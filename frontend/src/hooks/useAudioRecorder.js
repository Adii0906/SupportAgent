import { useEffect, useRef, useState } from 'react';

export const useAudioRecorder = () => {
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const chunks = useRef([]);
  const animationFrameRef = useRef(null);

  // Initialize audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Monitor audio levels
      const monitorAudioLevels = () => {
        if (analyserRef.current && isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
          setAudioLevel(average);
          animationFrameRef.current = requestAnimationFrame(monitorAudioLevels);
        }
      };
      monitorAudioLevels();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw new Error('Microphone access denied. Please grant permission.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioLevel(0);
    }
  };

  // Reset recording
  const resetRecording = () => {
    setRecordedBlob(null);
    chunks.current = [];
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        stopRecording();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    recordedBlob,
    audioLevel,
    startRecording,
    stopRecording,
    resetRecording,
  };
};