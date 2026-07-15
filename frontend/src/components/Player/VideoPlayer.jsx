import React, { useRef, useEffect, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Hls from 'hls.js';
import './VideoPlayer.css';

// ═══════════════════════════════════════════════════════════════════════════
// PROFESSIONAL SVG ICONS
// ═══════════════════════════════════════════════════════════════════════════
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

const VolumeHighIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
);

const VolumeLowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
  </svg>
);

const VolumeMuteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
  </svg>
);

const FullscreenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
  </svg>
);

const FullscreenExitIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
  </svg>
);

const PipIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/>
  </svg>
);

const QualityIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"/>
  </svg>
);

const SkipForwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const VideoPlayer = ({
  src,
  vastTagUrl,
  poster,
  autoPlay = false,
  muted = false,
  onReady,
  onError,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const hlsRef = useRef(null);
  const progressRef = useRef(null);
  const isDraggingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [adPlaying, setAdPlaying] = useState(false);
  const [adRemaining, setAdRemaining] = useState(0);
  const [adSkipable, setAdSkipable] = useState(false);
  const [adSkipCountdown, setAdSkipCountdown] = useState(0);
  const [hoverTime, setHoverTime] = useState(0);
  const [showHoverPreview, setShowHoverPreview] = useState(false);

  const controlsTimeoutRef = useRef(null);
  const adIntervalRef = useRef(null);
  const rafRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // SMOOTH PROGRESS UPDATE (RAF-based)
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const updateProgress = () => {
      if (playerRef.current && !isDraggingRef.current) {
        setCurrentTime(playerRef.current.currentTime());
      }
      rafRef.current = requestAnimationFrame(updateProgress);
    };
    rafRef.current = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZE PLAYER
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!videoRef.current || !src) return;

    const video = videoRef.current;

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

    // HLS.js setup
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
        setIsReady(true);
        setBuffering(false);
      });

      hls.on(Hls.Events.BUFFER_STALLED, () => setBuffering(true));
      hls.on(Hls.Events.BUFFER_FLUSHED, () => setBuffering(false));
      hls.on(Hls.Events.FRAG_BUFFERED, () => setBuffering(false));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      setIsReady(true);
      setBuffering(false);
    }

    // IMA SDK
    if (vastTagUrl && window.google?.ima) {
      initIMA(player, vastTagUrl);
    }

    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('durationchange', () => setDuration(player.duration()));
    player.on('volumechange', () => {
      setVolume(player.volume());
      setIsMuted(player.muted());
    });
    player.on('waiting', () => setBuffering(true));
    player.on('playing', () => setBuffering(false));
    player.on('canplay', () => {
      setIsReady(true);
      setBuffering(false);
    });
    player.on('error', (e) => {
      if (onError) onError(e);
    });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    if (onReady) onReady(player);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (hlsRef.current) hlsRef.current.destroy();
      if (playerRef.current) playerRef.current.dispose();
      clearTimeout(controlsTimeoutRef.current);
      clearInterval(adIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, vastTagUrl]);

  // ═══════════════════════════════════════════════════════════════════
  // IMA SDK
  // ═══════════════════════════════════════════════════════════════════
  const initIMA = (player, tagUrl) => {
    const video = player.el().querySelector('video');
    const adContainer = document.createElement('div');
    adContainer.className = 'ad-container';
    adContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:20;pointer-events:none;';
    containerRef.current.appendChild(adContainer);

    try {
      const adDisplayContainer = new window.google.ima.AdDisplayContainer(adContainer, video);
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
                  if (prev <= 1) { clearInterval(skipInterval); setAdSkipable(true); return 0; }
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
          am.addEventListener(window.google.ima.AdErrorEvent.Type.AD_ERROR, () => {
            setAdPlaying(false);
            player.play();
          });

          try {
            am.init(video.offsetWidth, video.offsetHeight, window.google.ima.ViewMode.NORMAL);
            am.start();
          } catch (e) { console.error('AdsManager error:', e); }
        }
      );

      const adsRequest = new window.google.ima.AdsRequest();
      adsRequest.adTagUrl = tagUrl;
      adsRequest.linearAdSlotWidth = video.offsetWidth;
      adsRequest.linearAdSlotHeight = video.offsetHeight;
      adsLoader.requestAds(adsRequest);
    } catch (e) { console.error('IMA SDK error:', e); }
  };

  // ═══════════════════════════════════════════════════════════════════
  // SEEK BAR - SMOOTH DRAG
  // ═══════════════════════════════════════════════════════════════════
  const getSeekPercent = (clientX) => {
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return percent;
  };

  const handleProgressMouseDown = (e) => {
    if (adPlaying) return;
    isDraggingRef.current = true;
    const percent = getSeekPercent(e.clientX);
    setCurrentTime(percent * duration);
  };

  const handleProgressMouseMove = (e) => {
    const percent = getSeekPercent(e.clientX);
    setHoverTime(percent * duration);
    setShowHoverPreview(true);
    if (isDraggingRef.current) {
      setCurrentTime(percent * duration);
    }
  };

  const handleProgressMouseUp = (e) => {
    if (isDraggingRef.current) {
      const percent = getSeekPercent(e.clientX);
      playerRef.current.currentTime(percent * duration);
      isDraggingRef.current = false;
    }
  };

  const handleProgressMouseLeave = () => {
    setShowHoverPreview(false);
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => { isDraggingRef.current = false; };
    const handleGlobalMouseMove = (e) => {
      if (isDraggingRef.current && progressRef.current) {
        const percent = getSeekPercent(e.clientX);
        setCurrentTime(percent * duration);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [duration]);

  // ═══════════════════════════════════════════════════════════════════
  // CONTROLS
  // ═══════════════════════════════════════════════════════════════════
  const togglePlay = useCallback(() => {
    if (adPlaying) return;
    const player = playerRef.current;
    if (player.paused()) player.play(); else player.pause();
  }, [adPlaying]);

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
        q.height === parseInt(quality.replace('p', ''), 10)
      );
      if (level !== -1) hls.currentLevel = level;
    }
    setCurrentQuality(quality);
    setShowQualityMenu(false);
  }, [availableQualities]);

  const changeSpeed = useCallback((speed) => {
    playerRef.current.playbackRate(speed);
    setPlaybackSpeed(speed);
    setShowQualityMenu(false);
  }, []);

  const skipAd = useCallback(() => {
    console.log('Skip ad');
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hoverPercent = duration > 0 ? (hoverTime / duration) * 100 : 0;

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div
      ref={containerRef}
      className={`video-player-container ${isFullscreen ? 'fullscreen' : ''} ${adPlaying ? 'ad-playing' : ''}`}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        className="video-js vjs-default-skin"
        playsInline
        webkit-playsinline="true"
      />

      {/* SINGLE LOADER - Only when buffering AND not ready */}
      {(buffering || !isReady) && (
        <div className="buffering-overlay">
          <div className="loader-ring">
            <div></div><div></div><div></div><div></div>
          </div>
          <p className="loader-text">{!isReady ? 'Loading...' : 'Buffering...'}</p>
        </div>
      )}

      {/* Ad Overlay */}
      {adPlaying && (
        <div className="ad-overlay">
          <div className="ad-label">Advertisement &bull; {Math.ceil(adRemaining)}s</div>
          {adSkipable ? (
            <button className="skip-ad-btn" onClick={skipAd}>
              Skip Ad <SkipForwardIcon />
            </button>
          ) : adSkipCountdown > 0 && (
            <div className="skip-countdown">Skip in {adSkipCountdown}s</div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className={`controls-overlay ${showControls || !isPlaying ? 'visible' : ''}`}>
        {/* Progress Bar - Smooth */}
        <div
          ref={progressRef}
          className="progress-container"
          onMouseDown={handleProgressMouseDown}
          onMouseMove={handleProgressMouseMove}
          onMouseUp={handleProgressMouseUp}
          onMouseLeave={handleProgressMouseLeave}
        >
          <div className="progress-bar">
            <div className="progress-bg" />
            <div className="progress-buffer" />
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
            {showHoverPreview && (
              <div
                className="progress-hover"
                style={{ width: `${hoverPercent}%` }}
              />
            )}
            <div
              className="progress-handle"
              style={{ left: `${progressPercent}%`, opacity: isDraggingRef.current ? 1 : undefined }}
            />
          </div>
          {showHoverPreview && (
            <div className="time-tooltip" style={{ left: `${hoverPercent}%` }}>
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button className="control-btn play-btn" onClick={togglePlay}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className="volume-container">
              <button className="control-btn" onClick={toggleMute}>
                {isMuted ? <VolumeMuteIcon /> : volume > 0.5 ? <VolumeHighIcon /> : <VolumeLowIcon />}
              </button>
              <div className="volume-slider-wrapper">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>
            </div>

            <span className="time-display">
              {formatTime(currentTime)} <span className="time-separator">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            <div className="menu-container">
              <button
                className="control-btn"
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                title="Settings"
              >
                <QualityIcon />
              </button>
              {showQualityMenu && (
                <div className="dropdown-menu settings-menu">
                  <div className="menu-section">
                    <div className="menu-section-title">Quality</div>
                    <button
                      className={`dropdown-item ${currentQuality === 'auto' ? 'active' : ''}`}
                      onClick={() => changeQuality('auto')}
                    >
                      Auto
                    </button>
                    {availableQualities.map(q => (
                      <button
                        key={q.index}
                        className={`dropdown-item ${currentQuality === q.label ? 'active' : ''}`}
                        onClick={() => changeQuality(q.label)}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <div className="menu-divider" />
                  <div className="menu-section">
                    <div className="menu-section-title">Speed</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                      <button
                        key={speed}
                        className={`dropdown-item ${playbackSpeed === speed ? 'active' : ''}`}
                        onClick={() => changeSpeed(speed)}
                      >
                        {speed === 1 ? 'Normal' : `${speed}x`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              className="control-btn"
              onClick={() => videoRef.current?.requestPictureInPicture?.()}
              title="Picture in Picture"
            >
              <PipIcon />
            </button>

            <button className="control-btn" onClick={toggleFullscreen} title="Fullscreen">
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
