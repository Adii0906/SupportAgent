import React from 'react';
import { motion } from 'framer-motion';
import './Header.css';

const Header = () => {
  return (
    <motion.header
      className="header"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="header-content">
        <motion.div
          className="logo-section"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="logo">SA</div>
          <div className="logo-text">
            <h1>Support Agent</h1>
            <p>Simple multilingual support</p>
          </div>
        </motion.div>

        <div className="status-badge">
          <span className="status-dot"></span>
          <span>Live</span>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
