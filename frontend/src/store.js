import create from 'zustand';

export const useStore = create((set) => ({
  // Language state
  selectedLanguage: 'en',
  setSelectedLanguage: (language) => set({ selectedLanguage: language }),

  // Input state
  inputMode: 'text', // 'text' or 'voice'
  setInputMode: (mode) => set({ inputMode: mode }),
  textInput: '',
  setTextInput: (text) => set({ textInput: text }),

  // Loading state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Recording state
  isRecording: false,
  setIsRecording: (recording) => set({ isRecording: recording }),

  // Response state
  response: null,
  setResponse: (response) => set({ response }),
  clearResponse: () => set({ response: null }),

  // Error state
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Avatar state
  avatarId: 'Wayne_20220920',
  setAvatarId: (id) => set({ avatarId: id }),
  isAvatarPlaying: false,
  setIsAvatarPlaying: (playing) => set({ isAvatarPlaying: playing }),

  // History state
  history: [],
  addToHistory: (item) =>
    set((state) => ({
      history: [...state.history, { ...item, id: Date.now() }],
    })),
  clearHistory: () => set({ history: [] }),

  // Volume state
  volume: 1,
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  // Settings state
  showTranscript: true,
  setShowTranscript: (show) => set({ showTranscript: show }),
  autoPlayAudio: true,
  setAutoPlayAudio: (auto) => set({ autoPlayAudio: auto }),
}));