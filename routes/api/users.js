// importing the express application object
const express = require('express');
//using express to get a 'Router' object
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require ('jsonwebtoken');

/* it is used to validate and response the user's stuff, like if user missed any of the required
field, express-validator takes place and remain the user to fill it.*/
const { check, validationResult } = require('express-validator');

//to pull name, email etc., pulling User module
const User = require('../../models/User');

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

// @route     POST api/users
// @desc      Register user
// @access    Public
router.post(
    '/',
    [   // below checks are sec params of post router.
        check('name', 'Name is required')
        // returns elements that do not match a certain criteria.
            .not()    
        // It is used to check whether a list, array, string, object etc is empty or not.  
            .isEmpty(), 
        check('email', 'Please include a valid email')
        //checking email whether it is in required format & valid one
        .isEmail(),   
        check(
        'password','Please enter a password with 6 or more characters')
        //checking the length of the password
            .isLength({ min: 6})    
],
async (req, res) => {      
    // set errors. It extracts the validation error from req and makes them available in a errors obj.
    const errors = validationResult(req);  

    // if any of the required info is missing it will be a bad request
    if (!errors.isEmpty()) {    
    //which is 400 and array is a method here to send the errors back
        return res.status(400).json({errors: errors.array() }); 
    }

    //pulling name email & pw from req.body
    const { name, email, password} = req.body;  

    try {
    // see if user exists
    // to select data from collections in MongoDB findOne method is used.It makes the user to wait util the returns the result of the promise
        let user= await User.findOne({ email}); 

        if (user) {
            return res.status (400).json({errors: [ { msg: 'User already exists'}]});
        }

    //Get users gravatar
    const avatar = gravatar.url(email, {    
        s: '200',  // default size
        r: 'pg',   // rating
        d: 'mm'    //default (give default image)
    });

    //which is created above and set tat to new User
    user = new User({  
        name,
        email,
        avatar,
        password     //here pw is nmo hasded
    });

    // Encrypt password

    // salt is a variable , 10 ia weight(round) more we use pw will be secure more
    // salt ia a key used to excrpt our data, here we give password.
    const salt = await bcrypt.genSalt(10);    

    // used to create a hash password 
    user.password = await bcrypt.hash(password, salt);  

    // saving the password to database
    await user.save();   

    // payload is the object. As we need user id for jwt.. getting userid
    const payload = {    
        user: {
            id: user.id
        }
    };

    // for jsonwebtoken signature we need payload and jwtsecret..
    // for authorization we are using token. We can also use email & pw, instead of giving it everytime we use jwt to access all routes.
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
        // if something goes wrong it going to be server error
        res.status(500).send('Server error');    
     }
}
);

module.exports = router;
