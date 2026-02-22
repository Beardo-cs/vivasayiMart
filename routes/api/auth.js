const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require ('../../middleware/auth');
const jwt = require ('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const User = require ('../../models/User');

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
        res.json(user);
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

module.exports = router;