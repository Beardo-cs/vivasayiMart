const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isAdminUser } = require('./checkRole');
const { recordActing } = require('./acting');
const jwtSecret = require('../utils/jwtSecret');

//middleware fn it takes 3 things(req,res,next), it has access to request-response cycle, next is a callback
module.exports = async function(req, res, next) {
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
    let decoded;
    try {
        decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
        return res.status(401).json( { msg: 'Token is not valid'});
    }
    req.user = decoded.user;
    if (!decoded.actor) return next();

    // Acting for a farmer: the session ends as soon as the admin is no longer an admin
    try {
        const actor = await User.findById(decoded.actor.id).select('name email isAdmin');
        if (!isAdminUser(actor)) return res.status(401).json({ msg: 'Token is not valid' });
        req.actor = { id: actor.id, name: actor.name };
        req.actingUntil = decoded.exp * 1000;
        if (req.method !== 'GET') recordActing(req, res);
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
