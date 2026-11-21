#!/usr/bin/env node
/* Read-only health check of the data before/after a release.
 *   node scripts/data-check.js
 * Uses the same MongoDB settings as the server (env mongoURI / MONGO_URI, or config/default.json).
 * It only READS: nothing is created, changed or deleted.
 */
const mongoose = require('mongoose');

const getUri = () => {
    if (process.env.mongoURI) return process.env.mongoURI;
    if (process.env.MONGO_URI) return process.env.MONGO_URI;
    return require('config').get('mongoURI');
};

const HUGE_IMAGE_CHARS = 400000; // list responses leave images above this out (see routes/api/posts.js)

(async () => {
    const uri = getUri();
    let host = 'unknown';
    try { host = new URL(uri).host; } catch (e) { /* not a URL: leave as unknown */ }
    console.log(`Checking database on ${host} (read-only)\n`);

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    const posts = db.collection('posts');
    const users = db.collection('users');

    const count = (col, q = {}) => col.countDocuments(q);
    const line = (label, n, hint = '') => console.log(`${String(n).padStart(6)}  ${label}${n && hint ? `   <- ${hint}` : ''}`);

    console.log('LISTINGS');
    line('total listings', await count(posts));
    line('without a photo', await count(posts, { $or: [{ productImage: { $exists: false } }, { productImage: '' }, { productImage: null }] }), 'shown without an image; fine, but cards look empty');
    line('without stock field (old listings)', await count(posts, { quantityAvailable: { $exists: false } }), 'backfilled automatically when the server starts');
    line('without category', await count(posts, { category: { $exists: false } }), 'shown as "Other"');
    line('without unit', await count(posts, { unit: { $exists: false } }), 'treated as kg');
    line('price zero or missing', await count(posts, { $or: [{ price: { $lte: 0 } }, { price: { $exists: false } }] }), 'fix or remove');
    line('marked available but zero stock', await count(posts, { available: true, quantityAvailable: { $lte: 0 } }), 'will show as sold out');
    line('hidden by a moderator', await count(posts, { hidden: true }));

    // photo sizes: need the string length, so use an aggregation instead of loading images
    const big = await posts.aggregate([
        { $match: { productImage: { $type: 'string' } } },
        { $project: { productName: 1, farmerName: 1, size: { $strLenCP: '$productImage' } } },
        { $match: { size: { $gt: HUGE_IMAGE_CHARS } } },
        { $sort: { size: -1 } },
        { $limit: 15 }
    ]).toArray();
    line(`photos bigger than ~${Math.round(HUGE_IMAGE_CHARS / 1000)} KB`, big.length, 'left out of list pages; ask farmers to re-upload');
    big.forEach(p => console.log(`          - ${p.productName} (${p.farmerName}): ~${Math.round(p.size / 1000)} KB  id ${p._id}`));

    console.log('\nPEOPLE');
    const farmers = await count(users, { userType: 'farmer' });
    line('farmers', farmers);
    line('buyers', await count(users, { userType: 'consumer' }));
    line('accounts with NO role (old template accounts)', await count(users, { userType: { $nin: ['farmer', 'consumer'] } }), 'cannot use farmer or buyer features; ask them to re-register');
    line('farmers with a farm profile', await count(db.collection('farmerprofiles')), `${farmers} farmers in total`);
    line('buyers with a profile', await count(db.collection('consumerprofiles')));
    line('accounts with email not yet verified', await count(users, { emailVerified: false }));
    line('accounts created before email verification existed', await count(users, { emailVerified: { $exists: false } }), 'no banner shown to them');
    line('administrators (flag in database)', await count(users, { isAdmin: true }), 'admins can also come from ADMIN_EMAILS');

    console.log('\nACTIVITY');
    line('orders', await count(db.collection('orders')));
    line('reviews', await count(db.collection('reviews')));
    line('open reports', await count(db.collection('reports'), { status: 'open' }));

    await mongoose.disconnect();
})().catch(err => {
    console.error('Check failed:', err.message);
    process.exit(1);
});
