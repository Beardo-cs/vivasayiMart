const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const CropCheck = require('../../models/CropCheck');
const { isAdminUser } = require('../../middleware/checkRole');
const { analyzeProductImage, getPriceSuggestion } = require('../../services/geminiService');
const cropCheckAi = require('../../services/cropCheckAi');
const { GUIDANCE_VERSION } = require('../../services/cropGuidance');

// @route     POST api/ai/analyze-product
// @desc      Analyze product image using Gemini AI
// @access    Private
router.post('/analyze-product', auth, async (req, res) => {
  try {
    console.log('Received AI analysis request');
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      console.error('No image data provided');
      return res.status(400).json({ msg: 'Image data is required' });
    }

    console.log('Image data received, size:', imageBase64.length);
    console.log('MIME type:', mimeType);

    // Analyze image with Gemini AI
    const result = await analyzeProductImage(imageBase64, mimeType);

    console.log('Analysis result:', result);

    if (!result.success) {
      console.error('Analysis failed:', result.error);
      return res.status(500).json({ msg: result.error });
    }

    res.json(result.data);

  } catch (err) {
    console.error('AI Analysis Error:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ msg: err.message || 'Server Error' });
  }
});

// @route     POST api/ai/suggest-price
// @desc      Get price suggestion based on product and location
// @access    Private
router.post('/suggest-price', auth, async (req, res) => {
  try {
    const { productName, location } = req.body;
    const unit = ['kg', 'litre', 'dozen', 'piece'].includes(req.body.unit) ? req.body.unit : 'kg';

    if (!productName || !location) {
      return res.status(400).json({ msg: 'Product name and location are required' });
    }

    // Get price suggestion from Gemini AI (cached)
    const result = await getPriceSuggestion(productName, location, unit);

    if (!result.success) {
      return res.status(500).json({ msg: result.error });
    }

    res.json(result.data);

  } catch (err) {
    console.error('Price Suggestion Error:', err.message);
    res.status(500).send('Server Error');
  }
});

const DAILY_CROP_CHECKS = 20;
const KEEP_ANSWER_MS = 10 * 60 * 1000;
// Per server instance: the same check sent again (a retry, a double tap) reuses the answer.
const cropJobs = new Map();

const remember = (key, job) => {
  cropJobs.set(key, job);
  job.then(
    () => setTimeout(() => cropJobs.delete(key), KEEP_ANSWER_MS).unref(),
    () => cropJobs.delete(key)
  );
};

// busy: Gemini refused for quota, which on a daily quota can last hours
const FAILURE_STATUS = { timeout: 504, busy: 503, unavailable: 503 };

const cropFailure = (res, err) => {
  const code = FAILURE_STATUS[err.code] ? err.code : 'unavailable';
  res.status(FAILURE_STATUS[err.code] || 502).json({ msg: 'Could not check the photos', code });
};

// @route     POST api/ai/crop-check
// @desc      Vivasayi AI: possible problems in crop photos, with advice from the reviewed list.
//            Photos go to Gemini and are not stored; only a short CropCheck line is kept.
// @access    Private: farmers testing Vivasayi AI, admins, and admins acting for a farmer
router.post('/crop-check', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('userType isTest isAdmin email');
    if (!user || user.userType !== 'farmer' || !(user.isTest || isAdminUser(user) || req.actor)) {
      return res.status(403).json({ msg: 'Vivasayi AI is not available for this account yet', code: 'notAllowed' });
    }
    const { input, error } = cropCheckAi.readInput(req.body);
    if (error) {
      return res.status(400).json({ msg: error === 'crop' ? 'Choose tomato or paddy' : 'Send 1 to 6 photos (JPEG, PNG or WebP)', code: error });
    }

    const key = input.checkId && `${user.id}:${input.checkId}`;
    const sameCheck = async () => {
      try {
        res.json(await cropJobs.get(key));
      } catch (err) {
        cropFailure(res, err);
      }
    };
    if (key && cropJobs.has(key)) return sameCheck();

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (await CropCheck.countDocuments({ user: user._id, at: { $gte: since } }) >= DAILY_CROP_CHECKS) {
      return res.status(429).json({ msg: 'Daily limit reached', code: 'limit' });
    }
    // checked again: a copy of this check may have started while we counted
    if (key && cropJobs.has(key)) return sameCheck();

    const started = Date.now();
    const job = cropCheckAi.assess(input);
    if (key) remember(key, job);
    let result = null;
    let failed = null;
    try {
      result = await job;
    } catch (err) {
      failed = err;
    }
    const line = {
      crop: input.crop,
      photos: input.photos.length,
      outcome: result ? result.outcome : undefined,
      causes: result ? result.causes.map(c => c.id) : [],
      failed: !!failed,
      ms: Date.now() - started
    };
    await CropCheck.create({
      ...line,
      user: user._id,
      actor: req.actor ? req.actor.id : undefined,
      model: result ? result.model : undefined,
      promptVersion: cropCheckAi.PROMPT_VERSION,
      guidanceVersion: GUIDANCE_VERSION
    });
    console.log('[crop-check]', JSON.stringify({ ...line, error: failed ? failed.code : undefined }));
    if (failed) return cropFailure(res, failed);
    res.json(result);
  } catch (err) {
    console.error('[crop-check]', err.message);
    res.status(500).json({ msg: 'Server error', code: 'unavailable' });
  }
});

module.exports = router;

