import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import './ResponseSection.css';

const ResponseSection = () => {
  const { response, showTranscript, setShowTranscript, addToHistory } = useStore();
  const [copied, setCopied] = useState(false);

  if (!response) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToHistory = () => {
    addToHistory({
      timestamp: new Date(),
      language: response.language,
      transcript: response.transcript,
      response: response.response_text,
      intent: response.intent,
      videoUrl: response.video_url,
    });
    toast.success('Added to history');
  };

  return (
    <motion.div
      className="response-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Transcript Section */}
      {showTranscript && (
        <AnimatePresence>
          <motion.div
            className="transcript-box"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="transcript-header">
              <h4>Your Question</h4>
              <motion.button
                className="copy-btn"
                onClick={() => copyToClipboard(response.transcript)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {copied ? 'Copied' : 'Copy'}
              </motion.button>
            </div>
            <p className="transcript-text">{response.transcript}</p>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Response Section */}
      <motion.div
        className="response-box"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="response-header">
          <div className="response-meta">
            <span className="intent-badge">{response.intent?.toUpperCase()}</span>
            <span className="lang-indicator">
              {response.language?.toUpperCase()}
            </span>
          </div>
          <motion.button
            className="copy-btn"
            onClick={() => copyToClipboard(response.response_text)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {copied ? 'Copied' : 'Copy'}
          </motion.button>
        </div>
        <p className="response-text">{response.response_text}</p>
      </motion.div>

      {/* Action Buttons */}
      <div className="response-actions">
        <motion.button
          className="action-btn transcript-toggle"
          onClick={() => setShowTranscript(!showTranscript)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{showTranscript ? 'Hide' : 'Show'} Transcript</span>
        </motion.button>

        <motion.button
          className="action-btn save-btn"
          onClick={handleSaveToHistory}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Save to History</span>
        </motion.button>
      </div>

      {/* Metadata */}
      <motion.div
        className="response-metadata"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="metadata-item">
          <span className="metadata-label">Intent Detected:</span>
          <span className="metadata-value">{response.intent || 'general'}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Language:</span>
          <span className="metadata-value">{response.language?.toUpperCase()}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Avatar:</span>
          <span className="metadata-value">{response.avatar_id || 'Wayne'}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResponseSection;
