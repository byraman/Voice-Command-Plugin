const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store for voice commands
let currentCommand = null;

// Serve the voice interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'voice-interface.html'));
});

// API endpoints
app.get('/api/commands', (req, res) => {
  res.json({ command: currentCommand });
});

app.post('/api/commands', (req, res) => {
  currentCommand = req.body.command;
  console.log('Voice command received:', currentCommand);
  res.json({ success: true });
});

app.delete('/api/commands', (req, res) => {
  currentCommand = null;
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🎤 Voice server running at http://localhost:${PORT}`);
  console.log('📱 Open this URL in your browser for voice interface');
});
