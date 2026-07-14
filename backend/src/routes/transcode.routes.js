/**
 * Transcode Routes
 * Handles video upload and transcoding initiation
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { transcodeVideo, getVideoMetadata } = require('../services/transcode.service');
const { addTranscodeJob, getJobStatus, getQueueStats } = require('../services/queue.service');

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Multer configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.ensureDir(UPLOADS_DIR);
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/ogg',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB max
    files: 1,
  },
});

/**
 * POST /api/transcode/upload
 * Upload and transcode a video file
 */
router.post('/upload', upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No video file uploaded', 400);
    }

    const videoId = uuidv4();
    const inputPath = req.file.path;

    logger.info(`Upload received: ${req.file.originalname} (${req.file.size} bytes)`);

    // Get metadata first
    const metadata = await getVideoMetadata(inputPath);

    // Start transcoding
    const result = await transcodeVideo(inputPath, videoId, {
      qualities: req.body.qualities?.split(',') || null,
    });

    // Clean up uploaded file
    await fs.remove(inputPath);

    res.status(201).json({
      success: true,
      message: 'Video uploaded and transcoding started',
      data: {
        videoId: result.videoId,
        streamUrl: `${req.protocol}://${req.get('host')}${result.masterPlaylist}`,
        qualities: result.qualities,
        metadata: {
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          bitrate: metadata.bitrate,
        },
      },
    });
  } catch (error) {
    // Clean up on error
    if (req.file?.path) {
      await fs.remove(req.file.path).catch(() => {});
    }
    next(error);
  }
});

/**
 * POST /api/transcode/url
 * Transcode from a URL (remote video)
 */
router.post('/url',
  body('url').isURL().withMessage('Valid URL is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { url } = req.body;
      const videoId = uuidv4();

      logger.info(`URL transcoding requested: ${url}`);

      // Download and transcode
      const result = await transcodeVideo(url, videoId);

      res.status(201).json({
        success: true,
        message: 'URL transcoding started',
        data: {
          videoId: result.videoId,
          streamUrl: `${req.protocol}://${req.get('host')}${result.masterPlaylist}`,
          qualities: result.qualities,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/transcode/jobs/:jobId
 * Get transcoding job status
 */
router.get('/jobs/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const status = await getJobStatus(jobId);

    if (!status) {
      throw new AppError('Job not found', 404);
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transcode/stats
 * Get queue statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getQueueStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
