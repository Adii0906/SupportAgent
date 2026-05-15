import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import './LanguageSelector.css';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Mandarin' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ko', name: 'Korean' },
  { code: 'it', name: 'Italian' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
];

const LanguageSelector = () => {
  const { selectedLanguage, setSelectedLanguage } = useStore();

  return (
    <motion.div
      className="language-selector-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="card-header">
        <h2>Select Language</h2>
        <span className="selected-lang">
          {selectedLanguage.toUpperCase()}
        </span>
      </div>

      <div className="languages-grid">
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            className={`language-btn ${selectedLanguage === lang.code ? 'active' : ''}`}
            onClick={() => setSelectedLanguage(lang.code)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={lang.name}
          >
            <span className="lang-name">{lang.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default LanguageSelector;
