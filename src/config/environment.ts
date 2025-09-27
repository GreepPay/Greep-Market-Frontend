/**
 * Environment Configuration
 * 
 * This file centralizes all environment variable access
 * to make it easier to manage and maintain configuration.
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
  },
  
  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dwrbtwtn5',
    uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'market_upload',
  },
  
  // VAPID Configuration
  vapid: {
    publicKey: process.env.REACT_APP_VAPID_PUBLIC_KEY || '',
  },
  
  // App Configuration
  app: {
    name: 'Greep Market',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
} as const;

// Export individual configs for convenience
export const { api, cloudinary, vapid, app } = config;
