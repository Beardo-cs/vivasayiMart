const mongoose = require('mongoose');

// One line per Vivasayi AI check, for the daily limit and to see how checks go. No photos,
// answers or result text: those stay on the farmer's phone. Lines are removed after 180 days.
const CropCheckSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    crop: { type: String },
    photos: { type: Number },
    outcome: { type: String },
    causes: [{ type: String }],
    failed: { type: Boolean, default: false },
    ms: { type: Number },
    model: { type: String },
    promptVersion: { type: String },
    guidanceVersion: { type: String },
    at: { type: Date, default: Date.now, expires: 180 * 24 * 60 * 60 }
});
CropCheckSchema.index({ user: 1, at: -1 });

module.exports = mongoose.model('cropCheck', CropCheckSchema);
