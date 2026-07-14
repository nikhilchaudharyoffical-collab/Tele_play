import React, { useRef, useEffect, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Hls from 'hls.js';
import './VideoPlayer.css';

// Quality options matching backend ladder
const QUALITY_LADDER = [
  { label: 'Auto', value: 'auto' },
  { label: '144p', value: '256x144', bitrate: 200000 },
  { label: '240p', value: '426x240', bitrate: 400000 },
  { label: '360p', value: '640x360', bitrate: 800000 },
  { label: '480p', value: '854x480', bitrate: 1400000 },
  { label: '720p', value: '1280x720', bitrate: 2800000 },
  { label: '1080p', value: '1920x1080', bitrate: 5000000 },
];

const VideoPlayer = ({
  src,
  vastTagUrl,
  poster,
  autoPlay = false,
  muted = false,
  onReady,
  onError,
  onAdEvent,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const hlsRef = useRef(null);
  const adContainerRef = useRef(null);

  // UI State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adRemaining, setAdRemaining] = useState(0);
  const [adSkipable, setAdSkipable] = useState(false);
  const [adSkipCountdown, setAdSkipCountdown] = useState(0);

  const controlsTimeoutRef = useRef(null);
  const adIntervalRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZE PLAYER
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!videoRef.current || !src) return;

    const video = videoRef.current;

    // Initialize Video.js
    const player = videojs(video, {
      html5: {
        vhs: {
          overrideNative: true,
          limitRenditionByPlayerDimensions: true,
          useDevicePixelRatio: true,
        },
      },
      controls: false,
      autoplay: autoPlay,
      muted: muted,
      preload: 'auto',
      fluid: true,
      poster: poster,
    });

    playerRef.current = player;

    // Initialize HLS.js for better control
    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const levels = data.levels.map((level, index) => ({
          index,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          label: `${level.height}p`,
        }));
        setAvailableQualities(levels);
        console.log('Available qualities:', levels);
      });

      hls.on(Hls.Events.BUFFER_STALLED, () => setBuffering(true));
      hls.on(Hls.Events.BUFFER_FLUSHED, () => setBuffering(false));
      hls.on(Hls.Events.FRAG_BUFFERED, () => setBuffering(false));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }

    // ═══════════════════════════════════════════════════════════════════
    // GOOGLE IMA SDK INTEGRATION (via global script in index.html)
    // ═══════════════════════════════════════════════════════════════════
    if (vastTagUrl && window.google?.ima) {
      initIMA(player, vastTagUrl);
    }

    // Player event listeners
    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('timeupdate', () => setCurrentTime(player.currentTime()));
    player.on('durationchange', () => setDuration(player.duration()));
    player.on('volumechange', () => {
      setVolume(player.volume());
      setIsMuted(player.muted());
    });
    player.on('waiting', () => setBuffering(true));
    player.on('playing', () => setBuffering(false));
    player.on('error', (e) => {
      console.error('Player error:', e);
      onError?.(e);
    });

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    if (onReady) onReady(player);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (playerRef.current) {
        playerRef.current.dispose();
      }
      clearTimeout(controlsTimeoutRef.current);
      clearInterval(adIntervalRef.current);
    };
  }, [src, vastTagUrl]);

  // ═══════════════════════════════════════════════════════════════════
  // IMA SDK INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════
  const initIMA = (player, tagUrl) => {
    const video = player.el().querySelector('video');

    // Create ad display container
    const adContainer = document.createElement('div');
    adContainer.className = 'ad-container';
    adContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:20;pointer-events:none;';
    containerRef.current.appendChild(adContainer);
    adContainerRef.current = adContainer;

    try {
      const adDisplayContainer = new window.google.ima.AdDisplayContainer(
        adContainer,
        video
      );

      const adsLoader = new window.google.ima.AdsLoader(adDisplayContainer);

      adsLoader.addEventListener(
        window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        (adsManagerLoadedEvent) => {
          const adsRenderingSettings = new window.google.ima.AdsRenderingSettings();
          adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

          const am = adsManagerLoadedEvent.getAdsManager(video, adsRenderingSettings);

          am.addEventListener(window.google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => {
            setAdPlaying(true);
            player.pause();
          });

          am.addEventListener(window.google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, () => {
            setAdPlaying(false);
            player.play();
          });

          am.addEventListener(window.google.ima.AdEvent.Type.STARTED, (event) => {
            const ad = event.getAd();
            setAdRemaining(ad.getDuration());

            const skipOffset = ad.getSkipTimeOffset();
            if (skipOffset > 0) {
              setAdSkipCountdown(Math.ceil(skipOffset));
              const skipInterval = setInterval(() => {
                setAdSkipCountdown(prev => {
                  if (prev <= 1) {
                    clearInterval(skipInterval);
                    setAdSkipable(true);
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            }

            adIntervalRef.current = setInterval(() => {
              setAdRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
          });

          am.addEventListener(window.google.ima.AdEvent.Type.COMPLETE, () => {
            clearInterval(adIntervalRef.current);
            setAdPlaying(false);
            setAdSkipable(false);
          });

          am.addEventListener(window.google.ima.AdErrorEvent.Type.AD_ERROR, (error) => {
            console.warn('Ad error:', error.getError());
            setAdPlaying(false);
            player.play();
          });

          try {
            am.init(video.offsetWidth, video.offsetHeight, window.google.ima.ViewMode.NORMAL);
            am.start();
          } catch (e) {
            console.error('AdsManager error:', e);
          }
        }
      );

      const adsRequest = new window.google.ima.AdsRequest();
      adsRequest.adTagUrl = tagUrl;
      adsRequest.linearAdSlotWidth = video.offsetWidth;
      adsRequest.linearAdSlotHeight = video.offsetHeight;
      adsRequest.nonLinearAdSlotWidth = video.offsetWidth;
      adsRequest.nonLinearAdSlotHeight = video.offsetHeight / 3;

      adsLoader.requestAds(adsRequest);
    } catch (e) {
      console.error('IMA SDK initialization error:', e);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // CONTROL HANDLERS
  // ═══════════════════════════════════════════════════════════════════
  const togglePlay = useCallback(() => {
    if (adPlaying) return;
    const player = playerRef.current;
    if (player.paused()) {
      player.play();
    } else {
      player.pause();
    }
  }, [adPlaying]);

  const handleSeek = useCallback((e) => {
    if (adPlaying) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    playerRef.current.currentTime(newTime);
  }, [duration, adPlaying]);

  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    playerRef.current.volume(newVolume);
    if (newVolume > 0 && playerRef.current.muted()) {
      playerRef.current.muted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    playerRef.current.muted(!playerRef.current.muted());
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const changeQuality = useCallback((quality) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (quality === 'auto') {
      hls.currentLevel = -1;
      hls.loadLevel = -1;
    } else {
      const level = availableQualities.findIndex(q =>
        q.height === parseInt(quality.replace('p', ''))
      );
      if (level !== -1) {
        hls.currentLevel = level;
      }
    }
    setCurrentQuality(quality);
    setShowQualityMenu(false);
  }, [availableQualities]);

  const changeSpeed = useCallback((speed) => {
    playerRef.current.playbackRate(speed);
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  }, []);

  const skipAd = useCallback(() => {
    // IMA SDK skip functionality
    console.log('Skip ad clicked');
  }, [adSkipable]);

  // Show/hide controls on mouse move
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  // Format time display
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div
      ref={containerRef}
      className={`video-player-container ${isFullscreen ? 'fullscreen' : ''} ${adPlaying ? 'ad-playing' : ''}`}
      onMouseMove={handleMouseMove}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="video-js vjs-default-skin"
        playsInline
        webkit-playsinline="true"
      />

      {/* Buffering Spinner */}
      {buffering && (
        <div className="buffering-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* Ad Overlay */}
      {adPlaying && (
        <div className="ad-overlay">
          <div className="ad-label">Advertisement &bull; {Math.ceil(adRemaining)}s</div>
          {adSkipable ? (
            <button className="skip-ad-btn" onClick={skipAd}>
              Skip Ad &rarr;
            </button>
          ) : adSkipCountdown > 0 && (
            <div className="skip-countdown">Skip in {adSkipCountdown}s</div>
          )}
        </div>
      )}

      {/* Custom Controls */}
      <div className={`controls-overlay ${showControls || !isPlaying ? 'visible' : ''}`}>
        {/* Progress Bar */}
        <div className="progress-container" onClick={handleSeek}>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            <div
              className="progress-handle"
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="controls-row">
          <div className="controls-left">
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            <div className="volume-container">
              <button className="control-btn" onClick={toggleMute}>
                {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>

            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            <div className="speed-menu-container">
              <button
                className="control-btn speed-btn"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <div className="speed-menu">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      className={`speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                      onClick={() => changeSpeed(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="quality-menu-container">
              <button
                className="control-btn quality-btn"
                onClick={() => setShowQualityMenu(!showQualityMenu)}
              >
                {currentQuality === 'auto' ? 'Auto' : currentQuality}
              </button>
              {showQualityMenu && (
                <div className="quality-menu">
                  <button
                    className={`quality-option ${currentQuality === 'auto' ? 'active' : ''}`}
                    onClick={() => changeQuality('auto')}
                  >
                    Auto
                  </button>
                  {availableQualities.map(q => (
                    <button
                      key={q.index}
                      className={`quality-option ${currentQuality === q.label ? 'active' : ''}`}
                      onClick={() => changeQuality(q.label)}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className="control-btn"
              onClick={() => videoRef.current?.requestPictureInPicture?.()}
            >
              📺
            </button>

            <button className="control-btn" onClick={toggleFullscreen}>
              {isFullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
