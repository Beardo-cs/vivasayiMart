const User = require('../models/User');
const { isAdminUser } = require('../middleware/checkRole');

// Farmers whose listings this viewer may see and order from. Accounts with no role are never farmers.
const visibleFarmerIds = async viewerId => {
    const viewer = viewerId ? await User.findById(viewerId).select('email isAdmin isTest') : null;
    const filter = { userType: 'farmer' };
    if (!isAdminUser(viewer)) {
        filter['approval.status'] = { $nin: ['pending', 'declined'] };
        if (!(viewer && viewer.isTest)) filter.isTest = { $ne: true };
    }
    return (await User.find(filter).select('_id')).map(u => u._id);
};

const canSee = (visible, farmerId) => !!farmerId && visible.some(id => id.equals(farmerId));

module.exports = { visibleFarmerIds, canSee };
