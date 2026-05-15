import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/** Default for quick JSON calls; long HeyGen pipeline uses per-request timeout. */
const DEFAULT_TIMEOUT_MS = 120000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An error occurred';
    if (error.response) {
      message = error.response.data?.detail || error.response.statusText;
    } else if (error.request) {
      message =
        error.code === 'ECONNABORTED'
          ? 'Request timed out. HeyGen video can take several minutes — try increasing REACT_APP_SUPPORT_REQUEST_TIMEOUT_MS (default 20m) or check the network tab.'
          : 'No response from server. Check if backend is running.';
    } else {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

/** Must exceed backend HeyGen poll window or the client aborts while the server still waits. */
const SUPPORT_TIMEOUT_MS = Number(
  process.env.REACT_APP_SUPPORT_REQUEST_TIMEOUT_MS || 1200000
);

export const apiService = {
  // Main support endpoint (blocks until video_url is ready — often many minutes)
  submitSupport: async (formData) => {
    const response = await api.post('/support', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: SUPPORT_TIMEOUT_MS,
    });
    return response.data;
  },

  // Transcribe audio
  transcribeAudio: async (audioFile) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    const response = await api.post('/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get available avatars
  getAvatars: async () => {
    const response = await api.get('/avatars');
    return response.data;
  },

  // Get supported languages
  getLanguages: async () => {
    const response = await api.get('/languages');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await axios.get(`${API_ROOT_URL}/health`, {
      timeout: 10000,
    });
    return response.data;
  },
};

export default api;
