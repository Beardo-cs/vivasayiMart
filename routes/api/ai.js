const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { analyzeProductImage, getPriceSuggestion } = require('../../services/geminiService');

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

    if (!productName || !location) {
      return res.status(400).json({ msg: 'Product name and location are required' });
    }

    // Get price suggestion from Gemini AI
    const result = await getPriceSuggestion(productName, location);

    if (!result.success) {
      return res.status(500).json({ msg: result.error });
    }

    res.json(result.data);

  } catch (err) {
    console.error('Price Suggestion Error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

