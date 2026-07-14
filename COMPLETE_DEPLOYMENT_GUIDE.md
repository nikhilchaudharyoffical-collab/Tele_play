# 🚀 COMPLETE DEPLOYMENT ROADMAP
# GitHub → Vercel (Frontend) + Render (Backend)
# ═══════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 1: LOCAL SETUP & GITHUB PUSH                                  ║
# ╚═══════════════════════════════════════════════════════════════════════╝
# ═══════════════════════════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 1.1: Project Folder Structure Verify Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

video-player-project/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-deployment pipeline
├── backend/
│   ├── src/
│   │   ├── server.js           # Express server
│   │   ├── routes/
│   │   │   ├── stream.routes.js
│   │   │   ├── transcode.routes.js
│   │   │   └── vast.routes.js
│   │   ├── services/
│   │   │   ├── transcode.service.js   # FFmpeg engine
│   │   │   ├── cache.service.js
│   │   │   ├── vast.service.js
│   │   │   └── queue.service.js
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   └── utils/
│   │       └── logger.js
│   ├── streams/                # HLS output (gitignore)
│   ├── cache/                  # Cached segments (gitignore)
│   ├── uploads/                # Temp uploads (gitignore)
│   ├── logs/                   # Log files (gitignore)
│   ├── package.json
│   ├── .env.example
│   ├── vercel.json
│   └── Dockerfile
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── components/
│   │   │   └── Player/
│   │   │       ├── VideoPlayer.jsx
│   │   │       ├── VideoPlayer.css
│   │   │       ├── HomePage.jsx
│   │   │       └── HomePage.css
│   │   └── styles/
│   │       └── global.css
│   ├── package.json
│   └── vercel.json
├── scripts/
│   └── deploy.sh
├── .gitignore
├── README.md
├── LICENSE
├── render.yaml
└── DEPLOYMENT_GUIDE.md

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 1.2: Git Repository Initialize Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Terminal open karein aur project folder mein jayein
cd video-player-project

# Git initialize karein
git init

# Saari files add karein
git add .

# Pehla commit karein
git commit -m "🎬 Initial commit: Production-grade video player

Features:
- HLS streaming with ABR (144p to 1080p)
- On-the-fly FFmpeg transcoding
- VAST ad integration (Google IMA SDK)
- Custom Netflix/YouTube-style UI
- Mobile gestures support
- Multi-layer caching (Memory + File + Redis)"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 1.3: GitHub Repository Create Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Browser mein jayein: https://github.com/new

# Settings:
#   Repository name: video-player-pro
#   Description: Production-grade video streaming with HLS & VAST
#   Visibility: Public (Vercel free tier ke liye)
#   ✅ Initialize with README: UNCHECK (already hai)
#   ✅ Add .gitignore: UNCHECK (already hai)
#   ✅ Choose a license: UNCHECK (already hai)

# "Create repository" click karein

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 1.4: Local Repo Ko GitHub Se Connect Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# GitHub URL apne username ke saath:
git remote add origin https://github.com/APKA_USERNAME/video-player-pro.git

# Branch name set karein
git branch -M main

# Push karein GitHub par
git push -u origin main

# ✅ VERIFY: GitHub par repo check karein - saari files dikhein

# ═══════════════════════════════════════════════════════════════════════════
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 2: FRONTEND DEPLOY (VERCEL)                                     ║
# ╚═══════════════════════════════════════════════════════════════════════╝
# ═══════════════════════════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2.1: Vercel Account Create/Login
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# URL: https://vercel.com/signup
# Option 1: "Continue with GitHub" (RECOMMENDED)
# Option 2: Email signup

# GitHub se signup karein taake repo access automatic ho

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2.2: Vercel CLI Install (Optional but Recommended)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Global install karein:
npm i -g vercel

# Login karein:
vercel login
# → Browser open hoga → "Authorize" click karein

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2.3: Method A - Vercel Dashboard Se Deploy (EASIEST)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1. Vercel Dashboard: https://vercel.com/dashboard
# 2. "Add New..." → "Project" click karein
# 3. "Import Git Repository" section mein apna repo dhundein
# 4. "video-player-pro" select karein → "Import" click karein

# Configure Project:
#   Framework Preset: Create React App
#   Root Directory: frontend
#   Build Command: npm run build
#   Output Directory: build

# Environment Variables add karein:
#   REACT_APP_API_URL=https://your-backend-url.com
#   (Abhi ke liye blank chhod dein, backend deploy ke baad update karein)

# "Deploy" click karein

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2.4: Method B - Vercel CLI Se Deploy
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd frontend

# Development preview:
vercel

# Production deploy:
vercel --prod

# Follow prompts:
# ? Set up and deploy "~/video-player-project/frontend"? [Y/n] → Y
# ? Which scope do you want to deploy to? → Select your account
# ? Link to existing project? [y/N] → N (first time)
# ? What's your project name? → video-player-frontend

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2.5: Vercel Deploy Verify Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Deploy ke baad URL milega: https://video-player-frontend.vercel.app

# Browser mein open karein:
# ✅ "Video Player Pro" title dikhe
# ✅ Setup form dikhe
# ✅ "Try Demo" button dikhe

# ═══════════════════════════════════════════════════════════════════════════
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 3: BACKEND DEPLOY (RENDER.COM)                                ║
# ╚═══════════════════════════════════════════════════════════════════════╝
# ═══════════════════════════════════════════════════════════════════════════

# NOTE: Vercel pe backend deploy mat karein kyunki:
# - Vercel serverless hai (stateless)
# - FFmpeg CPU-intensive hai
# - File system access chahiye streams ke liye
# - Isliye Render/Railway/DigitalOcean use karein

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3.1: Render.com Account Create
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# URL: https://dashboard.render.com/
# "Get Started" → "GitHub" se signup karein

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3.2: New Web Service Create Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1. Dashboard mein "New +" button → "Web Service" select karein
# 2. "Connect a repository" mein apna GitHub repo select karein
# 3. "Connect" click karein

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3.3: Web Service Configure Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Settings fill karein:

# Name: video-streaming-backend
# Region: Oregon (US West) ya Singapore (Asia)
# Branch: main
# Root Directory: backend
# Runtime: Node
# Build Command: npm install
# Start Command: node src/server.js

# Instance Type:
#   Free: $0/month (sleep after 15 min inactivity)
#   Starter: $7/month (always on, RECOMMENDED for production)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3.4: Environment Variables Add Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# "Environment" tab mein jayein ya deploy ke time "Advanced" mein:

# Add these variables:

NODE_ENV=production
PORT=10000
ALLOWED_ORIGINS=https://video-player-frontend.vercel.app

# Redis (optional - free tier mein skip kar sakte hain):
# Render pe "New +" → "Redis" → Free plan select karein
# Phir uska host aur port yahan add karein:
REDIS_HOST=your-redis-host.render.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# FFmpeg (auto-detect hoga agar installed hai):
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

# Logging:
LOG_LEVEL=info

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3.5: Disk Add Karein (Streams Store Karne Ke Liye)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# "Disks" tab → "Add Disk":
#   Name: streams
#   Mount Path: /opt/render/project/src/streams
#   Size: 10 GB (Free tier mein 1 GB)

# "Add Disk" again:
#   Name: cache
#   Mount Path: /opt/render/project/src/cache
#   Size: 5 GB

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3.6: Deploy Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# "Create Web Service" click karein

# Build process dekhein (2-5 min):
# ✅ "Build successful"
# ✅ "Your service is live"

# URL copy karein: https://video-streaming-backend.onrender.com

# Health check karein:
curl https://video-streaming-backend.onrender.com/health

# Expected response:
# {"status":"healthy","timestamp":"2026-07-15T...","environment":"production"}

# ═══════════════════════════════════════════════════════════════════════════
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 4: CONNECT FRONTEND ↔ BACKEND                                 ║
# ╚═══════════════════════════════════════════════════════════════════════╝
# ═══════════════════════════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 4.1: Frontend Environment Variable Update Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Vercel Dashboard → apna project → "Settings" → "Environment Variables"

# Add/Update:
REACT_APP_API_URL=https://video-streaming-backend.onrender.com

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 4.2: Frontend Redeploy Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Vercel Dashboard → "Deployments" tab → "Redeploy" latest deployment

# Ya git push se auto-deploy:
git commit --allow-empty -m "trigger: redeploy with backend URL"
git push origin main

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 4.3: CORS Verify Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Backend ke ALLOWED_ORIGINS mein exact Vercel URL hona chahiye:
# https://video-player-frontend.vercel.app

# Agar error aaye toh Render dashboard mein update karein aur redeploy karein

# ═══════════════════════════════════════════════════════════════════════════
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 5: TESTING & VERIFICATION                                       ║
# ╚═══════════════════════════════════════════════════════════════════════╝
# ═══════════════════════════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 5.1: Frontend Test Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Browser mein jayein: https://video-player-frontend.vercel.app

# Test Cases:
# ✅ Page load hota hai
# ✅ "Try Demo" button click karein
# ✅ Video play hoti hai
# ✅ Controls dikhte hain (play/pause/seek/volume)
# ✅ Quality selector kaam karta hai
# ✅ Speed control kaam karta hai
# ✅ Fullscreen kaam karta hai
# ✅ Mobile pe gestures kaam karte hain

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 5.2: Backend API Test Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Health check:
curl https://video-streaming-backend.onrender.com/health

# Stream status check:
curl https://video-streaming-backend.onrender.com/api/stream/SOME_VIDEO_ID/status

# VAST parse test:
curl -X POST https://video-streaming-backend.onrender.com/api/vast/parse \
  -H "Content-Type: application/json" \
  -d '{"vastUrl":"https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator="}'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 5.3: Video Upload Test Karein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Postman ya curl se test karein:

curl -X POST https://video-streaming-backend.onrender.com/api/transcode/upload \
  -F "video=@/path/to/your/video.mp4"

# Response mein milega:
# {
#   "success": true,
#   "data": {
#     "videoId": "uuid-here",
#     "streamUrl": "https://.../api/stream/uuid-here/master.m3u8",
#     "qualities": ["360p","720p","1080p"]
#   }
# }

# Is URL ko frontend mein paste karein aur play karein

# ═══════════════════════════════════════════════════════════════════════════
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 6: CUSTOM DOMAIN SETUP (OPTIONAL)                               ║
# ╚═══════════════════════════════════════════════════════════════════════╝
# ═══════════════════════════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 6.1: Domain Purchase (Namecheap/GoDaddy/Cloudflare)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Example: videoapp.com khareedein

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 6.2: Vercel Custom Domain
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Vercel Dashboard → Project → "Settings" → "Domains"
# "Add" → apna domain enter karein (e.g., app.videoapp.com)

# DNS Records add karein apne domain provider pe:
# Type: CNAME
# Name: app
# Value: cname.vercel-dns.com

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 6.3: Render Custom Domain
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Render Dashboard → Service → "Settings" → "Custom Domains"
# "Add Custom Domain" → api.videoapp.com

# DNS Records:
# Type: CNAME
# Name: api
# Value: video-streaming-backend.onrender.com

# ═══════════════════════════════════════════════════════════════════════════
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 7: PRODUCTION OPTIMIZATIONS                                   ║
# ╚═══════════════════════════════════════════════════════════════════════╝
# ═══════════════════════════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 7.1: CDN Setup (Cloudflare)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1. Cloudflare account create: https://dash.cloudflare.com/sign-up
# 2. "Add a Site" → apna domain enter karein
# 3. DNS records verify karein
# 4. Nameservers update karein apne domain provider pe

# Cloudflare Settings:
#   SSL/TLS: Full (strict)
#   Always Use HTTPS: ON
#   Auto Minify: HTML, CSS, JS
#   Brotli: ON
#   Caching Level: Standard

# Page Rules (for HLS segments):
#   URL: *videoapp.com/streams/*.ts
#   Settings: Cache Level - Cache Everything, Edge Cache TTL - 1 month

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 7.2: Monitoring Setup
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Sentry (Error Tracking):
# 1. https://sentry.io/signup/
# 2. Project create → React + Node.js
# 3. DSN keys environment variables mein add karein

# Uptime Monitoring:
# 1. https://uptimerobot.com/
# 2. Monitor add: https://api.videoapp.com/health
# 3. Alert setup (Email/Slack)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 7.3: Auto-Scaling (Render Pro Plan)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Render Dashboard → Service → "Settings" → "Scaling"
# Auto-scaling enable karein based on CPU/Memory usage

# ═══════════════════════════════════════════════════════════════════════════
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 8: TROUBLESHOOTING GUIDE                                      ║
# ╚═══════════════════════════════════════════════════════════════════════╝
# ═══════════════════════════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROBLEM 1: "CORS Error" Browser Console Mein
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# SOLUTION:
# 1. Render Dashboard → Environment Variables check karein
# 2. ALLOWED_ORIGINS mein exact Vercel URL hona chahiye:
#    https://video-player-frontend.vercel.app
# 3. Agar www subdomain ho toh dono add karein comma se separate:
#    https://video-player-frontend.vercel.app,https://www.video-player-frontend.vercel.app
# 4. Service redeploy karein

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROBLEM 2: "Video Not Playing" / Black Screen
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# SOLUTION:
# 1. Browser DevTools → Network tab check karein
# 2. .m3u8 request ka response check karein
# 3. Content-Type header hona chahiye: application/vnd.apple.mpegurl
# 4. Agar 404 aaye toh video transcoded hai ya nahi check karein:
#    curl https://backend-url/api/stream/VIDEO_ID/status
# 5. Agar transcoding pending ho toh wait karein (5-10 min for 1GB video)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROBLEM 3: "FFmpeg Not Found" Error
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# SOLUTION:
# Render pe FFmpeg pre-installed nahi hai (Free tier mein)
# Options:
# 1. Docker use karein (Dockerfile already created hai)
# 2. Railway use karein (better FFmpeg support)
# 3. DigitalOcean Droplet use karein (full control)

# Railway pe deploy karein:
# 1. https://railway.app/ → New Project → Deploy from GitHub
# 2. Apna repo select karein
# 3. "Add Redis" plugin
# 4. Environment variables add karein
# 5. Deploy

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROBLEM 4: "VAST Ads Not Loading"
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# SOLUTION:
# 1. Ad-blocker disable karein browser mein
# 2. Backend ka VAST proxy use karein:
#    POST /api/vast/parse with vastUrl
# 3. Server-Side Ad Insertion (SSAI) implement karein
# 4. Google IMA SDK console errors check karein

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROBLEM 5: "Free Tier Sleep" (Render)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# SOLUTION:
# Render free tier mein 15 min baad service sleep ho jaati hai
# Next request pe 30-60 sec lagte hain "wake up" hone mein

# Fix:
# 1. Starter plan ($7/month) upgrade karein
# 2. Ya UptimeRobot se ping karein har 10 min mein:
#    https://uptimerobot.com/

# ═══════════════════════════════════════════════════════════════════════════
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  QUICK REFERENCE: ALL URLs                                             ║
# ╚═══════════════════════════════════════════════════════════════════════╝
# ═══════════════════════════════════════════════════════════════════════════

# GitHub Repo:     https://github.com/YOUR_USERNAME/video-player-pro
# Vercel Frontend: https://video-player-frontend.vercel.app
# Render Backend:  https://video-streaming-backend.onrender.com
# Custom Domain:   https://app.videoapp.com (optional)

# API Endpoints:
#   GET  /health                           → Health check
#   POST /api/transcode/upload             → Upload video
#   POST /api/transcode/url                → Transcode from URL
#   GET  /api/stream/:id/master.m3u8      → HLS master playlist
#   GET  /api/stream/:id/:quality.m3u8    → Quality playlist
#   GET  /api/stream/:id/*.ts             → Video segment
#   POST /api/vast/parse                   → Parse VAST XML
#   GET  /api/vast/proxy                   → Proxy VAST request

# ═══════════════════════════════════════════════════════════════════════════
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  FINAL CHECKLIST                                                       ║
# ╚═══════════════════════════════════════════════════════════════════════╝
# ═══════════════════════════════════════════════════════════════════════════

# □ GitHub repo created aur pushed
# □ Vercel frontend deployed
# □ Render backend deployed
# □ Environment variables set (donon platforms pe)
# □ CORS configured correctly
# □ Frontend se backend connect ho raha hai
# □ Video play ho rahi hai
# □ Controls kaam kar rahe hain
# □ Mobile responsive hai
# □ VAST ads load ho rahe hain (optional)
# □ Custom domain configured (optional)
# □ CDN configured (optional)
# □ Monitoring setup (optional)

# ═══════════════════════════════════════════════════════════════════════════
# 🎉 CONGRATULATIONS! Aapka Netflix-level video player LIVE hai!
# ═══════════════════════════════════════════════════════════════════════════
