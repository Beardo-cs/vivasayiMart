const User = require('../models/User');

// Middleware to check if user is a farmer
const checkFarmer = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        if (user.userType !== 'farmer') {
            return res.status(403).json({ msg: 'Access denied. Farmers only.' });
        }
        
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Middleware to check if user is a consumer
const checkConsumer = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        if (user.userType !== 'consumer') {
            return res.status(403).json({ msg: 'Access denied. Consumers only.' });
        }
        
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Admin = user.isAdmin flag, or email listed in ADMIN_EMAILS (comma separated env var)
const isAdminUser = user => {
    if (!user) return false;
    if (user.isAdmin) return true;
    const list = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
    return list.includes(String(user.email || '').toLowerCase());
};

const checkAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!isAdminUser(user)) {
            return res.status(403).json({ msg: 'Access denied. Admins only.' });
        }
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { checkFarmer, checkConsumer, checkAdmin, isAdminUser };

