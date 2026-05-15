import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
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
      message = 'No response from server. Check if backend is running.';
    } else {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

export const apiService = {
  // Main support endpoint
  submitSupport: async (formData) => {
    const response = await api.post('/support', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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
