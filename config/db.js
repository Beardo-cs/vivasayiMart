const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use environment variable first, then fall back to config
    let db;

    if (process.env.mongoURI) {
      db = process.env.mongoURI;
    } else if (process.env.MONGO_URI) {
      db = process.env.MONGO_URI;
    } else {
      // Fall back to config only in development
      try {
        const config = require('config');
        db = config.get('mongoURI');
      } catch (err) {
        throw new Error('MongoDB URI not found in environment variables or config');
      }
    }

    // Check if already connected (important for serverless)
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    await mongoose.connect(db, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // Don't exit process in serverless environment
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    } else {
      throw err;
    }
  }
};

module.exports = connectDB;