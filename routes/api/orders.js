const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const { checkConsumer } = require('../../middleware/checkRole');

const Order = require('../../models/Order');
const { unitPriceFor } = require('../../utils/pricing');
const Post = require('../../models/Post');
const User = require('../../models/User');
const Review = require('../../models/Review');
const ConsumerProfile = require('../../models/ConsumerProfile');

const isObjectId = id => /^[0-9a-fA-F]{24}$/.test(id);

// Deduct stock atomically; returns the updated post or null if not enough stock
const reserveStock = async (postId, qty) => {
    // Backfill legacy listings that predate stock tracking
    await Post.updateOne(
        { _id: postId, quantityAvailable: { $exists: false } },
        [{ $set: { quantityAvailable: '$weight' } }],
        { updatePipeline: true }
    );
    const post = await Post.findOneAndUpdate(
        { _id: postId, available: true, quantityAvailable: { $gte: qty } },
        { $inc: { quantityAvailable: -qty } },
        { new: true }
    );
    if (post) {
        post.totalAmount = post.quantityAvailable * post.price;
        if (post.quantityAvailable <= 0) post.available = false;
        await post.save();
    }
    return post;
};

const releaseStock = async (postId, qty) => {
    const post = await Post.findById(postId);
    if (!post) return; // listing was deleted, nothing to restore
    post.quantityAvailable = (post.quantityAvailable || 0) + qty;
    post.available = true;
    post.totalAmount = post.quantityAvailable * post.price;
    await post.save();
};

// Validate one cart/order line and build (but don't save) the Order document.
// Returns { order } or { status, msg }.
const prepareOrder = async ({ userId, buyerName, buyerMobile, postId, quantity, deliveryMethod, deliveryAddress, note, checkoutId }) => {
    if (!isObjectId(String(postId))) return { status: 400, msg: 'Invalid product' };
    const post = await Post.findById(postId);
    if (!post || post.hidden) return { status: 404, msg: 'Product not found' };

    const unit = post.unit || 'kg';
    const stock = post.quantityAvailable ?? post.weight;
    if (!post.available || stock <= 0) {
        return { status: 400, msg: `${post.productName} is sold out or unavailable` };
    }
    if (!(quantity > 0)) return { status: 400, msg: 'Quantity must be greater than 0' };
    if (quantity > stock) {
        return { status: 400, msg: `Only ${stock} ${unit} of ${post.productName} available` };
    }
    if (post.user.toString() === userId) {
        return { status: 400, msg: 'You cannot order your own product' };
    }

    const pricePerUnit = unitPriceFor(post.price, post.bulkPricing, quantity);

    return {
        order: new Order({
            post: post._id,
            buyer: userId,
            farmer: post.user,
            productName: post.productName,
            productImage: post.productImage,
            unit,
            pricePerUnit,
            quantity,
            totalAmount: Math.round(quantity * pricePerUnit * 100) / 100,
            buyerName,
            buyerMobile,
            farmerName: post.farmerName,
            farmerMobile: post.mobileNumber,
            deliveryMethod,
            deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress.trim() : undefined,
            note,
            checkoutId
        })
    };
};

const buyerDetails = async userId => {
    const [buyer, profile] = await Promise.all([
        User.findById(userId).select('name'),
        ConsumerProfile.findOne({ user: userId })
    ]);
    return {
        buyerName: (profile && profile.name) || (buyer && buyer.name),
        buyerMobile: profile && profile.mobileNumber
    };
};

const deliveryChecks = [
    check('deliveryMethod', 'Invalid delivery method').optional().isIn(['pickup', 'delivery']),
    check('note', 'Note is too long').optional().isLength({ max: 500 })
];

const deliveryError = ({ deliveryMethod = 'pickup', deliveryAddress }) =>
    deliveryMethod === 'delivery' && !(deliveryAddress && String(deliveryAddress).trim())
        ? 'Delivery address is required for delivery'
        : null;

// @route     POST api/orders
// @desc      Place an order request for one listing
// @access    Private (Consumer)
router.post('/', [
    auth,
    checkConsumer,
    [
        check('postId', 'Valid product is required').custom(isObjectId),
        check('quantity', 'Quantity must be greater than 0').isFloat({ gt: 0 }),
        ...deliveryChecks
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { postId, deliveryMethod = 'pickup', deliveryAddress, note } = req.body;
        const dErr = deliveryError(req.body);
        if (dErr) return res.status(400).json({ msg: dErr });

        const result = await prepareOrder({
            userId: req.user.id,
            ...(await buyerDetails(req.user.id)),
            postId, quantity: Number(req.body.quantity), deliveryMethod, deliveryAddress, note
        });
        if (result.msg) return res.status(result.status).json({ msg: result.msg });

        await result.order.save();
        res.json(result.order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     POST api/orders/checkout
// @desc      Order several listings at once (cart). Creates one order request per
//            listing (farmers handle each separately) sharing a checkoutId.
//            All lines are validated first; nothing is created if any line is invalid.
// @access    Private (Consumer)
router.post('/checkout', [
    auth,
    checkConsumer,
    [
        check('items', 'Cart is empty').isArray({ min: 1, max: 30 }),
        check('items.*.postId', 'Valid product is required').custom(isObjectId),
        check('items.*.quantity', 'Quantity must be greater than 0').isFloat({ gt: 0 }),
        ...deliveryChecks
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { deliveryMethod = 'pickup', deliveryAddress, note } = req.body;
        const dErr = deliveryError(req.body);
        if (dErr) return res.status(400).json({ msg: dErr });

        // merge duplicate lines for the same product
        const merged = new Map();
        req.body.items.forEach(i => {
            merged.set(String(i.postId), (merged.get(String(i.postId)) || 0) + Number(i.quantity));
        });

        const buyer = await buyerDetails(req.user.id);
        const checkoutId = new mongoose.Types.ObjectId().toString();
        const orders = [];
        for (const [postId, quantity] of merged) {
            const result = await prepareOrder({
                userId: req.user.id, ...buyer, postId, quantity,
                deliveryMethod, deliveryAddress, note, checkoutId
            });
            if (result.msg) return res.status(result.status).json({ msg: result.msg, postId });
            orders.push(result.order);
        }

        await Order.insertMany(orders);
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/orders/mine
// @desc      Orders I placed (buyer)
// @access    Private
router.get('/mine', auth, async (req, res) => {
    try {
        const orders = await Order.find({ buyer: req.user.id }).sort({ date: -1 });
        const reviews = await Review.find({ order: { $in: orders.map(o => o._id) } });
        const byOrder = {};
        reviews.forEach(r => { byOrder[r.order.toString()] = r; });
        res.json(orders.map(o => ({ ...o.toObject(), review: byOrder[o.id] || null })));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/orders/received
// @desc      Orders placed on my listings (farmer)
// @access    Private
router.get('/received', auth, async (req, res) => {
    try {
        const orders = await Order.find({ farmer: req.user.id }).sort({ date: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/orders/stats
// @desc      Farmer dashboard numbers
// @access    Private
router.get('/stats', auth, async (req, res) => {
    try {
        const [totalProducts, activeListings, pendingOrders, confirmedOrders, completed] = await Promise.all([
            Post.countDocuments({ user: req.user.id }),
            Post.countDocuments({ user: req.user.id, available: true, quantityAvailable: { $gt: 0 } }),
            Order.countDocuments({ farmer: req.user.id, status: 'placed' }),
            Order.countDocuments({ farmer: req.user.id, status: 'confirmed' }),
            Order.aggregate([
                { $match: { farmer: new mongoose.Types.ObjectId(req.user.id), status: 'completed' } },
                { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
            ])
        ]);
        res.json({
            totalProducts,
            activeListings,
            pendingOrders,
            confirmedOrders,
            completedOrders: completed[0] ? completed[0].count : 0,
            revenue: completed[0] ? completed[0].revenue : 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/orders/badge
// @desc      Count of orders needing my attention: new requests (farmer)
//            plus farmer updates I haven't seen (buyer)
// @access    Private
router.get('/badge', auth, async (req, res) => {
    try {
        const [toReview, updates] = await Promise.all([
            Order.countDocuments({ farmer: req.user.id, status: 'placed' }),
            Order.countDocuments({ buyer: req.user.id, buyerSeen: false })
        ]);
        res.json({ count: toReview + updates });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     PUT api/orders/seen
// @desc      Mark farmer updates on my orders as seen
// @access    Private
router.put('/seen', auth, async (req, res) => {
    try {
        await Order.updateMany({ buyer: req.user.id, buyerSeen: false }, { buyerSeen: true });
        res.json({ msg: 'ok' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Allowed transitions: from -> { to: [roles allowed] }
const TRANSITIONS = {
    placed:    { confirmed: ['farmer'], rejected: ['farmer'], cancelled: ['buyer'] },
    confirmed: { completed: ['farmer'], cancelled: ['buyer', 'farmer'] }
};

// @route     PUT api/orders/:id/status
// @desc      Move an order along: confirmed | rejected | completed | cancelled
// @access    Private (farmer or buyer of that order)
router.put('/:id/status', [
    auth,
    check('status', 'Invalid status').isIn(['confirmed', 'rejected', 'cancelled', 'completed'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        if (!isObjectId(req.params.id)) return res.status(404).json({ msg: 'Order not found' });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        let role = null;
        if (order.farmer.toString() === req.user.id) role = 'farmer';
        else if (order.buyer.toString() === req.user.id) role = 'buyer';
        if (!role) return res.status(401).json({ msg: 'User not authorised' });

        const next = req.body.status;
        const allowedRoles = TRANSITIONS[order.status] && TRANSITIONS[order.status][next];
        if (!allowedRoles) {
            return res.status(400).json({ msg: `Cannot change an order from ${order.status} to ${next}` });
        }
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ msg: `A ${role} cannot mark this order ${next}` });
        }

        if (next === 'confirmed') {
            const post = await reserveStock(order.post, order.quantity);
            if (!post) {
                return res.status(400).json({ msg: 'Not enough stock left to confirm this order' });
            }
            order.stockReserved = true;
        } else if (next === 'cancelled' && order.stockReserved) {
            await releaseStock(order.post, order.quantity);
            order.stockReserved = false;
        }

        order.status = next;
        if (role === 'farmer') order.buyerSeen = false;
        order.updatedAt = Date.now();
        await order.save();
        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
