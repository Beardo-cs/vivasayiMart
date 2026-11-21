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
require('../models/Review');
require('../models/Favorite');
require('../models/Report');

let mongod;
let app;

const tokenFor = user => jwt.sign({ user: { id: user.id } }, process.env.jwtSecret);
const as = (user) => ({ 'x-auth-token': tokenFor(user) });

let farmer, farmer2, buyer, buyer2;

const makeUser = (name, userType) =>
    User.create({ name, email: `${name}@test.com`, password: 'x'.repeat(8), userType });

const makePost = (overrides = {}) =>
    Post.create({
        user: farmer.id, text: 'fresh', farmerName: 'F', productName: 'Tomato', mobileNumber: '999',
        weight: 10, price: 20, totalAmount: 200, address: 'Madurai', unit: 'kg', quantityAvailable: 10,
        ...overrides
    });

const placeOrder = (user, postId, quantity, extra = {}) =>
    request(app).post('/api/orders').set(as(user)).send({ postId, quantity, ...extra });

const setStatus = (user, orderId, status) =>
    request(app).put(`/api/orders/${orderId}/status`).set(as(user)).send({ status });

before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    app = express();
    app.use(express.json());
    app.use('/api/posts', require('../routes/api/posts'));
    app.use('/api/orders', require('../routes/api/orders'));
    app.use('/api/reviews', require('../routes/api/reviews'));
    app.use('/api/favorites', require('../routes/api/favorites'));
    app.use('/api/reports', require('../routes/api/reports'));
    app.use('/api/admin', require('../routes/api/admin'));
    app.use('/api/auth', require('../routes/api/auth'));
    app.use('/api/market-price', require('../routes/api/marketPrice'));
    app.use('/api/users', require('../routes/api/users'));
    app.use('/api', require('../routes/api/monitoring'));
    app.use('/api/farmer-profile', require('../routes/api/farmerProfile'));
});

after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Post.deleteMany({}), Order.deleteMany({}),
        mongoose.model('review').deleteMany({}), mongoose.model('favorite').deleteMany({}), mongoose.model('report').deleteMany({})]);
    farmer = await makeUser('farmer', 'farmer');
    farmer2 = await makeUser('farmer2', 'farmer');
    buyer = await makeUser('buyer', 'consumer');
    buyer2 = await makeUser('buyer2', 'consumer');
});

test('order request does not reserve stock until the farmer confirms', async () => {
    const post = await makePost();
    const res = await placeOrder(buyer, post.id, 4);
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'placed');
    assert.equal(res.body.totalAmount, 80);
    assert.equal((await Post.findById(post.id)).quantityAvailable, 10);
});

test('confirming deducts stock; cancelling a confirmed order restores it', async () => {
    const post = await makePost();
    const { body: order } = await placeOrder(buyer, post.id, 4);

    const confirmed = await setStatus(farmer, order._id, 'confirmed');
    assert.equal(confirmed.status, 200);
    assert.equal((await Post.findById(post.id)).quantityAvailable, 6);

    const cancelled = await setStatus(buyer, order._id, 'cancelled');
    assert.equal(cancelled.status, 200);
    assert.equal((await Post.findById(post.id)).quantityAvailable, 10);

    // cancelling again must not restore twice
    const again = await setStatus(buyer, order._id, 'cancelled');
    assert.equal(again.status, 400);
    assert.equal((await Post.findById(post.id)).quantityAvailable, 10);
});

test('cannot double-book the last stock: second confirm fails', async () => {
    const post = await makePost({ weight: 5, quantityAvailable: 5, totalAmount: 100 });
    const a = (await placeOrder(buyer, post.id, 4)).body;
    const b = (await placeOrder(buyer2, post.id, 4)).body;

    assert.equal((await setStatus(farmer, a._id, 'confirmed')).status, 200);
    const second = await setStatus(farmer, b._id, 'confirmed');
    assert.equal(second.status, 400);
    assert.match(second.body.msg, /stock/i);
    assert.equal((await Post.findById(post.id)).quantityAvailable, 1);
});

test('concurrent confirms never oversell', async () => {
    const post = await makePost({ weight: 5, quantityAvailable: 5, totalAmount: 100 });
    const orders = await Promise.all(
        [buyer, buyer2].map(async u => (await placeOrder(u, post.id, 4)).body)
    );
    const results = await Promise.all(orders.map(o => setStatus(farmer, o._id, 'confirmed')));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 400]);
    assert.equal((await Post.findById(post.id)).quantityAvailable, 1);
});

test('confirming the full stock marks the listing sold out; cancel re-opens it', async () => {
    const post = await makePost({ weight: 3, quantityAvailable: 3, totalAmount: 60 });
    const { body: order } = await placeOrder(buyer, post.id, 3);
    await setStatus(farmer, order._id, 'confirmed');

    let p = await Post.findById(post.id);
    assert.equal(p.quantityAvailable, 0);
    assert.equal(p.available, false);

    const blocked = await placeOrder(buyer2, post.id, 1);
    assert.equal(blocked.status, 400);

    await setStatus(farmer, order._id, 'cancelled');
    p = await Post.findById(post.id);
    assert.equal(p.quantityAvailable, 3);
    assert.equal(p.available, true);
});

test('validation: quantity over stock, zero, own listing role, delivery address', async () => {
    const post = await makePost();
    assert.equal((await placeOrder(buyer, post.id, 11)).status, 400);
    assert.equal((await placeOrder(buyer, post.id, 0)).status, 400);
    assert.equal((await placeOrder(farmer, post.id, 1)).status, 403); // farmers cannot order
    assert.equal((await placeOrder(buyer, post.id, 1, { deliveryMethod: 'delivery' })).status, 400);
    assert.equal((await placeOrder(buyer, post.id, 1, { deliveryMethod: 'delivery', deliveryAddress: 'Chennai' })).status, 200);
});

test('only the right party can change status', async () => {
    const post = await makePost();
    const { body: order } = await placeOrder(buyer, post.id, 2);

    assert.equal((await setStatus(buyer, order._id, 'confirmed')).status, 403); // buyer cannot accept
    assert.equal((await setStatus(farmer2, order._id, 'confirmed')).status, 401); // other farmer
    assert.equal((await setStatus(buyer2, order._id, 'cancelled')).status, 401); // other buyer
    assert.equal((await setStatus(farmer, order._id, 'completed')).status, 400); // must confirm first
    assert.equal((await setStatus(farmer, order._id, 'rejected')).status, 200);
    assert.equal((await setStatus(farmer, order._id, 'confirmed')).status, 400); // terminal state
});

test('legacy listing without quantityAvailable is backfilled on confirm', async () => {
    const post = await makePost();
    await Post.collection.updateOne({ _id: post._id }, { $unset: { quantityAvailable: '' } });
    const { body: order } = await placeOrder(buyer, post.id, 2);
    assert.equal((await setStatus(farmer, order._id, 'confirmed')).status, 200);
    assert.equal((await Post.findById(post.id)).quantityAvailable, 8);
});

test('posts: category and unit saved on create; only the owner can edit', async () => {
    const created = await request(app).post('/api/posts').set(as(farmer)).send({
        text: 'd', farmerName: 'F', productName: 'Milk', mobileNumber: '1', weight: 20, price: 50,
        address: 'Salem', category: 'Dairy', unit: 'litre'
    });
    assert.equal(created.status, 200);
    assert.equal(created.body.category, 'Dairy');
    assert.equal(created.body.unit, 'litre');
    assert.equal(created.body.quantityAvailable, 20);

    const bad = await request(app).post('/api/posts').set(as(farmer)).send({
        text: 'd', farmerName: 'F', productName: 'Milk', mobileNumber: '1', weight: 20, price: 50,
        address: 'Salem', category: 'Bogus'
    });
    assert.equal(bad.status, 400);

    const id = created.body._id;
    assert.equal((await request(app).put(`/api/posts/${id}`).set(as(farmer2)).send({ price: 1 })).status, 401);
    assert.equal((await request(app).put(`/api/posts/${id}`).set(as(buyer)).send({ price: 1 })).status, 403);

    const edited = await request(app).put(`/api/posts/${id}`).set(as(farmer)).send({ price: 60, quantityAvailable: 0 });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.price, 60);
    assert.equal(edited.body.available, false); // zero stock closes the listing

    const restocked = await request(app).put(`/api/posts/${id}`).set(as(farmer)).send({ quantityAvailable: 5 });
    assert.equal(restocked.body.available, true);
});

test('posts search: filters, in-stock, pagination', async () => {
    await makePost({ productName: 'Tomato', category: 'Vegetables', price: 20 });
    await makePost({ productName: 'Mango', category: 'Fruits', price: 80, address: 'Theni' });
    await makePost({ productName: 'Rice', category: 'Grains', price: 50, quantityAvailable: 0, available: false });

    const get = qs => request(app).get(`/api/posts?${qs}`).set(as(buyer));

    assert.equal((await get('')).body.total, 3);
    assert.deepEqual((await get('category=Fruits')).body.posts.map(p => p.productName), ['Mango']);
    assert.equal((await get('q=tom')).body.total, 1);
    assert.equal((await get('location=theni')).body.total, 1);
    assert.equal((await get('minPrice=30&maxPrice=60')).body.total, 1);
    assert.equal((await get('inStock=true')).body.total, 2);
    assert.deepEqual((await get('sort=price_desc')).body.posts.map(p => p.productName), ['Mango', 'Rice', 'Tomato']);

    const page = (await get('limit=2&page=2')).body;
    assert.equal(page.posts.length, 1);
    assert.equal(page.pages, 2);

    // regex characters in search text must not crash or match everything
    assert.equal((await get('q=.*(')).status, 200);
    assert.equal((await get('q=.*(')).body.total, 0);
});

test('badge and stats', async () => {
    const post = await makePost();
    const { body: order } = await placeOrder(buyer, post.id, 2);

    let badge = await request(app).get('/api/orders/badge').set(as(farmer));
    assert.equal(badge.body.count, 1);

    await setStatus(farmer, order._id, 'confirmed');
    badge = await request(app).get('/api/orders/badge').set(as(buyer));
    assert.equal(badge.body.count, 1); // unseen farmer update
    await request(app).put('/api/orders/seen').set(as(buyer));
    badge = await request(app).get('/api/orders/badge').set(as(buyer));
    assert.equal(badge.body.count, 0);

    await setStatus(farmer, order._id, 'completed');
    const stats = await request(app).get('/api/orders/stats').set(as(farmer));
    assert.equal(stats.body.completedOrders, 1);
    assert.equal(stats.body.revenue, 40);
    assert.equal(stats.body.totalProducts, 1);
});

test('reviews: only buyer, only completed, once; rating shows on listings', async () => {
    const post = await makePost();
    const { body: order } = await placeOrder(buyer, post.id, 2);
    const review = (user, body) => request(app).post('/api/reviews').set(as(user)).send({ orderId: order._id, ...body });

    assert.equal((await review(buyer, { rating: 5 })).status, 400); // not completed yet
    await setStatus(farmer, order._id, 'confirmed');
    await setStatus(farmer, order._id, 'completed');

    assert.equal((await review(buyer2, { rating: 5 })).status, 401); // not the buyer
    assert.equal((await review(buyer, { rating: 6 })).status, 400);  // out of range
    assert.equal((await review(buyer, { rating: 4, comment: 'fresh' })).status, 200);
    assert.equal((await review(buyer, { rating: 1 })).status, 400);  // only once

    const summary = await request(app).get(`/api/reviews/farmer/${farmer.id}`).set(as(buyer));
    assert.equal(summary.body.average, 4);
    assert.equal(summary.body.count, 1);

    const list = await request(app).get('/api/posts').set(as(buyer));
    assert.deepEqual(list.body.posts[0].farmerRating, { average: 4, count: 1 });

    const mine = await request(app).get('/api/orders/mine').set(as(buyer));
    assert.equal(mine.body[0].review.rating, 4);
});

test('favorites: toggle and saved filter', async () => {
    const a = await makePost({ productName: 'Tomato' });
    await makePost({ productName: 'Mango' });

    assert.equal((await request(app).put(`/api/favorites/${a.id}`).set(as(buyer))).body.favorite, true);
    let list = await request(app).get('/api/posts?saved=true').set(as(buyer));
    assert.deepEqual(list.body.posts.map(p => p.productName), ['Tomato']);
    assert.equal(list.body.posts[0].isFavorite, true);

    // another user's saved list is separate
    assert.equal((await request(app).get('/api/posts?saved=true').set(as(buyer2))).body.total, 0);

    assert.equal((await request(app).put(`/api/favorites/${a.id}`).set(as(buyer))).body.favorite, false);
    list = await request(app).get('/api/posts?saved=true').set(as(buyer));
    assert.equal(list.body.total, 0);
    assert.equal((await request(app).put('/api/favorites/000000000000000000000000').set(as(buyer))).status, 404);
});

test('reports: once per listing, not own listing', async () => {
    const post = await makePost();
    const report = (user, body) => request(app).post('/api/reports').set(as(user)).send({ postId: post.id, ...body });

    assert.equal((await report(buyer, { reason: 'bogus' })).status, 400);
    assert.equal((await report(farmer, { reason: 'spam' })).status, 400);
    assert.equal((await report(buyer, { reason: 'fake', details: 'not real' })).status, 200);
    assert.equal((await report(buyer, { reason: 'spam' })).status, 400);
    assert.equal((await report(buyer2, { reason: 'spam' })).status, 200);
});

test('cart checkout: one order per product, all-or-nothing validation', async () => {
    const a = await makePost({ productName: 'Tomato' });
    const b = await makePost({ productName: 'Mango', user: farmer2.id, price: 80 });
    const checkout = (items, extra = {}) => request(app).post('/api/orders/checkout').set(as(buyer)).send({ items, ...extra });

    const ok = await checkout([{ postId: a.id, quantity: 2 }, { postId: b.id, quantity: 1 }, { postId: a.id, quantity: 1 }]);
    assert.equal(ok.status, 200);
    assert.equal(ok.body.length, 2); // duplicate lines merged
    assert.equal(new Set(ok.body.map(o => o.checkoutId)).size, 1);
    assert.equal(ok.body.find(o => o.productName === 'Tomato').quantity, 3);
    assert.equal(ok.body.find(o => o.productName === 'Mango').farmer, farmer2.id);

    const before = await Order.countDocuments();
    const bad = await checkout([{ postId: a.id, quantity: 1 }, { postId: b.id, quantity: 999 }]);
    assert.equal(bad.status, 400);
    assert.equal(await Order.countDocuments(), before); // nothing created

    assert.equal((await checkout([])).status, 400);
    assert.equal((await checkout([{ postId: a.id, quantity: 1 }], { deliveryMethod: 'delivery' })).status, 400);
    assert.equal((await request(app).post('/api/orders/checkout').set(as(farmer)).send({ items: [{ postId: b.id, quantity: 1 }] })).status, 403);
});

test('admin: moderation', async () => {
    const admin = await makeUser('boss', 'consumer');
    process.env.ADMIN_EMAILS = 'boss@test.com';
    const post = await makePost();
    await request(app).post('/api/reports').set(as(buyer)).send({ postId: post.id, reason: 'fake' });

    assert.equal((await request(app).get('/api/admin/reports').set(as(buyer))).status, 403);
    const list = await request(app).get('/api/admin/reports').set(as(admin));
    assert.equal(list.status, 200);
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].post.productName, 'Tomato');

    // resolve + hide the listing
    const resolved = await request(app).put(`/api/admin/reports/${list.body[0]._id}`).set(as(admin)).send({ status: 'reviewed', hideListing: true });
    assert.equal(resolved.status, 200);
    assert.equal((await request(app).get('/api/admin/reports').set(as(admin))).body.length, 0); // no longer open

    // hidden: gone from search for buyers, visible to its farmer, not orderable, 404 by id
    assert.equal((await request(app).get('/api/posts').set(as(buyer))).body.total, 0);
    assert.equal((await request(app).get(`/api/posts?farmer=${farmer.id}`).set(as(farmer))).body.total, 1);
    assert.equal((await placeOrder(buyer, post.id, 1)).status, 404);
    assert.equal((await request(app).get(`/api/posts/${post.id}`).set(as(buyer))).status, 404);
    assert.equal((await request(app).get(`/api/posts/${post.id}`).set(as(admin))).status, 200);

    // restore: back in search for buyers
    await request(app).put(`/api/admin/posts/${post.id}/hidden`).set(as(admin)).send({ hidden: false });
    assert.equal((await request(app).get('/api/posts').set(as(buyer))).body.total, 1);
    assert.equal((await request(app).get('/api/admin/farmers?q=farmer2').set(as(admin))).body.length, 1);
    delete process.env.ADMIN_EMAILS;
});

test('password reset: token is single-use, expires, and never leaks the account', async () => {
    const crypto = require('crypto');
    const bcrypt = require('bcryptjs');
    const user = await User.create({ name: 'Reset Me', email: 'reset@test.com', password: await bcrypt.hash('oldpass1', 4), userType: 'consumer' });

    // unknown email answers the same as a known one
    const unknown = await request(app).post('/api/auth/forgot').send({ email: 'nobody@test.com' });
    const known = await request(app).post('/api/auth/forgot').send({ email: 'reset@test.com' });
    assert.equal(unknown.status, 200);
    assert.deepEqual(unknown.body, known.body);

    // emailing is stubbed in dev; plant a known token the way the route stores it
    const token = 'a'.repeat(64);
    await User.updateOne({ _id: user._id }, { resetTokenHash: crypto.createHash('sha256').update(token).digest('hex'), resetTokenExpires: new Date(Date.now() + 60000) });

    assert.equal((await request(app).post('/api/auth/reset').send({ token: 'wrong', password: 'newpass1' })).status, 400);
    assert.equal((await request(app).post('/api/auth/reset').send({ token, password: '123' })).status, 400); // too short
    assert.equal((await request(app).post('/api/auth/reset').send({ token, password: 'newpass1' })).status, 200);
    assert.equal((await request(app).post('/api/auth/reset').send({ token, password: 'another1' })).status, 400); // single-use

    const fresh = await User.findById(user._id);
    assert.equal(await bcrypt.compare('newpass1', fresh.password), true);

    // expired token
    await User.updateOne({ _id: user._id }, { resetTokenHash: crypto.createHash('sha256').update('b'.repeat(64)).digest('hex'), resetTokenExpires: new Date(Date.now() - 1000) });
    assert.equal((await request(app).post('/api/auth/reset').send({ token: 'b'.repeat(64), password: 'newpass2' })).status, 400);

    // tokens are not exposed by GET /api/auth
    const me = await request(app).get('/api/auth').set(as(user));
    assert.equal(me.body.resetTokenHash, undefined);
    assert.equal(me.body.password, undefined);
});

test('email verification: token flips the flag once', async () => {
    const crypto = require('crypto');
    const token = 'c'.repeat(64);
    const u = await User.create({ name: 'V', email: 'v@test.com', password: 'x'.repeat(8), userType: 'consumer',
        emailVerified: false, verifyTokenHash: crypto.createHash('sha256').update(token).digest('hex'), verifyTokenExpires: new Date(Date.now() + 60000) });

    assert.equal((await request(app).post('/api/auth/verify').send({ token: 'nope' })).status, 400);
    assert.equal((await request(app).post('/api/auth/verify').send({ token })).status, 200);
    assert.equal((await User.findById(u._id)).emailVerified, true);
    assert.equal((await request(app).post('/api/auth/verify').send({ token })).status, 400);

    const resend = await request(app).post('/api/auth/resend-verification').set(as(u));
    assert.equal(resend.body.msg, 'Your email is already verified');
});

test('bulk pricing: validated, applied to orders and carts, editable', async () => {
    const create = body => request(app).post('/api/posts').set(as(farmer)).send({
        text: 'd', farmerName: 'F', productName: 'Onion', mobileNumber: '1', weight: 200, price: 20, address: 'Salem', ...body
    });

    assert.equal((await create({ bulkPricing: [{ minQuantity: 50, price: 25 }] })).status, 400);  // not cheaper
    assert.equal((await create({ bulkPricing: [{ minQuantity: 0, price: 10 }] })).status, 400);   // bad quantity
    assert.equal((await create({ bulkPricing: [{ minQuantity: 10, price: 18 }, { minQuantity: 20, price: 19 }] })).status, 400); // higher qty must be cheaper
    const ok = await create({ bulkPricing: [{ minQuantity: 100, price: 15 }, { minQuantity: 50, price: 18 }] });
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.body.bulkPricing, [{ minQuantity: 50, price: 18 }, { minQuantity: 100, price: 15 }]); // sorted

    const price = async qty => (await placeOrder(buyer, ok.body._id, qty)).body.pricePerUnit;
    assert.equal(await price(10), 20);   // below first tier
    assert.equal(await price(50), 18);
    assert.equal(await price(120), 15);
    const big = await placeOrder(buyer, ok.body._id, 120);
    assert.equal(big.body.totalAmount, 1800);

    // cart checkout uses the same tiers
    const cart = await request(app).post('/api/orders/checkout').set(as(buyer)).send({ items: [{ postId: ok.body._id, quantity: 60 }] });
    assert.equal(cart.body[0].pricePerUnit, 18);

    // raising the base price below a tier is rejected; clearing tiers works
    assert.equal((await request(app).put(`/api/posts/${ok.body._id}`).set(as(farmer)).send({ price: 16 })).status, 400);
    const cleared = await request(app).put(`/api/posts/${ok.body._id}`).set(as(farmer)).send({ bulkPricing: [] });
    assert.equal(cleared.status, 200);
    assert.deepEqual(cleared.body.bulkPricing, []);
    assert.equal(await price(120), 20);
});

test('public farmer page: no login, no phone numbers, only in-stock visible listings', async () => {
    const FarmerProfile = require('../models/FarmerProfile');
    await FarmerProfile.create({ user: farmer.id, farmName: 'Green Farm', location: 'Salem', mobileNumber: '9999999999', farmingSpecializations: ['Rice'] });
    await makePost({ productName: 'Rice' });
    await makePost({ productName: 'SoldOut', quantityAvailable: 0, available: false });
    await makePost({ productName: 'Hidden', hidden: true });
    await User.updateOne({ _id: farmer._id }, { badges: [{ type: 'phone' }] });

    const res = await request(app).get(`/api/farmer-profile/${farmer.id}/public`); // no auth header
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.farmer.badges.map(b => b.type), ['phone']);
    assert.equal(res.body.profile.farmName, 'Green Farm');
    assert.deepEqual(res.body.products.map(p => p.productName), ['Rice']);
    const text = JSON.stringify(res.body);
    assert.equal(text.includes('9999999999'), false);   // profile phone not exposed
    assert.equal(text.includes('"mobileNumber"'), false); // listing phone not exposed
    assert.equal(text.includes('@test.com'), false);       // no email

    assert.equal((await request(app).get(`/api/farmer-profile/${buyer.id}/public`)).status, 404); // not a farmer
    assert.equal((await request(app).get('/api/farmer-profile/nope/public')).status, 404);

    const list = await request(app).get('/api/farmer-profile');
    assert.deepEqual(list.body[0].user.badges.map(b => b.type), ['phone']);
    const single = await request(app).get(`/api/farmer-profile/${farmer.id}`);
    assert.equal(JSON.stringify(single.body).includes('9999999999'), false);
});

test('farmer profile: save + validation, consumer cannot', async () => {
    const save = (user, body) => request(app).post('/api/farmer-profile').set(as(user)).send(body);
    const base = { farmName: 'F', location: 'L', mobileNumber: '1', farmingSpecializations: ['Rice'] };
    assert.equal((await save(farmer, { ...base, farmingSpecializations: [] })).status, 400);
    assert.equal((await save(farmer, { ...base, yearsOfExperience: 'abc' })).status, 400);
    assert.equal((await save(buyer, base)).status, 403);
    assert.equal((await save(farmer, { ...base, yearsOfExperience: 7 })).status, 200);
    const me = await request(app).get('/api/farmer-profile/me').set(as(farmer));
    assert.equal(me.body.yearsOfExperience, 7);
    assert.equal((await save(farmer, { ...base, farmName: 'Renamed' })).status, 200); // upsert, not duplicate
    assert.equal((await request(app).get('/api/farmer-profile')).body.length, 1);
});

test('privacy: phone numbers appear only for the owner, and on orders only after confirmation', async () => {
    const post = await makePost({ mobileNumber: '9000000001' });
    const asBuyer = await request(app).get('/api/posts').set(as(buyer));
    assert.equal(asBuyer.body.posts[0].mobileNumber, undefined);
    assert.equal((await request(app).get(`/api/posts/${post.id}`).set(as(buyer))).body.mobileNumber, undefined);
    assert.equal((await request(app).get('/api/posts').set(as(farmer))).body.posts[0].mobileNumber, '9000000001');

    const placed = await placeOrder(buyer, post.id, 1);
    assert.equal(placed.body.farmerMobile, undefined);                       // not even for the buyer yet
    let mine = await request(app).get('/api/orders/mine').set(as(buyer));
    assert.equal(mine.body[0].farmerMobile, undefined);
    let received = await request(app).get('/api/orders/received').set(as(farmer));
    assert.equal(received.body[0].buyerMobile, undefined);

    await setStatus(farmer, placed.body._id, 'confirmed');
    mine = await request(app).get('/api/orders/mine').set(as(buyer));
    assert.equal(mine.body[0].farmerMobile, '9000000001');                   // revealed after confirmation
    await setStatus(buyer, placed.body._id, 'cancelled');
    mine = await request(app).get('/api/orders/mine').set(as(buyer));
    assert.equal(mine.body[0].farmerMobile, undefined);                      // hidden again once cancelled
});

test('featured listings: public, light, no phone numbers or images', async () => {
    await makePost({ productName: 'Tomato' });
    await makePost({ productName: 'Hidden', hidden: true });
    await makePost({ productName: 'SoldOut', quantityAvailable: 0, available: false });
    const res = await request(app).get('/api/posts/featured'); // no login
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map(p => p.productName), ['Tomato']);
    const text = JSON.stringify(res.body);
    assert.equal(text.includes('mobileNumber'), false);
    assert.equal(text.includes('productImage'), false);
});

test('CORS: the site\'s own address always works; strangers are blocked quietly', async () => {
    const corsApp = express();
    corsApp.use(require('../middleware/cors'));
    corsApp.get('/ping', (req, res) => res.json({ ok: true }));
    const call = origin => request(corsApp).get('/ping').set('Host', 'shop.example.com').set(origin ? { Origin: origin } : {});

    assert.equal((await call('https://shop.example.com')).headers['access-control-allow-origin'], 'https://shop.example.com'); // same site (custom domain)
    assert.equal((await call('https://vivasayimart.vercel.app')).headers['access-control-allow-origin'], 'https://vivasayimart.vercel.app');
    const stranger = await call('https://evil.example.org');
    assert.equal(stranger.status, 200);                                  // not a 500
    assert.equal(stranger.headers['access-control-allow-origin'], undefined);
    process.env.CORS_ORIGINS = 'https://partner.example.org';
    assert.equal((await call('https://partner.example.org')).headers['access-control-allow-origin'], 'https://partner.example.org');
    delete process.env.CORS_ORIGINS;
    assert.equal((await call(null)).status, 200);
    // the Android / iOS apps load their pages from these built-in addresses
    for (const origin of ['capacitor://localhost', 'https://localhost']) {
        assert.equal((await call(origin)).headers['access-control-allow-origin'], origin);
    }
});

test('list responses leave out oversized legacy photos but keep normal ones', async () => {
    await makePost({ productName: 'Big', productImage: 'x'.repeat(500000) });
    await makePost({ productName: 'Small', productImage: 'data:image/jpeg;base64,abc' });
    const res = await request(app).get('/api/posts').set(as(buyer));
    const big = res.body.posts.find(p => p.productName === 'Big');
    const small = res.body.posts.find(p => p.productName === 'Small');
    assert.equal(big.productImage, '');
    assert.equal(big.imageOmitted, true);
    assert.equal(small.productImage, 'data:image/jpeg;base64,abc');
});

test('market price proxy: key stays on the server, filters are whitelisted, answers are cached', async () => {
    const mp = require('../routes/api/marketPrice');
    mp._cache.clear();
    const realFetch = global.fetch;
    const upstreamUrls = [];
    global.fetch = async url => {
        upstreamUrls.push(String(url));
        return { ok: true, status: 200, json: async () => ({ records: [{ state: 'Tamil Nadu', modal_price: '2500' }] }) };
    };
    try {
        delete process.env.DATA_GOV_API_KEY;
        const none = await request(app).get('/api/market-price');
        assert.equal(none.status, 503);                          // not configured: clear error, no upstream call
        assert.equal(upstreamUrls.length, 0);

        process.env.DATA_GOV_API_KEY = 'super-secret-key';
        const res = await request(app).get('/api/market-price')
            .query({ 'filters[state.keyword]': 'Tamil Nadu', 'filters[district]': 'Salem', 'filters[evil]': 'x', limit: '99999' });
        assert.equal(res.status, 200);
        assert.equal(res.body.records[0].modal_price, '2500');
        assert.equal(JSON.stringify(res.body).includes('super-secret-key'), false);   // never sent to the browser
        assert.equal(JSON.stringify(res.headers).includes('super-secret-key'), false);

        const sent = new URL(upstreamUrls[0]);
        assert.equal(sent.hostname, 'api.data.gov.in');
        assert.equal(sent.searchParams.get('api-key'), 'super-secret-key');
        assert.equal(sent.searchParams.get('filters[state.keyword]'), 'Tamil Nadu');
        assert.equal(sent.searchParams.get('filters[district]'), 'Salem');
        assert.equal(sent.searchParams.get('filters[evil]'), null);                    // unknown filter dropped
        assert.equal(sent.searchParams.get('limit'), '1000');                          // clamped

        await request(app).get('/api/market-price').query({ 'filters[state.keyword]': 'Tamil Nadu', 'filters[district]': 'Salem', 'filters[evil]': 'y', limit: '5' });
        assert.equal(upstreamUrls.length, 2);                                          // different limit: new call
        await request(app).get('/api/market-price').query({ 'filters[state.keyword]': 'Tamil Nadu', 'filters[district]': 'Salem', limit: '5' });
        assert.equal(upstreamUrls.length, 2);                                          // same request: served from cache

        global.fetch = async () => { throw new Error('network down'); };
        mp._cache.clear();
        const down = await request(app).get('/api/market-price');
        assert.equal(down.status, 502);
        assert.equal(JSON.stringify(down.body).includes('network down'), false);       // no internals leaked
    } finally {
        global.fetch = realFetch;
        delete process.env.DATA_GOV_API_KEY;
    }
});

test('sign-up needs consent to the Terms and Privacy Policy, and records when', async () => {
    const body = { name: 'New Person', email: 'newperson@test.com', password: 'secret123', userType: 'consumer' };
    assert.equal((await request(app).post('/api/users').send(body)).status, 400);
    assert.equal((await request(app).post('/api/users').send({ ...body, acceptedTerms: false })).status, 400);
    const ok = await request(app).post('/api/users').send({ ...body, acceptedTerms: true });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);
    const saved = await User.findOne({ email: 'newperson@test.com' });
    assert.ok(saved.acceptedTermsAt instanceof Date);
});

test('monitoring: health reports the database, client crash reports are accepted and clipped', async () => {
    const health = await request(app).get('/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.db, 'up');

    const logged = [];
    const realError = console.error;
    console.error = (...args) => logged.push(args.join(' '));
    try {
        const res = await request(app).post('/api/client-error').send({ message: 'x'.repeat(5000), stack: 'y'.repeat(5000), url: '/orders', kind: 'render' });
        assert.equal(res.status, 204);
        assert.equal((await request(app).post('/api/client-error')).status, 204); // empty body is fine
    } finally {
        console.error = realError;
    }
    assert.ok(logged[0].includes('[client-error]'));
    assert.ok(logged[0].length < 2500);                                             // clipped, can't flood the logs
});

test('old accounts without a role can choose one exactly once', async () => {
    const legacy = await User.collection.insertOne({ name: 'Old Timer', email: 'old@test.com', password: 'x', date: new Date() });
    const asLegacy = { id: legacy.insertedId.toString() };
    const choose = userType => request(app).put('/api/auth/role').set(as(asLegacy)).send({ userType });

    assert.equal((await choose('admin')).status, 400);                    // only farmer / consumer
    const ok = await choose('farmer');
    assert.equal(ok.status, 200);
    assert.equal(ok.body.userType, 'farmer');
    assert.equal(ok.body.password, undefined);
    assert.equal((await choose('consumer')).status, 400);                 // cannot switch afterwards
    assert.equal((await request(app).put('/api/auth/role').set(as(buyer)).send({ userType: 'farmer' })).status, 400); // existing users unchanged
    assert.equal((await User.findById(buyer.id)).userType, 'consumer');
});

test('delete account: needs the password, cancels active orders, returns stock, removes personal data', async () => {
    const bcrypt = require('bcryptjs');
    const Favorite = mongoose.model('favorite');
    const Review = mongoose.model('review');
    const hash = await bcrypt.hash('mypassword', 4);
    await User.updateOne({ _id: buyer._id }, { password: hash });
    await User.updateOne({ _id: farmer._id }, { password: hash });

    const post = await makePost({ mobileNumber: '9000000001' });
    const other = await makePost({ productName: 'Other', user: farmer2.id });
    await request(app).put(`/api/favorites/${post.id}`).set(as(buyer));
    await request(app).put(`/api/favorites/${other.id}`).set(as(buyer));
    await request(app).post(`/api/posts/comment/${other.id}`).set(as(buyer)).send({ text: 'nice' });

    // one confirmed order (stock reserved), one completed (already reviewed), one new request
    const confirmed = (await placeOrder(buyer, post.id, 4, { note: 'ring the bell' })).body;
    await setStatus(farmer, confirmed._id, 'confirmed');
    const done = (await placeOrder(buyer, other.id, 1)).body;
    await setStatus(farmer2, done._id, 'confirmed');
    await setStatus(farmer2, done._id, 'completed');
    await request(app).post('/api/reviews').set(as(buyer)).send({ orderId: done._id, rating: 4, comment: 'good' });
    const fresh = (await placeOrder(buyer, other.id, 1)).body;
    assert.equal((await Post.findById(post.id)).quantityAvailable, 6);

    const del = body => request(app).delete('/api/auth/account').set(as(buyer)).send(body);
    assert.equal((await del({})).status, 400);                                  // password required
    assert.equal((await del({ password: 'wrong' })).status, 400);                // and must be right
    assert.ok(await User.findById(buyer.id));

    const ok = await del({ password: 'mypassword' });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.cancelledOrders, 2);

    assert.equal(await User.findById(buyer.id), null);                          // account gone
    assert.equal((await Post.findById(post.id)).quantityAvailable, 10);          // reserved stock came back
    assert.equal((await Order.findById(confirmed._id)).status, 'cancelled');
    assert.equal((await Order.findById(fresh._id)).status, 'cancelled');
    for (const id of [confirmed._id, done._id, fresh._id]) {                     // personal details removed, record kept
        const o = (await Order.findById(id)).toObject();
        assert.equal(o.buyerName, 'Deleted user');
        assert.equal(o.buyerMobile, undefined);
        assert.equal(o.note, undefined);
    }
    assert.equal((await Order.findById(done._id)).status, 'completed');          // history stays intact
    assert.equal(await Favorite.countDocuments({ user: buyer._id }), 0);
    assert.equal((await Review.findOne({ order: done._id })).buyerName, 'Deleted user');
    assert.equal((await Post.findById(other.id)).comments.length, 0);

    // deleting a farmer removes their listings and the reviews about them
    const farmerPost = await makePost({ productName: 'Mine' });
    const del2 = await request(app).delete('/api/auth/account').set(as(farmer)).send({ password: 'mypassword' });
    assert.equal(del2.status, 200);
    assert.equal(await Post.findById(farmerPost.id), null);
    assert.equal(await User.findById(farmer.id), null);
    // an unauthenticated call does nothing
    assert.equal((await request(app).delete('/api/auth/account').send({ password: 'x' })).status, 401);
});
