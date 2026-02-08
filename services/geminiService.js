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

console.log('Gemini API Key loaded:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');

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

    console.log('Calling Gemini API with gemini-2.5-flash-image model...');

    // Use the new SDK format
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
 * Get price suggestion based on product and location
 * @param {string} productName - Name of the product
 * @param {string} location - Location/address
 * @returns {Object} - Price suggestion
 */
async function getPriceSuggestion(productName, location) {
  try {
    if (!ai) {
      return {
        success: false,
        error: 'Gemini AI is not configured. Please set GEMINI_API_KEY environment variable.'
      };
    }

    const prompt = `You are an agricultural market expert in India. Based on the following information, suggest a fair market price:

Product: ${productName}
Location: ${location}

Please provide price suggestion in JSON format:
{
  "suggestedPricePerKg": <number>,
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
      model: 'gemini-2.0-flash',
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
  getPriceSuggestion
};

