const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require ('../../middleware/auth');
const jwt = require ('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const crypto = require('crypto');
const User = require ('../../models/User');
const { isAdminUser } = require('../../middleware/checkRole');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../services/email');

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const newToken = () => crypto.randomBytes(32).toString('hex');

// Get JWT secret from environment variable first, then fall back to config
let jwtSecret;
if (process.env.jwtSecret) {
  jwtSecret = process.env.jwtSecret;
} else if (process.env.JWT_SECRET) {
  jwtSecret = process.env.JWT_SECRET;
} else {
  try {
    const config = require('config');
    jwtSecret = config.get('jwtSecret');
  } catch (err) {
    console.error('JWT Secret not found');
  }
}

// @route     GET api/auth
// @desc      Test route
// @access    Public
router.get('/', auth, async (req, res) => {
    try {
        // findById method is used to find a single document by use its _id field.
        const user = await User.findById(req.user.id).select('-password'); // we dont need password
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json({ ...user.toObject(), isAdmin: isAdminUser(user) });
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');

    }
});

// @route     POST api/auth
// @desc      Authenticate user & get tokenbb
// @access    Public
router.post(
    '/',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password','Password is required').exists()
],
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
    // see if user exists
        let user= await User.findOne({ email});

        if (!user) {
            return res
            .status (400)
            .json({errors: [ { msg: 'Invalid Credentials'}]});
        }
 
    const isMatch = await bcrypt.compare (password, user.password);

    if(!isMatch) {
        return res
            .status (400)
            .json({errors: [ { msg: 'Invalid Credentials'}]});
    }

    const payload = {
        user: {
            id: user.id,
            userType: user.userType
        }
    };

    jwt.sign(
        payload,
        jwtSecret,
        { expiresIn: 360000 },
        (err, token)=> {
            if(err) throw err;
            res.json({ token });
        }
        );
    } catch (err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
}
);

// @route     PUT api/auth/role
// @desc      One-time role choice for old accounts that were created before roles existed.
//            Never changes an existing role.
// @access    Private
router.put('/role', [auth, check('userType', 'Choose farmer or consumer').isIn(['farmer', 'consumer'])], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.user.id, userType: { $nin: ['farmer', 'consumer'] } },
            { userType: req.body.userType },
            { new: true }
        ).select('-password');
        if (!user) return res.status(400).json({ errors: [{ msg: 'Your role is already set' }] });
        res.json({ ...user.toObject(), isAdmin: isAdminUser(user) });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route     POST api/auth/forgot
// @desc      Email a password reset link. Always answers the same, so it can't be used
//            to find out which emails are registered.
// @access    Public
router.post('/forgot', [check('email', 'Please include a valid email').isEmail()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const generic = { msg: 'If that email is registered, a reset link has been sent.' };
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            const token = newToken();
            user.resetTokenHash = sha256(token);
            user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
            await user.save();
            try {
                await sendPasswordResetEmail(user, token);
            } catch (mailErr) {
                console.error('Reset email failed:', mailErr.message);
            }
        }
        res.json(generic);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route     POST api/auth/reset
// @desc      Set a new password using the emailed token
// @access    Public
router.post('/reset', [
    check('token', 'Token is required').not().isEmpty(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const user = await User.findOne({
            resetTokenHash: sha256(String(req.body.token)),
            resetTokenExpires: { $gt: new Date() }
        }).select('+resetTokenHash +resetTokenExpires');

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'This reset link is invalid or has expired' }] });
        }

        user.password = await bcrypt.hash(req.body.password, await bcrypt.genSalt(10));
        user.resetTokenHash = undefined;
        user.resetTokenExpires = undefined;
        await user.save();
        res.json({ msg: 'Password updated. You can now sign in.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route     POST api/auth/verify
// @desc      Confirm an email address with the emailed token
// @access    Public
router.post('/verify', [check('token', 'Token is required').not().isEmpty()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const user = await User.findOne({
            verifyTokenHash: sha256(String(req.body.token)),
            verifyTokenExpires: { $gt: new Date() }
        }).select('+verifyTokenHash +verifyTokenExpires');

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'This verification link is invalid or has expired' }] });
        }
        user.emailVerified = true;
        user.verifyTokenHash = undefined;
        user.verifyTokenExpires = undefined;
        await user.save();
        res.json({ msg: 'Email verified. Thank you!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route     POST api/auth/resend-verification
// @desc      Send a fresh verification email to the logged-in user
// @access    Private
router.post('/resend-verification', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.emailVerified) return res.json({ msg: 'Your email is already verified' });

        const token = newToken();
        user.verifyTokenHash = sha256(token);
        user.verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.emailVerified = false;
        await user.save();
        await sendVerificationEmail(user, token);
        res.json({ msg: 'Verification email sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;