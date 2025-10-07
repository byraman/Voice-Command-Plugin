const express = require('express');
const path = require('path');
const { callOpenAI } = require('./ai-processor');

// Only load dotenv in local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
let currentCommand = null;
let pluginConnections = new Set();

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
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

// Claude API endpoint
app.post('/api/claude', async (req, res) => {
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
  console.log('📥 GET /api/commands - Commands available:', currentCommand ? 1 : 0);
  
  // Register plugin connection (track that a plugin is active)
  const pluginId = req.headers['x-plugin-id'] || 'unknown';
  pluginConnections.add(pluginId);
  
  res.json({ command: currentCommand });
});

app.post('/api/commands', (req, res) => {
  try {
    const { transcript } = req.body;
    currentCommand = transcript;
    console.log('Voice command received:', currentCommand);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid JSON' });
  }
});

app.delete('/api/commands', (req, res) => {
  console.log('🗑️ DELETE /api/commands - Clearing commands');
  currentCommand = null;
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
