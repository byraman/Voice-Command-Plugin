// code.ts - Main Figma plugin logic
figma.showUI(__html__, { width: 400, height: 300 });

console.log('🎤 Voice Commands Plugin loaded!');

// Get API URL from environment or default to Vercel
const API_BASE_URL = (globalThis as any).API_BASE_URL || 'https://voice-command-plugin.vercel.app';

// Listen for messages from the UI (mic control and incoming transcripts)
figma.ui.onmessage = (msg) => {
  console.log('📨 Message received from UI:', msg);
  
  if (msg.type === 'voice-command') {
    console.log('🎯 Processing voice command:', msg.command);
    
    // Send to Claude API
    processVoiceCommand(msg.command);
  }
};

// Poll for commands from the voice interface via server
setInterval(async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/commands`);
    const data = await response.json();
    
    if (data.command) {
      console.log('🎤 Voice command received from server:', data.command);
      
      // If command has actions, execute them directly
      if (data.command.actions && Array.isArray(data.command.actions)) {
        console.log('✅ Executing actions:', data.command.actions);
        executeActions(data.command.actions);
      } else {
        // Send to Claude API for processing
        processVoiceCommand(data.command);
      }
      
      // Clear the command after processing
      await fetch(`${API_BASE_URL}/api/commands`, { method: 'DELETE' });
    }
  } catch (error) {
    // Silently ignore connection errors
  }
}, 1000);

async function processVoiceCommand(transcript: string) {
  try {
    console.log('🚀 Sending to Claude API:', transcript);
    
    const response = await fetch(`${API_BASE_URL}/api/claude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript })
    });
    
    const data = await response.json();
    console.log('🤖 Claude response:', data);
    
    if (data.actions && data.actions.length > 0) {
      console.log('✅ Executing actions:', data.actions);
      executeActions(data.actions);
    } else {
      console.log('❌ No actions in response');
      figma.notify('No actions generated from command');
    }
    
  } catch (error) {
    console.error('💥 Error processing command:', error);
    figma.notify('Error processing voice command: ' + (error instanceof Error ? error.message : String(error)));
  }
}

function executeActions(actions: any[]) {
  console.log('🎨 Executing actions on canvas:', actions);
  
  actions.forEach((action, index) => {
    console.log(`Action ${index + 1}:`, action);
    
    try {
      // Execute the action safely through controlled switch cases
      executeAction(action);
    } catch (error) {
      console.error('💥 Error executing action:', error);
    }
  });
  
  figma.notify(`Executed ${actions.length} actions on canvas!`);
}

function executeAction(action: any) {
  const { op, args = {}, target } = action;
  
  switch (op) {
    // CREATE SHAPES
    case 'create_rectangle':
      const rect = figma.createRectangle();
      rect.x = args.x || 100;
      rect.y = args.y || 100;
      rect.resize(args.width || 100, args.height || 100);
      if (args.color) rect.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.borderRadius) rect.cornerRadius = args.borderRadius;
      if (args.name) rect.name = args.name;
      figma.currentPage.appendChild(rect);
      console.log('✅ Rectangle created');
      break;
      
    case 'create_circle':
      const circle = figma.createEllipse();
      circle.x = args.x || 100;
      circle.y = args.y || 100;
      const radius = args.radius || 50;
      circle.resize(radius * 2, radius * 2);
      if (args.color) circle.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.name) circle.name = args.name;
      figma.currentPage.appendChild(circle);
      console.log('✅ Circle created');
      break;
      
    case 'create_ellipse':
      const ellipse = figma.createEllipse();
      ellipse.x = args.x || 100;
      ellipse.y = args.y || 100;
      ellipse.resize(args.width || 100, args.height || 100);
      if (args.color) ellipse.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.name) ellipse.name = args.name;
      figma.currentPage.appendChild(ellipse);
      console.log('✅ Ellipse created');
      break;
      
    case 'create_line':
      const line = figma.createLine();
      line.x = args.x || 100;
      line.y = args.y || 100;
      line.resize(args.width || 100, 0);
      if (args.color) line.strokes = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.strokeWeight) line.strokeWeight = args.strokeWeight;
      if (args.name) line.name = args.name;
      figma.currentPage.appendChild(line);
      console.log('✅ Line created');
      break;
      
    case 'create_polygon':
      const polygon = figma.createPolygon();
      polygon.x = args.x || 100;
      polygon.y = args.y || 100;
      polygon.resize(args.width || 100, args.height || 100);
      if (args.color) polygon.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.name) polygon.name = args.name;
      figma.currentPage.appendChild(polygon);
      console.log('✅ Polygon created');
      break;
      
    case 'create_star':
      const star = figma.createStar();
      star.x = args.x || 100;
      star.y = args.y || 100;
      star.resize(args.width || 100, args.height || 100);
      if (args.color) star.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.name) star.name = args.name;
      figma.currentPage.appendChild(star);
      console.log('✅ Star created');
      break;
      
    // TEXT
    case 'create_text':
      const text = figma.createText();
      text.x = args.x || 100;
      text.y = args.y || 100;
      text.characters = args.text || 'Hello';
      if (args.fontSize) text.fontSize = args.fontSize;
      if (args.color) text.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.name) text.name = args.name;
      figma.currentPage.appendChild(text);
      console.log('✅ Text created');
      break;
      
    // FRAMES
    case 'create_frame':
      const frame = figma.createFrame();
      frame.x = args.x || 100;
      frame.y = args.y || 100;
      frame.resize(args.width || 200, args.height || 200);
      if (args.color) frame.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.borderRadius) frame.cornerRadius = args.borderRadius;
      if (args.name) frame.name = args.name;
      figma.currentPage.appendChild(frame);
      console.log('✅ Frame created');
      break;
      
    // STYLING
    case 'set_fill':
      if (target) {
        const node = findNodeById(target);
        if (node && 'fills' in node) {
          node.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
          console.log('✅ Fill set');
        }
      }
      break;
      
    case 'set_stroke':
      if (target) {
        const node = findNodeById(target);
        if (node && 'strokes' in node) {
          node.strokes = [{ type: 'SOLID', color: hexToRgb(args.color) }];
          if (args.strokeWeight) node.strokeWeight = args.strokeWeight;
          console.log('✅ Stroke set');
        }
      }
      break;
      
    case 'set_opacity':
      if (target) {
        const node = findNodeById(target);
        if (node && 'opacity' in node) {
          node.opacity = args.opacity;
          console.log('✅ Opacity set');
        }
      }
      break;
      
    // TRANSFORM
    case 'move':
      if (target) {
        const node = findNodeById(target);
        if (node) {
          node.x = args.x || node.x;
          node.y = args.y || node.y;
          console.log('✅ Node moved');
        }
      }
      break;
      
    case 'resize':
      if (target) {
        const node = findNodeById(target);
        if (node && 'resize' in node) {
          node.resize(args.width || node.width, args.height || node.height);
          console.log('✅ Node resized');
        }
      }
      break;
      
    case 'rotate':
      if (target) {
        const node = findNodeById(target);
        if (node && 'rotation' in node) {
          node.rotation = args.rotation || 0;
          console.log('✅ Node rotated');
        }
      }
      break;
      
    // SELECTION
    case 'select':
      if (target) {
        const node = findNodeById(target);
        if (node) {
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);
          console.log('✅ Node selected');
        }
      }
      break;
      
    case 'select_all':
      const allNodes = figma.currentPage.children;
      figma.currentPage.selection = allNodes;
      console.log('✅ All nodes selected');
      break;
      
    case 'deselect':
      figma.currentPage.selection = [];
      console.log('✅ Selection cleared');
      break;
      
    // LAYERS
    case 'bring_to_front':
      if (target) {
        const node = findNodeById(target);
        if (node) {
          figma.currentPage.appendChild(node);
          console.log('✅ Brought to front');
        }
      }
      break;
      
    case 'send_to_back':
      if (target) {
        const node = findNodeById(target);
        if (node) {
          figma.currentPage.insertChild(0, node);
          console.log('✅ Sent to back');
        }
      }
      break;
      
    // DELETE
    case 'delete':
      if (target) {
        const node = findNodeById(target);
        if (node) {
          node.remove();
          console.log('✅ Node deleted');
        }
      }
      break;
      
    case 'delete_selection':
      figma.currentPage.selection.forEach(node => node.remove());
      console.log('✅ Selection deleted');
      break;
      
    // GROUP/UNGROUP
    case 'group':
      if (figma.currentPage.selection.length > 1) {
        const group = figma.group(figma.currentPage.selection, figma.currentPage);
        if (args.name) group.name = args.name;
        console.log('✅ Grouped');
      }
      break;
      
    case 'ungroup':
      const groups = figma.currentPage.selection.filter(node => node.type === 'GROUP');
      groups.forEach(group => figma.ungroup(group));
      console.log('✅ Ungrouped');
      break;
      
    // ZOOM
    case 'zoom_to_fit':
      figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
      console.log('✅ Zoomed to fit');
      break;
      
    case 'zoom_to_selection':
      if (figma.currentPage.selection.length > 0) {
        figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
        console.log('✅ Zoomed to selection');
      }
      break;
      
    default:
      console.log('❌ Unknown action:', op);
      figma.notify(`Unknown action: ${op}`);
  }
}

function findNodeById(id: string) {
  if (!id || typeof id !== 'string') {
    console.warn('Invalid node ID:', id);
    return null;
  }
  // Simple implementation - in a real app you'd want a more robust ID system
  return figma.currentPage.findOne(node => node.id === id);
}

function hexToRgb(hex: string) {
  if (!hex || typeof hex !== 'string') {
    console.warn('Invalid hex color:', hex);
    return { r: 0, g: 0, b: 0 };
  }
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}
