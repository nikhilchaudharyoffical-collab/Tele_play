/**
 * Cache Service
 * Multi-layer caching: In-Memory (NodeCache) + File System + Redis
 * Used for: Transcoded segments, VAST responses, Metadata
 */

const NodeCache = require('node-cache');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

// In-memory cache (TTL: 1 hour)
const memoryCache = new NodeCache({ 
  stdTTL: 3600, 
  checkperiod: 600,
  useClones: false 
});

const CACHE_DIR = path.join(__dirname, '../../cache');

/**
 * Initialize cache directories
 */
async function initializeCache() {
  await fs.ensureDir(CACHE_DIR);
  await fs.ensureDir(path.join(CACHE_DIR, 'segments'));
  await fs.ensureDir(path.join(CACHE_DIR, 'vast'));
  await fs.ensureDir(path.join(CACHE_DIR, 'metadata'));
  logger.info('✅ Cache service initialized');
}

/**
 * Generate cache key from input
 */
function generateCacheKey(input) {
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

/**
 * Get cached item (Memory -> File -> null)
 */
async function get(key) {
  // Check memory cache first
  const memValue = memoryCache.get(key);
  if (memValue !== undefined) {
    logger.debug(`Memory cache HIT: ${key}`);
    return memValue;
  }

  // Check file cache
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (await fs.pathExists(filePath)) {
    try {
      const data = await fs.readJson(filePath);
      // Promote to memory cache
      memoryCache.set(key, data);
      logger.debug(`File cache HIT: ${key}`);
      return data;
    } catch (error) {
      logger.warn(`Failed to read cache file: ${filePath}`);
    }
  }

  return null;
}

/**
 * Set cached item (Memory + File)
 */
async function set(key, value, ttl = 3600) {
  // Set in memory
  memoryCache.set(key, value, ttl);

  // Set in file
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  try {
    await fs.writeJson(filePath, value, { spaces: 0 });
    logger.debug(`Cache SET: ${key}`);
  } catch (error) {
    logger.error(`Failed to write cache file: ${error.message}`);
  }
}

/**
 * Check if key exists in cache
 */
async function has(key) {
  if (memoryCache.has(key)) return true;
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  return await fs.pathExists(filePath);
}

/**
 * Delete cached item
 */
async function del(key) {
  memoryCache.del(key);
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
  }
}

/**
 * Get cached segment path
 */
function getSegmentPath(videoId, quality, segmentIndex) {
  return path.join(CACHE_DIR, 'segments', `${videoId}_${quality}_${segmentIndex}.ts`);
}

/**
 * Check if segment is cached
 */
async function isSegmentCached(videoId, quality, segmentIndex) {
  const segmentPath = getSegmentPath(videoId, quality, segmentIndex);
  return await fs.pathExists(segmentPath);
}

/**
 * Cache a transcoded segment
 */
async function cacheSegment(videoId, quality, segmentIndex, buffer) {
  const segmentPath = getSegmentPath(videoId, quality, segmentIndex);
  await fs.ensureDir(path.dirname(segmentPath));
  await fs.writeFile(segmentPath, buffer);
  logger.debug(`Segment cached: ${videoId}_${quality}_${segmentIndex}`);
}

/**
 * Get cached segment
 */
async function getSegment(videoId, quality, segmentIndex) {
  const segmentPath = getSegmentPath(videoId, quality, segmentIndex);
  if (await fs.pathExists(segmentPath)) {
    return await fs.readFile(segmentPath);
  }
  return null;
}

/**
 * Cache VAST response
 */
async function cacheVastResponse(vastUrl, response) {
  const key = `vast_${generateCacheKey(vastUrl)}`;
  await set(key, response, 300); // 5 minutes TTL for VAST
}

/**
 * Get cached VAST response
 */
async function getVastResponse(vastUrl) {
  const key = `vast_${generateCacheKey(vastUrl)}`;
  return await get(key);
}

module.exports = {
  initializeCache,
  generateCacheKey,
  get,
  set,
  has,
  del,
  getSegmentPath,
  isSegmentCached,
  cacheSegment,
  getSegment,
  cacheVastResponse,
  getVastResponse,
};
