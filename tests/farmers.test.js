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
const Activity = require('../models/Activity');
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

const addFarmer = (fields = {}) => request(app).post('/api/admin/farmers').set(as(boss)).send({
    name: 'Murugan', mobileNumber: '98765 43210', location: 'Melur', farmName: 'Murugan Thottam',
    farmingSpecializations: ['Vegetables'], ...fields
});

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
    await Promise.all([User, Post, Order, FarmerProfile, Activity].map(m => m.deleteMany({})));
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

test('admin adds a farmer who has no smartphone', async () => {
    const res = await addFarmer({ phoneVerified: true, visitedOn: '2026-11-20' });
    assert.equal(res.status, 200);
    assert.equal(res.body.managed, true);
    assert.equal(res.body.email, null);                                     // no real email to show
    assert.equal(res.body.approval.status, 'approved');
    assert.deepEqual(res.body.badges.map(b => b.type).sort(), ['phone', 'visit']);

    const saved = await User.findById(res.body._id);
    assert.match(saved.email, /^farmer-[0-9a-f]{24}@managed\.invalid$/);
    assert.equal((await FarmerProfile.findOne({ user: saved._id })).mobileNumber, '9876543210');
    assert.equal((await Activity.findOne({ account: saved._id, action: 'farmer.create' })).actor.toString(), boss.id);
    assert.equal((await browse(buyer)).body.total, 0);                      // no listings yet, but visible:
    assert.equal((await request(app).get(`/api/farmer-profile/${saved.id}/public`)).status, 200);

    assert.equal((await addFarmer({ mobileNumber: '12345' })).status, 400);
    assert.equal((await addFarmer({ farmingSpecializations: [] })).status, 400);
    assert.equal((await request(app).post('/api/admin/farmers').set(as(buyer)).send({})).status, 403);
});

test('approving and declining records who, when and why', async () => {
    const kumar = await makeFarmer('kumar', { approval: { status: 'pending' } });
    const attention = await request(app).get('/api/admin/attention').set(as(boss));
    assert.deepEqual(attention.body.pendingFarmers.map(f => f.name), ['kumar']);
    assert.deepEqual((await request(app).get('/api/admin/farmers?status=pending').set(as(boss))).body.map(f => f.name), ['kumar']);

    const decide = body => request(app).put(`/api/admin/farmers/${kumar.id}/approval`).set(as(boss)).send(body);
    assert.equal((await decide({ status: 'declined' })).status, 400);       // declining needs a reason
    assert.equal((await decide({ status: 'maybe' })).status, 400);
    const ok = await decide({ status: 'approved', note: 'Called, grows brinjal in Melur' });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.approval.status, 'approved');

    const saved = await User.findById(kumar._id);
    assert.equal(saved.approval.status, 'approved');
    assert.equal(saved.approval.by.toString(), boss.id);
    assert.ok(saved.approval.at instanceof Date);
    assert.equal(saved.approval.note, 'Called, grows brinjal in Melur');
    assert.ok(await Activity.findOne({ account: kumar._id, action: 'farmer.approve' }));
    assert.equal((await request(app).get('/api/admin/attention').set(as(boss))).body.pendingFarmers.length, 0);

    const declined = await decide({ status: 'declined', note: 'Not a farmer' });
    assert.equal(declined.status, 200);
    assert.ok(await Activity.findOne({ account: kumar._id, action: 'farmer.decline', 'details.note': 'Not a farmer' }));
});

test('badges show on listings and farmer pages without saying who added them', async () => {
    const f = await makeFarmer('f');
    await listing(f._id);
    await FarmerProfile.create({ user: f._id, farmName: 'F Farm', location: 'Salem', mobileNumber: '9876543210', farmingSpecializations: ['Rice'] });
    const setBadge = body => request(app).put(`/api/admin/farmers/${f.id}/badges`).set(as(boss)).send(body);
    assert.equal((await setBadge({ type: 'visit', on: true })).status, 400); // a visit needs its date
    assert.equal((await setBadge({ type: 'gold', on: true })).status, 400);
    assert.equal((await setBadge({ type: 'phone', on: true })).status, 200);
    assert.equal((await setBadge({ type: 'visit', on: true, visitedOn: '2026-11-19' })).status, 200);

    const card = (await browse(buyer)).body.posts[0];
    assert.deepEqual(card.farmerBadges.map(b => b.type), ['phone', 'visit']);
    assert.equal(card.farmerBadges[0].by, undefined);
    assert.equal(card.farmerVerified, undefined);

    const page = await request(app).get(`/api/farmer-profile/${f.id}/public`);
    assert.deepEqual(page.body.farmer.badges.map(b => b.type), ['phone', 'visit']);
    assert.equal(page.body.farmer.badges[1].by, undefined);
    const directory = await request(app).get('/api/farmer-profile');
    assert.deepEqual(directory.body[0].user.badges.map(b => b.type), ['phone', 'visit']);
    assert.equal(directory.body[0].user.badges[0].by, undefined);

    assert.equal((await setBadge({ type: 'phone', on: false })).status, 200);
    assert.deepEqual((await browse(buyer)).body.posts[0].farmerBadges.map(b => b.type), ['visit']);
    assert.equal(await Activity.countDocuments({ account: f._id, action: 'badge.add' }), 2);
    assert.equal(await Activity.countDocuments({ account: f._id, action: 'badge.remove' }), 1);
});

test('admin finds any account and marks test accounts', async () => {
    const found = await request(app).get('/api/admin/users?q=buyer').set(as(boss));
    assert.deepEqual(found.body.map(u => u.name), ['buyer']);
    assert.equal(found.body[0].email, 'buyer@test.com');

    const res = await request(app).put(`/api/admin/users/${buyer.id}/test`).set(as(boss)).send({ isTest: true });
    assert.equal(res.status, 200);
    assert.equal((await User.findById(buyer._id)).isTest, true);
    assert.ok(await Activity.findOne({ account: buyer._id, action: 'account.test' }));

    await request(app).put(`/api/admin/users/${buyer.id}/test`).set(as(boss)).send({ isTest: false });
    assert.equal((await User.findById(buyer._id)).isTest, undefined);

    const log = await request(app).get(`/api/admin/activity?account=${buyer.id}`).set(as(boss));
    assert.equal(log.body.length, 2);
    assert.equal(log.body[0].actor.name, 'boss');
    assert.equal(log.body[0].account.name, 'buyer');
});
