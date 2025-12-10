# Render Backend Deployment Guide

## Prerequisites
- GitHub account with your code pushed
- Render account (sign up at https://render.com)

## Deployment Steps

### 1. Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `chatapp-postgres`
   - **Database**: `chatapp`
   - **User**: `chatapp_user` (auto-generated)
   - **Region**: Choose nearest to you
   - **Plan**: Free
4. Click "Create Database"
5. **Save the Internal Database URL** (starts with `postgresql://`)


### 2. Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `morsalin101/chat-app`
3. Configure:
   - **Name**: `chatapp-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile` (relative to backend folder)
   - **Plan**: Free

### 3. Configure Environment Variables

In the "Environment" section, add:

```
JDBC_DATABASE_URL = jdbc:[paste Internal Database URL from step 1]
JWT_SECRET = your-super-secret-jwt-key-min-32-chars-change-this
CORS_ORIGINS = https://your-vercel-app.vercel.app
PORT = 8080
```

**Important**: 
- Use the **Internal Database URL** (not External) for better performance and free egress
- Add `jdbc:` prefix to the DATABASE_URL when setting JDBC_DATABASE_URL
- Example: If DATABASE_URL is `postgresql://user:pass@host/db`, use `jdbc:postgresql://user:pass@host/db`

### 4. Deploy



1. Click "Create Web Service"
2. Render will:
   - Clone your repository
   - Build Docker image from `backend/Dockerfile`
   - Deploy your application
   - Provide a public URL like `https://chatapp-backend.onrender.com`

### 5. Health Check Configuration

Render automatically uses the health check path from `render.yaml`:
- Path: `/actuator/health`
- Your Spring Boot app should respond with 200 OK

### 6. Get Your Backend URL

After deployment completes:
1. Go to your service dashboard
2. Copy the URL (e.g., `https://chatapp-backend.onrender.com`)
3. Use this for your frontend configuration

## Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| JDBC_DATABASE_URL | JDBC PostgreSQL connection string (with jdbc: prefix) | `jdbc:postgresql://user:pass@host/db` |
| JWT_SECRET | Secret key for JWT tokens (min 32 chars) | `your-super-secret-key-change-this` |
| CORS_ORIGINS | Allowed frontend domains | `https://your-app.vercel.app` |
| PORT | Application port | `8080` |

## Important Notes

### Free Tier Limitations
- **Sleep Mode**: Free services sleep after 15 minutes of inactivity
- **Cold Starts**: First request after sleep takes 30-60 seconds
- **Monthly Hours**: 750 hours/month (not 24/7)
- **Database**: 90-day expiration on free tier

### Staying Active (Optional)
To prevent sleep, you can:
1. Use a service like UptimeRobot to ping every 14 minutes
2. Upgrade to paid plan ($7/month for always-on)

### Database Connection
- Always use **Internal Database URL** (starts with `postgresql://`)
- External URL costs egress bandwidth on free tier

## Frontend Configuration (Vercel)

Update your frontend environment variables:

```env
VITE_API_URL=https://chatapp-backend.onrender.com/api
VITE_WS_URL=wss://chatapp-backend.onrender.com/ws
```

## Updating CORS

After deploying frontend to Vercel:
1. Copy your Vercel URL (e.g., `https://chatapp.vercel.app`)
2. Go to Render dashboard → chatapp-backend → Environment
3. Update `CORS_ORIGINS` to your Vercel URL
4. Save (triggers auto-redeploy)

## Auto-Deploy from GitHub

Render automatically deploys when you push to the connected branch:

```bash
git add .
git commit -m "Update backend code"
git push origin main
```

Render will detect the push and auto-deploy.

## Troubleshooting

### Build Fails
- Check Render build logs
- Verify `backend/Dockerfile` exists
- Ensure `pom.xml` has correct dependencies

### Database Connection Error
- Verify `DATABASE_URL` uses **Internal Database URL**
- Check database is running in Render dashboard
- Ensure database and service are in same region

### CORS Errors
- Update `CORS_ORIGINS` with exact Vercel URL (no trailing slash)
- Include protocol: `https://`
- Redeploy after changing

### Health Check Fails
- Verify Spring Boot Actuator is enabled
- Check `/actuator/health` returns 200 OK
- Review application logs in Render dashboard

### Service Not Responding
- Free tier may be sleeping (wait 30-60s for cold start)
- Check service status in dashboard
- Review logs for errors

## Monitoring

1. **Logs**: Dashboard → Your Service → Logs
2. **Metrics**: Dashboard → Your Service → Metrics
3. **Events**: Shows deploy history and status

## Cost Optimization

Free tier includes:
- ✅ 750 hours/month web service
- ✅ PostgreSQL database (90 days)
- ✅ Automatic SSL certificates
- ✅ Auto-deploy from GitHub

Paid upgrade ($7/month):
- ✅ Always-on (no sleep)
- ✅ Unlimited hours
- ✅ Permanent database
- ✅ Better performance

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Copy backend URL
3. ✅ Deploy frontend to Vercel with backend URL
4. ✅ Update CORS_ORIGINS in Render
5. ✅ Test your application

Your chat app is now live! 🚀
