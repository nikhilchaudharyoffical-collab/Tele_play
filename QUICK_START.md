# 🚀 QUICK START - 5 MINUTE DEPLOY

## Step 1: GitHub Push (2 min)
```bash
cd video-player-project
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/video-player-pro.git
git push -u origin main
```

## Step 2: Vercel Frontend (2 min)
1. https://vercel.com/new → Import GitHub repo
2. Root Directory: `frontend`
3. Framework: Create React App
4. Deploy

## Step 3: Render Backend (1 min)
1. https://dashboard.render.com/ → New + → Web Service
2. Connect GitHub repo
3. Root Directory: `backend`
4. Build: `npm install` | Start: `node src/server.js`
5. Add Environment Variables
6. Deploy

## Step 4: Connect
1. Copy Render URL
2. Vercel → Settings → Environment Variables
3. Add: `REACT_APP_API_URL=https://your-render-url.com`
4. Redeploy Vercel

## Done! 🎉
Frontend: https://your-app.vercel.app
Backend:  https://your-app.onrender.com
