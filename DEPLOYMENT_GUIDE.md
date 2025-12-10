# Complete Deployment Guide - Railway + Vercel

## 🚀 Quick Deployment Steps

### Step 1: Deploy Backend to Railway

1. **Push to GitHub**
   ```bash
   cd /media/morsalin/NewVolume/project/chat-app-main
   git add .
   git commit -m "Configure for Railway deployment"
   git push origin main
   ```

2. **Create Railway Project**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect the Dockerfile

3. **Add PostgreSQL Database**
   - In your project, click "+ New"
   - Select "Database" → "Add PostgreSQL"
   - Railway automatically creates `DATABASE_URL` environment variable

4. **Configure Environment Variables**
   
   Click on backend service → "Variables":
   ```
   JWT_SECRET=my-super-secret-jwt-key-please-change-this-to-something-random-and-secure
   CORS_ORIGINS=http://localhost:5173
   PORT=8080
   ```

5. **Generate Public URL**
   - Settings → "Generate Domain"
   - Copy URL (e.g., `chatapp-backend-production.up.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Update Frontend Environment**
   
   Edit `frontendv2/.env.production`:
   ```
   VITE_API_URL=https://chatapp-backend-production.up.railway.app
   VITE_WS_URL=https://chatapp-backend-production.up.railway.app
   ```

2. **Push Changes**
   ```bash
   git add .
   git commit -m "Update production URLs"
   git push origin main
   ```

3. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Configure:
     - **Framework**: Vite
     - **Root Directory**: `frontendv2`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

4. **Add Environment Variables in Vercel**
   
   Settings → Environment Variables:
   ```
   VITE_API_URL = https://chatapp-backend-production.up.railway.app
   VITE_WS_URL = https://chatapp-backend-production.up.railway.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Copy your Vercel URL (e.g., `your-app.vercel.app`)

### Step 3: Update CORS

1. **Update Railway Environment Variable**
   
   Railway → Backend Service → Variables:
   ```
   CORS_ORIGINS=https://your-app.vercel.app
   ```

2. **Redeploy**
   - Railway will auto-redeploy with new CORS settings

---

## 🔄 Auto-Deploy Setup

### Railway (Backend)
Automatically deploys on every push to `main` branch.

### Vercel (Frontend)
Automatically deploys on every push to `main` branch.

### Trigger Deployment
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Both services will deploy automatically!

---

## 📋 Environment Variables Checklist

### Railway (Backend)
- [x] `DATABASE_URL` - Auto-created by PostgreSQL add-on
- [ ] `JWT_SECRET` - Your secret key (min 32 chars)
- [ ] `CORS_ORIGINS` - Your Vercel URL
- [ ] `PORT` - 8080

### Vercel (Frontend)
- [ ] `VITE_API_URL` - Your Railway backend URL
- [ ] `VITE_WS_URL` - Your Railway backend URL

---

## 🧪 Test Your Deployment

1. **Backend Health Check**
   ```
   https://your-railway-app.up.railway.app/actuator/health
   ```

2. **Frontend**
   ```
   https://your-app.vercel.app
   ```

3. **Test Features**
   - [ ] User registration
   - [ ] User login
   - [ ] Send message
   - [ ] Voice call
   - [ ] Video call
   - [ ] File upload
   - [ ] Create new chat

---

## 🐛 Troubleshooting

### Backend won't start
- Check Railway logs: Dashboard → Service → Logs
- Verify DATABASE_URL is set
- Ensure PORT is 8080

### Frontend can't connect to backend
- Check CORS_ORIGINS includes your Vercel URL
- Verify VITE_API_URL is correct
- Check Railway service is running

### Database connection error
- Verify PostgreSQL is running in Railway
- Check DATABASE_URL format
- Ensure database is in same Railway project

### CORS errors
- Update CORS_ORIGINS: `https://your-app.vercel.app`
- No trailing slash
- Use https (not http) for production

---

## 💰 Free Tier Limits

### Railway
- $5 monthly credit (enough for hobby projects)
- 500MB PostgreSQL storage
- 512MB RAM
- 1GB disk

### Vercel
- 100GB bandwidth/month
- Unlimited deployments
- Free custom domains
- Serverless functions

---

## 📝 Your Deployment URLs

After deployment, fill in:

**Backend (Railway):**
```
https://______________________.up.railway.app
```

**Frontend (Vercel):**
```
https://______________________.vercel.app
```

**Database (Railway PostgreSQL):**
```
Internal URL: (shown in Railway dashboard)
```

---

## 🎉 You're Done!

Your chat app is now live and will auto-deploy on every git push!
