const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    post: { type: Schema.Types.ObjectId, ref: 'post', required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    farmer: { type: Schema.Types.ObjectId, ref: 'users', required: true },

    // Snapshot of the listing at order time (listing may later be edited/deleted)
    productName: { type: String, required: true },
    productImage: { type: String },
    unit: { type: String, default: 'kg' },
    pricePerUnit: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    totalAmount: { type: Number, required: true },

    buyerName: { type: String },
    buyerMobile: { type: String },
    farmerName: { type: String },
    farmerMobile: { type: String },

    deliveryMethod: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    deliveryAddress: { type: String },
    note: { type: String, maxlength: 500 },

    // orders created together from one cart checkout share this id
    checkoutId: { type: String },

    status: {
        type: String,
        enum: ['placed', 'confirmed', 'rejected', 'cancelled', 'completed'],
        default: 'placed'
    },
    // false when the farmer changed the order and the buyer hasn't looked yet
    buyerSeen: { type: Boolean, default: true },
    // true while this order's quantity is deducted from the listing's stock
    stockReserved: { type: Boolean, default: false },

    date: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = Order = mongoose.model('order', OrderSchema);
