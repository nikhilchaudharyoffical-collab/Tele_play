/**
 * VAST Routes
 * Handles VAST ad serving and proxying
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { fetchVast, validateVast, getBestMediaFile, getTrackingUrls } = require('../services/vast.service');

const router = express.Router();

/**
 * POST /api/vast/parse
 * Parse a VAST URL and return structured data
 */
router.post('/parse',
  body('vastUrl').isURL().withMessage('Valid VAST URL is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vastUrl } = req.body;
      logger.info(`VAST parse requested: ${vastUrl}`);

      const vastData = await fetchVast(vastUrl);
      const validation = validateVast(vastData);

      res.json({
        success: true,
        data: {
          vast: vastData,
          validation,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/vast/proxy
 * Proxy VAST request (for ad-blocker bypass)
 */
router.get('/proxy',
  query('url').isURL().withMessage('Valid URL is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { url } = req.query;
      const vastData = await fetchVast(url);

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(vastData.raw);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/vast/media
 * Get best media file for an ad
 */
router.post('/media',
  body('vastUrl').isURL(),
  body('width').optional().isInt(),
  body('height').optional().isInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vastUrl, width = 1920, height = 1080 } = req.body;
      const vastData = await fetchVast(vastUrl);

      const ads = vastData.ads.map(ad => {
        const mediaFile = getBestMediaFile(ad, width, height);
        const tracking = {
          start: getTrackingUrls(ad, 'start'),
          firstQuartile: getTrackingUrls(ad, 'firstQuartile'),
          midpoint: getTrackingUrls(ad, 'midpoint'),
          thirdQuartile: getTrackingUrls(ad, 'thirdQuartile'),
          complete: getTrackingUrls(ad, 'complete'),
          skip: getTrackingUrls(ad, 'skip'),
        };

        return {
          id: ad.id,
          type: ad.type,
          mediaFile,
          tracking,
          duration: ad.inline?.creatives?.[0]?.linear?.duration,
          skipoffset: ad.inline?.creatives?.[0]?.linear?.skipoffset,
        };
      });

      res.json({
        success: true,
        data: { ads },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
