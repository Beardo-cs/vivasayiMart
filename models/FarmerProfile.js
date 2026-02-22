const mongoose = require('mongoose');

const FarmerProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    farmName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    bio: {
        type: String
    },
    farmingSpecializations: {
        type: [String],
        required: true
    },
    yearsOfExperience: {
        type: Number,
        default: 0
    },
    farmSize: {
        type: String
    },
    certifications: {
        type: String
    },
    profileImage: {
        type: String
    },
    // Social media links
    social: {
        facebook: {
            type: String
        },
        instagram: {
            type: String
        },
        whatsapp: {
            type: String
        }
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = FarmerProfile = mongoose.model('FarmerProfile', FarmerProfileSchema);

