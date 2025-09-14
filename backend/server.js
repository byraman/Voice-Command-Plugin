const express = require('express');
const path = require('path');
const { callClaude } = require('./ai-processor');

// Only load dotenv in local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
let currentCommand = null;

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
    
    // Call Claude API to process the transcript
    try {
      console.log('🤖 Calling Claude with transcript:', transcript);
      const claudeResponse = await callClaude(transcript);
      console.log('✅ Claude response received:', claudeResponse);
      
      res.json(claudeResponse);
    } catch (error) {
      console.error('❌ Error calling Claude:', error);
      res.status(500).json({ error: 'Failed to process command with AI' });
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Voice commands endpoints
app.get('/api/commands', (req, res) => {
  console.log('📥 GET /api/commands - Commands available:', currentCommand ? 1 : 0);
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

// Start server only in local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🎤 Voice server running at http://localhost:${PORT}`);
    console.log('📱 Open this URL in your browser for voice interface');
  });
}
