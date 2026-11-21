const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const gravatar = require('gravatar');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');
const { checkAdmin } = require('../../middleware/checkRole');
const { noActing } = require('../../middleware/acting');
const jwtSecret = require('../../utils/jwtSecret');
const Report = require('../../models/Report');
const Post = require('../../models/Post');
const User = require('../../models/User');
const FarmerProfile = require('../../models/FarmerProfile');
const Activity = require('../../models/Activity');

const isObjectId = id => /^[0-9a-fA-F]{24}$/.test(id);
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isTrue = v => v === true || v === 'true';
const ACTING_SECONDS = 60 * 60;

const record = (req, account, action, details) =>
    Activity.create({ actor: req.user.id, account, action, details });

const farmerSummary = (user, profile) => ({
    _id: user._id,
    name: user.name,
    email: user.managed ? null : user.email,
    managed: !!user.managed,
    isTest: !!user.isTest,
    approval: user.approval && user.approval.status ? user.approval : { status: 'approved' },
    badges: user.badges || [],
    date: user.date,
    farmName: profile ? profile.farmName : null,
    location: profile ? profile.location : null
});

// All routes here: logged-in admins only, and never while acting for a farmer
router.use(auth, noActing, checkAdmin);

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

// @route     GET api/admin/attention
// @desc      What needs the founder now: farmers waiting for approval, oldest first
router.get('/attention', async (req, res) => {
    try {
        const pending = await User.find({ userType: 'farmer', 'approval.status': 'pending' })
            .select('name email date')
            .sort({ date: 1 })
            .limit(100);
        res.json({ pendingFarmers: pending.map(f => ({ _id: f._id, name: f.name, email: f.email, waitingSince: f.date })) });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/admin/farmers?q=&status=pending
// @desc      Farmers by name or email, with their farm, approval, badges and test flag
router.get('/farmers', async (req, res) => {
    try {
        const filter = { userType: 'farmer' };
        if (req.query.q) {
            const rx = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
            filter.$or = [{ name: rx }, { email: rx }];
        }
        if (req.query.status === 'pending') filter['approval.status'] = 'pending';
        const farmers = await User.find(filter)
            .select('name email managed isTest approval badges date')
            .sort({ date: -1 })
            .limit(100);
        const profiles = await FarmerProfile.find({ user: { $in: farmers.map(f => f._id) } }).select('user farmName location');
        const profileOf = {};
        profiles.forEach(p => { profileOf[p.user.toString()] = p; });
        res.json(farmers.map(f => farmerSummary(f, profileOf[f.id])));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     POST api/admin/farmers
// @desc      Add a farmer the team runs (no smartphone): no email, nobody signs in to it
router.post('/farmers', [
    check('name', 'Name is required').trim().notEmpty(),
    check('mobileNumber', 'Enter a 10-digit mobile number')
        .customSanitizer(v => String(v || '').replace(/[\s-]/g, ''))
        .matches(/^(\+91)?[6-9]\d{9}$/),
    check('location', 'Village or town is required').trim().notEmpty(),
    check('farmName', 'Farm name is required').trim().notEmpty(),
    check('farmingSpecializations', 'Say what they grow').isArray({ min: 1 }),
    check('phoneVerified', 'phoneVerified must be true or false').optional().isBoolean(),
    check('visitedOn', 'Visit date is not valid').optional({ values: 'falsy' }).isISO8601(),
    check('isTest', 'isTest must be true or false').optional().isBoolean()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const { name, mobileNumber, location, farmName, farmingSpecializations, farmSize, phoneVerified, visitedOn, isTest } = req.body;
        const id = new mongoose.Types.ObjectId();
        // .invalid can never be a real address, so no email is ever sent to it
        const email = `farmer-${id}@managed.invalid`;
        const badges = [];
        if (isTrue(phoneVerified)) badges.push({ type: 'phone', by: req.user.id });
        if (visitedOn) badges.push({ type: 'visit', by: req.user.id, visitedOn: new Date(visitedOn) });

        const farmer = await User.create({
            _id: id,
            name,
            email,
            avatar: gravatar.url(email, { s: '200', r: 'pg', d: 'mm' }),
            password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
            userType: 'farmer',
            managed: true,
            approval: { status: 'approved', by: req.user.id, at: new Date(), note: 'Added by an admin' },
            badges,
            isTest: isTrue(isTest) || undefined
        });
        const profile = await FarmerProfile.create({
            user: farmer._id,
            farmName,
            location,
            mobileNumber,
            farmingSpecializations: farmingSpecializations.map(s => String(s).trim()).filter(Boolean),
            farmSize: farmSize || undefined
        });
        await record(req, farmer._id, 'farmer.create', { name: farmer.name, isTest: !!farmer.isTest });
        res.json(farmerSummary(farmer, profile));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     PUT api/admin/farmers/:id/approval
// @desc      Approve or decline a farmer (declining needs a reason the farmer will see)
router.put('/farmers/:id/approval', [
    check('status', 'Status must be approved or declined').isIn(['approved', 'declined']),
    check('note', 'Note is too long').optional().isLength({ max: 500 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const note = String(req.body.note || '').trim();
    if (req.body.status === 'declined' && !note) {
        return res.status(400).json({ errors: [{ msg: 'Say why the farmer is declined' }] });
    }
    try {
        if (!isObjectId(req.params.id)) return res.status(404).json({ msg: 'Farmer not found' });
        const farmer = await User.findOneAndUpdate(
            { _id: req.params.id, userType: 'farmer' },
            { approval: { status: req.body.status, by: req.user.id, at: new Date(), note: note || undefined } },
            { new: true }
        );
        if (!farmer) return res.status(404).json({ msg: 'Farmer not found' });
        await record(req, farmer._id, req.body.status === 'approved' ? 'farmer.approve' : 'farmer.decline', { note });
        res.json(farmerSummary(farmer));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     PUT api/admin/farmers/:id/badges
// @desc      Turn a badge on or off (a farm visit needs the date it happened)
router.put('/farmers/:id/badges', [
    check('type', 'Unknown badge').isIn(['phone', 'visit']),
    check('on', 'on must be true or false').isBoolean(),
    check('visitedOn', 'Visit date is not valid').optional({ values: 'falsy' }).isISO8601()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { type, visitedOn } = req.body;
    const on = isTrue(req.body.on);
    if (on && type === 'visit' && !visitedOn) {
        return res.status(400).json({ errors: [{ msg: 'Give the date of the farm visit' }] });
    }
    try {
        if (!isObjectId(req.params.id)) return res.status(404).json({ msg: 'Farmer not found' });
        const farmer = await User.findOne({ _id: req.params.id, userType: 'farmer' });
        if (!farmer) return res.status(404).json({ msg: 'Farmer not found' });
        const badges = (farmer.badges || []).filter(b => b.type !== type);
        if (on) badges.push({ type, by: req.user.id, at: new Date(), visitedOn: type === 'visit' ? new Date(visitedOn) : undefined });
        farmer.badges = badges;
        await farmer.save();
        await record(req, farmer._id, on ? 'badge.add' : 'badge.remove', { type });
        res.json(farmerSummary(farmer));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     POST api/admin/act-as/:id
// @desc      Open a farmer's account for up to an hour (only farmers the team added).
//            The token carries the admin as actor; see middleware/auth.js and middleware/acting.js
router.post('/act-as/:id', async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) return res.status(404).json({ msg: 'Farmer not found' });
        const farmer = await User.findOne({ _id: req.params.id, userType: 'farmer' }).select('name managed');
        if (!farmer) return res.status(404).json({ msg: 'Farmer not found' });
        if (!farmer.managed) return res.status(400).json({ msg: 'You can only act for farmers you added' });

        const token = jwt.sign(
            { user: { id: farmer.id, userType: 'farmer' }, actor: { id: req.user.id } },
            jwtSecret,
            { expiresIn: ACTING_SECONDS }
        );
        await record(req, farmer._id, 'act-as.start');
        res.json({ token, farmer: { _id: farmer._id, name: farmer.name }, until: jwt.decode(token).exp * 1000 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/admin/users?q=
// @desc      Find any account by name or email (to mark test accounts)
router.get('/users', async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        if (!q) return res.json([]);
        const rx = new RegExp(escapeRegex(q), 'i');
        const users = await User.find({ $or: [{ name: rx }, { email: rx }] })
            .select('name email userType managed isTest date')
            .sort({ date: -1 })
            .limit(50);
        res.json(users.map(u => ({
            _id: u._id,
            name: u.name,
            email: u.managed ? null : u.email,
            userType: u.userType || null,
            managed: !!u.managed,
            isTest: !!u.isTest
        })));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     PUT api/admin/users/:id/test
// @desc      Mark or unmark a test account (test accounts only see each other)
router.put('/users/:id/test', [check('isTest', 'isTest must be true or false').isBoolean()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        if (!isObjectId(req.params.id)) return res.status(404).json({ msg: 'User not found' });
        const isTest = isTrue(req.body.isTest);
        const user = await User.findByIdAndUpdate(
            req.params.id,
            isTest ? { isTest: true } : { $unset: { isTest: 1 } },
            { new: true }
        );
        if (!user) return res.status(404).json({ msg: 'User not found' });
        await record(req, user._id, 'account.test', { isTest });
        res.json({ _id: user._id, isTest: !!user.isTest });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/admin/activity?account=&limit=
// @desc      Newest activity first, optionally for one account
router.get('/activity', async (req, res) => {
    try {
        const filter = {};
        if (req.query.account) {
            if (!isObjectId(String(req.query.account))) return res.json([]);
            filter.account = req.query.account;
        }
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
        const entries = await Activity.find(filter)
            .sort({ at: -1, _id: -1 })
            .limit(limit)
            .populate('actor', 'name')
            .populate('account', 'name');
        res.json(entries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
