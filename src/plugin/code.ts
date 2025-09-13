// code.ts
figma.showUI(__html__, { width: 300, height: 200 });
figma.ui.onmessage = (msg) => {
  if (msg.type === 'voice-command') {
    figma.notify("Received: " + JSON.stringify(msg.payload));
  }
};
