# Railway Backend Deployment Guide

## Prerequisites
- GitHub account
- Railway account (sign up at https://railway.app)

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure for Railway deployment"
git push origin main
```

### 2. Create Railway Project

1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the root directory (Railway will detect the backend automatically)

### 3. Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway automatically creates and links `DATABASE_URL`

### 4. Configure Environment Variables

Click on your backend service → "Variables" tab → Add:

```
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-this-in-production
CORS_ORIGINS=https://your-vercel-app.vercel.app
PORT=8080
```

### 5. Deploy

Railway will automatically:
- Detect the Dockerfile
- Build the Docker image
- Deploy your application
- Provide a public URL

### 6. Generate Domain

1. Go to "Settings" tab
2. Click "Generate Domain"
3. Copy the URL (e.g., `chatapp-backend-production.up.railway.app`)

### 7. Update Frontend

Update your Vercel environment variables:
```
VITE_API_URL=https://your-railway-app.up.railway.app
VITE_WS_URL=https://your-railway-app.up.railway.app
```

## Auto-Deploy

Railway automatically deploys when you push to your main branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

## Environment Variables Reference

Railway automatically provides:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Application port

You need to set:
- `JWT_SECRET` - JWT signing key (min 32 characters)
- `CORS_ORIGINS` - Your frontend URL
- `DB_USERNAME` - (Optional, if DATABASE_URL doesn't include it)
- `DB_PASSWORD` - (Optional, if DATABASE_URL doesn't include it)

## Monitoring

- View logs: Railway Dashboard → Your Service → "Logs"
- View metrics: Railway Dashboard → Your Service → "Metrics"
- Database access: Railway Dashboard → PostgreSQL → "Data"

## Troubleshooting

### Build fails
- Check Dockerfile syntax
- Verify pom.xml dependencies
- Check Railway build logs

### Database connection error
- Verify DATABASE_URL is set
- Check PostgreSQL service is running
- Verify database credentials

### CORS errors
- Update CORS_ORIGINS with your Vercel URL
- Redeploy after updating environment variables

## Cost

Railway Free Tier:
- $5 monthly credit
- 500MB PostgreSQL storage
- Shared CPU
- 512MB RAM
- 1GB disk storage

Your app should run free indefinitely on this tier.
