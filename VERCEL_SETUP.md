# Vercel Deployment Setup

## ✅ Fixed Issues

1. **Express 5 Wildcard Route Error** - Changed from `app.get('*')` to `app.use()` middleware
2. **Environment Variables** - All files updated to use environment variables instead of config package

## 🔐 Add Environment Variables to Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Click on your **vivasayimart** project
3. Click **Settings** → **Environment Variables**
4. Add these variables (copy from `.env.production` file):

```
mongoURI = mongodb+srv://<user>:<password>@<cluster>.mongodb.net/vivasayimart?retryWrites=true&w=majority
MONGO_URI = <same value as mongoURI>
jwtSecret = <long random string, e.g. the output of: openssl rand -hex 32>
JWT_SECRET = <same value as jwtSecret>
geminiApiKey = <your Gemini API key>
GEMINI_API_KEY = <same value as geminiApiKey>
NODE_ENV = production
githubClientId = <your GitHub OAuth client ID>
GITHUB_CLIENT_ID = <same value as githubClientId>
githubSecret = <your GitHub OAuth client secret>
GITHUB_SECRET = <same value as githubSecret>
```

Never write the real values in this file: the repository is public.

5. For each variable, select **all environments**: Production, Preview, Development
6. Click **Save** for each

### Option 2: Via Vercel CLI

```bash
# Login to Vercel
vercel login

# Link to your project
vercel link

# Add environment variables
vercel env add mongoURI production
vercel env add MONGO_URI production
vercel env add jwtSecret production
vercel env add JWT_SECRET production
vercel env add geminiApiKey production
vercel env add GEMINI_API_KEY production
vercel env add NODE_ENV production
vercel env add githubClientId production
vercel env add GITHUB_CLIENT_ID production
vercel env add githubSecret production
vercel env add GITHUB_SECRET production
```

## 🚀 Deploy

After adding environment variables:

```bash
# Deploy to production
vercel --prod
```

Or if connected to GitHub, Vercel will auto-deploy when you push.

## 🧪 Test Deployment

```bash
# Test login endpoint
curl 'https://vivasayimart.vercel.app/api/auth' \
  -H 'content-type: application/json' \
  --data-raw '{"email":"<your email>","password":"<your password>"}'
```

Expected: Should return a JWT token (not 500 error)

## 📊 View Logs

```bash
# Via CLI
vercel logs

# Or in dashboard:
# Deployments → Click deployment → View Function Logs
```

## ⚠️ Important Notes

1. **MongoDB Atlas**: Make sure Network Access allows `0.0.0.0/0` (all IPs)
2. **Both Variants**: We add both `mongoURI` and `MONGO_URI` for compatibility
3. **Case Sensitive**: Environment variable names are case-sensitive
4. **Redeploy Required**: After adding env vars, you must redeploy

## 🔧 Troubleshooting

If you still get errors:

1. Check deployment logs in Vercel dashboard
2. Verify all environment variables are set
3. Make sure MongoDB Atlas allows Vercel IPs
4. Check for typos in variable names

