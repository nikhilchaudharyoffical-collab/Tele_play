/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  PRODUCTION-GRADE VIDEO STREAMING SERVER                               ║
 * ║  Features: On-the-fly Transcoding | HLS Streaming | VAST Ads | Cache  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const { logger } = require('./src/utils/logger');
const { errorHandler } = require('./src/middleware/errorHandler');
const { rateLimiter } = require('./src/middleware/rateLimiter');
const streamRoutes = require('./src/routes/stream.routes');
const transcodeRoutes = require('./src/routes/transcode.routes');
const vastRoutes = require('./src/routes/vast.routes');
const { initializeCache } = require('./src/services/cache.service');
const { initializeTranscodeQueue } = require('./src/services/queue.service');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE SETUP
// ═══════════════════════════════════════════════════════════════════════════

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      mediaSrc: ["'self'", "blob:", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://imasdk.googleapis.com"],
      connectSrc: ["'self'", "https://pubads.g.doubleclick.net"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS - Allow video playback from any origin
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type'],
  credentials: true,
}));

// Compression for text responses
app.use(compression());

// Request logging
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimiter);

// ═══════════════════════════════════════════════════════════════════════════
// STATIC FILES & STREAMING
// ═══════════════════════════════════════════════════════════════════════════

// Serve HLS streams with proper MIME types
app.use('/streams', express.static(path.join(__dirname, 'streams'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache for segments
    }
    // Enable range requests for seeking
    res.setHeader('Accept-Ranges', 'bytes');
  }
}));

// Serve cache directory
app.use('/cache', express.static(path.join(__dirname, 'cache'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
  }
}));

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.use('/api/stream', streamRoutes);
app.use('/api/transcode', transcodeRoutes);
app.use('/api/vast', vastRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Video Streaming Server',
    version: '1.0.0',
    endpoints: {
      stream: '/api/stream/:videoId',
      transcode: '/api/transcode',
      vast: '/api/vast/parse',
      health: '/health',
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

async function startServer() {
  try {
    // Ensure directories exist
    await fs.ensureDir(path.join(__dirname, 'streams'));
    await fs.ensureDir(path.join(__dirname, 'cache'));
    await fs.ensureDir(path.join(__dirname, 'uploads'));

    // Initialize services
    await initializeCache();
    await initializeTranscodeQueue();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📹 Environment: ${NODE_ENV}`);
      logger.info(`⚡ Transcoding engine: FFmpeg + HLS`);
      logger.info(`🎯 VAST Ads: Google IMA SDK ready`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

module.exports = app;
