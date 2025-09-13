const http = require('http');
const fs = require('fs');
const path = require('path');
const { callClaude } = require('./ai-processor'); // Temporarily disabled

const PORT = 3000;
let currentCommand = null;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  
  // Claude API endpoint
  if (url === '/api/claude' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { transcript } = data;
        
        if (!transcript || typeof transcript !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Transcript is required' }));
          return;
        }
        
        if (transcript.length > 1000) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Transcript too long' }));
          return;
        }
        
        // Call Claude API to process the transcript
        try {
          console.log('🤖 Calling Claude with transcript:', transcript);
          const claudeResponse = await callClaude(transcript);
          console.log('✅ Claude response received:', claudeResponse);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(claudeResponse));
        } catch (error) {
          console.error('❌ Error calling Claude:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to process command with AI' }));
        }
        
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }
  
  // API endpoints
  if (url === '/api/commands' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ command: currentCommand }));
    return;
  }
  
  if (url === '/api/commands' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        currentCommand = data.command;
        console.log('Voice command received:', currentCommand);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  if (url === '/api/commands' && req.method === 'DELETE') {
    currentCommand = null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }
  
  // Serve voice interface
  if (url === '/') {
    const filePath = path.join(__dirname, '..', 'src', 'frontend', 'voice-interface.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }
  
  // 404
  res.writeHead(404);
  res.end('Not found');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`🎤 Voice server running at http://localhost:${PORT}`);
  console.log('📱 Open this URL in your browser for voice interface');
});
