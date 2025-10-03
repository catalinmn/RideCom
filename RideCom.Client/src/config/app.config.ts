export const AppConfig = {
  // Server Configuration
  SIGNALING_SERVER_URL: __DEV__ 
    ? 'http://localhost:3000' 
    : 'https://your-production-server.com',
  
  // WebRTC Configuration
  ICE_SERVERS: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
    // Add TURN server for production
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'your-username',
    //   credential: 'your-password',
    // },
  ],

  // Audio Configuration
  AUDIO_CONSTRAINTS: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1,
  },

  // Connection Configuration
  RECONNECTION_CONFIG: {
    initialDelay: 5000, // 5 seconds
    maxDelay: 30000, // 30 seconds
    maxAttempts: 10,
    backoffFactor: 1.5,
  },

  // Room Configuration
  MAX_PARTICIPANTS: 8,
  ROOM_CODE_LENGTH: 6,

  // Performance Configuration
  MAX_MEMORY_USAGE_MB: 100,
  MAX_CPU_USAGE_PERCENT: 15,
};