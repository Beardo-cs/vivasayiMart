# 🚨 Security Cleanup Guide

## ⚠️ CRITICAL: Exposed Secrets in Git History

Your Git history contains sensitive information:
- MongoDB connection string with password
- JWT secret token
- Google Gemini API key
- GitHub OAuth credentials

**These MUST be rotated immediately!**

---

## 🔒 Step-by-Step Cleanup Process

### Step 1: Clean Git History (Automated)

Run the cleanup script:

```bash
./clean-git-history.sh
```

This will:
1. Remove sensitive files from Git tracking
2. Delete all Git history
3. Create a fresh repository
4. Optionally force push to GitHub (overwrites everything)

**⚠️ WARNING:** This will permanently delete all commit history!

---

### Step 2: Rotate ALL Exposed Secrets

#### A. MongoDB Password

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Database Access → Click on user `vivasayimart`
3. Edit Password → Generate new password
4. Update connection string in `config/default.json` (local only)
5. Update Vercel environment variables

#### B. JWT Secret

Generate a new secure secret:

```bash
# Generate a new random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Update in:
- `config/default.json` (local only)
- Vercel environment variables

#### C. Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Delete the old API key
3. Create a new API key
4. Update in:
   - `config/default.json` (local only)
   - Vercel environment variables

#### D. GitHub OAuth Credentials

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Find your OAuth App
3. Regenerate Client Secret
4. Update in:
   - `config/default.json` (local only)
   - Vercel environment variables

---

### Step 3: Update Configuration Files

**Local Development:**

Copy the example file and add your NEW secrets:

```bash
cp config/default.example.json config/default.json
# Edit config/default.json with your NEW secrets
```

**NEVER commit `config/default.json` again!**

---

### Step 4: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Your Project → Settings → Environment Variables
3. **Delete all old variables**
4. Add new variables with NEW secrets:
   - `mongoURI` (new MongoDB connection string)
   - `MONGO_URI` (same as above)
   - `jwtSecret` (new JWT secret)
   - `JWT_SECRET` (same as above)
   - `geminiApiKey` (new Gemini API key)
   - `GEMINI_API_KEY` (same as above)
   - `githubClientId` (keep same or update)
   - `GITHUB_CLIENT_ID` (same as above)
   - `githubSecret` (new GitHub secret)
   - `GITHUB_SECRET` (same as above)
   - `NODE_ENV` = `production`

---

### Step 5: Verify Security

**Check what's being tracked:**

```bash
git status
```

**Verify .gitignore is working:**

```bash
# These should NOT appear in git status:
# - config/default.json
# - .env.production
# - VERCEL_ENV_VARIABLES.txt
# - add-vercel-env.sh
```

**Check what will be committed:**

```bash
git diff --cached
```

---

## ✅ Best Practices Going Forward

### 1. NEVER Commit Secrets

Files that should NEVER be committed:
- `config/default.json`
- `config/production.json`
- `.env` (any .env files)
- Any file with API keys, passwords, or tokens

### 2. Use Example Files

Always provide example files:
- `config/default.example.json` ✅
- `.env.example` ✅

### 3. Use Environment Variables

For production (Vercel):
- Always use environment variables
- Never hardcode secrets in code

### 4. Regular Security Audits

```bash
# Check for accidentally committed secrets
git log --all --full-history --source -- config/default.json
```

---

## 📋 Checklist

Before pushing code:

- [ ] `.gitignore` includes all sensitive files
- [ ] No secrets in code (use environment variables)
- [ ] `config/default.json` is NOT tracked by Git
- [ ] `.env.production` is NOT tracked by Git
- [ ] All secrets have been rotated
- [ ] Vercel environment variables updated with NEW secrets
- [ ] Tested locally with new secrets
- [ ] Tested on Vercel with new secrets

---

## 🆘 If You've Already Pushed Secrets

If you've already pushed secrets to GitHub:

1. **Run the cleanup script immediately**
2. **Rotate ALL secrets immediately**
3. **Force push the clean history**
4. **Monitor for unauthorized access**

---

## 📞 Need Help?

If you're unsure about any step, STOP and ask for help before proceeding.

Exposing secrets can lead to:
- Unauthorized database access
- API quota theft
- Security breaches
- Financial costs

**Take security seriously!**

