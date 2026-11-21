//declaring mongoose module, mongoose is a ODM which manages the relationship b/w data and provides schema validation.
const mongoose = require('mongoose'); 

//defining schema, it represents the structure of the document
const UserSchema = new mongoose.Schema( {
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    // gravatar allows us to attach a profile image to email
    avatar: {
        type: String
    },
    // User type: farmer or consumer
    userType: {
        type: String,
        enum: ['farmer', 'consumer'],
        required: true
    },
    // Set by an admin after checking a farmer; shown as a badge on their listings
    farmerVerified: {
        type: Boolean
    },
    // Admins are also granted via the ADMIN_EMAILS env var (see middleware/checkRole.js)
    isAdmin: {
        type: Boolean
    },
    // Email verification (no default so existing accounts are not flagged as unverified)
    emailVerified: { type: Boolean },
    verifyTokenHash: { type: String, select: false },
    verifyTokenExpires: { type: Date, select: false },
    // Password reset
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    date: {
        type: Date,
    //automatically it takes current time and date.
        default: Date.now
    }
});

//exporting it and set a variable user to mongoose.model.here User is model name and schema                                                                                                                                                   
module.exports = User = mongoose.model('User', UserSchema);      