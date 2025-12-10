#!/bin/bash

echo "🚀 Chat App - Railway Deployment Setup"
echo "========================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git not initialized. Initializing..."
    git init
    echo "✅ Git initialized"
fi

# Add all files
echo "📦 Adding files to git..."
git add .

# Commit
echo "💾 Committing changes..."
git commit -m "Configure for Railway deployment with auto-deploy"

# Check if remote exists
if ! git remote get-url origin &> /dev/null; then
    echo ""
    echo "⚠️  No git remote found!"
    echo "Please add your GitHub repository:"
    echo ""
    echo "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo "git branch -M main"
    echo "git push -u origin main"
    echo ""
else
    echo "🚀 Pushing to GitHub..."
    git push origin main
    echo "✅ Pushed to GitHub"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://railway.app"
echo "2. Deploy from GitHub repo"
echo "3. Add PostgreSQL database"
echo "4. Set environment variables (see DEPLOYMENT_GUIDE.md)"
echo "5. Generate domain"
echo "6. Deploy frontend to Vercel"
echo ""
echo "📖 Full guide: DEPLOYMENT_GUIDE.md"
