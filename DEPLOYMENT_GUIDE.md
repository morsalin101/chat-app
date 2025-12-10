# Complete Deployment Guide - Render + Vercel

## 🚀 Quick Deployment Steps

### Step 1: Deploy Backend to Render

1. **Push to GitHub**
   ```bash
   cd /media/morsalin/NewVolume/project/chat-app-main
   git add .
   git commit -m "Configure for Render deployment"
   git push origin main
   ```

2. **Create PostgreSQL Database**
   - Go to https://dashboard.render.com
   - Click "New +" → "PostgreSQL"
   - Configure:
     - Name: `chatapp-postgres`
     - Database: `chatapp`
     - Region: Choose nearest
     - Plan: **Free**
   - Click "Create Database"
   - **Copy the Internal Database URL** (starts with `postgresql://`)

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository: `morsalin101/chat-app`
   - Configure:
     - Name: `chatapp-backend`
     - Region: Same as database
     - Branch: `main`
     - Root Directory: `backend`
     - Environment: **Docker**
     - Dockerfile Path: `./Dockerfile`
     - Plan: **Free**

4. **Configure Environment Variables**
   
   In "Environment" section, add:
   ```
   DATABASE_URL=[Paste Internal Database URL from step 2]
   JWT_SECRET=my-super-secret-jwt-key-please-change-this-to-something-random-and-secure
   CORS_ORIGINS=http://localhost:5173
   PORT=8080
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete (5-10 minutes)
   - Copy URL (e.g., `https://chatapp-backend.onrender.com`)

### Step 2: Deploy Frontend to Vercel

1. **Update Frontend Environment**
   
   Edit `frontendv2/.env.production`:
   ```
   VITE_API_URL=https://chatapp-backend.onrender.com/api
   VITE_WS_URL=wss://chatapp-backend.onrender.com/ws
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
   VITE_API_URL = https://chatapp-backend.onrender.com/api
   VITE_WS_URL = wss://chatapp-backend.onrender.com/ws
   ```

5. **Deploy**
   - Click "Deploy"
   - Copy your Vercel URL (e.g., `your-app.vercel.app`)

### Step 3: Update CORS

1. **Update Render Environment Variable**
   
   Render Dashboard → chatapp-backend → Environment:
   ```
   CORS_ORIGINS=https://your-app.vercel.app
   ```

2. **Save**
   - Render will auto-redeploy with new CORS settings

---

## 🔄 Auto-Deploy Setup

### Render (Backend)
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

### Render (Backend)
- [ ] `DATABASE_URL` - Internal PostgreSQL URL from database
- [ ] `JWT_SECRET` - Your secret key (min 32 chars)
- [ ] `CORS_ORIGINS` - Your Vercel URL
- [ ] `PORT` - 8080

### Vercel (Frontend)
- [ ] `VITE_API_URL` - Your Render backend URL + `/api`
- [ ] `VITE_WS_URL` - Your Render backend URL (wss://) + `/ws`

---

## 🧪 Test Your Deployment

1. **Backend Health Check**
   ```
   https://your-render-app.onrender.com/actuator/health
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
- Check Render logs: Dashboard → Service → Logs
- Verify DATABASE_URL is set correctly (Internal URL)
- Ensure PORT is 8080
- Check build logs for errors

### Backend is slow (cold starts)
- Free tier sleeps after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Consider upgrading to paid plan ($7/month) for always-on

### Frontend can't connect to backend
- Check CORS_ORIGINS includes your Vercel URL
- Verify VITE_API_URL is correct with `/api` suffix
- Verify VITE_WS_URL uses `wss://` protocol
- Check Render service is running (not sleeping)

### Database connection error
- Verify PostgreSQL is running in Render
- Use **Internal Database URL** (not External)
- Check DATABASE_URL format: `postgresql://user:pass@host:port/db`
- Ensure database and service are in same region

### CORS errors
- Update CORS_ORIGINS: `https://your-app.vercel.app`
- No trailing slash
- Use https (not http) for production
- Save and wait for auto-redeploy

### File uploads not working
- Note: Render free tier has ephemeral filesystem
- Files are deleted on redeploy
- Consider using S3/Cloudinary for production

---

## 💰 Free Tier Limits

### Render
- **Web Service**: 750 hours/month (sleeps after 15 min idle)
- **PostgreSQL**: 90-day expiration on free tier
- **RAM**: 512MB
- **Build Minutes**: 500/month
- **Bandwidth**: 100GB/month

### Vercel
- **Bandwidth**: 100GB/month
- **Deployments**: Unlimited
- **Domains**: Free custom domains
- **Serverless Functions**: 100GB-hours execution time

---

## ⚡ Staying Active (Optional)

To prevent Render free tier from sleeping:

1. **UptimeRobot** (recommended):
   - Sign up at uptimerobot.com
   - Add HTTP monitor
   - URL: `https://your-app.onrender.com/actuator/health`
   - Interval: Every 5 minutes
   
2. **Upgrade to Paid**: $7/month for always-on service

---

## 📝 Your Deployment URLs

After deployment, fill in:

**Backend (Render):**
```
https://______________________.onrender.com
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
