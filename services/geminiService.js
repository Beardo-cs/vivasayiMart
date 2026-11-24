const { GoogleGenAI } = require('@google/genai');

// Get API key from environment variable first, then fall back to config
let apiKey;

if (process.env.geminiApiKey) {
  apiKey = process.env.geminiApiKey;
} else if (process.env.GEMINI_API_KEY) {
  apiKey = process.env.GEMINI_API_KEY;
} else {
  // Fall back to config only in development
  try {
    const config = require('config');
    apiKey = config.get('geminiApiKey');
  } catch (err) {
    console.error('Gemini API Key not found in environment variables or config');
  }
}

console.log('Gemini API Key:', apiKey ? 'loaded' : 'NOT FOUND');

// Small in-memory cache (per server instance) so repeated lookups don't spend Gemini quota
const crypto = require('crypto');
const cache = new Map();
const MAX_ENTRIES = 500;
const cacheGet = key => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) { cache.delete(key); return null; }
  return hit.value;
};
const cacheSet = (key, value, ttlMs) => {
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value); // drop oldest
  cache.set(key, { value, expires: Date.now() + ttlMs });
};
const HOUR = 60 * 60 * 1000;

// Model names can be overridden without a code change when Google retires one
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash';
const VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-3-flash-preview';

// Initialize Gemini AI with API key
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Analyze agricultural product image using Gemini AI
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
 * @returns {Object} - Detected product information
 */
async function analyzeProductImage(imageBase64, mimeType = 'image/jpeg') {
  try {
    if (!ai) {
      return {
        success: false,
        error: 'Gemini AI is not configured. Please set GEMINI_API_KEY environment variable.'
      };
    }

    const imageKey = 'img:' + crypto.createHash('sha256').update(imageBase64).digest('hex');
    const cachedImage = cacheGet(imageKey);
    if (cachedImage) return { success: true, data: cachedImage, cached: true };

    console.log('Starting Gemini AI analysis...');
    console.log('Image size:', imageBase64.length, 'bytes');
    console.log('MIME type:', mimeType);

    const prompt = `You are an agricultural product expert. Analyze this image and identify the agricultural product.

Please provide the following information in JSON format:
{
  "productName": "Name of the agricultural product (e.g., Tomato, Rice, Wheat)",
  "category": "Category (e.g., Vegetable, Grain, Fruit)",
  "quality": "Estimated quality (e.g., Premium, Good, Average)",
  "confidence": "Your confidence level in percentage (0-100)"
}

Only respond with valid JSON. If you cannot identify the product, set productName to "Unknown".`;

    console.log('Calling Gemini API with', VISION_MODEL);

    // Use the new SDK format
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ]
    });

    const text = response.text;
    console.log('Gemini AI Response:', text);

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const productInfo = JSON.parse(jsonMatch[0]);
      console.log('Parsed product info:', productInfo);
      if (productInfo.productName && productInfo.productName !== 'Unknown') {
        cacheSet(imageKey, productInfo, 24 * HOUR);
      }
      return {
        success: true,
        data: productInfo
      };
    }

    console.error('Could not parse AI response:', text);
    return {
      success: false,
      error: 'Could not parse AI response'
    };

  } catch (error) {
    console.error('Gemini AI Error Details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Get price suggestion based on product, location and unit of sale
 * @param {string} productName - Name of the product
 * @param {string} location - Location/address
 * @param {string} unit - kg | litre | dozen | piece
 * @returns {Object} - { suggestedPrice, unit, priceRange, reasoning, ... } (price is per ONE unit)
 */
async function getPriceSuggestion(productName, location, unit = 'kg') {
  try {
    if (!ai) {
      return {
        success: false,
        error: 'Gemini AI is not configured. Please set GEMINI_API_KEY environment variable.'
      };
    }

    const product = String(productName).slice(0, 80);
    const place = String(location).slice(0, 120);
    const priceKey = `price:${product.toLowerCase()}|${place.toLowerCase().trim()}|${unit}`;
    const cachedPrice = cacheGet(priceKey);
    if (cachedPrice) return { success: true, data: cachedPrice, cached: true };

    const prompt = `You are an agricultural market expert in India. Based on the following information, suggest a fair market price for ONE ${unit}:

Product: ${product}
Location: ${place}
Unit of sale: ${unit}

Please provide price suggestion in JSON format:
{
  "suggestedPrice": <number, price in INR per one ${unit}>,
  "priceRange": {
    "min": <number>,
    "max": <number>
  },
  "currency": "INR",
  "reasoning": "Brief explanation of the price"
}

Consider current market trends, location, and seasonal factors. Only respond with valid JSON.`;

    console.log('Getting price suggestion from Gemini AI...');

    // Use the new SDK format with gemini-2.0-flash for text generation
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    const text = response.text;
    console.log('Price suggestion response:', text);

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const priceInfo = JSON.parse(jsonMatch[0]);
      // tolerate the older field name; always return suggestedPrice (+ suggestedPricePerKg for kg)
      const price = Number(priceInfo.suggestedPrice ?? priceInfo.suggestedPricePerKg);
      if (!(price > 0)) {
        return { success: false, error: 'AI did not return a usable price' };
      }
      priceInfo.suggestedPrice = price;
      priceInfo.unit = unit;
      if (unit === 'kg') priceInfo.suggestedPricePerKg = price;
      cacheSet(priceKey, priceInfo, 6 * HOUR);
      return {
        success: true,
        data: priceInfo
      };
    }

    return {
      success: false,
      error: 'Could not parse AI response'
    };

  } catch (error) {
    console.error('Gemini AI Price Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  analyzeProductImage,
  getPriceSuggestion,
  client: () => ai,
  VISION_MODEL
};

