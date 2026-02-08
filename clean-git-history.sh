#!/bin/bash

echo "========================================="
echo "🚨 CLEANING GIT HISTORY - REMOVING SECRETS"
echo "========================================="
echo ""
echo "⚠️  WARNING: This will:"
echo "   1. Remove ALL Git history"
echo "   2. Create a fresh repository"
echo "   3. Force push to remote (overwrites everything)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Removing sensitive files from tracking..."

# Remove sensitive files from Git tracking
git rm --cached config/default.json 2>/dev/null || true
git rm --cached .env.production 2>/dev/null || true
git rm --cached VERCEL_ENV_VARIABLES.txt 2>/dev/null || true
git rm --cached add-vercel-env.sh 2>/dev/null || true

echo "Step 2: Deleting .git directory..."
rm -rf .git

echo "Step 3: Initializing fresh Git repository..."
git init

echo "Step 4: Adding all files (respecting .gitignore)..."
git add .

echo "Step 5: Creating initial commit..."
git commit -m "Initial commit - clean history without secrets"

echo ""
echo "Step 6: Setting up remote..."
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/repo.git): " repo_url

if [ -z "$repo_url" ]; then
    echo "No repository URL provided. Skipping remote setup."
    echo "You can add it later with: git remote add origin <url>"
else
    git remote add origin "$repo_url"
    
    echo ""
    echo "Step 7: Force pushing to remote (this will overwrite everything)..."
    read -p "Ready to force push? This will DELETE all history on GitHub! (yes/no): " push_confirm
    
    if [ "$push_confirm" = "yes" ]; then
        git push -f origin main
        echo ""
        echo "✅ Done! Git history has been cleaned."
    else
        echo "Skipped push. You can push later with: git push -f origin main"
    fi
fi

echo ""
echo "========================================="
echo "✅ LOCAL GIT HISTORY CLEANED!"
echo "========================================="
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo ""
echo "1. ROTATE ALL EXPOSED SECRETS:"
echo "   - Change MongoDB password in Atlas"
echo "   - Generate new JWT secret"
echo "   - Regenerate Gemini API key"
echo "   - Regenerate GitHub OAuth credentials"
echo ""
echo "2. Update config/default.json with NEW secrets (locally only)"
echo ""
echo "3. Update Vercel environment variables with NEW secrets"
echo ""
echo "4. NEVER commit config/default.json again!"
echo ""
echo "========================================="

