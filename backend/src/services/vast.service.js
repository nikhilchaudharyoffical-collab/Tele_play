/**
 * VAST Service - Ad Serving Template Parser
 * Handles VAST XML parsing, ad decisioning, and metadata extraction
 */

const axios = require('axios');
const xml2js = require('xml2js');
const { logger } = require('../utils/logger');
const { cacheVastResponse, getVastResponse } = require('./cache.service');

const VAST_TIMEOUT = 5000; // 5 seconds

/**
 * Fetch and parse VAST XML from ad server
 */
async function fetchVast(vastUrl) {
  // Check cache first
  const cached = await getVastResponse(vastUrl);
  if (cached) {
    logger.debug(`VAST cache HIT: ${vastUrl}`);
    return cached;
  }

  try {
    const response = await axios.get(vastUrl, {
      timeout: VAST_TIMEOUT,
      headers: {
        'User-Agent': 'VideoPlayer/1.0',
        'Accept': 'application/xml, text/xml',
      },
    });

    const vastXml = response.data;
    const parsed = await parseVastXml(vastXml);

    // Cache the parsed response
    await cacheVastResponse(vastUrl, parsed);

    logger.info(`VAST fetched and parsed: ${vastUrl}`);
    return parsed;
  } catch (error) {
    logger.error(`VAST fetch failed: ${error.message}`);
    throw new Error(`Failed to fetch VAST: ${error.message}`);
  }
}

/**
 * Parse VAST XML to structured object
 */
async function parseVastXml(xml) {
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
  });

  const result = await parser.parseStringPromise(xml);
  const vast = result.VAST;

  if (!vast) {
    throw new Error('Invalid VAST XML: No VAST root element');
  }

  const version = vast.version || '3.0';
  const ads = [];

  // Handle single ad or array of ads
  const adElements = Array.isArray(vast.Ad) ? vast.Ad : [vast.Ad];

  for (const adElement of adElements) {
    if (!adElement) continue;

    const ad = {
      id: adElement.id,
      sequence: adElement.sequence,
      type: adElement.InLine ? 'inline' : 'wrapper',
      inline: null,
      wrapper: null,
    };

    if (adElement.InLine) {
      ad.inline = parseInlineAd(adElement.InLine);
    }

    if (adElement.Wrapper) {
      ad.wrapper = {
        vastAdTagUri: adElement.Wrapper.VASTAdTagURI,
        error: adElement.Wrapper.Error,
        impression: adElement.Wrapper.Impression,
      };
    }

    ads.push(ad);
  }

  return {
    version,
    ads,
    raw: xml,
  };
}

/**
 * Parse Inline Ad element
 */
function parseInlineAd(inline) {
  const creatives = [];

  // Handle creatives
  const creativeElements = inline.Creatives?.Creative;
  if (creativeElements) {
    const creativeArray = Array.isArray(creativeElements) ? creativeElements : [creativeElements];

    for (const creative of creativeArray) {
      const parsedCreative = {
        id: creative.id,
        sequence: creative.sequence,
        type: null,
        linear: null,
        nonLinear: null,
        companionAds: null,
      };

      if (creative.Linear) {
        parsedCreative.type = 'linear';
        parsedCreative.linear = parseLinearCreative(creative.Linear);
      }

      if (creative.NonLinearAds) {
        parsedCreative.type = 'nonLinear';
        parsedCreative.nonLinear = creative.NonLinearAds;
      }

      if (creative.CompanionAds) {
        parsedCreative.type = 'companion';
        parsedCreative.companionAds = creative.CompanionAds;
      }

      creatives.push(parsedCreative);
    }
  }

  return {
    adSystem: inline.AdSystem?._ || inline.AdSystem,
    adTitle: inline.AdTitle,
    description: inline.Description,
    error: inline.Error,
    impression: inline.Impression,
    creatives,
    extensions: inline.Extensions,
  };
}

/**
 * Parse Linear Creative
 */
function parseLinearCreative(linear) {
  const mediaFiles = [];

  if (linear.MediaFiles?.MediaFile) {
    const mediaFileElements = Array.isArray(linear.MediaFiles.MediaFile) 
      ? linear.MediaFiles.MediaFile 
      : [linear.MediaFiles.MediaFile];

    for (const mf of mediaFileElements) {
      mediaFiles.push({
        id: mf.id,
        delivery: mf.delivery,
        type: mf.type,
        width: parseInt(mf.width) || 0,
        height: parseInt(mf.height) || 0,
        bitrate: parseInt(mf.bitrate) || 0,
        scalable: mf.scalable === 'true',
        maintainAspectRatio: mf.maintainAspectRatio === 'true',
        apiFramework: mf.apiFramework,
        uri: mf._ || mf,
      });
    }
  }

  const trackingEvents = {};
  if (linear.TrackingEvents?.Tracking) {
    const trackingElements = Array.isArray(linear.TrackingEvents.Tracking)
      ? linear.TrackingEvents.Tracking
      : [linear.TrackingEvents.Tracking];

    for (const tracking of trackingElements) {
      const event = tracking.event;
      if (!trackingEvents[event]) trackingEvents[event] = [];
      trackingEvents[event].push(tracking._ || tracking);
    }
  }

  const videoClicks = {
    clickThrough: linear.VideoClicks?.ClickThrough?._ || linear.VideoClicks?.ClickThrough,
    clickTracking: [],
    customClick: [],
  };

  return {
    duration: linear.Duration,
    skipoffset: linear.skipoffset,
    mediaFiles,
    trackingEvents,
    videoClicks,
    adParameters: linear.AdParameters,
  };
}

/**
 * Validate VAST response
 */
function validateVast(vastData) {
  const errors = [];

  if (!vastData.ads || vastData.ads.length === 0) {
    errors.push('No ads found in VAST response');
  }

  for (const ad of vastData.ads) {
    if (ad.type === 'inline' && ad.inline) {
      const hasLinear = ad.inline.creatives.some(c => c.type === 'linear');
      if (!hasLinear) {
        errors.push(`Ad ${ad.id}: No linear creative found`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get best media file for playback
 */
function getBestMediaFile(ad, targetWidth = 1920, targetHeight = 1080) {
  const linearCreative = ad.inline?.creatives?.find(c => c.type === 'linear');
  if (!linearCreative || !linearCreative.linear) return null;

  const mediaFiles = linearCreative.linear.mediaFiles;
  if (!mediaFiles || mediaFiles.length === 0) return null;

  // Filter by progressive delivery and MP4 type
  const suitableFiles = mediaFiles.filter(mf => 
    mf.delivery === 'progressive' && 
    (mf.type === 'video/mp4' || mf.type === 'application/x-mpegURL')
  );

  if (suitableFiles.length === 0) return null;

  // Sort by closest resolution to target
  suitableFiles.sort((a, b) => {
    const aDiff = Math.abs(a.width - targetWidth) + Math.abs(a.height - targetHeight);
    const bDiff = Math.abs(b.width - targetWidth) + Math.abs(b.height - targetHeight);
    return aDiff - bDiff;
  });

  return suitableFiles[0];
}

/**
 * Extract tracking URLs for events
 */
function getTrackingUrls(ad, event) {
  const linearCreative = ad.inline?.creatives?.find(c => c.type === 'linear');
  if (!linearCreative || !linearCreative.linear) return [];

  return linearCreative.linear.trackingEvents[event] || [];
}

module.exports = {
  fetchVast,
  parseVastXml,
  validateVast,
  getBestMediaFile,
  getTrackingUrls,
};
