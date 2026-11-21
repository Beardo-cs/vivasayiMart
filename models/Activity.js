const mongoose = require('mongoose');

// Admin actions, and everything done while acting for a farmer (see middleware/acting.js)
const ActivitySchema = new mongoose.Schema({
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    params: { type: mongoose.Schema.Types.Mixed },
    details: { type: mongoose.Schema.Types.Mixed },
    status: { type: Number },
    at: { type: Date, default: Date.now }
});
ActivitySchema.index({ account: 1, at: -1 });

module.exports = mongoose.model('activity', ActivitySchema);
