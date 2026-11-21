// Run with: npm test   (uses an in-memory MongoDB; the first run downloads a mongod binary)
process.env.jwtSecret = 'test-secret';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');
const Post = require('../models/Post');
const Order = require('../models/Order');
const FarmerProfile = require('../models/FarmerProfile');
require('../models/Review');
require('../models/Favorite');

let mongod;
let app;
let boss, buyer;

const tokenFor = id => jwt.sign({ user: { id: String(id) } }, process.env.jwtSecret);
const as = user => ({ 'x-auth-token': tokenFor(user._id) });

const makeUser = (name, fields = {}) =>
    User.create({ name, email: `${name}@test.com`, password: 'x'.repeat(8), ...fields });
const makeFarmer = (name, fields = {}) => makeUser(name, { userType: 'farmer', ...fields });

const listing = (ownerId, overrides = {}) =>
    Post.create({
        user: ownerId, text: 'fresh', farmerName: 'F', productName: 'Tomato', mobileNumber: '999',
        weight: 10, price: 20, totalAmount: 200, address: 'Madurai', unit: 'kg', quantityAvailable: 10,
        ...overrides
    });

const browse = user => request(app).get('/api/posts').set(as(user));
const order = (user, postId) => request(app).post('/api/orders').set(as(user)).send({ postId, quantity: 1 });

before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    app = express();
    app.use(express.json());
    app.use('/api/users', require('../routes/api/users'));
    app.use('/api/auth', require('../routes/api/auth'));
    app.use('/api/admin', require('../routes/api/admin'));
    app.use('/api/posts', require('../routes/api/posts'));
    app.use('/api/orders', require('../routes/api/orders'));
    app.use('/api/farmer-profile', require('../routes/api/farmerProfile'));
});

after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    process.env.ADMIN_EMAILS = 'boss@test.com';
    await Promise.all([User, Post, Order, FarmerProfile].map(m => m.deleteMany({})));
    boss = await makeUser('boss', { userType: 'consumer' });
    buyer = await makeUser('buyer', { userType: 'consumer' });
});

test('farmers who sign up wait for approval, and buyers cannot see or order from them meanwhile', async () => {
    const signup = await request(app).post('/api/users').send({
        name: 'Kumar', email: 'kumar@test.com', password: 'secret123', userType: 'farmer', acceptedTerms: true
    });
    assert.equal(signup.status, 200);
    const kumar = await User.findOne({ email: 'kumar@test.com' });
    assert.equal(kumar.approval.status, 'pending');

    const post = await listing(kumar._id);
    await FarmerProfile.create({
        user: kumar._id, farmName: 'K Farm', location: 'Melur', mobileNumber: '9876543210', farmingSpecializations: ['Vegetables']
    });

    assert.equal((await browse(buyer)).body.total, 0);
    assert.equal((await request(app).get('/api/posts/featured')).body.length, 0);
    assert.equal((await request(app).get(`/api/posts/${post.id}`).set(as(buyer))).status, 404);
    assert.equal((await order(buyer, post.id)).status, 404);
    assert.equal((await request(app).get(`/api/farmer-profile/${kumar.id}/public`)).status, 404);
    assert.equal((await request(app).get(`/api/farmer-profile/${kumar.id}`)).status, 400);
    assert.equal((await request(app).get('/api/farmer-profile')).body.length, 0);

    // the farmer still sees their own listing, and admins see everyone
    assert.equal((await request(app).get(`/api/posts?farmer=${kumar.id}`).set(as(kumar))).body.total, 1);
    assert.equal((await request(app).get(`/api/posts/${post.id}`).set(as(kumar))).status, 200);
    assert.equal((await browse(boss)).body.total, 1);

    await User.updateOne({ _id: kumar._id }, { 'approval.status': 'approved' });
    assert.equal((await browse(buyer)).body.total, 1);
    assert.equal((await request(app).get(`/api/farmer-profile/${kumar.id}/public`)).status, 200);
    assert.equal((await request(app).get('/api/farmer-profile')).body.length, 1);
    assert.equal((await order(buyer, post.id)).status, 200);
});

test('declined farmers stay hidden; farmers from before approvals existed stay visible', async () => {
    const declined = await makeFarmer('declined', { approval: { status: 'declined', note: 'Not a farmer' } });
    const old = await makeFarmer('old');
    await listing(declined._id);
    await listing(old._id, { productName: 'Brinjal' });

    const res = await browse(buyer);
    assert.deepEqual(res.body.posts.map(p => p.productName), ['Brinjal']);
    assert.equal((await request(app).get(`/api/posts?farmer=${declined.id}`).set(as(buyer))).body.total, 0);
});

test('old accounts that choose the farmer role wait for approval too', async () => {
    const legacy = await User.collection.insertOne({ name: 'Old Timer', email: 'oldtimer@test.com', password: 'x', date: new Date() });
    const res = await request(app).put('/api/auth/role').set({ 'x-auth-token': tokenFor(legacy.insertedId) }).send({ userType: 'farmer' });
    assert.equal(res.status, 200);
    assert.equal((await User.findById(legacy.insertedId)).approval.status, 'pending');
});

test('listings owned by an account that is not a farmer never show', async () => {
    const roleless = await User.collection.insertOne({ name: 'Old', email: 'old@test.com', password: 'x', date: new Date() });
    await listing(roleless.insertedId);
    assert.equal((await browse(buyer)).body.total, 0);
    assert.equal((await request(app).get('/api/posts/featured')).body.length, 0);
});

test('test farmers are seen only by test accounts and admins', async () => {
    const testFarmer = await makeFarmer('testfarmer', { isTest: true });
    const post = await listing(testFarmer._id);
    const tester = await makeUser('tester', { userType: 'consumer', isTest: true });

    assert.equal((await browse(buyer)).body.total, 0);
    assert.equal((await order(buyer, post.id)).status, 404);
    assert.equal((await browse(tester)).body.total, 1);
    assert.equal((await browse(boss)).body.total, 1);
    assert.equal((await order(tester, post.id)).status, 200);
});
