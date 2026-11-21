const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// One review per completed order, written by the buyer about the farmer/product
const ReviewSchema = new Schema({
    order: { type: Schema.Types.ObjectId, ref: 'order', required: true, unique: true },
    post: { type: Schema.Types.ObjectId, ref: 'post' },
    productName: { type: String },
    farmer: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    buyerName: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
    date: { type: Date, default: Date.now }
});

module.exports = Review = mongoose.model('review', ReviewSchema);
