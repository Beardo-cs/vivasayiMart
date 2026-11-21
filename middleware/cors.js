const cors = require('cors');

// The React app and the API are served from the same address in production, so a browser
// call from the site's own address must always be allowed (custom domain, preview URL, ...).
// Anything else must be listed here or in the CORS_ORIGINS env var (comma separated).
const BUILT_IN = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://vivasayimart.vercel.app'
];

const extraOrigins = () => (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const isAllowed = (origin, host) => {
    if (!origin) return true; // curl, mobile apps, same-origin GETs
    try {
        if (host && new URL(origin).host === host) return true; // same site
    } catch (e) {
        return false; // malformed Origin header
    }
    return BUILT_IN.includes(origin) || extraOrigins().includes(origin);
};

// A disallowed origin simply gets no CORS headers (the browser blocks it); it is not a 500.
module.exports = cors((req, callback) => {
    callback(null, {
        origin: isAllowed(req.header('Origin'), req.headers.host),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
        exposedHeaders: ['x-auth-token']
    });
});
module.exports.isAllowed = isAllowed;
