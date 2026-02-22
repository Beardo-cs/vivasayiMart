const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { checkConsumer } = require('../../middleware/checkRole');
const { check, validationResult } = require('express-validator');

const ConsumerProfile = require('../../models/ConsumerProfile');
const User = require('../../models/User');

// @route     GET api/consumer-profile/me
// @desc      Get current consumer's profile
// @access    Private (Consumer only)
router.get('/me', auth, checkConsumer, async (req, res) => {
    try {
        const profile = await ConsumerProfile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar', 'email']);

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this consumer' });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     POST api/consumer-profile
// @desc      Create or update consumer profile
// @access    Private (Consumer only)
router.post(
    '/',
    [
        auth,
        checkConsumer,
        [
            check('name', 'Name is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name,
            location,
            mobileNumber,
            preferences
        } = req.body;

        // Build profile object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (name) profileFields.name = name;
        if (location) profileFields.location = location;
        if (mobileNumber) profileFields.mobileNumber = mobileNumber;
        if (preferences) profileFields.preferences = preferences;

        try {
            let profile = await ConsumerProfile.findOne({ user: req.user.id });

            if (profile) {
                // Update
                profile = await ConsumerProfile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                );

                return res.json(profile);
            }

            // Create
            profile = new ConsumerProfile(profileFields);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route     DELETE api/consumer-profile
// @desc      Delete consumer profile and user
// @access    Private (Consumer only)
router.delete('/', auth, checkConsumer, async (req, res) => {
    try {
        // Remove consumer profile
        await ConsumerProfile.findOneAndDelete({ user: req.user.id });
        
        // Remove user
        await User.findByIdAndDelete(req.user.id);

        res.json({ msg: 'Consumer profile and user deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

