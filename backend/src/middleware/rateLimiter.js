/**
 * Rate Limiter Middleware
 * Protects API endpoints from abuse and DDoS
 */

const { RateLimiterRedis } = require('rate-limiter-flexible');
const { logger } = require('../utils/logger');

// In-memory fallback (use Redis in production)
const rateLimiter = async (req, res, next) => {
  try {
    // Simple IP-based rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    const key = `rate_limit:${clientIp}`;

    // For production, use Redis-based rate limiter
    // const limiter = new RateLimiterRedis({
    //   storeClient: redisClient,
    //   keyPrefix: 'middleware',
    //   points: 100, // 100 requests
    //   duration: 60, // per 60 seconds
    // });

    // Simple in-memory implementation for demo
    if (!global.requestCounts) global.requestCounts = new Map();

    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    const requests = global.requestCounts.get(key) || [];
    const recentRequests = requests.filter(time => time > windowStart);

    if (recentRequests.length >= 100) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((requests[0] - windowStart) / 1000),
      });
    }

    recentRequests.push(now);
    global.requestCounts.set(key, recentRequests);

    next();
  } catch (error) {
    logger.error('Rate limiter error:', error);
    next();
  }
};

module.exports = { rateLimiter };
