// src/config.js - Environment configuration
const isProduction = process.env.NODE_ENV === 'production';

// API URL configuration
export const API_BASE_URL = isProduction 
  ? process.env.NEXT_PUBLIC_API_URL || 'https://your-app-name.vercel.app'
  : 'http://localhost:3000';

// Export for use in both plugin and frontend
if (typeof window !== 'undefined') {
  window.API_BASE_URL = API_BASE_URL;
}
