# 🚀 Vercel Deployment Guide - VivasayiMart

This guide will help you deploy both the **backend API** and **frontend React app** to Vercel.

## 📋 Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional) - Install with `npm install -g vercel`
3. **MongoDB Atlas** - Your database should be accessible from anywhere (whitelist `0.0.0.0/0`)
4. **Gemini API Key** - From [Google AI Studio](https://aistudio.google.com/)

## 🔧 Configuration Files

The following files have been configured for Vercel deployment:

- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `server.js` - Updated to work with serverless functions
- ✅ `client/src/utils/api.js` - Updated to use relative URLs in production
- ✅ `.vercelignore` - Files to exclude from deployment
- ✅ `.env.example` - Environment variables template

## 📦 Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Push to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

#### Step 2: Import Project to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect the configuration

#### Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

**Required Variables:**
- `mongoURI` = Your MongoDB Atlas connection string
- `jwtSecret` = Your JWT secret token
- `geminiApiKey` = Your Gemini API key
- `NODE_ENV` = `production`

**Optional Variables:**
- `githubClientId` = Your GitHub OAuth client ID
- `githubSecret` = Your GitHub OAuth secret

**How to add:**
1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable with its value
4. Click **Save**

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (3-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

During deployment, you'll be prompted to:
- Link to existing project or create new one
- Set environment variables (if not already set)

## 🔐 Environment Variables Setup

### Option A: Via Vercel Dashboard

1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable:
   - Name: `mongoURI`
   - Value: `mongodb+srv://username:password@cluster.mongodb.net/database`
   - Environment: Production, Preview, Development
3. Repeat for all variables

### Option B: Via Vercel CLI

```bash
# Set environment variables
vercel env add mongoURI
vercel env add jwtSecret
vercel env add geminiApiKey
vercel env add NODE_ENV
```

## 📝 Important Notes

### MongoDB Atlas Configuration

Make sure your MongoDB Atlas is configured to accept connections from Vercel:

1. Go to MongoDB Atlas → **Network Access**
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (`0.0.0.0/0`)
4. Click **"Confirm"**

### CORS Configuration

The server is already configured to allow requests from:
- `http://localhost:3000` (development)
- `http://192.168.0.103:3000` (local network)
- `https://vivasayimart.vercel.app` (production)

If your Vercel URL is different, update `server.js`:

```javascript
const allowedOrigins = [
    "http://localhost:3000",
    "http://192.168.0.103:3000",
    "https://your-actual-vercel-url.vercel.app"  // Update this
];
```

## 🧪 Testing the Deployment

After deployment:

1. **Test Frontend**: Visit `https://your-project.vercel.app`
2. **Test API**: Visit `https://your-project.vercel.app/api/users` (should return 401 or similar)
3. **Test Full Flow**:
   - Register a new user
   - Login
   - Create a profile
   - Upload a product with AI detection

## 🐛 Troubleshooting

### Build Fails

**Error**: `Module not found`
- **Solution**: Make sure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error**: `Build exceeded maximum duration`
- **Solution**: The free tier has a 45-second build limit
- Optimize your build or upgrade to Pro plan

### API Not Working

**Error**: `500 Internal Server Error`
- **Solution**: Check Vercel logs for detailed error
- Verify environment variables are set correctly

**Error**: `MongoDB connection failed`
- **Solution**: Check MongoDB Atlas IP whitelist
- Verify connection string is correct

### AI Features Not Working

**Error**: `Gemini API quota exceeded`
- **Solution**: Check your API usage at https://ai.dev/rate-limit
- Upgrade to paid plan if needed

**Error**: `Invalid API key`
- **Solution**: Verify `geminiApiKey` environment variable is set correctly

## 📊 Monitoring

### View Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"**
3. Click on a deployment → **"View Function Logs"**

### Check Performance

1. Go to Vercel Dashboard → Your Project
2. Click **"Analytics"** to see:
   - Page views
   - Response times
   - Error rates

## 🔄 Redeployment

### Automatic Redeployment

Every time you push to your GitHub repository, Vercel will automatically:
1. Build your project
2. Run tests (if configured)
3. Deploy to production

### Manual Redeployment

1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"**
3. Find the deployment you want to redeploy
4. Click **"..."** → **"Redeploy"**

## 🎉 Success!

Your VivasayiMart application is now live on Vercel with:
- ✅ Backend API running as serverless functions
- ✅ Frontend React app served statically
- ✅ MongoDB Atlas database
- ✅ Gemini AI integration
- ✅ Automatic deployments on git push

**Your app URL**: `https://your-project.vercel.app`

---

## 📞 Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Check deployment logs in Vercel Dashboard
- Review this guide for common issues

**Happy Farming! 🌾**

