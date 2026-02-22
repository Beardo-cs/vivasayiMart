const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { checkFarmer } = require('../../middleware/checkRole');
const { check, validationResult } = require('express-validator');

const FarmerProfile = require('../../models/FarmerProfile');
const User = require('../../models/User');

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
            check('farmingSpecializations', 'At least one farming specialization is required').isArray({ min: 1 })
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
        const profiles = await FarmerProfile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
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
        const profile = await FarmerProfile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar', 'email']);

        if (!profile) {
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

// @route     DELETE api/farmer-profile
// @desc      Delete farmer profile and user
// @access    Private (Farmer only)
router.delete('/', auth, checkFarmer, async (req, res) => {
    try {
        // Remove farmer profile
        await FarmerProfile.findOneAndDelete({ user: req.user.id });
        
        // Remove user
        await User.findByIdAndDelete(req.user.id);

        res.json({ msg: 'Farmer profile and user deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

