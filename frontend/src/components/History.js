import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import './History.css';

const History = () => {
  const { history, setResponse, clearHistory } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  const handleSelectHistory = (item) => {
    setResponse({
      language: item.language,
      transcript: item.transcript,
      response_text: item.response,
      intent: item.intent,
      video_url: item.videoUrl,
    });
    toast.success('Loaded from history');
    setIsOpen(false);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return time;
  };

  return (
    <motion.div
      className="history-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <motion.button
        className="history-toggle"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="history-label">
          History {history.length > 0 && `(${history.length})`}
        </span>
        <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </motion.button>

      {isOpen && (
        <motion.div
          className="history-content"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="history-list">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                className="history-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectHistory(item)}
                role="button"
                tabIndex={0}
              >
                <div className="history-item-header">
                  <span className="history-lang">
                    {item.language?.toUpperCase()}
                  </span>
                  <span className="history-time">
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                <p className="history-transcript">
                  {item.transcript?.substring(0, 60)}...
                </p>
                <p className="history-response">
                  {item.response?.substring(0, 60)}...
                </p>
                <div className="history-intent">
                  <span>{item.intent?.toUpperCase()}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {history.length > 0 && (
            <motion.button
              className="clear-all-btn"
              onClick={() => {
                clearHistory();
                setIsOpen(false);
                toast.success('History cleared');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Clear All History
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default History;
