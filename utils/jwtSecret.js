// Environment first (Vercel sets it there), then config/default.json for local development
let jwtSecret = process.env.jwtSecret || process.env.JWT_SECRET;
if (!jwtSecret) {
    try {
        jwtSecret = require('config').get('jwtSecret');
    } catch (err) {
        console.error('JWT Secret not found in environment variables or config');
    }
}

module.exports = jwtSecret;
