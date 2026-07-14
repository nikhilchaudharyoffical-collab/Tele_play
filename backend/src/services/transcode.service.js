/**
 * Transcode Service - The Heart of the Streaming Engine
 * 
 * Handles:
 * - On-the-fly FFmpeg transcoding to HLS
 * - Multi-quality ABR (Adaptive Bitrate) generation
 * - Segment-based transcoding for low latency
 * - Segment caching for performance
 */

const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { 
  generateCacheKey, 
  isSegmentCached, 
  cacheSegment, 
  getSegment 
} = require('./cache.service');

// Set FFmpeg binary paths
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic);

// Quality ladder configuration
const QUALITY_LADDER = [
  {
    name: '144p',
    resolution: '256x144',
    videoBitrate: '200k',
    audioBitrate: '64k',
    bandwidth: 264000,
    codecs: 'avc1.42C015,mp4a.40.2',
  },
  {
    name: '240p',
    resolution: '426x240',
    videoBitrate: '400k',
    audioBitrate: '64k',
    bandwidth: 464000,
    codecs: 'avc1.42C015,mp4a.40.2',
  },
  {
    name: '360p',
    resolution: '640x360',
    videoBitrate: '800k',
    audioBitrate: '96k',
    bandwidth: 896000,
    codecs: 'avc1.4D401E,mp4a.40.2',
  },
  {
    name: '480p',
    resolution: '854x480',
    videoBitrate: '1400k',
    audioBitrate: '128k',
    bandwidth: 1528000,
    codecs: 'avc1.4D401E,mp4a.40.2',
  },
  {
    name: '720p',
    resolution: '1280x720',
    videoBitrate: '2800k',
    audioBitrate: '128k',
    bandwidth: 2928000,
    codecs: 'avc1.4D401F,mp4a.40.2',
  },
  {
    name: '1080p',
    resolution: '1920x1080',
    videoBitrate: '5000k',
    audioBitrate: '192k',
    bandwidth: 5192000,
    codecs: 'avc1.640028,mp4a.40.2',
  },
];

const STREAMS_DIR = path.join(__dirname, '../../streams');
const SEGMENT_DURATION = 4; // seconds per segment
const SEGMENT_LIST_SIZE = 0; // 0 = keep all (VOD), positive = live window

/**
 * Get video metadata using ffprobe
 */
async function getVideoMetadata(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        width: videoStream?.width,
        height: videoStream?.height,
        fps: videoStream?.r_frame_rate,
        videoCodec: videoStream?.codec_name,
        audioCodec: audioStream?.codec_name,
        hasAudio: !!audioStream,
      });
    });
  });
}

/**
 * Generate master playlist (.m3u8) for ABR streaming
 */
function generateMasterPlaylist(outputDir, qualities) {
  const lines = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    '',
  ];

  qualities.forEach(quality => {
    const [width, height] = quality.resolution.split('x');
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${quality.bandwidth},RESOLUTION=${width}x${height},CODECS="${quality.codecs}"`);
    lines.push(`${quality.name}.m3u8`);
    lines.push('');
  });

  const masterPath = path.join(outputDir, 'master.m3u8');
  fs.writeFileSync(masterPath, lines.join('\n'));
  logger.info(`Master playlist generated: ${masterPath}`);
  return masterPath;
}

/**
 * Transcode video to single quality HLS
 */
async function transcodeToQuality(inputPath, outputDir, quality, videoId) {
  const outputPath = path.join(outputDir, `${quality.name}.m3u8`);
  const segmentPattern = path.join(outputDir, `${quality.name}_%04d.ts`);

  return new Promise((resolve, reject) => {
    const [width, height] = quality.resolution.split('x');

    const command = ffmpeg(inputPath)
      .videoCodec('libx264')
      .videoBitrate(quality.videoBitrate)
      .audioCodec('aac')
      .audioBitrate(quality.audioBitrate)
      .size(`${width}x${height}`)
      .outputOptions([
        `-hls_time ${SEGMENT_DURATION}`,
        `-hls_list_size ${SEGMENT_LIST_SIZE}`,
        `-hls_segment_filename ${segmentPattern}`,
        '-hls_playlist_type vod',
        '-preset fast',        // Balance between speed and quality
        '-crf 23',             // Constant Rate Factor
        '-profile:v main',     // H.264 Main profile
        '-level 3.1',          // H.264 Level
        '-sc_threshold 0',     // Disable scene cut detection
        '-g 48',               // GOP size (keyframe every 48 frames @ 24fps)
        '-keyint_min 48',      // Minimum GOP size
        '-movflags +faststart', // Web optimization
        '-f hls',
      ])
      .on('start', (commandLine) => {
        logger.info(`FFmpeg started: ${quality.name} - ${commandLine}`);
      })
      .on('progress', (progress) => {
        logger.debug(`Transcoding ${quality.name}: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        logger.info(`✅ Transcoding complete: ${quality.name}`);
        resolve(outputPath);
      })
      .on('error', (err, stdout, stderr) => {
        logger.error(`❌ Transcoding failed: ${quality.name}`, { error: err.message, stderr });
        reject(err);
      });

    command.run();
  });
}

/**
 * Full transcoding pipeline: Multi-quality ABR
 */
async function transcodeVideo(inputPath, videoId, options = {}) {
  const outputDir = path.join(STREAMS_DIR, videoId);
  await fs.ensureDir(outputDir);

  // Get video metadata
  const metadata = await getVideoMetadata(inputPath);
  logger.info(`Video metadata:`, metadata);

  // Filter qualities based on source resolution
  const availableQualities = QUALITY_LADDER.filter(q => {
    const [qWidth, qHeight] = q.resolution.split('x').map(Number);
    return qHeight <= metadata.height;
  });

  // Always include at least 360p for compatibility
  if (availableQualities.length === 0) {
    availableQualities.push(QUALITY_LADDER.find(q => q.name === '360p'));
  }

  logger.info(`Transcoding to ${availableQualities.length} qualities: ${availableQualities.map(q => q.name).join(', ')}`);

  // Transcode all qualities in parallel
  const transcodeJobs = availableQualities.map(quality => 
    transcodeToQuality(inputPath, outputDir, quality, videoId)
  );

  await Promise.all(transcodeJobs);

  // Generate master playlist
  const masterPath = generateMasterPlaylist(outputDir, availableQualities);

  // Save metadata
  const metaPath = path.join(outputDir, 'metadata.json');
  await fs.writeJson(metaPath, {
    videoId,
    qualities: availableQualities.map(q => q.name),
    duration: metadata.duration,
    createdAt: new Date().toISOString(),
    ...metadata,
  });

  return {
    videoId,
    masterPlaylist: `/streams/${videoId}/master.m3u8`,
    qualities: availableQualities.map(q => q.name),
    metadata,
  };
}

/**
 * On-the-fly segment transcoding (Just-In-Time)
 * Only transcodes segments that are requested, not the whole video
 */
async function transcodeSegmentOnDemand(inputPath, videoId, quality, segmentIndex) {
  // Check cache first
  const cached = await getSegment(videoId, quality, segmentIndex);
  if (cached) {
    logger.debug(`Cache HIT for segment: ${videoId}_${quality}_${segmentIndex}`);
    return cached;
  }

  // Find quality config
  const qualityConfig = QUALITY_LADDER.find(q => q.name === quality);
  if (!qualityConfig) {
    throw new Error(`Invalid quality: ${quality}`);
  }

  const startTime = segmentIndex * SEGMENT_DURATION;
  const [width, height] = qualityConfig.resolution.split('x');

  return new Promise((resolve, reject) => {
    const chunks = [];

    const command = ffmpeg(inputPath)
      .seekInput(startTime)
      .duration(SEGMENT_DURATION)
      .videoCodec('libx264')
      .videoBitrate(qualityConfig.videoBitrate)
      .audioCodec('aac')
      .audioBitrate(qualityConfig.audioBitrate)
      .size(`${width}x${height}`)
      .outputOptions([
        '-preset ultrafast',   // Fastest encoding for live segments
        '-tune zerolatency',   // Minimize latency
        '-crf 28',             // Slightly lower quality for speed
        '-profile:v baseline', // Maximum compatibility
        '-level 3.0',
        '-g 48',
        '-keyint_min 48',
        '-f mpegts',           // Output as MPEG-TS segment
        '-muxdelay 0',
        '-muxpreload 0',
      ])
      .on('error', (err) => {
        logger.error(`Segment transcoding error: ${err.message}`);
        reject(err);
      })
      .pipe();

    command.on('data', (chunk) => {
      chunks.push(chunk);
    });

    command.on('end', async () => {
      const buffer = Buffer.concat(chunks);

      // Cache the segment
      await cacheSegment(videoId, quality, segmentIndex, buffer);

      logger.debug(`Segment transcoded on-demand: ${videoId}_${quality}_${segmentIndex} (${buffer.length} bytes)`);
      resolve(buffer);
    });

    command.on('error', reject);
  });
}

/**
 * Get stream info for a video
 */
async function getStreamInfo(videoId) {
  const metaPath = path.join(STREAMS_DIR, videoId, 'metadata.json');
  if (await fs.pathExists(metaPath)) {
    return await fs.readJson(metaPath);
  }
  return null;
}

/**
 * Check if video is already transcoded
 */
async function isTranscoded(videoId) {
  const masterPath = path.join(STREAMS_DIR, videoId, 'master.m3u8');
  return await fs.pathExists(masterPath);
}

/**
 * Cleanup transcoded files
 */
async function cleanupTranscoded(videoId) {
  const videoDir = path.join(STREAMS_DIR, videoId);
  if (await fs.pathExists(videoDir)) {
    await fs.remove(videoDir);
    logger.info(`Cleaned up transcoded files: ${videoId}`);
  }
}

module.exports = {
  QUALITY_LADDER,
  SEGMENT_DURATION,
  getVideoMetadata,
  transcodeVideo,
  transcodeSegmentOnDemand,
  getStreamInfo,
  isTranscoded,
  cleanupTranscoded,
  generateMasterPlaylist,
};
