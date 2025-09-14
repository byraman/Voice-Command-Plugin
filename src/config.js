// src/config.js - Environment configuration
const isProduction = process.env.NODE_ENV === 'production';

// API URL configuration
export const API_BASE_URL = isProduction 
  ? process.env.NEXT_PUBLIC_API_URL || 'https://voice-command-plugin.vercel.app'
  : 'https://voice-command-plugin.vercel.app'; // Always use Vercel URL for deployed version

// Export for use in both plugin and frontend
if (typeof window !== 'undefined') {
  window.API_BASE_URL = API_BASE_URL;
  
  // Allow localhost override for development
  window.USE_LOCALHOST = process.env.USE_LOCALHOST || 'false';
}
