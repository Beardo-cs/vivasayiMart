const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema =  new Schema ( {
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    text: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    avatar: {
        type: String
    },
    // Agricultural product fields
    farmerName: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    productImage: {
        type: String
    },
    // Quantity originally listed (kept as `weight` for backward compatibility)
    weight: {
        type: Number,
        required: true
    },
    // Unit of measure for weight/price
    unit: {
        type: String,
        enum: ['kg', 'litre', 'dozen', 'piece'],
        default: 'kg'
    },
    // Optional cheaper prices for larger quantities, e.g. [{ minQuantity: 50, price: 18 }]
    bulkPricing: {
        type: [{
            _id: false,
            minQuantity: { type: Number, required: true, min: 0 },
            price: { type: Number, required: true, min: 0 }
        }],
        default: []
    },
    // Stock remaining; reduced when the farmer confirms an order
    quantityAvailable: {
        type: Number,
        min: 0
    },
    price: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    // Product category
    category: {
        type: String,
        enum: ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Poultry', 'Other'],
        default: 'Other'
    },
    // Product availability status
    available: {
        type: Boolean,
        default: true
    },
    // Hidden by an admin after a report; not shown in listings and cannot be ordered
    hidden: {
        type: Boolean,
        default: false
    },
    likes: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'users'
            }
        }
    ],
    comments: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'users'
            },
            text: {
                type: String,
                required: true
            },
            name: {
                type: String
            },
            avatar: {
                type: String
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = Post = mongoose.model('post',PostSchema);