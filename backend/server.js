const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { callOpenAI } = require('./ai-processor');

// Only load dotenv in local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
let pluginCommands = new Map(); // Map<pluginId, command>
let pluginConnections = new Set();

// Middleware
app.use(express.json({ limit: '10mb' }));

// Rate limiting for OpenAI API calls
// Note: In-memory rate limiting works per serverless instance on Vercel.
// For production at scale, consider Redis or Vercel's built-in rate limiting.
// 
// Per-IP: 10 requests per minute (prevents rapid spam)
// Configure via env: RATE_LIMIT_PER_MINUTE (default: 10)
const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_PER_MINUTE) || 10,
  message: {
    error: 'Too many requests. Please wait a moment before trying again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Daily limit per IP: 100 requests per day (allows good usage)
// Configure via env: RATE_LIMIT_PER_DAY (default: 100)
const dailyRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.RATE_LIMIT_PER_DAY) || 100,
  message: {
    error: 'Daily limit reached. You\'ve used all your requests for today. Try again tomorrow.',
    limit: '100 requests per day'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Plugin-ID');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// OpenAI endpoint with rate limiting
app.post('/api/claude', dailyRateLimit, apiRateLimit, async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    
    if (transcript.length > 1000) {
      return res.status(400).json({ error: 'Transcript too long' });
    }
    
    // Call OpenAI API to process the transcript
    try {
      console.log('🤖 Calling OpenAI with transcript:', transcript);
      const openaiResponse = await callOpenAI(transcript);
      console.log('✅ OpenAI response received:', openaiResponse);
      
      res.json(openaiResponse);
    } catch (error) {
      console.error('❌ Error calling OpenAI:', error);
      res.status(500).json({ error: 'Failed to process command with AI' });
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Plugin status tracking
app.get('/api/plugin-status', (req, res) => {
  const isConnected = pluginConnections.size > 0;
  res.json({ 
    connected: isConnected, 
    activePlugins: pluginConnections.size,
    timestamp: new Date().toISOString()
  });
});

// Voice commands endpoints
app.get('/api/commands', (req, res) => {
  // Register plugin connection (track that a plugin is active)
  const pluginId = req.headers['x-plugin-id'] || 'unknown';
  pluginConnections.add(pluginId);
  
  // Get command for this specific plugin
  const command = pluginCommands.get(pluginId) || null;
  
  // Only log when a command is actually available
  if (command) {
    console.log(`📥 GET /api/commands - Command available for ${pluginId}:`, command);
  }
  
  res.json({ command });
});

app.post('/api/commands', (req, res) => {
  try {
    const { transcript, pluginId } = req.body;
    
    if (!pluginId) {
      return res.status(400).json({ error: 'pluginId is required' });
    }
    
    pluginCommands.set(pluginId, transcript);
    console.log(`Voice command received for ${pluginId}:`, transcript);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid JSON' });
  }
});

app.delete('/api/commands', (req, res) => {
  const pluginId = req.headers['x-plugin-id'] || 'unknown';
  pluginCommands.delete(pluginId);
  console.log(`🗑️ DELETE /api/commands - Cleared command for ${pluginId}`);
  res.json({ success: true });
});

// Serve voice interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'src', 'frontend', 'voice-interface.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel
module.exports = app;

// Cleanup inactive plugin connections every 30 seconds
setInterval(() => {
  // Remove connections older than 5 seconds (plugins poll every 1 second)
  // This is a simple cleanup - in production you'd want more sophisticated tracking
  if (pluginConnections.size > 0) {
    console.log(`🔌 Active plugin connections: ${pluginConnections.size}`);
  }
}, 30000);

// Start server only in local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🎤 Voice server running at http://localhost:${PORT}`);
    console.log('📱 Open this URL in your browser for voice interface');
  });
}
