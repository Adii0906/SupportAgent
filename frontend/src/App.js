import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useStore } from './store';
import { apiService } from './api';
import Header from './components/Header';
import LanguageSelector from './components/LanguageSelector';
import InputSection from './components/InputSection';
import ResponseSection from './components/ResponseSection';
import AvatarSection from './components/AvatarSection';
import SettingsPanel from './components/SettingsPanel';
import History from './components/History';
import './App.css';

function App() {
  const {
    response,
    error,
    clearError,
    setError,
  } = useStore();

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiService.healthCheck();
      } catch (err) {
        setError('Backend server is not running. Please start: python main.py');
        toast.error('Backend connection failed');
      }
    };
    checkHealth();
  }, [setError]);

  // Error notification
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  return (
    <div className="app-container">
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#000',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          },
        }}
      />

      <Header />

      <motion.main
        className="main-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="content-wrapper">
          <div className="left-panel">
            <LanguageSelector />
            <InputSection />
            <SettingsPanel />
          </div>

          <div className="right-panel">
            {response ? (
              <>
                <AvatarSection />
                <ResponseSection />
              </>
            ) : (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="empty-state-icon">SA</div>
                <h2>Ask Your Question</h2>
                <p>Select a language and either type or speak your question in the panel on the left.</p>
                <div className="empty-state-features">
                  <div className="feature">
                    <span>Voice Input</span>
                  </div>
                  <div className="feature">
                    <span>AI Powered</span>
                  </div>
                  <div className="feature">
                    <span>Avatar Video</span>
                  </div>
                  <div className="feature">
                    <span>12+ Languages</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <History />
      </motion.main>
    </div>
  );
}

export default App;
