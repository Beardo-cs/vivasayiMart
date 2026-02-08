# 🤖 Gemini AI Integration for VivasayiMart

## Overview

This document explains how to set up and use Google's Gemini AI for automatic agricultural product detection and price suggestion in VivasayiMart.

## Features

✅ **AI-Powered Product Detection** - Upload a product image and AI automatically identifies it
✅ **Smart Price Suggestion** - Get market price recommendations based on product and location
✅ **Auto-fill Forms** - Product name and price are automatically filled after image analysis
✅ **Quality Assessment** - AI evaluates product quality (Premium, Good, Average)
✅ **Confidence Score** - Shows how confident the AI is about its detection

## Setup Instructions

### Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### Step 2: Add API Key to Configuration

Open `config/default.json` and replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key:

```json
{
    "mongoURI": "mongodb+srv://...",
    "jwtSecret": "mysecrettoken",
    "githubClientId": "...",
    "githubSecret": "...",
    "geminiApiKey": "AIzaSy..."  ← Paste your API key here
}
```

### Step 3: Restart Your Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run server
# OR
npm run dev
```

## How It Works

### Backend Architecture

1. **Gemini Service** (`services/geminiService.js`)
   - `analyzeProductImage()` - Analyzes uploaded image to detect product
   - `getPriceSuggestion()` - Suggests price based on product and location

2. **AI API Routes** (`routes/api/ai.js`)
   - `POST /api/ai/analyze-product` - Endpoint for image analysis
   - `POST /api/ai/suggest-price` - Endpoint for price suggestion

### Frontend Flow

1. Farmer uploads product image
2. Image is converted to base64
3. Sent to backend `/api/ai/analyze-product`
4. Gemini AI analyzes the image
5. Returns: product name, category, quality, confidence
6. If address is provided, automatically gets price suggestion
7. Form fields are auto-filled with AI results

## Usage

### For Farmers:

1. Navigate to Dashboard or Posts page
2. Click "📸 Upload Product Image (AI Detection)" button
3. Select a photo of your agricultural product
4. Wait for AI analysis (2-5 seconds)
5. Review AI detection results:
   - Product name
   - Category
   - Quality assessment
   - Suggested price
6. Verify/edit the auto-filled information
7. Complete remaining fields
8. Submit the form

### Example AI Response:

```json
{
  "productName": "Tomato",
  "category": "Vegetable",
  "quality": "Premium",
  "confidence": 95,
  "priceInfo": {
    "suggestedPricePerKg": 30,
    "priceRange": {
      "min": 25,
      "max": 35
    },
    "currency": "INR",
    "reasoning": "Based on current market trends in Bangalore..."
  }
}
```

## API Endpoints

### 1. Analyze Product Image

**Endpoint:** `POST /api/ai/analyze-product`

**Headers:**
```
x-auth-token: <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "imageBase64": "base64_encoded_image_data",
  "mimeType": "image/jpeg"
}
```

**Response:**
```json
{
  "productName": "Rice",
  "category": "Grain",
  "quality": "Good",
  "confidence": 90
}
```

### 2. Get Price Suggestion

**Endpoint:** `POST /api/ai/suggest-price`

**Headers:**
```
x-auth-token: <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productName": "Tomato",
  "location": "Bangalore, Karnataka"
}
```

**Response:**
```json
{
  "suggestedPricePerKg": 30,
  "priceRange": {
    "min": 25,
    "max": 35
  },
  "currency": "INR",
  "reasoning": "Based on current market trends..."
}
```

## Files Modified/Created

### New Files:
- ✅ `services/geminiService.js` - Gemini AI integration service
- ✅ `routes/api/ai.js` - AI API endpoints
- ✅ `GEMINI_AI_SETUP.md` - This documentation

### Modified Files:
- ✅ `server.js` - Added AI route
- ✅ `config/default.json` - Added Gemini API key
- ✅ `client/src/components/posts/PostForm.js` - Added image upload and AI integration
- ✅ `package.json` - Added @google/genai (latest SDK) and multer dependencies

## Troubleshooting

### Issue: "API key not valid"
**Solution:** Make sure you've added the correct Gemini API key in `config/default.json`

### Issue: "Could not analyze image"
**Solution:** 
- Check if the image file is valid (JPEG, PNG)
- Ensure the image is not too large (< 5MB recommended)
- Verify your internet connection

### Issue: "Server Error"
**Solution:**
- Restart the Node.js server
- Check server logs for detailed error messages
- Verify Gemini API key is active

## Best Practices

1. **Image Quality** - Use clear, well-lit photos for better AI detection
2. **Single Product** - Focus on one product per image for accurate detection
3. **Verify AI Results** - Always review and verify AI suggestions before submitting
4. **Manual Override** - You can always manually edit the auto-filled fields

## Future Enhancements

- 🔄 Multi-language support for product names
- 📊 Historical price trends
- 🌾 Crop disease detection
- 📍 GPS-based location for more accurate pricing
- 🎯 Variety-specific detection (e.g., Basmati Rice vs Regular Rice)

## Support

For issues or questions, please contact the development team or create an issue in the repository.

---

**Happy Farming! 🌾**

