import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import './SettingsPanel.css';

const SettingsPanel = () => {
  const {
    showTranscript,
    setShowTranscript,
    autoPlayAudio,
    setAutoPlayAudio,
    volume,
    setVolume,
    history,
    clearHistory,
    clearResponse,
  } = useStore();

  const [isExpanded, setIsExpanded] = useState(false);

  const handleClearHistory = () => {
    clearHistory();
    toast.success('History cleared');
  };

  const handleNewChat = () => {
    clearResponse();
    toast.success('Ready for a new question');
  };

  return (
    <motion.div
      className="settings-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.button
        className="settings-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="settings-text">Settings</span>
        <span className={`chevron ${isExpanded ? 'open' : ''}`}>▼</span>
      </motion.button>

      {isExpanded && (
        <motion.div
          className="settings-content"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {/* Transcript Toggle */}
          <div className="setting-item">
            <div className="setting-header">
              <label htmlFor="transcript-toggle" className="setting-label">
                Show Transcript
              </label>
              <motion.button
                id="transcript-toggle"
                className={`toggle-btn ${showTranscript ? 'active' : ''}`}
                onClick={() => setShowTranscript(!showTranscript)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div className="toggle-thumb" layoutId="transcript-thumb" />
              </motion.button>
            </div>
            <p className="setting-description">Display your original question transcript</p>
          </div>

          {/* Auto-play Toggle */}
          <div className="setting-item">
            <div className="setting-header">
              <label htmlFor="autoplay-toggle" className="setting-label">
                Auto-play Video
              </label>
              <motion.button
                id="autoplay-toggle"
                className={`toggle-btn ${autoPlayAudio ? 'active' : ''}`}
                onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div className="toggle-thumb" layoutId="autoplay-thumb" />
              </motion.button>
            </div>
            <p className="setting-description">Automatically play avatar response video</p>
          </div>

          {/* Volume Control */}
          <div className="setting-item">
            <div className="setting-header">
              <label className="setting-label">Volume</label>
              <span className="volume-value">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="volume-slider"
            />
            <p className="setting-description">Adjust avatar video volume</p>
          </div>

          {/* History Info */}
          {history.length > 0 && (
            <div className="setting-item">
              <div className="setting-header">
                <label className="setting-label">History</label>
                <span className="history-count">{history.length}</span>
              </div>
              <p className="setting-description">Saved conversations</p>
              <motion.button
                className="clear-history-btn"
                onClick={handleClearHistory}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear History
              </motion.button>
            </div>
          )}

          {/* New Chat Button */}
          <motion.button
            className="new-chat-btn"
            onClick={handleNewChat}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Start New Chat</span>
          </motion.button>

          {/* About */}
          <div className="setting-item about">
            <h4>About This App</h4>
            <p>
              AI-powered multilingual customer support with HeyGen avatar responses. Supports 12+ languages.
            </p>
            <div className="about-stats">
              <div className="stat">
                <span className="stat-value">12+</span>
                <span className="stat-label">Languages</span>
              </div>
              <div className="stat">
                <span className="stat-value">AI</span>
                <span className="stat-label">AI Powered</span>
              </div>
              <div className="stat">
                <span className="stat-value">AV</span>
                <span className="stat-label">Avatar Video</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SettingsPanel;
