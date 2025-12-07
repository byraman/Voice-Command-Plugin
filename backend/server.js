const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { callOpenAI } = require('./ai-processor');

// Only load dotenv in local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
let pluginCommands = new Map(); // Map<pluginId, {command, timestamp}>
let pluginConnections = new Map(); // Map<pluginId, lastPollTime>

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

// Rate limiting for command endpoints (stricter than API calls)
const commandRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.COMMAND_RATE_LIMIT_PER_MINUTE) || 30,
  message: {
    error: 'Too many command requests. Please wait a moment before trying again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS middleware - whitelist allowed origins
const allowedOrigins = [
  'https://www.figma.com',
  'https://voice-command-plugin.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin === 'null' || !origin) {
    // Allow 'null' origin (Figma plugin sandbox) and requests with no origin
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
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

// Plugin ID validation
function isValidPluginId(pluginId) {
  if (!pluginId || typeof pluginId !== 'string') return false;
  if (pluginId.length > 100) return false;
  // Format: plugin_timestamp_randomstring
  return /^plugin_\d+_[a-z0-9]+$/.test(pluginId);
}

// Plugin status tracking
app.get('/api/plugin-status', (req, res) => {
  // Clean up inactive plugins (older than 4 seconds)
  const now = Date.now();
  for (const [pluginId, lastPollTime] of pluginConnections.entries()) {
    if (now - lastPollTime > 4000) {
      pluginConnections.delete(pluginId);
    }
  }
  
  const isConnected = pluginConnections.size > 0;
  res.json({ 
    connected: isConnected, 
    activePlugins: pluginConnections.size,
    timestamp: new Date().toISOString()
  });
});

// Voice commands endpoints
app.get('/api/commands', (req, res) => {
  const pluginId = req.headers['x-plugin-id'] || 'unknown';
  
  // Validate plugin ID
  if (!isValidPluginId(pluginId)) {
    return res.status(400).json({ error: 'Invalid plugin ID format' });
  }
  
  // Register plugin connection (track that a plugin is active)
  pluginConnections.set(pluginId, Date.now());
  
  // Get command for this specific plugin
  const commandData = pluginCommands.get(pluginId);
  const command = commandData ? commandData.command : null;
  
  // Only log when a command is actually available
  if (command) {
    console.log(`📥 GET /api/commands - Command available for ${pluginId}:`, command);
  }
  
  res.json({ command });
});

app.post('/api/commands', commandRateLimit, (req, res) => {
  try {
    const { transcript, pluginId } = req.body;
    
    if (!pluginId) {
      return res.status(400).json({ error: 'pluginId is required' });
    }
    
    // Validate plugin ID
    if (!isValidPluginId(pluginId)) {
      return res.status(400).json({ error: 'Invalid plugin ID format' });
    }
    
    // Validate transcript
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript is required and must be a string' });
    }
    
    const trimmedTranscript = transcript.trim();
    if (trimmedTranscript.length === 0) {
      return res.status(400).json({ error: 'Transcript cannot be empty' });
    }
    
    if (trimmedTranscript.length > 1000) {
      return res.status(400).json({ error: 'Transcript too long (max 1000 characters)' });
    }
    
    // Store command with timestamp
    pluginCommands.set(pluginId, {
      command: trimmedTranscript,
      timestamp: Date.now()
    });
    
    console.log(`Voice command received for ${pluginId}:`, trimmedTranscript);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid JSON' });
  }
});

app.delete('/api/commands', (req, res) => {
  const pluginId = req.headers['x-plugin-id'] || 'unknown';
  
  // Validate plugin ID
  if (!isValidPluginId(pluginId)) {
    return res.status(400).json({ error: 'Invalid plugin ID format' });
  }
  
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

// Memory cleanup: remove old commands and inactive connections
setInterval(() => {
  const now = Date.now();
  const COMMAND_TTL = 30000; // 30 seconds
  const CONNECTION_TTL = 4000; // 4 seconds
  const MAX_COMMANDS = 1000; // Max entries in pluginCommands
  
  // Clean up old commands
  let cleanedCommands = 0;
  for (const [pluginId, data] of pluginCommands.entries()) {
    if (now - data.timestamp > COMMAND_TTL) {
      pluginCommands.delete(pluginId);
      cleanedCommands++;
    }
  }
  
  // Clean up inactive connections
  let cleanedConnections = 0;
  for (const [pluginId, lastPollTime] of pluginConnections.entries()) {
    if (now - lastPollTime > CONNECTION_TTL) {
      pluginConnections.delete(pluginId);
      cleanedConnections++;
    }
  }
  
  // Enforce max size limit on pluginCommands (evict oldest)
  if (pluginCommands.size > MAX_COMMANDS) {
    const entries = Array.from(pluginCommands.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = pluginCommands.size - MAX_COMMANDS;
    for (let i = 0; i < toRemove; i++) {
      pluginCommands.delete(entries[i][0]);
    }
  }
  
  if (pluginConnections.size > 0 || pluginCommands.size > 0) {
    console.log(`🔌 Active: ${pluginConnections.size} connections, ${pluginCommands.size} commands (cleaned ${cleanedConnections} connections, ${cleanedCommands} commands)`);
  }
}, 10000); // Run every 10 seconds

// Start server only in local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🎤 Voice server running at http://localhost:${PORT}`);
    console.log('📱 Open this URL in your browser for voice interface');
  });
}
