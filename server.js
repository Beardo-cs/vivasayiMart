const express = require('express');
const cors = require('cors');
// initialize express to app variable
const connectDB = require('./config/db');
const path = require ('path');
// declaring a variable app to access our app.
const app= express();

// Connect Database
connectDB();


const allowedOrigins = [
    "http://localhost:3000",
    "http://192.168.0.103:3000",
    "https://vivasayimart.vercel.app"
];

// Enable CORS for all routes
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
//application level Middleware. req.body is populated when we use middleware called body parser such as express.json() or urlencoded()
// it allows us to get data from user.js (req.body)
app.use(express.json({ extended: false }));

// app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/ai', require('./routes/api/ai'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder. Built in middleware
    app.use(express.static('client/build'));

    // Serve React app for all non-API routes
    // Express 5 doesn't support '*' - use a catch-all route instead
    // Only serve index.html if the request doesn't match a file
    app.get('*', (req, res, next) => {
        // Don't serve index.html for API routes or static files
        if (req.path.startsWith('/api/') ||
            req.path.match(/\.(js|css|json|ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot|txt|xml|map)$/)) {
            return next();
        }
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}
//process.env.PORT will look at the Port variable to run the server on corres. port
const PORT = process.env.PORT || 4000;

// Only start the server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

// Export for Vercel serverless functions
module.exports = app;
