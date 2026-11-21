const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FavoriteSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'post', required: true },
    date: { type: Date, default: Date.now }
});
FavoriteSchema.index({ user: 1, post: 1 }, { unique: true });

module.exports = Favorite = mongoose.model('favorite', FavoriteSchema);
