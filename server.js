const express = require('express');
const cors = require('cors');
// initialize express to app variable
const connectDB = require('./config/db');
const path = require ('path');
// declaring a variable app to access our app.
const app= express();

// Needed behind Vercel/other proxies so rate limiting sees the real client IP
app.set('trust proxy', 1);

// Connect Database
connectDB();


const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.74:3000",
    "https://vivasayimart.vercel.app"
];

// Enable CORS for all routes with proper preflight handling
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    exposedHeaders: ['x-auth-token']
}));
//application level Middleware. req.body is populated when we use middleware called body parser such as express.json() or urlencoded()
// it allows us to get data from user.js (req.body)
// Product photos are sent as base64 inside JSON, so the 100kb default is far too small.
// (Client also downsizes photos before upload; Vercel itself caps request bodies at ~4.5MB.)
app.use(express.json({ extended: false, limit: '8mb' }));

// app.get('/', (req, res) => res.send('API Running'));

// Define Routes
// Rate limits: brute-force protection on auth, cost protection on AI (paid Gemini quota)
const rateLimit = require('express-rate-limit');
const limiter = (windowMinutes, max, msg) => rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg }
});
// POST only: GET /api/auth runs on every page load to restore the session
app.post('/api/auth', limiter(15, 30, 'Too many login attempts, please try again later'));
app.post('/api/users', limiter(60, 20, 'Too many sign-up attempts, please try again later'));
app.post('/api/auth/forgot', limiter(60, 5, 'Too many reset requests, please try again later'));
app.post('/api/auth/reset', limiter(60, 10, 'Too many attempts, please try again later'));
app.post('/api/auth/resend-verification', limiter(60, 5, 'Too many requests, please try again later'));
app.use('/api/ai', limiter(60, 60, 'AI request limit reached, please try again later'));

app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/farmer-profile', require('./routes/api/farmerProfile'));
app.use('/api/consumer-profile', require('./routes/api/consumerProfile'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/orders', require('./routes/api/orders'));
app.use('/api/reviews', require('./routes/api/reviews'));
app.use('/api/favorites', require('./routes/api/favorites'));
app.use('/api/reports', require('./routes/api/reports'));
app.use('/api/admin', require('./routes/api/admin'));
app.use('/api/ai', require('./routes/api/ai'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder. Built in middleware
    app.use(express.static(path.join(__dirname, 'client/build')));

    // Serve React app for all non-API, non-static routes
    app.use((req, res, next) => {
        // Skip if it's an API route
        if (req.path.startsWith('/api/')) {
            return next();
        }

        // Skip if it's a static file request
        if (req.path.match(/\.(js|css|json|ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot|txt|xml|map)$/)) {
            return next();
        }

        // Serve index.html for all other routes (SPA routing)
        res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
    });
}
//process.env.PORT will look at the Port variable to run the server on corres. port
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

// Only start the server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
    app.listen(PORT, HOST, () => {
        console.log(`Server started on port ${PORT}`);
        console.log(`Server accessible at:`);
        console.log(`  - Local:   http://localhost:${PORT}`);
        console.log(`  - Network: http://192.168.1.74:${PORT}`);
    });
}

// Export for Vercel serverless functions
module.exports = app;
