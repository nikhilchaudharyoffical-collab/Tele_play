/**
 * Stream Routes
 * Handles HLS playlist serving, segment serving, and stream management
 */

const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { param, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { getStreamInfo, isTranscoded } = require('../services/transcode.service');

const router = express.Router();
const STREAMS_DIR = path.join(__dirname, '../../streams');

/**
 * GET /api/stream/:videoId/master.m3u8
 * Serve master playlist for a video
 */
router.get('/:videoId/master.m3u8', 
  param('videoId').isUUID().withMessage('Invalid video ID'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { videoId } = req.params;
      const masterPath = path.join(STREAMS_DIR, videoId, 'master.m3u8');

      if (!(await fs.pathExists(masterPath))) {
        throw new AppError('Stream not found or not yet transcoded', 404);
      }

      // Set proper headers for HLS
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const content = await fs.readFile(masterPath, 'utf8');
      res.send(content);

      logger.info(`Master playlist served: ${videoId}`);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stream/:videoId/:quality.m3u8
 * Serve quality-specific playlist
 */
router.get('/:videoId/:quality.m3u8',
  [
    param('videoId').isUUID(),
    param('quality').isIn(['144p', '240p', '360p', '480p', '720p', '1080p']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { videoId, quality } = req.params;
      const playlistPath = path.join(STREAMS_DIR, videoId, `${quality}.m3u8`);

      if (!(await fs.pathExists(playlistPath))) {
        throw new AppError(`Quality ${quality} not available for this video`, 404);
      }

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const content = await fs.readFile(playlistPath, 'utf8');
      res.send(content);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stream/:videoId/:quality_*.ts
 * Serve video segments
 */
router.get('/:videoId/:segment', async (req, res, next) => {
  try {
    const { videoId, segment } = req.params;
    const segmentPath = path.join(STREAMS_DIR, videoId, segment);

    if (!(await fs.pathExists(segmentPath))) {
      throw new AppError('Segment not found', 404);
    }

    // Set proper headers for TS segments
    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');

    // Support range requests for seeking
    const stat = await fs.stat(segmentPath);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Content-Length', chunkSize);
      res.status(206);

      const stream = fs.createReadStream(segmentPath, { start, end });
      stream.pipe(res);
    } else {
      res.setHeader('Content-Length', stat.size);
      const stream = fs.createReadStream(segmentPath);
      stream.pipe(res);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stream/:videoId/info
 * Get stream metadata
 */
router.get('/:videoId/info', async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const info = await getStreamInfo(videoId);

    if (!info) {
      throw new AppError('Stream not found', 404);
    }

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stream/:videoId/status
 * Check if video is transcoded
 */
router.get('/:videoId/status', async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const transcoded = await isTranscoded(videoId);

    res.json({
      success: true,
      videoId,
      transcoded,
      streamUrl: transcoded ? `/api/stream/${videoId}/master.m3u8` : null,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
