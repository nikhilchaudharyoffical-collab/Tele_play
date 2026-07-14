# 🎬 Video Player Pro

> Production-grade native video player with on-the-fly transcoding, HLS streaming, and VAST ad integration.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-5.0+-orange)](https://ffmpeg.org/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

## ✨ Features

- 🎥 **HLS Streaming** - Adaptive Bitrate (ABR) from 144p to 1080p
- ⚡ **On-the-fly Transcoding** - FFmpeg segment-based processing
- 📺 **VAST Ads** - Google IMA SDK integration (Pre/Mid/Post-roll)
- 📱 **Mobile Gestures** - Double-tap seek, swipe volume/brightness
- 🎚️ **Custom Controls** - Netflix/YouTube-style UI
- 🔒 **Production Ready** - Rate limiting, caching, logging, error handling

## 🏗️ Architecture

```
[ Video Source ] → [ FFmpeg Transcoding ] → [ HLS .m3u8/.ts ]
                                      ↓
[ VAST Server ] → [ Google IMA SDK ] ← [ Frontend Player ]
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- FFmpeg 5.0+
- Redis (optional, for caching)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📁 Project Structure

```
video-player-project/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express server entry
│   │   ├── routes/                # API routes
│   │   ├── services/              # Business logic
│   │   ├── middleware/            # Express middleware
│   │   └── utils/                 # Utilities
│   ├── streams/                   # HLS output directory
│   ├── cache/                     # Cached segments
│   └── vercel.json               # Vercel deployment config
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Player/           # Video player components
│   │   ├── hooks/                 # Custom React hooks
│   │   └── styles/                # Global styles
│   └── public/                    # Static assets
└── scripts/                       # Deployment scripts
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transcode/upload` | Upload & transcode video |
| POST | `/api/transcode/url` | Transcode from URL |
| GET | `/api/stream/:id/master.m3u8` | Master playlist |
| GET | `/api/stream/:id/:quality.m3u8` | Quality playlist |
| GET | `/api/stream/:id/*.ts` | Video segments |
| POST | `/api/vast/parse` | Parse VAST XML |
| GET | `/api/vast/proxy` | Proxy VAST request |

## 🛠️ FFmpeg Transcoding

### Multi-Quality ABR
```bash
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]split=3[v1][v2][v3]; \
    [v1]scale=256:144[v1out]; \
    [v2]scale=640:360[v2out]; \
    [v3]scale=1280:720[v3out]" \
  -map "[v1out]" -c:v libx264 -b:v 200k \
  -map "[v2out]" -c:v libx264 -b:v 800k \
  -map "[v3out]" -c:v libx264 -b:v 2500k \
  -f hls -hls_time 4 -master_pl_name master.m3u8 stream_%v.m3u8
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ using Node.js, FFmpeg, React, and Video.js
