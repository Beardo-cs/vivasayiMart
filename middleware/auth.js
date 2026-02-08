const jwt = require('jsonwebtoken');

// Get JWT secret from environment variable first, then fall back to config
let jwtSecret;

if (process.env.jwtSecret) {
  jwtSecret = process.env.jwtSecret;
} else if (process.env.JWT_SECRET) {
  jwtSecret = process.env.JWT_SECRET;
} else {
  // Fall back to config only in development
  try {
    const config = require('config');
    jwtSecret = config.get('jwtSecret');
  } catch (err) {
    console.error('JWT Secret not found in environment variables or config');
  }
}

//middleware fn it takes 3 things(req,res,next), it has access to request-response cycle, next is a callback
module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if(!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Check if JWT secret is available
    if (!jwtSecret) {
        return res.status(500).json({ msg: 'Server configuration error: JWT secret not found' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, jwtSecret);

        req.user = decoded.user;
        // calling the next. when we call this fn, next piece of middleware will going to run
        next();
    } catch (err) {
        res.status(401).json( { msg: 'Token is not valid'});
    }
};