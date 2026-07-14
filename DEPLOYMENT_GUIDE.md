# 🚀 COMPLETE DEPLOYMENT GUIDE
# GitHub → Vercel (Frontend) + Render/Railway (Backend)
# ═══════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: PROJECT PREPARATION (Local Machine)
# ═══════════════════════════════════════════════════════════════════════════

# 1.1 Navigate to project directory
cd video-player-project

# 1.2 Initialize Git repository
git init

# 1.3 Add all files
git add .

# 1.4 Commit
git commit -m "Initial commit: Production-grade video player with HLS & VAST"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: CREATE GITHUB REPOSITORY
# ═══════════════════════════════════════════════════════════════════════════

# 2.1 Go to https://github.com/new
# 2.2 Repository name: video-player-pro
# 2.3 Make it Public (for Vercel free tier)
# 2.4 Do NOT initialize with README (we already have one)
# 2.5 Click "Create repository"

# 2.6 Connect local repo to GitHub
git remote add origin https://github.com/YOUR_USERNAME/video-player-pro.git
git branch -M main
git push -u origin main

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: DEPLOY FRONTEND TO VERCEL
# ═══════════════════════════════════════════════════════════════════════════

# 3.1 Install Vercel CLI (if not installed)
npm i -g vercel

# 3.2 Login to Vercel
vercel login

# 3.3 Deploy frontend (from project root)
cd frontend

# 3.4 Create vercel.json for frontend
# (Already created in frontend/vercel.json)

# 3.5 Deploy
vercel --prod

# OR use GitHub Integration (RECOMMENDED):
# 3.5.1 Go to https://vercel.com/new
# 3.5.2 Import your GitHub repo
# 3.5.3 Select "frontend" as root directory
# 3.5.4 Framework: Create React App
# 3.5.5 Build Command: npm run build
# 3.5.6 Output Directory: build
# 3.5.7 Add Environment Variables:
#       REACT_APP_API_URL=https://your-backend.onrender.com
# 3.5.8 Click Deploy

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: DEPLOY BACKEND TO RENDER (Recommended for Node.js + FFmpeg)
# ═══════════════════════════════════════════════════════════════════════════

# 4.1 Go to https://dashboard.render.com/
# 4.2 Click "New +" → "Web Service"
# 4.3 Connect your GitHub repo
# 4.4 Configure:
#     Name: video-streaming-backend
#     Root Directory: backend
#     Runtime: Node
#     Build Command: npm install && npm run build
#     Start Command: node src/server.js
#     Plan: Free (or Starter for production)

# 4.5 Add Environment Variables:
#     NODE_ENV=production
#     PORT=10000
#     ALLOWED_ORIGINS=https://your-frontend.vercel.app
#     REDIS_HOST=your-redis-host
#     REDIS_PORT=6379

# 4.6 Click "Create Web Service"

# ═══════════════════════════════════════════════════════════════════════════
# ALTERNATIVE: DEPLOY BACKEND TO RAILWAY
# ═══════════════════════════════════════════════════════════════════════════

# 4.1 Go to https://railway.app/
# 4.2 Click "New Project" → "Deploy from GitHub repo"
# 4.3 Select your repo
# 4.4 Add Redis plugin (Railway provides managed Redis)
# 4.5 Add environment variables
# 4.6 Deploy

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: UPDATE FRONTEND WITH BACKEND URL
# ═══════════════════════════════════════════════════════════════════════════

# 5.1 After backend deploys, get the URL (e.g., https://video-streaming.onrender.com)

# 5.2 In Vercel Dashboard:
#     Go to Project Settings → Environment Variables
#     Add: REACT_APP_API_URL=https://your-backend-url.com

# 5.3 Redeploy frontend

# ═══════════════════════════════════════════════════════════════════════════
# STEP 6: VERCEL CONFIGURATION FILES
# ═══════════════════════════════════════════════════════════════════════════

# frontend/vercel.json (already created)
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}

# backend/vercel.json (for serverless deployment - NOT recommended for FFmpeg)
# Better to use Render/Railway for backend due to FFmpeg requirements

# ═══════════════════════════════════════════════════════════════════════════
# STEP 7: DOMAIN CONFIGURATION (Custom Domain)
# ═══════════════════════════════════════════════════════════════════════════

# 7.1 In Vercel Dashboard:
#     Settings → Domains → Add your domain
#     Follow DNS instructions

# 7.2 In Render Dashboard:
#     Settings → Custom Domains → Add custom domain
#     Add CNAME record pointing to Render URL

# ═══════════════════════════════════════════════════════════════════════════
# STEP 8: SSL/HTTPS (Auto-enabled on both platforms)
# ═══════════════════════════════════════════════════════════════════════════

# Vercel: Automatic SSL via Let's Encrypt
# Render: Automatic SSL via Let's Encrypt
# Railway: Automatic SSL

# ═══════════════════════════════════════════════════════════════════════════
# STEP 9: MONITORING & LOGS
# ═══════════════════════════════════════════════════════════════════════════

# Vercel Dashboard: https://vercel.com/dashboard
#   → Select project → Analytics / Logs

# Render Dashboard: https://dashboard.render.com/
#   → Select service → Logs tab

# Railway Dashboard: https://railway.app/dashboard
#   → Select project → Logs

# ═══════════════════════════════════════════════════════════════════════════
# STEP 10: UPDATES & REDEPLOY
# ═══════════════════════════════════════════════════════════════════════════

# 10.1 Make changes locally
# 10.2 Commit and push
git add .
git commit -m "Your update message"
git push origin main

# 10.3 Auto-deploy:
#     Vercel: Automatic on push to main
#     Render: Automatic on push to main
#     Railway: Automatic on push to main

# ═══════════════════════════════════════════════════════════════════════════
# TROUBLESHOOTING
# ═══════════════════════════════════════════════════════════════════════════

# Issue: FFmpeg not found on Render
# Solution: Add build script in render.yaml or use Docker

# Issue: CORS errors
# Solution: Update ALLOWED_ORIGINS in backend env with exact Vercel URL

# Issue: HLS not playing
# Solution: Check .m3u8 Content-Type header is application/vnd.apple.mpegurl

# Issue: VAST ads not loading
# Solution: Check ad-blockers, use VAST proxy endpoint

# ═══════════════════════════════════════════════════════════════════════════
# PRODUCTION CHECKLIST
# ═══════════════════════════════════════════════════════════════════════════

□ FFmpeg installed on server
□ Redis running (for caching)
□ Environment variables set
□ CORS configured correctly
□ SSL/HTTPS enabled
□ CDN configured (Cloudflare)
□ Rate limiting active
□ Logging configured
□ Error monitoring (Sentry)
□ Database backups
□ Auto-scaling configured
