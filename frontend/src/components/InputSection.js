import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { apiService } from '../api';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import toast from 'react-hot-toast';
import './InputSection.css';

const InputSection = () => {
  const {
    selectedLanguage,
    inputMode,
    setInputMode,
    textInput,
    setTextInput,
    isLoading,
    setIsLoading,
    setResponse,
    setError,
    avatarId,
  } = useStore();

  const {
    isRecording,
    recordedBlob,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  // Handle voice input
  const handleVoiceInput = async () => {
    if (!isRecording && recordedBlob) {
      await submitAudio();
    } else if (!isRecording) {
      try {
        await startRecording();
        toast.success('Recording started. Speak now!');
      } catch (err) {
        setError(err.message);
      }
    } else {
      stopRecording();
    }
  };

  // Submit audio
  const submitAudio = async () => {
    if (!recordedBlob) return;

    setIsLoading(true);
    const loadingToast = toast.loading('Processing your audio...');

    try {
      const formData = new FormData();
      formData.append('audio_file', recordedBlob, 'audio.webm');
      formData.append('language', selectedLanguage);
      if (avatarId) {
        formData.append('avatar_id', avatarId);
      }

      const result = await apiService.submitSupport(formData);
      
      setResponse(result);
      toast.success('Response generated!', { id: loadingToast });
      resetRecording();
    } catch (err) {
      setError(err.message);
      toast.error('Failed to process audio', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  // Submit text
  const handleSubmitText = async () => {
    if (!textInput.trim()) {
      setError('Please enter a question');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Generating response...');

    try {
      const formData = new FormData();
      formData.append('text_input', textInput);
      formData.append('language', selectedLanguage);
      if (avatarId) {
        formData.append('avatar_id', avatarId);
      }

      const result = await apiService.submitSupport(formData);
      setResponse(result);
      setTextInput('');
      toast.success('Response generated!', { id: loadingToast });
    } catch (err) {
      setError(err.message);
      toast.error('Failed to generate response', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="input-section-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="card-header">
        <h2>Ask Your Question</h2>
      </div>

      {/* Input Mode Tabs */}
      <div className="input-mode-tabs">
        <motion.button
          className={`tab-btn ${inputMode === 'text' ? 'active' : ''}`}
          onClick={() => setInputMode('text')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Text</span>
        </motion.button>
        <motion.button
          className={`tab-btn ${inputMode === 'voice' ? 'active' : ''}`}
          onClick={() => setInputMode('voice')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Voice</span>
        </motion.button>
      </div>

      {/* Text Input */}
      <AnimatePresence>
        {inputMode === 'text' && (
          <motion.div
            key="text-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="input-container"
          >
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your question here... (e.g., 'How do I track my order?')"
              rows="4"
              disabled={isLoading}
              className="text-input"
            />
            <motion.button
              className="submit-btn"
              onClick={handleSubmitText}
              disabled={isLoading || !textInput.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span> Processing...
                </>
              ) : (
                <>
                  <span>Send</span>
                  <span>→</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Input */}
      <AnimatePresence>
        {inputMode === 'voice' && (
          <motion.div
            key="voice-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="voice-input-container"
          >
            {/* Recording Visualization */}
            {isRecording && (
              <div className="recording-viz">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="viz-bar"
                    animate={{
                      height: ['20%', '100%', '30%', '80%', '50%', '20%'],
                    }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.1,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Recorded Audio Display */}
            {recordedBlob && !isRecording && (
              <div className="recorded-audio-display">
                <div className="audio-info">
                  <span className="audio-size">
                    Audio recorded ({(recordedBlob.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>
            )}

            {/* Voice Buttons */}
            <div className="voice-buttons">
              <motion.button
                className={`voice-btn record-btn ${isRecording ? 'recording' : ''} ${recordedBlob ? 'has-audio' : ''}`}
                onClick={handleVoiceInput}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="voice-btn-icon">
                  {isRecording ? 'Stop' : recordedBlob ? 'Again' : 'Record'}
                </span>
                <span className="voice-btn-text">
                  {isRecording ? 'Stop Recording' : recordedBlob ? 'Re-record' : 'Start Recording'}
                </span>
              </motion.button>

              {recordedBlob && !isRecording && (
                <>
                  <motion.button
                    className="voice-btn submit-btn"
                    onClick={submitAudio}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span> Processing...
                      </>
                    ) : (
                      <>
                        <span>Send Audio</span>
                        <span>→</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    className="voice-btn cancel-btn"
                    onClick={resetRecording}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear
                  </motion.button>
                </>
              )}
            </div>

            <p className="voice-hint">
              {isRecording
                ? 'Recording... Speak clearly'
                : recordedBlob
                ? 'Audio recorded. Click Send or Re-record'
                : 'Click to start recording'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InputSection;
