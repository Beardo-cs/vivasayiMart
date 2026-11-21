const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { checkFarmer } = require('../../middleware/checkRole');
const { check, validationResult } = require('express-validator');

const FarmerProfile = require('../../models/FarmerProfile');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Review = require('../../models/Review');
const mongoose = require('mongoose');
const { visibleFarmerIds, canSee } = require('../../services/visibility');
const { publicBadges } = require('../../utils/badges');

const isObjectId = id => /^[0-9a-fA-F]{24}$/.test(id);

// @route     GET api/farmer-profile/me
// @desc      Get current farmer's profile
// @access    Private (Farmer only)
router.get('/me', auth, checkFarmer, async (req, res) => {
    try {
        const profile = await FarmerProfile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar', 'email']);

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this farmer' });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     POST api/farmer-profile
// @desc      Create or update farmer profile
// @access    Private (Farmer only)
router.post(
    '/',
    [
        auth,
        checkFarmer,
        [
            check('farmName', 'Farm name is required').not().isEmpty(),
            check('location', 'Location is required').not().isEmpty(),
            check('mobileNumber', 'Mobile number is required').not().isEmpty(),
            check('farmingSpecializations', 'At least one farming specialization is required').isArray({ min: 1 }),
            check('yearsOfExperience', 'Years of experience must be a number').optional({ values: 'falsy' }).isFloat({ min: 0, max: 100 })
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            farmName,
            location,
            mobileNumber,
            bio,
            farmingSpecializations,
            yearsOfExperience,
            farmSize,
            certifications,
            profileImage,
            facebook,
            instagram,
            whatsapp
        } = req.body;

        // Build profile object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (farmName) profileFields.farmName = farmName;
        if (location) profileFields.location = location;
        if (mobileNumber) profileFields.mobileNumber = mobileNumber;
        if (bio) profileFields.bio = bio;
        if (farmingSpecializations) profileFields.farmingSpecializations = farmingSpecializations;
        if (yearsOfExperience) profileFields.yearsOfExperience = yearsOfExperience;
        if (farmSize) profileFields.farmSize = farmSize;
        if (certifications) profileFields.certifications = certifications;
        if (profileImage) profileFields.profileImage = profileImage;

        // Build social object
        profileFields.social = {};
        if (facebook) profileFields.social.facebook = facebook;
        if (instagram) profileFields.social.instagram = instagram;
        if (whatsapp) profileFields.social.whatsapp = whatsapp;

        try {
            let profile = await FarmerProfile.findOne({ user: req.user.id });

            if (profile) {
                // Update
                profile = await FarmerProfile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                );

                return res.json(profile);
            }

            // Create
            profile = new FarmerProfile(profileFields);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route     GET api/farmer-profile
// @desc      Get all farmer profiles
// @access    Public
router.get('/', async (req, res) => {
    try {
        const profiles = await FarmerProfile.find({ user: { $in: await visibleFarmerIds(null) } })
            .sort({ date: -1 })
            .populate('user', ['name', 'avatar', 'badges']);
        const ids = profiles.map(p => p.user && p.user._id).filter(Boolean);
        const ratings = ids.length ? await Review.aggregate([
            { $match: { farmer: { $in: ids } } },
            { $group: { _id: '$farmer', average: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]) : [];
        const byFarmer = {};
        ratings.forEach(r => { byFarmer[r._id.toString()] = { average: Math.round(r.average * 10) / 10, count: r.count }; });

        res.json(profiles
            .filter(p => p.user)
            .map(p => ({
                ...p.toObject(),
                user: { _id: p.user._id, name: p.user.name, avatar: p.user.avatar, badges: publicBadges(p.user.badges) },
                rating: byFarmer[p.user._id.toString()] || { average: 0, count: 0 }
            })));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/farmer-profile/:user_id/public
// @desc      Everything for the shareable farmer page: profile (may be null), rating,
//            and current in-stock listings. Contact number is NOT included.
// @access    Public
router.get('/:user_id/public', async (req, res) => {
    try {
        if (!isObjectId(req.params.user_id)) return res.status(404).json({ msg: 'Farmer not found' });
        const user = await User.findOne({ _id: req.params.user_id, userType: 'farmer' }).select('name avatar badges');
        if (!user || !canSee(await visibleFarmerIds(null), user._id)) return res.status(404).json({ msg: 'Farmer not found' });

        const [profile, products, summary] = await Promise.all([
            FarmerProfile.findOne({ user: user._id }).select('-mobileNumber -social.whatsapp'),
            Post.find({ user: user._id, hidden: { $ne: true }, available: true, quantityAvailable: { $gt: 0 } })
                .select('-comments -likes -mobileNumber')
                .sort({ date: -1 })
                .limit(24),
            Review.aggregate([
                { $match: { farmer: new mongoose.Types.ObjectId(req.params.user_id) } },
                { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            farmer: { _id: user._id, name: user.name, avatar: user.avatar, badges: publicBadges(user.badges) },
            profile,
            products,
            rating: summary[0]
                ? { average: Math.round(summary[0].average * 10) / 10, count: summary[0].count }
                : { average: 0, count: 0 }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/farmer-profile/:user_id
// @desc      Get farmer profile by user ID
// @access    Public
router.get('/:user_id', async (req, res) => {
    try {
        const profile = await FarmerProfile.findOne({ user: req.params.user_id }).select('-mobileNumber').populate('user', ['name', 'avatar']);

        if (!profile || !canSee(await visibleFarmerIds(null), profile.user && profile.user._id)) {
            return res.status(400).json({ msg: 'Profile not found' });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;

