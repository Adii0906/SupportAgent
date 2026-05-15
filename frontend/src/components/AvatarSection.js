import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import './AvatarSection.css';

const AvatarSection = () => {
  const {
    response,
    volume,
    setIsAvatarPlaying,
    autoPlayAudio,
  } = useStore();

  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoErrorMessage, setVideoErrorMessage] = useState('');

  const videoUrl = response?.video_url;

  // Auto-play video if enabled
  useEffect(() => {
    if (videoUrl && videoRef.current && autoPlayAudio && !hasError) {
      // Delay auto-play to ensure video is loaded
      const timeout = setTimeout(() => {
        videoRef.current?.play().catch((err) => {
          console.log('Auto-play prevented:', err);
        });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [videoUrl, autoPlayAudio, hasError]);

  // Update volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Handle play/pause
  const handlePlayPause = async () => {
    try {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
          setIsAvatarPlaying(false);
        } else {
          await videoRef.current.play();
          setIsPlaying(true);
          setIsAvatarPlaying(true);
        }
      }
    } catch (err) {
      console.error('Play/pause error:', err);
      setHasError(true);
      toast.error('Failed to play video');
    }
  };

  // Handle video loaded
  const handleCanPlay = () => {
    setIsBuffering(false);
    setVideoLoaded(true);
    setHasError(false);
    setVideoErrorMessage('');
  };

  // Handle video waiting (buffering)
  const handleWaiting = () => {
    setIsBuffering(true);
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Handle video ended
  const handleVideoEnded = () => {
    setIsPlaying(false);
    setIsAvatarPlaying(false);
    setCurrentTime(0);
  };

  // Handle video error
  const handleVideoError = (e) => {
    console.error('Video error:', e);
    setHasError(true);
    setIsBuffering(false);
    setVideoLoaded(false);
    setVideoErrorMessage(
      'The video URL could not be loaded. Check the generated video link or the HeyGen fallback URL.'
    );
    toast.error('Error loading video');
  };

  // Format time display
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Progress percentage
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // Handle progress bar click
  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Download video
  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `avatar-response-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download started');
    }
  };

  return (
    <motion.div
      className="avatar-section"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="avatar-header">
        <h3>Avatar Response</h3>
        <span className="language-badge">{response?.language?.toUpperCase()}</span>
      </div>

      <div className="avatar-container">
        {videoUrl ? (
          <div className="video-wrapper">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
              onPlay={() => {
                setIsPlaying(true);
                setIsAvatarPlaying(true);
              }}
              onPause={() => {
                setIsPlaying(false);
                setIsAvatarPlaying(false);
              }}
              onEnded={handleVideoEnded}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={handleCanPlay}
              onWaiting={handleWaiting}
              onError={handleVideoError}
              className="avatar-video"
            />

            {/* Play overlay button */}
            {!isPlaying && videoLoaded && !isBuffering && (
              <motion.button
                className="play-overlay"
                onClick={handlePlayPause}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="play-icon">Play</span>
              </motion.button>
            )}

            {/* Loading spinner */}
            {(isBuffering || !videoLoaded) && (
              <div className="loading-spinner-overlay">
                <div className="loading-spinner"></div>
                <p>{!videoLoaded ? 'Loading video...' : 'Buffering...'}</p>
              </div>
            )}

            {/* Error state */}
            {hasError && (
              <div className="error-state">
                <p>Failed to load video</p>
                {videoErrorMessage && <p>{videoErrorMessage}</p>}
                <button
                  onClick={() => {
                    setHasError(false);
                    setVideoErrorMessage('');
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className="retry-btn"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="loading-avatar">
            <div className="loading-spinner"></div>
            <p>Generating avatar response...</p>
            <p className="loading-subtext">This may take 15-20 seconds</p>
          </div>
        )}
      </div>

      {/* Video Controls */}
      {videoUrl && videoLoaded && (
        <>
          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              onClick={handleProgressClick}
            >
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              >
                <motion.div
                  className="progress-handle"
                  drag="x"
                  dragConstraints={{
                    left: 0,
                    right: 0,
                  }}
                  onDrag={(event, info) => {
                    const progressBar = event.currentTarget.parentElement.parentElement;
                    const rect = progressBar.getBoundingClientRect();
                    const percent = Math.max(
                      0,
                      Math.min(1, (info.offset.x + info.point.x - rect.left) / rect.width)
                    );
                    const newTime = percent * duration;
                    if (videoRef.current) {
                      videoRef.current.currentTime = newTime;
                      setCurrentTime(newTime);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="video-controls">
            {/* Play/Pause Button */}
            <motion.button
              className="control-btn play-btn"
              onClick={handlePlayPause}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </motion.button>

            {/* Time Display */}
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span className="time-separator">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Volume Control */}
            <div className="volume-control-wrapper">
              <span className="volume-icon">Vol</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const { setVolume } = useStore.getState();
                  setVolume(parseFloat(e.target.value));
                }}
                className="volume-slider"
                title="Volume"
              />
            </div>

            {/* Fullscreen Button */}
            <motion.button
              className="control-btn fullscreen-btn"
              onClick={() => {
                if (videoRef.current) {
                  if (videoRef.current.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                  } else if (videoRef.current.webkitRequestFullscreen) {
                    videoRef.current.webkitRequestFullscreen();
                  }
                }
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Fullscreen"
            >
              Full
            </motion.button>

            {/* Download Button */}
            <motion.button
              className="control-btn download-btn"
              onClick={handleDownload}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Download"
            >
              Download
            </motion.button>
          </div>

          {/* Audio Visualization during playback */}
          {isPlaying && (
            <motion.div
              className="audio-visualization"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="audio-bar"
                  animate={{
                    height: ['20%', '100%', '30%', '80%', '50%', '20%'],
                  }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.08,
                    repeat: Infinity,
                  }}
                />
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default AvatarSection;
