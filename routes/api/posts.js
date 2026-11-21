const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const { checkFarmer, isAdminUser } = require('../../middleware/checkRole');

const Post = require('../../models/Post');
const User = require('../../models/User');
const Review = require('../../models/Review');
const { normalizeTiers } = require('../../utils/pricing');
const Favorite = require('../../models/Favorite');
const { visibleFarmerIds, canSee } = require('../../services/visibility');

// Phone numbers are shared only after an order is confirmed (see routes/api/orders.js),
// so listings never expose them to anyone except the farmer who owns the listing.
const hideContact = (post, viewerId) => {
    const obj = typeof post.toObject === 'function' ? post.toObject() : { ...post };
    if (!obj.user || obj.user.toString() !== viewerId) delete obj.mobileNumber;
    return obj;
};

// Photos saved before client-side resizing can be several MB; a page of them would exceed
// Vercel's ~4.5MB response limit. Leave oversized ones out of list responses (the card still works).
const MAX_LIST_IMAGE_CHARS = 400000;
const lightenImage = obj => {
    if (obj.productImage && obj.productImage.length > MAX_LIST_IMAGE_CHARS) {
        obj.productImage = '';
        obj.imageOmitted = true;
    }
    return obj;
};

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Poultry', 'Other'];
const UNITS = ['kg', 'litre', 'dozen', 'piece'];
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @route     POST api/posts
// @desc      Create a post (Agricultural Product)
// @access    Private (Farmer only)
router.post('/',
[ auth,
  checkFarmer,
    [
        check('text','Description is required')
        .not()
        .isEmpty(),
        check('farmerName','Farmer name is required')
        .not()
        .isEmpty(),
        check('productName','Product name is required')
        .not()
        .isEmpty(),
        check('mobileNumber','Mobile number is required')
        .not()
        .isEmpty(),
        check('weight','Quantity must be a number greater than 0')
        .isFloat({ gt: 0 }),
        check('price','Price must be a number greater than 0')
        .isFloat({ gt: 0 }),
        check('address','Address is required')
        .not()
        .isEmpty(),
        check('category','Invalid category')
        .optional()
        .isIn(CATEGORIES),
        check('unit','Invalid unit')
        .optional()
        .isIn(UNITS)
    ]
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const { text, farmerName, productName, mobileNumber, productImage, address } = req.body;
        const weight = Number(req.body.weight);
        const price = Number(req.body.price);
        const category = req.body.category || 'Other';
        const unit = req.body.unit || 'kg';

        const tierResult = normalizeTiers(req.body.bulkPricing, price);
        if (tierResult.error) return res.status(400).json({ errors: [{ msg: tierResult.error }] });

        // Calculate total amount
        const totalAmount = weight * price;

        const newPost = new Post({
            text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id,
            farmerName,
            productName,
            mobileNumber,
            productImage: productImage || '',
            weight,
            price,
            totalAmount,
            address,
            category,
            unit,
            bulkPricing: tierResult.tiers,
            quantityAvailable: weight
        });

        const post = await newPost.save();

        res.json(post);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}
);

// @route     GET api/posts
// @desc      Search/filter posts with pagination
//            Query: q, category, location, minPrice, maxPrice, inStock=true,
//                   farmer=<userId>, sort=newest|price_asc|price_desc, page, limit
// @access    Private
router.get('/', auth, async(req, res) => {
    try {
        const { q, category, location, minPrice, maxPrice, inStock, farmer, sort } = req.query;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

        const filter = {};
        if (farmer && farmer === req.user.id) {
            filter.user = farmer;                    // own view: hidden listings too, even while waiting for approval
        } else {
            filter.hidden = { $ne: true };
            const visible = await visibleFarmerIds(req.user.id);
            filter.user = { $in: farmer ? visible.filter(id => id.toString() === farmer) : visible };
        }

        if (category && CATEGORIES.includes(category)) {
            filter.category = category;
        }
        if (q) {
            filter.productName = new RegExp(escapeRegex(String(q).trim()), 'i');
        }
        if (location) {
            filter.address = new RegExp(escapeRegex(String(location).trim()), 'i');
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined && !isNaN(minPrice)) filter.price.$gte = Number(minPrice);
            if (maxPrice !== undefined && !isNaN(maxPrice)) filter.price.$lte = Number(maxPrice);
            if (Object.keys(filter.price).length === 0) delete filter.price;
        }
        const myFavorites = await Favorite.find({ user: req.user.id }).select('post');
        const favoriteIds = new Set(myFavorites.map(f => f.post.toString()));
        if (req.query.saved === 'true') {
            filter._id = { $in: myFavorites.map(f => f.post) };
        }
        if (inStock === 'true') {
            filter.available = true;
            filter.quantityAvailable = { $gt: 0 };
        }

        const sortMap = {
            newest: { date: -1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 }
        };

        const [posts, total] = await Promise.all([
            Post.find(filter)
                .sort(sortMap[sort] || sortMap.newest)
                .skip((page - 1) * limit)
                .limit(limit),
            Post.countDocuments(filter)
        ]);

        // Attach each farmer's average rating and whether I saved the listing
        const farmerIds = [...new Set(posts.map(p => p.user && p.user.toString()).filter(Boolean))];
        const ratings = farmerIds.length ? await Review.aggregate([
            { $match: { farmer: { $in: farmerIds.map(id => new mongoose.Types.ObjectId(id)) } } },
            { $group: { _id: '$farmer', average: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]) : [];
        const ratingByFarmer = {};
        ratings.forEach(r => { ratingByFarmer[r._id.toString()] = { average: Math.round(r.average * 10) / 10, count: r.count }; });

        const verifiedFarmers = farmerIds.length
            ? await User.find({ _id: { $in: farmerIds }, farmerVerified: true }).select('_id')
            : [];
        const verifiedSet = new Set(verifiedFarmers.map(u => u.id));

        const result = posts.map(p => ({
            ...lightenImage(hideContact(p, req.user.id)),
            farmerVerified: !!(p.user && verifiedSet.has(p.user.toString())),
            isFavorite: favoriteIds.has(p.id),
            farmerRating: (p.user && ratingByFarmer[p.user.toString()]) || { average: 0, count: 0 }
        }));

        res.json({ posts: result, page, limit, total, pages: Math.ceil(total / limit) });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/posts/featured
// @desc      A few recent in-stock listings for the public landing page (no images, no phone numbers)
// @access    Public
router.get('/featured', async (req, res) => {
    try {
        const posts = await Post.find({
            user: { $in: await visibleFarmerIds(null) }, hidden: { $ne: true }, available: true, quantityAvailable: { $gt: 0 }
        })
            .select('productName category price unit quantityAvailable address farmerName bulkPricing date')
            .sort({ date: -1 })
            .limit(6);
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     GET api/posts/:id
// @desc      Get post by ID
// @access    Private
router.get('/:id', auth, async(req, res) => {
    try {
        const post =  await Post.findById(req.params.id);

        if(!post) {
            return res.status(404).json({ msg: 'Post not found'});
        }

        if (post.hidden && post.user.toString() !== req.user.id) {
            const me = await User.findById(req.user.id);
            if (!isAdminUser(me)) return res.status(404).json({ msg: 'Post not found'});
        }
        if (post.user.toString() !== req.user.id && !canSee(await visibleFarmerIds(req.user.id), post.user)) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.json(hideContact(post, req.user.id));

    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found'});
        }

        res.status(500).send('Server Error');
}
});

// @route     PUT api/posts/:id
// @desc      Edit own product listing (price, stock, unit, category, availability, ...)
// @access    Private (Farmer, owner only)
router.put('/:id',
[ auth,
  checkFarmer,
    [
        check('price','Price must be a number greater than 0').optional().isFloat({ gt: 0 }),
        check('quantityAvailable','Stock must be a number 0 or more').optional().isFloat({ min: 0 }),
        check('category','Invalid category').optional().isIn(CATEGORIES),
        check('unit','Invalid unit').optional().isIn(UNITS),
        check('available','Available must be true or false').optional().isBoolean(),
        check('productName','Product name cannot be empty').optional().not().isEmpty(),
        check('text','Description cannot be empty').optional().not().isEmpty(),
        check('address','Address cannot be empty').optional().not().isEmpty(),
        check('mobileNumber','Mobile number cannot be empty').optional().not().isEmpty()
    ]
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const post = await Post.findById(req.params.id);

        if(!post) {
            return res.status(404).json({ msg: 'Post not found'});
        }

        if(post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorised'});
        }

        // Legacy listings created before stock tracking
        if (post.quantityAvailable === undefined || post.quantityAvailable === null) {
            post.quantityAvailable = post.weight;
        }

        const editable = ['text', 'farmerName', 'productName', 'mobileNumber', 'productImage', 'address', 'category', 'unit'];
        editable.forEach(field => {
            if (req.body[field] !== undefined) post[field] = req.body[field];
        });

        if (req.body.price !== undefined) post.price = Number(req.body.price);

        // Re-validate tiers against the (possibly new) price, even if tiers weren't sent
        const tierResult = normalizeTiers(
            req.body.bulkPricing !== undefined ? req.body.bulkPricing : post.bulkPricing.map(t => ({ minQuantity: t.minQuantity, price: t.price })),
            post.price
        );
        if (tierResult.error) return res.status(400).json({ errors: [{ msg: tierResult.error }] });
        post.bulkPricing = tierResult.tiers;

        const stockChanged = req.body.quantityAvailable !== undefined;
        if (stockChanged) {
            post.quantityAvailable = Number(req.body.quantityAvailable);
            if (post.quantityAvailable > post.weight) post.weight = post.quantityAvailable;
        }

        if (req.body.available !== undefined) {
            post.available = req.body.available === true || req.body.available === 'true';
        } else if (stockChanged) {
            // restocking re-opens a sold-out listing; zero stock closes it
            post.available = post.quantityAvailable > 0;
        }

        // Cannot mark an empty listing as available
        if (post.quantityAvailable <= 0) post.available = false;

        post.totalAmount = post.quantityAvailable * post.price;

        await post.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found'});
        }
        res.status(500).send('Server Error');
    }
});

// @route     DELETE api/posts/:id
// @desc      DELETE  a post
// @access    Private
router.delete('/:id', auth, async(req, res) => {
    try {
        const post =  await Post.findById(req.params.id);

        if(!post) {
            return res.status(404).json ({ msg: 'Post not found'});
        }

        // Check user
        if(post.user.toString() !== req.user.id) {
            return res.status(401).json({'msg' : 'User not authorised'});
        }

        // Use deleteOne() instead of deprecated remove()
        await Post.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Post removed'});
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found'});
        }

        res.status(500).send('Server Error');
    }
});

// @route     PUT api/postslike/:id
// @desc      Like  a post
// @access    Private
router.put('/like/:id',auth, async (req, res)=> {
    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has al ready been liked
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Post already liked'});
        }
        post.likes.unshift({ user: req.user.id});

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route     PUT api/posts/unlike/:id
// @desc      Unlike  a post
// @access    Private
router.put('/unlike/:id',auth, async (req, res)=> {
    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has already been liked
        if(
            !post.likes.filter(like => like.user.toString() === req.user.id)
            )  {
            return res.status(400).json({ msg: 'Post has not yet been liked'});
        }
        // Get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route     POST api/posts/comment/:id
// @desc      Comment a post
// @access    Private
router.post('/comment/:id',
[ auth,
    [
        check('text','Text is required') 
        .not()
        .isEmpty()
    ]
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = ({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        } );

        post.comments.unshift(newComment);
        
        await post.save();

        res.json(post.comments);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}
);

// @route     DELETE api/posts/comment/:id/;comment_id
// @desc      Delete comment
// @access    Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        //Pull out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // Make sure comment exists
        if(!comment) {
            return res.status(400).json({ msg: 'Comment does not exists'});
        }

        //Check user
        if(comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorised'});
        }

        // Get remove index
          const removeIndex = post.comments
          .map(like => like.user.toString())
          .indexOf(req.user.id);
          
          post.comments.splice(removeIndex, 1);
  
          await post.save();
  
          res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;