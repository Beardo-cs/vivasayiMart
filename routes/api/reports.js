const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Report = require('../../models/Report');
const Post = require('../../models/Post');

// @route     POST api/reports
// @desc      Report a listing (spam, fake, wrong price, ...). One report per user per listing.
// @access    Private
router.post('/', [
    auth,
    [
        check('postId', 'Valid product is required').matches(/^[0-9a-fA-F]{24}$/),
        check('reason', 'Invalid reason').isIn(['spam', 'fake', 'wrong-price', 'inappropriate', 'other']),
        check('details', 'Details are too long').optional().isLength({ max: 1000 })
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const post = await Post.findById(req.body.postId);
        if (!post) return res.status(404).json({ msg: 'Product not found' });
        if (post.user.toString() === req.user.id) {
            return res.status(400).json({ msg: 'You cannot report your own listing' });
        }
        await Report.create({
            reporter: req.user.id,
            post: post._id,
            farmer: post.user,
            reason: req.body.reason,
            details: req.body.details
        });
        res.json({ msg: 'Thanks, we will review this listing' });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ msg: 'You already reported this listing' });
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
