const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const { checkConsumer } = require('../../middleware/checkRole');
const Review = require('../../models/Review');
const Order = require('../../models/Order');

const isObjectId = id => /^[0-9a-fA-F]{24}$/.test(id);

// @route     POST api/reviews
// @desc      Review a completed order (once per order)
// @access    Private (Consumer who placed the order)
router.post('/', [
    auth,
    checkConsumer,
    [
        check('orderId', 'Valid order is required').custom(isObjectId),
        check('rating', 'Rating must be 1 to 5').isInt({ min: 1, max: 5 }),
        check('comment', 'Comment is too long').optional().isLength({ max: 1000 })
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const order = await Order.findById(req.body.orderId);
        if (!order) return res.status(404).json({ msg: 'Order not found' });
        if (order.buyer.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorised' });
        if (order.status !== 'completed') {
            return res.status(400).json({ msg: 'You can review an order once it is completed' });
        }
        if (await Review.findOne({ order: order._id })) {
            return res.status(400).json({ msg: 'You already reviewed this order' });
        }

        const review = await Review.create({
            order: order._id,
            post: order.post,
            productName: order.productName,
            farmer: order.farmer,
            buyer: req.user.id,
            buyerName: order.buyerName,
            rating: Number(req.body.rating),
            comment: req.body.comment
        });
        res.json(review);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ msg: 'You already reviewed this order' });
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/reviews/farmer/:id
// @desc      Rating summary and recent reviews for a farmer (user id)
// @access    Public (shown on the shareable farmer page)
router.get('/farmer/:id', async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) return res.status(404).json({ msg: 'Farmer not found' });
        const farmerId = new mongoose.Types.ObjectId(req.params.id);
        const [summary, reviews] = await Promise.all([
            Review.aggregate([
                { $match: { farmer: farmerId } },
                { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
            ]),
            Review.find({ farmer: farmerId }).sort({ date: -1 }).limit(20)
        ]);
        res.json({
            average: summary[0] ? Math.round(summary[0].average * 10) / 10 : 0,
            count: summary[0] ? summary[0].count : 0,
            reviews
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
