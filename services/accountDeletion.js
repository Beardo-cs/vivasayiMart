// Permanently deletes a user and their personal data. Used by DELETE /api/auth/account
// (required by Apple and Google: users must be able to delete their account inside the app).
//
// What happens:
//  - active orders (placed/confirmed) are cancelled, reserved stock is returned
//  - the other person keeps a basic record of past orders, with the deleted person's
//    name, phone, address and notes removed
//  - the user's listings, profile, favourites, reports, comments and likes are deleted
//  - reviews they wrote stay (anonymised); reviews about a deleted farmer are deleted
const User = require('../models/User');
const Post = require('../models/Post');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');
const Report = require('../models/Report');
const FarmerProfile = require('../models/FarmerProfile');
const ConsumerProfile = require('../models/ConsumerProfile');
const CropCheck = require('../models/CropCheck');

const DELETED_NAME = 'Deleted user';

module.exports = async function deleteAccount(userId) {
    const result = { cancelledOrders: 0, deletedListings: 0 };

    // 1. cancel active orders and give reserved stock back
    const active = await Order.find({
        $or: [{ buyer: userId }, { farmer: userId }],
        status: { $in: ['placed', 'confirmed'] }
    });
    for (const order of active) {
        if (order.stockReserved) {
            const post = await Post.findById(order.post);
            if (post && post.user.toString() !== String(userId)) { // the user's own listings are deleted below
                post.quantityAvailable = (post.quantityAvailable || 0) + order.quantity;
                post.available = true;
                post.totalAmount = post.quantityAvailable * post.price;
                await post.save();
            }
            order.stockReserved = false;
        }
        order.status = 'cancelled';
        order.buyerSeen = false; // so the other person sees what happened
        order.updatedAt = Date.now();
        await order.save();
        result.cancelledOrders += 1;
    }

    // 2. remove personal details from every order the user was part of
    await Order.updateMany(
        { buyer: userId },
        { $set: { buyerName: DELETED_NAME }, $unset: { buyerMobile: '', deliveryAddress: '', note: '' } }
    );
    await Order.updateMany(
        { farmer: userId },
        { $set: { farmerName: DELETED_NAME }, $unset: { farmerMobile: '' } }
    );

    // 3. the user's listings (and what points at them)
    const myPosts = await Post.find({ user: userId }).select('_id');
    const postIds = myPosts.map(p => p._id);
    if (postIds.length) {
        await Favorite.deleteMany({ post: { $in: postIds } });
        await Report.deleteMany({ post: { $in: postIds } });
    }
    result.deletedListings = (await Post.deleteMany({ user: userId })).deletedCount;

    // 4. reviews, favourites, reports, comments and likes made by or about the user
    await Review.deleteMany({ farmer: userId });
    await Review.updateMany({ buyer: userId }, { $set: { buyerName: DELETED_NAME } });
    await Favorite.deleteMany({ user: userId });
    await Report.deleteMany({ reporter: userId });
    await CropCheck.deleteMany({ user: userId });
    await Post.updateMany({}, { $pull: { comments: { user: userId }, likes: { user: userId } } });

    // 5. profiles and the account itself
    await FarmerProfile.deleteMany({ user: userId });
    await ConsumerProfile.deleteMany({ user: userId });
    await User.deleteOne({ _id: userId });

    return result;
};
