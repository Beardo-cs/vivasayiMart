const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Favorite = require('../../models/Favorite');
const Post = require('../../models/Post');

const isObjectId = id => /^[0-9a-fA-F]{24}$/.test(id);

// @route     PUT api/favorites/:postId
// @desc      Toggle a listing in my saved items
// @access    Private
router.put('/:postId', auth, async (req, res) => {
    try {
        if (!isObjectId(req.params.postId)) return res.status(404).json({ msg: 'Product not found' });
        const existing = await Favorite.findOneAndDelete({ user: req.user.id, post: req.params.postId });
        if (existing) return res.json({ favorite: false });

        if (!(await Post.exists({ _id: req.params.postId }))) {
            return res.status(404).json({ msg: 'Product not found' });
        }
        await Favorite.updateOne(
            { user: req.user.id, post: req.params.postId },
            { $setOnInsert: { date: new Date() } },
            { upsert: true }
        );
        res.json({ favorite: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
