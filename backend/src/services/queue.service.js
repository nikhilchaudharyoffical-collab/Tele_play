/**
 * Queue Service - Background Job Processing
 * Uses Bull for Redis-backed job queues
 * Handles: Transcoding jobs, cleanup jobs, analytics
 */

const Queue = require('bull');
const { logger } = require('../utils/logger');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

// Transcode Queue
let transcodeQueue;

/**
 * Initialize all queues
 */
async function initializeTranscodeQueue() {
  transcodeQueue = new Queue('video-transcode', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });

  // Event listeners
  transcodeQueue.on('completed', (job, result) => {
    logger.info(`✅ Transcode job completed: ${job.id}`, result);
  });

  transcodeQueue.on('failed', (job, err) => {
    logger.error(`❌ Transcode job failed: ${job.id}`, err);
  });

  transcodeQueue.on('progress', (job, progress) => {
    logger.debug(`Transcode job ${job.id} progress: ${progress}%`);
  });

  logger.info('✅ Transcode queue initialized');
}

/**
 * Add a transcoding job to the queue
 */
async function addTranscodeJob(videoId, inputPath, options = {}) {
  if (!transcodeQueue) {
    throw new Error('Transcode queue not initialized');
  }

  const job = await transcodeQueue.add('transcode', {
    videoId,
    inputPath,
    options,
  });

  logger.info(`Transcode job added: ${job.id} for video ${videoId}`);
  return job;
}

/**
 * Get job status
 */
async function getJobStatus(jobId) {
  if (!transcodeQueue) return null;

  const job = await transcodeQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress();

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    result: job.returnvalue,
    failedReason: job.failedReason,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
}

/**
 * Get queue stats
 */
async function getQueueStats() {
  if (!transcodeQueue) return null;

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    transcodeQueue.getWaitingCount(),
    transcodeQueue.getActiveCount(),
    transcodeQueue.getCompletedCount(),
    transcodeQueue.getFailedCount(),
    transcodeQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

module.exports = {
  initializeTranscodeQueue,
  addTranscodeJob,
  getJobStatus,
  getQueueStats,
};
