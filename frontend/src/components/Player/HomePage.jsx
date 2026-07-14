import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import './HomePage.css';

const HomePage = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [vastUrl, setVastUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Default demo URLs
  const DEMO_VIDEO = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  const DEMO_VAST = 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=';

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleDemo = () => {
    setVideoUrl(DEMO_VIDEO);
    setVastUrl(DEMO_VAST);
    setSubmitted(true);
  };

  return (
    <div className="home-page">
      <header className="header">
        <h1>🎬 Video Player Pro</h1>
        <p>Production-grade streaming with HLS, ABR & VAST Ads</p>
      </header>

      {!submitted ? (
        <div className="setup-panel">
          <form onSubmit={handleSubmit} className="url-form">
            <div className="input-group">
              <label>HLS Stream URL (.m3u8)</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://your-server.com/stream/master.m3u8"
                required
              />
            </div>

            <div className="input-group">
              <label>VAST Ad Tag URL (Optional)</label>
              <input
                type="url"
                value={vastUrl}
                onChange={(e) => setVastUrl(e.target.value)}
                placeholder="https://adserver.com/vast.xml"
              />
            </div>

            <div className="button-group">
              <button type="submit" className="btn-primary">
                ▶ Play Stream
              </button>
              <button type="button" className="btn-secondary" onClick={handleDemo}>
                🎯 Try Demo
              </button>
            </div>
          </form>

          <div className="features">
            <h3>✨ Features</h3>
            <ul>
              <li>🎥 HLS Streaming with Adaptive Bitrate</li>
              <li>📺 VAST Ad Integration (Pre/Mid/Post-roll)</li>
              <li>📱 Mobile Gestures (Double-tap, Swipe)</li>
              <li>⚡ Quality Selector (144p to 1080p)</li>
              <li>🎚️ Playback Speed Control</li>
              <li>🔲 Picture-in-Picture</li>
              <li>⛶ Fullscreen Support</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="player-wrapper">
          <VideoPlayer
            src={videoUrl}
            vastTagUrl={vastUrl}
            autoPlay={false}
            muted={false}
          />
          <button className="btn-back" onClick={() => setSubmitted(false)}>
            ← Back to Setup
          </button>
        </div>
      )}
    </div>
  );
};

export default HomePage;
