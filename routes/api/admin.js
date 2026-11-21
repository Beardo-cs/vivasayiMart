const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const { checkAdmin } = require('../../middleware/checkRole');
const Report = require('../../models/Report');
const Post = require('../../models/Post');
const User = require('../../models/User');

const isObjectId = id => /^[0-9a-fA-F]{24}$/.test(id);
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// All routes here: logged-in admins only
router.use(auth, checkAdmin);

// @route     GET api/admin/reports?status=open|reviewed|dismissed|all
// @desc      Reports with the listing and reporter, newest first
router.get('/reports', async (req, res) => {
    try {
        const status = req.query.status || 'open';
        const filter = status === 'all' ? {} : { status };
        const reports = await Report.find(filter)
            .sort({ date: -1 })
            .limit(200)
            .populate('post', 'productName farmerName hidden user')
            .populate('reporter', 'name email');
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     PUT api/admin/reports/:id
// @desc      Resolve a report; optionally hide the reported listing
router.put('/reports/:id', [
    check('status', 'Status must be reviewed or dismissed').isIn(['reviewed', 'dismissed']),
    check('hideListing', 'hideListing must be true or false').optional().isBoolean()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        if (!isObjectId(req.params.id)) return res.status(404).json({ msg: 'Report not found' });
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Report not found' });

        report.status = req.body.status;
        await report.save();

        if (req.body.hideListing === true || req.body.hideListing === 'true') {
            await Post.updateOne({ _id: report.post }, { hidden: true });
        }
        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     PUT api/admin/posts/:id/hidden
// @desc      Hide or restore a listing
router.put('/posts/:id/hidden', [check('hidden', 'hidden must be true or false').isBoolean()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        if (!isObjectId(req.params.id)) return res.status(404).json({ msg: 'Product not found' });
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { hidden: req.body.hidden === true || req.body.hidden === 'true' },
            { new: true }
        );
        if (!post) return res.status(404).json({ msg: 'Product not found' });
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/admin/farmers?q=
// @desc      Find farmers to verify (by name or email)
router.get('/farmers', async (req, res) => {
    try {
        const filter = { userType: 'farmer' };
        if (req.query.q) {
            const rx = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
            filter.$or = [{ name: rx }, { email: rx }];
        }
        const farmers = await User.find(filter)
            .select('name email farmerVerified emailVerified date')
            .sort({ date: -1 })
            .limit(50);
        res.json(farmers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     PUT api/admin/farmers/:id/verify
// @desc      Mark a farmer verified / not verified
router.put('/farmers/:id/verify', [check('verified', 'verified must be true or false').isBoolean()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        if (!isObjectId(req.params.id)) return res.status(404).json({ msg: 'Farmer not found' });
        const farmer = await User.findOneAndUpdate(
            { _id: req.params.id, userType: 'farmer' },
            { farmerVerified: req.body.verified === true || req.body.verified === 'true' },
            { new: true }
        ).select('name email farmerVerified');
        if (!farmer) return res.status(404).json({ msg: 'Farmer not found' });
        res.json(farmer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
