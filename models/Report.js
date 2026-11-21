const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User reports about a listing (and its farmer). Stored for moderator review.
const ReportSchema = new Schema({
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'post', required: true },
    farmer: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: {
        type: String,
        enum: ['spam', 'fake', 'wrong-price', 'inappropriate', 'other'],
        required: true
    },
    details: { type: String, maxlength: 1000 },
    status: { type: String, enum: ['open', 'reviewed', 'dismissed'], default: 'open' },
    date: { type: Date, default: Date.now }
});
ReportSchema.index({ reporter: 1, post: 1 }, { unique: true });

module.exports = Report = mongoose.model('report', ReportSchema);
