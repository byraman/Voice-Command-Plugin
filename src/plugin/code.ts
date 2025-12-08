// code.ts - Main Figma plugin logic
figma.showUI(__html__, { width: 400, height: 450 });
console.log('Voice Commands Plugin loaded');

// Auto-detect API URL: try localhost first, fallback to Vercel
async function detectApiUrl(): Promise<string> {
  try {
    const localhostUrl = 'http://localhost:3000';
    console.log('Checking for localhost server...');
    const response = await fetch(`${localhostUrl}/api/health`, { 
      method: 'GET'
    });
    if (response.ok) {
      console.log('Localhost server detected');
      return localhostUrl;
    } else {
      console.log('Localhost server responded but not OK:', response.status);
    }
  } catch (error) {
    console.log('Localhost not available, using Vercel:', error instanceof Error ? error.message : String(error));
  }
  return (globalThis as any).API_BASE_URL || 'https://voice-command-plugin.vercel.app';
}

// Generate unique plugin ID
const PLUGIN_ID = `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// API URL will be set after detection
let API_BASE_URL = 'https://voice-command-plugin.vercel.app';

// Send messages to UI after a short delay to ensure UI is ready
setTimeout(() => {
  figma.ui.postMessage({ type: 'plugin-id', pluginId: PLUGIN_ID });
  figma.ui.postMessage({ type: 'api-url', apiUrl: API_BASE_URL });
}, 100);

// Initialize plugin with auto-detected API URL
(async () => {
  API_BASE_URL = await detectApiUrl();
  console.log('Plugin initialized, using API:', API_BASE_URL);
  
  // Send detected API URL to UI (will update if different from default)
  figma.ui.postMessage({ type: 'api-url', apiUrl: API_BASE_URL });
  
  // Poll for commands from the voice interface via server
  setInterval(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/commands`, {
        headers: {
          'X-Plugin-ID': PLUGIN_ID
        }
      });
      const data = await response.json();
      
      if (data.command) {
        console.log('Command received:', data.command);
        
        // Clear the command IMMEDIATELY to prevent re-processing
        await fetch(`${API_BASE_URL}/api/commands`, { 
          method: 'DELETE',
          headers: {
            'X-Plugin-ID': PLUGIN_ID
          }
        });
        
        // If command has actions, execute them directly
        if (data.command.actions && Array.isArray(data.command.actions)) {
          console.log('Executing actions:', data.command.actions);
          executeActions(data.command.actions);
        } else {
          // Send to OpenAI API for processing
          console.log('Processing voice command:', data.command);
          processVoiceCommand(data.command);
        }
      }
    } catch (error) {
      // Silently ignore connection errors
    }
  }, 1000);
})();

async function processVoiceCommand(transcript: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/claude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript })
    });
    
    // Handle rate limit errors
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Rate limit exceeded. Please wait before trying again.';
      figma.notify(errorMessage);
      return;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      figma.notify(errorData.error || `Server error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.actions && data.actions.length > 0) {
      console.log('OpenAI returned actions:', data.actions);
      executeActions(data.actions);
    } else {
      console.log('No actions generated from command');
      figma.notify('No actions generated from command');
    }
    
  } catch (error) {
    console.error('💥 Error processing command:', error);
    figma.notify('Error processing voice command: ' + (error instanceof Error ? error.message : String(error)));
  }
}

function executeActions(actions: any[]) {
  actions.forEach((action, index) => {
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
  const { op, action: actionName, args = {}, target } = action;
  const command = op || actionName;
  console.log(`Executing action: ${command}`, args);
  
  switch (command) {
    // CREATE SHAPES
    case 'create_rectangle':
      const rect = figma.createRectangle();
      rect.x = args.x || 100;
      rect.y = args.y || 100;
      rect.resize(args.width || 100, args.height || 100);
      if (args.color) rect.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.borderRadius) rect.cornerRadius = args.borderRadius;
      if (args.name) rect.name = args.name;
      appendToParent(rect, args.parentId);
      figma.currentPage.selection = [rect];
      figma.viewport.scrollAndZoomIntoView([rect]);
      break;
      
    case 'create_circle':
      const circle = figma.createEllipse();
      circle.x = args.x || 100;
      circle.y = args.y || 100;
      const radius = args.radius || 50;
      circle.resize(radius * 2, radius * 2);
      if (args.color) circle.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.name) circle.name = args.name;
      appendToParent(circle, args.parentId);
      figma.currentPage.selection = [circle];
      figma.viewport.scrollAndZoomIntoView([circle]);
      break;
      
    case 'create_ellipse':
      const ellipse = figma.createEllipse();
      ellipse.x = args.x || 100;
      ellipse.y = args.y || 100;
      ellipse.resize(args.width || 100, args.height || 100);
      if (args.color) ellipse.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.name) ellipse.name = args.name;
      appendToParent(ellipse, args.parentId);
      figma.currentPage.selection = [ellipse];
      figma.viewport.scrollAndZoomIntoView([ellipse]);
      break;
      
    case 'create_line':
      const line = figma.createLine();
      line.x = args.x || 100;
      line.y = args.y || 100;
      line.resize(args.width || 100, 0);
      if (args.color) line.strokes = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.strokeWeight) line.strokeWeight = args.strokeWeight;
      if (args.name) line.name = args.name;
      appendToParent(line, args.parentId);
      figma.currentPage.selection = [line];
      figma.viewport.scrollAndZoomIntoView([line]);
      break;
      
    case 'create_polygon':
      const polygon = figma.createPolygon();
      polygon.x = args.x || 100;
      polygon.y = args.y || 100;
      polygon.resize(args.width || 100, args.height || 100);
      if (args.color) polygon.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.name) polygon.name = args.name;
      appendToParent(polygon, args.parentId);
      figma.currentPage.selection = [polygon];
      figma.viewport.scrollAndZoomIntoView([polygon]);
      break;
      
    case 'create_star':
      const star = figma.createStar();
      star.x = args.x || 100;
      star.y = args.y || 100;
      star.resize(args.width || 100, args.height || 100);
      if (args.color) star.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
      if (args.name) star.name = args.name;
      appendToParent(star, args.parentId);
      figma.currentPage.selection = [star];
      figma.viewport.scrollAndZoomIntoView([star]);
      break;
      
    // TEXT
    case 'create_text':
      const text = figma.createText();
      text.x = args.x || 100;
      text.y = args.y || 100;
      
      // Load font before setting text content
      figma.loadFontAsync({ family: "Inter", style: "Regular" }).then(() => {
        text.characters = args.text || 'Hello';
        if (args.fontSize) text.fontSize = args.fontSize;
        if (args.color) text.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
        if (args.name) text.name = args.name;
        
        // Auto-resize text to fit content
        text.textAutoResize = "WIDTH_AND_HEIGHT";
        
        appendToParent(text, args.parentId);
        figma.currentPage.selection = [text];
        figma.viewport.scrollAndZoomIntoView([text]);
      }).catch((error) => {
        console.error('❌ Font loading failed:', error);
        // Fallback: still create text but it might not display properly
        text.characters = args.text || 'Hello';
        if (args.fontSize) text.fontSize = args.fontSize;
        if (args.color) text.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
        if (args.name) text.name = args.name;
        appendToParent(text, args.parentId);
        figma.currentPage.selection = [text];
        figma.viewport.scrollAndZoomIntoView([text]);
      });
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
      appendToParent(frame, args.parentId);
      figma.currentPage.selection = [frame];
      figma.viewport.scrollAndZoomIntoView([frame]);
      break;
      
    // STYLING
    case 'set_fill':
      // If target is provided, use it; otherwise use selected objects
      if (target) {
        const node = findNodeById(target);
        if (node && 'fills' in node) {
          node.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
        }
      } else {
        // Use selected objects
        const selectedNodes = figma.currentPage.selection;
        if (selectedNodes.length > 0) {
          selectedNodes.forEach(node => {
            if ('fills' in node) {
              node.fills = [{ type: 'SOLID', color: hexToRgb(args.color) }];
            }
          });
        }
      }
      break;
      
    case 'set_stroke':
      // If target is provided, use it; otherwise use selected objects
      if (target) {
        const node = findNodeById(target);
        if (node && 'strokes' in node) {
          node.strokes = [{ type: 'SOLID', color: hexToRgb(args.color) }];
          if (args.strokeWeight) node.strokeWeight = args.strokeWeight;
        }
      } else {
        // Use selected objects
        const selectedNodes = figma.currentPage.selection;
        if (selectedNodes.length > 0) {
          selectedNodes.forEach(node => {
            if ('strokes' in node) {
              node.strokes = [{ type: 'SOLID', color: hexToRgb(args.color) }];
              if (args.strokeWeight) node.strokeWeight = args.strokeWeight;
            }
          });
        }
      }
      break;
      
    case 'set_opacity':
      // If target is provided, use it; otherwise use selected objects
      if (target) {
        const node = findNodeById(target);
        if (node && 'opacity' in node) {
          node.opacity = args.opacity;
        }
      } else {
        // Use selected objects
        const selectedNodes = figma.currentPage.selection;
        if (selectedNodes.length > 0) {
          selectedNodes.forEach(node => {
            if ('opacity' in node) {
              node.opacity = args.opacity;
            }
          });
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
        }
      }
      break;
      
    case 'resize':
      if (target) {
        const node = findNodeById(target);
        if (node && 'resize' in node) {
          node.resize(args.width || node.width, args.height || node.height);
        }
      }
      break;
      
    case 'rotate':
      if (target) {
        const node = findNodeById(target);
        if (node && 'rotation' in node) {
          node.rotation = args.rotation || 0;
        }
      }
      break;
      
    // SELECTION
    case 'select': {
      // Try to find by ID first if target is provided
      if (target) {
        const nodeById = findNodeById(target);
        if (nodeById) {
          figma.currentPage.selection = [nodeById];
          figma.viewport.scrollAndZoomIntoView([nodeById]);
          break;
        }
        // If target is not a valid ID, treat it as a name
      }
      
      // Search by name (from args.name or target if it wasn't a valid ID)
      const selectSearchName = args.name || (target && typeof target === 'string' ? target : '');
      
      if (!selectSearchName) {
        figma.notify("No layer name specified for selection.");
        break;
      }
      
      const selectAllNodes = figma.currentPage.findAll();
      const searchLower = selectSearchName.toLowerCase();
      
      // First try exact match (case-insensitive)
      const exactMatches = selectAllNodes.filter(node => 
        node.name && node.name.toLowerCase() === searchLower
      );
      
      // Use exact matches if found, otherwise fall back to partial matches
      const selectMatchingNodes = exactMatches.length > 0 
        ? exactMatches
        : selectAllNodes.filter(node => 
            node.name && node.name.toLowerCase().includes(searchLower)
          );
      
      if (selectMatchingNodes.length === 0) {
        figma.notify(`No matching layers found with name "${selectSearchName}".`);
      } else if (selectMatchingNodes.length > 1) {
        // Multiple matches - select all and show notification
        figma.currentPage.selection = selectMatchingNodes;
        figma.viewport.scrollAndZoomIntoView(selectMatchingNodes);
        figma.notify(`Selected ${selectMatchingNodes.length} layers named '${selectSearchName}'.`);
      } else {
        // Single match
        figma.currentPage.selection = [selectMatchingNodes[0]];
        figma.viewport.scrollAndZoomIntoView([selectMatchingNodes[0]]);
      }
      break;
    }
      
    case 'find_by_name': {
      const findSearchName = args.name || '';
      const findAllNodes = figma.currentPage.findAll();
      
      // Better fuzzy matching - prioritize exact matches, then partial matches
      const findMatchingNodes = findAllNodes.filter(node => 
        node.name && node.name.toLowerCase().includes(findSearchName.toLowerCase())
      ).sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const search = findSearchName.toLowerCase();
        
        // Exact match first
        if (aName === search) return -1;
        if (bName === search) return 1;
        
        // Starts with search term
        if (aName.startsWith(search) && !bName.startsWith(search)) return -1;
        if (bName.startsWith(search) && !aName.startsWith(search)) return 1;
        
        // Shorter names first (more specific)
        return aName.length - bName.length;
      });
      
      if (findMatchingNodes.length > 0) {
        // Select the first (best) match
        const selectedNode = findMatchingNodes[0];
        figma.currentPage.selection = [selectedNode];
        figma.viewport.scrollAndZoomIntoView([selectedNode]);
        
        // Store the selected node ID for future operations
        (globalThis as any).lastSelectedNodeId = selectedNode.id;
        
        // Show notification
        figma.notify(`Found and selected: ${selectedNode.name}`);
      } else {
        figma.notify(`No objects found matching "${findSearchName}"`);
      }
      break;
    }
      
    case 'select_last':
      const lastSelectedId = (globalThis as any).lastSelectedNodeId;
      if (lastSelectedId) {
        const node = findNodeById(lastSelectedId);
        if (node) {
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);
        }
      }
      break;
      
    case 'select_all':
      const allPageNodes = figma.currentPage.children;
      figma.currentPage.selection = allPageNodes;
      break;
      
    case 'deselect':
      figma.currentPage.selection = [];
      break;
      
    case 'list_objects':
      const allObjects = figma.currentPage.findAll();
      const objectNames = allObjects.map(node => node.name).filter(name => name);
      console.log(`Available objects (${objectNames.length}):`);
      objectNames.forEach((name, index) => {
        console.log(`  ${index + 1}. "${name}"`);
      });
      break;
      
    // LAYERS
    case 'bring_to_front':
      if (target) {
        const node = findNodeById(target);
        if (node) {
          figma.currentPage.appendChild(node);
        }
      }
      break;
      
    case 'send_to_back':
      if (target) {
        const node = findNodeById(target);
        if (node) {
          figma.currentPage.insertChild(0, node);
        }
      }
      break;
      
    // DELETE
    case 'delete':
      if (target) {
        const node = findNodeById(target);
        if (node) {
          node.remove();
        }
      }
      break;
      
    case 'delete_selection':
      figma.currentPage.selection.forEach(node => node.remove());
      break;
      
    // GROUP/UNGROUP
    case 'group':
      if (figma.currentPage.selection.length > 1) {
        const group = figma.group(figma.currentPage.selection, figma.currentPage);
        if (args.name) group.name = args.name;
      }
      break;
      
    case 'ungroup':
      const groups = figma.currentPage.selection.filter(node => node.type === 'GROUP');
      groups.forEach(group => figma.ungroup(group));
      break;
      
    // ZOOM
    case 'zoom_to_fit':
      figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
      break;
      
    case 'zoom_to_selection':
      if (figma.currentPage.selection.length > 0) {
        figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
      }
      break;
      
    default:
      console.log('Unknown action:', op);
      figma.notify(`Unknown action: ${op}`);
  }
}

function findNodeById(id: string) {
  if (!id || typeof id !== 'string') {
    return null;
  }
  // Simple implementation - in a real app you'd want a more robust ID system
  return figma.currentPage.findOne(node => node.id === id);
}

function findNodesByName(name: string) {
  if (!name || typeof name !== 'string') {
    return [];
  }
  const allNodes = figma.currentPage.findAll();
  return allNodes.filter(node => 
    node.name && node.name.toLowerCase().includes(name.toLowerCase())
  );
}

function findParentNode(parentId: string) {
  if (!parentId) return null;
  
  // First try by ID
  const byId = findNodeById(parentId);
  if (byId) return byId;
  
  // Then try by name (for multiple matches)
  const byName = findNodesByName(parentId);
  return byName.length > 0 ? byName : null;
}

function appendToParent(node: any, parentId: string | undefined) {
  if (!parentId) {
    figma.currentPage.appendChild(node);
    return;
  }
  
  const parent = findParentNode(parentId);
  if (parent) {
    if (Array.isArray(parent)) {
      // Multiple parents with same name - use first match only
      const firstParent = parent[0];
      if ('appendChild' in firstParent) {
        firstParent.appendChild(node);
      } else {
        figma.currentPage.appendChild(node);
      }
    } else {
      // Single parent
      if ('appendChild' in parent) {
        parent.appendChild(node);
      } else {
        figma.currentPage.appendChild(node);
      }
    }
  } else {
    // Parent not found, create at root
    figma.currentPage.appendChild(node);
    figma.notify("Parent not found, created at root instead.");
  }
}

function hexToRgb(hex: string) {
  if (!hex || typeof hex !== 'string') {
    return { r: 0, g: 0, b: 0 };
  }
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}
