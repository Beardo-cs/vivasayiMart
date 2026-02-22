const mongoose = require('mongoose');

const ConsumerProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    location: {
        type: String
    },
    mobileNumber: {
        type: String
    },
    preferences: {
        type: [String],
        default: []
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = ConsumerProfile = mongoose.model('ConsumerProfile', ConsumerProfileSchema);

