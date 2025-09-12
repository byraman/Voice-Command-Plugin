figma.showUI(__html__, { width: 600, height: 300 });

// Poll for commands from the voice interface
setInterval(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/commands');
    const data = await response.json();
    
    if (data.command) {
      console.log('Voice command received:', data.command);
      figma.notify('Voice command: ' + data.command);
      
      // Clear the command after processing
      await fetch('http://localhost:3000/api/commands', { method: 'DELETE' });
    }
  } catch (error) {
    console.log('No command available or server not running');
  }
}, 1000);