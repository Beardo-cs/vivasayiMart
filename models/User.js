//declaring mongoose module, mongoose is a ODM which manages the relationship b/w data and provides schema validation.
const mongoose = require('mongoose'); 

// A check the team actually did (phone call answered, farm visited)
const BadgeSchema = new mongoose.Schema({
    type: { type: String, enum: ['phone', 'visit'], required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    visitedOn: { type: Date }
}, { _id: false });

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
    // Admins are also granted via the ADMIN_EMAILS env var (see middleware/checkRole.js)
    isAdmin: {
        type: Boolean
    },
    // Farmers the team runs for people without a smartphone: placeholder email, nobody signs in
    managed: { type: Boolean },
    // No status = an account from before approvals existed, treated as approved
    approval: {
        status: { type: String, enum: ['pending', 'approved', 'declined'] },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date },
        note: { type: String, maxlength: 500 }
    },
    badges: [BadgeSchema],
    // Test accounts only see each other (see services/visibility.js)
    isTest: { type: Boolean },
    // When the user accepted the Terms and Privacy Policy at sign-up
    acceptedTermsAt: { type: Date },
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