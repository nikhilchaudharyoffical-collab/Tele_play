import React, { useRef, useEffect, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Hls from 'hls.js';
import './VideoPlayer.css';

// SVG ICONS
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
);
const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
);
const VolumeHighIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
);
const VolumeLowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>
);
const VolumeMuteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
);
const FullscreenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
);
const FullscreenExitIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
);
const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
);
const PipIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>
);
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
);
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
);

const VideoPlayer = ({ src, vastTagUrl, poster, autoPlay = false, muted = false, onReady, onError }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const hlsRef = useRef(null);
  const progressRef = useRef(null);
  const isDraggingRef = useRef(false);
  const rafRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const adIntervalRef = useRef(null);

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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsSubMenu, setSettingsSubMenu] = useState(null); // null | 'quality' | 'speed'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adRemaining, setAdRemaining] = useState(0);
  const [adSkipable, setAdSkipable] = useState(false);
  const [adSkipCountdown, setAdSkipCountdown] = useState(0);
  const [hoverTime, setHoverTime] = useState(0);
  const [showHoverPreview, setShowHoverPreview] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // SMOOTH PROGRESS (RAF)
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
  // INIT PLAYER
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!videoRef.current || !src) return;
    const video = videoRef.current;

    const player = videojs(video, {
      html5: { vhs: { overrideNative: true, limitRenditionByPlayerDimensions: true, useDevicePixelRatio: true } },
      controls: false, autoplay: autoPlay, muted: muted, preload: 'auto', fluid: true, poster: poster,
    });
    playerRef.current = player;

    if (Hls.isSupported()) {
      const hls = new Hls({ debug: false, enableWorker: true, lowLatencyMode: true, backBufferLength: 90, maxBufferLength: 30, maxMaxBufferLength: 60, startLevel: -1 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, (e, data) => {
        setAvailableQualities(data.levels.map((l, i) => ({ index: i, height: l.height, width: l.width, bitrate: l.bitrate, label: `${l.height}p` })));
        setIsReady(true); setBuffering(false);
      });
      hls.on(Hls.Events.BUFFER_STALLED, () => setBuffering(true));
      hls.on(Hls.Events.BUFFER_FLUSHED, () => setBuffering(false));
      hls.on(Hls.Events.FRAG_BUFFERED, () => setBuffering(false));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src; setIsReady(true); setBuffering(false);
    }

    if (vastTagUrl && window.google?.ima) initIMA(player, vastTagUrl);

    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('durationchange', () => setDuration(player.duration()));
    player.on('volumechange', () => { setVolume(player.volume()); setIsMuted(player.muted()); });
    player.on('waiting', () => setBuffering(true));
    player.on('playing', () => setBuffering(false));
    player.on('canplay', () => { setIsReady(true); setBuffering(false); });
    player.on('error', (e) => { if (onError) onError(e); });

    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    if (onReady) onReady(player);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (hlsRef.current) hlsRef.current.destroy();
      if (playerRef.current) playerRef.current.dispose();
      clearTimeout(controlsTimeoutRef.current);
      clearInterval(adIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, vastTagUrl]);

  // ═══════════════════════════════════════════════════════════════════════
  // IMA SDK
  // ═══════════════════════════════════════════════════════════════════════
  const initIMA = (player, tagUrl) => {
    const video = player.el().querySelector('video');
    const adContainer = document.createElement('div');
    adContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:20;pointer-events:none;';
    containerRef.current.appendChild(adContainer);

    try {
      const adDisplayContainer = new window.google.ima.AdDisplayContainer(adContainer, video);
      const adsLoader = new window.google.ima.AdsLoader(adDisplayContainer);

      adsLoader.addEventListener(window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, (e) => {
        const settings = new window.google.ima.AdsRenderingSettings();
        settings.restoreCustomPlaybackStateOnAdBreakComplete = true;
        const am = e.getAdsManager(video, settings);

        am.addEventListener(window.google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => { setAdPlaying(true); player.pause(); });
        am.addEventListener(window.google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, () => { setAdPlaying(false); player.play(); });
        am.addEventListener(window.google.ima.AdEvent.Type.STARTED, (ev) => {
          const ad = ev.getAd();
          setAdRemaining(ad.getDuration());
          const skipOff = ad.getSkipTimeOffset();
          if (skipOff > 0) {
            setAdSkipCountdown(Math.ceil(skipOff));
            const si = setInterval(() => {
              setAdSkipCountdown(p => { if (p <= 1) { clearInterval(si); setAdSkipable(true); return 0; } return p - 1; });
            }, 1000);
          }
          adIntervalRef.current = setInterval(() => setAdRemaining(p => Math.max(0, p - 1)), 1000);
        });
        am.addEventListener(window.google.ima.AdEvent.Type.COMPLETE, () => { clearInterval(adIntervalRef.current); setAdPlaying(false); setAdSkipable(false); });
        am.addEventListener(window.google.ima.AdErrorEvent.Type.AD_ERROR, () => { setAdPlaying(false); player.play(); });

        try { am.init(video.offsetWidth, video.offsetHeight, window.google.ima.ViewMode.NORMAL); am.start(); } catch (er) { console.error(er); }
      });

      const req = new window.google.ima.AdsRequest();
      req.adTagUrl = tagUrl;
      req.linearAdSlotWidth = video.offsetWidth;
      req.linearAdSlotHeight = video.offsetHeight;
      adsLoader.requestAds(req);
    } catch (er) { console.error(er); }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SEEK BAR - SMOOTH DRAG
  // ═══════════════════════════════════════════════════════════════════════
  const getSeekPercent = (clientX) => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const seekToPercent = (pct) => {
    const time = pct * duration;
    setCurrentTime(time);
    if (playerRef.current) playerRef.current.currentTime(time);
  };

  const handleProgressMouseDown = (e) => {
    if (adPlaying || !duration) return;
    isDraggingRef.current = true;
    const pct = getSeekPercent(e.clientX);
    seekToPercent(pct);
  };

  const handleProgressMouseMove = (e) => {
    const pct = getSeekPercent(e.clientX);
    setHoverTime(pct * duration);
    setShowHoverPreview(true);
    if (isDraggingRef.current) {
      seekToPercent(pct);
    }
  };

  const handleProgressMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleProgressMouseLeave = () => {
    setShowHoverPreview(false);
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const onMouseUp = () => { isDraggingRef.current = false; };
    const onMouseMove = (e) => {
      if (isDraggingRef.current && progressRef.current && duration) {
        const pct = getSeekPercent(e.clientX);
        seekToPercent(pct);
      }
    };
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  // ═══════════════════════════════════════════════════════════════════════
  // CONTROLS
  // ═══════════════════════════════════════════════════════════════════════
  const togglePlay = useCallback(() => {
    if (adPlaying) return;
    const p = playerRef.current;
    if (p.paused()) p.play(); else p.pause();
  }, [adPlaying]);

  const handleVolumeChange = useCallback((e) => {
    const v = parseFloat(e.target.value);
    playerRef.current.volume(v);
    if (v > 0 && playerRef.current.muted()) playerRef.current.muted(false);
  }, []);

  const toggleMute = useCallback(() => { playerRef.current.muted(!playerRef.current.muted()); }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  const changeQuality = useCallback((quality) => {
    const hls = hlsRef.current;
    if (!hls) return;
    if (quality === 'auto') { hls.currentLevel = -1; hls.loadLevel = -1; }
    else { const lvl = availableQualities.findIndex(q => q.height === parseInt(quality.replace('p',''),10)); if (lvl !== -1) hls.currentLevel = lvl; }
    setCurrentQuality(quality);
  }, [availableQualities]);

  const changeSpeed = useCallback((speed) => {
    playerRef.current.playbackRate(speed);
    setPlaybackSpeed(speed);
  }, []);

  const skipAd = useCallback(() => { console.log('Skip ad'); }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  }, [isPlaying]);

  const openSettings = () => {
    setShowSettingsMenu(true);
    setSettingsSubMenu(null);
  };

  const closeSettings = () => {
    setShowSettingsMenu(false);
    setSettingsSubMenu(null);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2,'0')}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hoverPct = duration > 0 ? (hoverTime / duration) * 100 : 0;

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div ref={containerRef} className={`video-player-container ${isFullscreen ? 'fullscreen' : ''} ${adPlaying ? 'ad-playing' : ''}`} onMouseMove={handleMouseMove}>
      <video ref={videoRef} className="video-js vjs-default-skin" playsInline webkit-playsinline="true" />

      {/* LOADER */}
      {(buffering || !isReady) && (
        <div className="buffering-overlay">
          <div className="loader-ring"><div></div><div></div><div></div><div></div></div>
          <p className="loader-text">{!isReady ? 'Loading...' : 'Buffering...'}</p>
        </div>
      )}

      {/* AD OVERLAY */}
      {adPlaying && (
        <div className="ad-overlay">
          <div className="ad-label">Advertisement &bull; {Math.ceil(adRemaining)}s</div>
          {adSkipable ? (<button className="skip-ad-btn" onClick={skipAd}>Skip Ad</button>) : adSkipCountdown > 0 && (<div className="skip-countdown">Skip in {adSkipCountdown}s</div>)}
        </div>
      )}

      {/* CONTROLS */}
      <div className={`controls-overlay ${showControls || !isPlaying ? 'visible' : ''}`}>
        {/* PROGRESS BAR */}
        <div ref={progressRef} className="progress-container" onMouseDown={handleProgressMouseDown} onMouseMove={handleProgressMouseMove} onMouseUp={handleProgressMouseUp} onMouseLeave={handleProgressMouseLeave}>
          <div className="progress-bar">
            <div className="progress-bg" />
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            {showHoverPreview && <div className="progress-hover" style={{ width: `${hoverPct}%` }} />}
            <div className="progress-handle" style={{ left: `${progressPct}%`, opacity: isDraggingRef.current ? 1 : undefined }} />
          </div>
          {showHoverPreview && <div className="time-tooltip" style={{ left: `${hoverPct}%` }}>{formatTime(hoverTime)}</div>}
        </div>

        {/* BUTTONS ROW */}
        <div className="controls-row">
          <div className="controls-left">
            <button className="control-btn play-btn" onClick={togglePlay}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
            <div className="volume-container">
              <button className="control-btn" onClick={toggleMute}>{isMuted ? <VolumeMuteIcon /> : volume > 0.5 ? <VolumeHighIcon /> : <VolumeLowIcon />}</button>
              <div className="volume-slider-wrapper"><input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="volume-slider" /></div>
            </div>
            <span className="time-display">{formatTime(currentTime)} <span className="time-separator">/</span> {formatTime(duration)}</span>
          </div>

          <div className="controls-right">
            {/* SETTINGS MENU - Main Menu → Sub Menu */}
            <div className="menu-container">
              <button className="control-btn" onClick={openSettings} title="Settings"><SettingsIcon /></button>

              {showSettingsMenu && !settingsSubMenu && (
                <div className="dropdown-menu settings-main-menu" onMouseLeave={closeSettings}>
                  <button className="dropdown-item settings-option" onClick={() => setSettingsSubMenu('quality')}>
                    <span>Quality</span>
                    <span className="settings-current">{currentQuality === 'auto' ? 'Auto' : currentQuality} <ChevronRightIcon /></span>
                  </button>
                  <button className="dropdown-item settings-option" onClick={() => setSettingsSubMenu('speed')}>
                    <span>Speed</span>
                    <span className="settings-current">{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`} <ChevronRightIcon /></span>
                  </button>
                </div>
              )}

              {showSettingsMenu && settingsSubMenu === 'quality' && (
                <div className="dropdown-menu settings-sub-menu" onMouseLeave={closeSettings}>
                  <button className="dropdown-item settings-back" onClick={() => setSettingsSubMenu(null)}>
                    <BackIcon /> Quality
                  </button>
                  <div className="menu-divider" />
                  <button className={`dropdown-item ${currentQuality === 'auto' ? 'active' : ''}`} onClick={() => { changeQuality('auto'); closeSettings(); }}>Auto</button>
                  {availableQualities.map(q => (
                    <button key={q.index} className={`dropdown-item ${currentQuality === q.label ? 'active' : ''}`} onClick={() => { changeQuality(q.label); closeSettings(); }}>{q.label}</button>
                  ))}
                </div>
              )}

              {showSettingsMenu && settingsSubMenu === 'speed' && (
                <div className="dropdown-menu settings-sub-menu" onMouseLeave={closeSettings}>
                  <button className="dropdown-item settings-back" onClick={() => setSettingsSubMenu(null)}>
                    <BackIcon /> Speed
                  </button>
                  <div className="menu-divider" />
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button key={speed} className={`dropdown-item ${playbackSpeed === speed ? 'active' : ''}`} onClick={() => { changeSpeed(speed); closeSettings(); }}>{speed === 1 ? 'Normal' : `${speed}x`}</button>
                  ))}
                </div>
              )}
            </div>

            <button className="control-btn" onClick={() => videoRef.current?.requestPictureInPicture?.()} title="PiP"><PipIcon /></button>
            <button className="control-btn" onClick={toggleFullscreen} title="Fullscreen">{isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
