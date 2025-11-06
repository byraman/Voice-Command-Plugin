"use strict";
(() => {
  // src/plugin/code.ts
  figma.showUI(__html__, { width: 400, height: 400 });
  console.log("Voice Commands Plugin loaded");
  async function detectApiUrl() {
    try {
      const localhostUrl = "http://localhost:3000";
      console.log("Checking for localhost server...");
      const response = await fetch(`${localhostUrl}/api/health`, {
        method: "GET"
      });
      if (response.ok) {
        console.log("Localhost server detected");
        return localhostUrl;
      } else {
        console.log("Localhost server responded but not OK:", response.status);
      }
    } catch (error) {
      console.log("Localhost not available, using Vercel:", error instanceof Error ? error.message : String(error));
    }
    return globalThis.API_BASE_URL || "https://voice-command-plugin.vercel.app";
  }
  var PLUGIN_ID = `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  var API_BASE_URL = "https://voice-command-plugin.vercel.app";
  (async () => {
    API_BASE_URL = await detectApiUrl();
    console.log("Plugin initialized, using API:", API_BASE_URL);
    setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/commands`, {
          headers: {
            "X-Plugin-ID": PLUGIN_ID
          }
        });
        const data = await response.json();
        if (data.command) {
          console.log("Command received:", data.command);
          if (data.command.actions && Array.isArray(data.command.actions)) {
            console.log("Executing actions:", data.command.actions);
            executeActions(data.command.actions);
          } else {
            console.log("Processing voice command:", data.command);
            processVoiceCommand(data.command);
          }
          await fetch(`${API_BASE_URL}/api/commands`, { method: "DELETE" });
        }
      } catch (error) {
      }
    }, 1e3);
  })();
  async function processVoiceCommand(transcript) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/claude`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transcript })
      });
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Rate limit exceeded. Please wait before trying again.";
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
        console.log("OpenAI returned actions:", data.actions);
        executeActions(data.actions);
      } else {
        console.log("No actions generated from command");
        figma.notify("No actions generated from command");
      }
    } catch (error) {
      console.error("\u{1F4A5} Error processing command:", error);
      figma.notify("Error processing voice command: " + (error instanceof Error ? error.message : String(error)));
    }
  }
  function executeActions(actions) {
    actions.forEach((action, index) => {
      try {
        executeAction(action);
      } catch (error) {
        console.error("\u{1F4A5} Error executing action:", error);
      }
    });
    figma.notify(`Executed ${actions.length} actions on canvas!`);
  }
  function executeAction(action) {
    const { op, action: actionName, args = {}, target } = action;
    const command = op || actionName;
    console.log(`Executing action: ${command}`, args);
    switch (command) {
      // CREATE SHAPES
      case "create_rectangle":
        const rect = figma.createRectangle();
        rect.x = args.x || 100;
        rect.y = args.y || 100;
        rect.resize(args.width || 100, args.height || 100);
        if (args.color) rect.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.borderRadius) rect.cornerRadius = args.borderRadius;
        if (args.name) rect.name = args.name;
        appendToParent(rect, args.parentId);
        break;
      case "create_circle":
        const circle = figma.createEllipse();
        circle.x = args.x || 100;
        circle.y = args.y || 100;
        const radius = args.radius || 50;
        circle.resize(radius * 2, radius * 2);
        if (args.color) circle.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.name) circle.name = args.name;
        appendToParent(circle, args.parentId);
        break;
      case "create_ellipse":
        const ellipse = figma.createEllipse();
        ellipse.x = args.x || 100;
        ellipse.y = args.y || 100;
        ellipse.resize(args.width || 100, args.height || 100);
        if (args.color) ellipse.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.name) ellipse.name = args.name;
        appendToParent(ellipse, args.parentId);
        break;
      case "create_line":
        const line = figma.createLine();
        line.x = args.x || 100;
        line.y = args.y || 100;
        line.resize(args.width || 100, 0);
        if (args.color) line.strokes = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.strokeWeight) line.strokeWeight = args.strokeWeight;
        if (args.name) line.name = args.name;
        appendToParent(line, args.parentId);
        break;
      case "create_polygon":
        const polygon = figma.createPolygon();
        polygon.x = args.x || 100;
        polygon.y = args.y || 100;
        polygon.resize(args.width || 100, args.height || 100);
        if (args.color) polygon.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.name) polygon.name = args.name;
        appendToParent(polygon, args.parentId);
        break;
      case "create_star":
        const star = figma.createStar();
        star.x = args.x || 100;
        star.y = args.y || 100;
        star.resize(args.width || 100, args.height || 100);
        if (args.color) star.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.name) star.name = args.name;
        appendToParent(star, args.parentId);
        break;
      // TEXT
      case "create_text":
        const text = figma.createText();
        text.x = args.x || 100;
        text.y = args.y || 100;
        figma.loadFontAsync({ family: "Inter", style: "Regular" }).then(() => {
          text.characters = args.text || "Hello";
          if (args.fontSize) text.fontSize = args.fontSize;
          if (args.color) text.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
          if (args.name) text.name = args.name;
          text.textAutoResize = "WIDTH_AND_HEIGHT";
          appendToParent(text, args.parentId);
        }).catch((error) => {
          console.error("\u274C Font loading failed:", error);
          text.characters = args.text || "Hello";
          if (args.fontSize) text.fontSize = args.fontSize;
          if (args.color) text.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
          if (args.name) text.name = args.name;
          appendToParent(text, args.parentId);
        });
        break;
      // FRAMES
      case "create_frame":
        const frame = figma.createFrame();
        frame.x = args.x || 100;
        frame.y = args.y || 100;
        frame.resize(args.width || 200, args.height || 200);
        if (args.color) frame.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.borderRadius) frame.cornerRadius = args.borderRadius;
        if (args.name) frame.name = args.name;
        appendToParent(frame, args.parentId);
        break;
      // STYLING
      case "set_fill":
        if (target) {
          const node = findNodeById(target);
          if (node && "fills" in node) {
            node.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
          }
        } else {
          const selectedNodes = figma.currentPage.selection;
          if (selectedNodes.length > 0) {
            selectedNodes.forEach((node) => {
              if ("fills" in node) {
                node.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
              }
            });
          }
        }
        break;
      case "set_stroke":
        if (target) {
          const node = findNodeById(target);
          if (node && "strokes" in node) {
            node.strokes = [{ type: "SOLID", color: hexToRgb(args.color) }];
            if (args.strokeWeight) node.strokeWeight = args.strokeWeight;
          }
        } else {
          const selectedNodes = figma.currentPage.selection;
          if (selectedNodes.length > 0) {
            selectedNodes.forEach((node) => {
              if ("strokes" in node) {
                node.strokes = [{ type: "SOLID", color: hexToRgb(args.color) }];
                if (args.strokeWeight) node.strokeWeight = args.strokeWeight;
              }
            });
          }
        }
        break;
      case "set_opacity":
        if (target) {
          const node = findNodeById(target);
          if (node && "opacity" in node) {
            node.opacity = args.opacity;
          }
        } else {
          const selectedNodes = figma.currentPage.selection;
          if (selectedNodes.length > 0) {
            selectedNodes.forEach((node) => {
              if ("opacity" in node) {
                node.opacity = args.opacity;
              }
            });
          }
        }
        break;
      // TRANSFORM
      case "move":
        if (target) {
          const node = findNodeById(target);
          if (node) {
            node.x = args.x || node.x;
            node.y = args.y || node.y;
          }
        }
        break;
      case "resize":
        if (target) {
          const node = findNodeById(target);
          if (node && "resize" in node) {
            node.resize(args.width || node.width, args.height || node.height);
          }
        }
        break;
      case "rotate":
        if (target) {
          const node = findNodeById(target);
          if (node && "rotation" in node) {
            node.rotation = args.rotation || 0;
          }
        }
        break;
      // SELECTION
      case "select":
        if (target) {
          const node = findNodeById(target);
          if (node) {
            figma.currentPage.selection = [node];
            figma.viewport.scrollAndZoomIntoView([node]);
          } else {
            figma.notify("No matching layers found with the specified name.");
          }
        } else {
          const searchName2 = args.name || "";
          const allNodes2 = figma.currentPage.findAll();
          const matchingNodes2 = allNodes2.filter(
            (node) => node.name && node.name.toLowerCase().includes(searchName2.toLowerCase())
          );
          if (matchingNodes2.length === 0) {
            figma.notify("No matching layers found with the specified name.");
          } else if (matchingNodes2.length > 1) {
            figma.currentPage.selection = matchingNodes2;
            figma.viewport.scrollAndZoomIntoView(matchingNodes2);
            figma.notify(`Selected ${matchingNodes2.length} layers named '${searchName2}'.`);
          } else {
            figma.currentPage.selection = [matchingNodes2[0]];
            figma.viewport.scrollAndZoomIntoView([matchingNodes2[0]]);
          }
        }
        break;
      case "find_by_name":
        const searchName = args.name || "";
        const allNodes = figma.currentPage.findAll();
        const matchingNodes = allNodes.filter(
          (node) => node.name && node.name.toLowerCase().includes(searchName.toLowerCase())
        ).sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const search = searchName.toLowerCase();
          if (aName === search) return -1;
          if (bName === search) return 1;
          if (aName.startsWith(search) && !bName.startsWith(search)) return -1;
          if (bName.startsWith(search) && !aName.startsWith(search)) return 1;
          return aName.length - bName.length;
        });
        if (matchingNodes.length > 0) {
          const selectedNode = matchingNodes[0];
          figma.currentPage.selection = [selectedNode];
          figma.viewport.scrollAndZoomIntoView([selectedNode]);
          globalThis.lastSelectedNodeId = selectedNode.id;
          figma.notify(`Found and selected: ${selectedNode.name}`);
        } else {
          figma.notify(`No objects found matching "${searchName}"`);
        }
        break;
      case "select_last":
        const lastSelectedId = globalThis.lastSelectedNodeId;
        if (lastSelectedId) {
          const node = findNodeById(lastSelectedId);
          if (node) {
            figma.currentPage.selection = [node];
            figma.viewport.scrollAndZoomIntoView([node]);
          }
        }
        break;
      case "select_all":
        const allPageNodes = figma.currentPage.children;
        figma.currentPage.selection = allPageNodes;
        break;
      case "deselect":
        figma.currentPage.selection = [];
        break;
      case "list_objects":
        const allObjects = figma.currentPage.findAll();
        const objectNames = allObjects.map((node) => node.name).filter((name) => name);
        console.log(`Available objects (${objectNames.length}):`);
        objectNames.forEach((name, index) => {
          console.log(`  ${index + 1}. "${name}"`);
        });
        break;
      // LAYERS
      case "bring_to_front":
        if (target) {
          const node = findNodeById(target);
          if (node) {
            figma.currentPage.appendChild(node);
          }
        }
        break;
      case "send_to_back":
        if (target) {
          const node = findNodeById(target);
          if (node) {
            figma.currentPage.insertChild(0, node);
          }
        }
        break;
      // DELETE
      case "delete":
        if (target) {
          const node = findNodeById(target);
          if (node) {
            node.remove();
          }
        }
        break;
      case "delete_selection":
        figma.currentPage.selection.forEach((node) => node.remove());
        break;
      // GROUP/UNGROUP
      case "group":
        if (figma.currentPage.selection.length > 1) {
          const group = figma.group(figma.currentPage.selection, figma.currentPage);
          if (args.name) group.name = args.name;
        }
        break;
      case "ungroup":
        const groups = figma.currentPage.selection.filter((node) => node.type === "GROUP");
        groups.forEach((group) => figma.ungroup(group));
        break;
      // ZOOM
      case "zoom_to_fit":
        figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
        break;
      case "zoom_to_selection":
        if (figma.currentPage.selection.length > 0) {
          figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
        }
        break;
      default:
        console.log("Unknown action:", op);
        figma.notify(`Unknown action: ${op}`);
    }
  }
  function findNodeById(id) {
    if (!id || typeof id !== "string") {
      return null;
    }
    return figma.currentPage.findOne((node) => node.id === id);
  }
  function findNodesByName(name) {
    if (!name || typeof name !== "string") {
      return [];
    }
    const allNodes = figma.currentPage.findAll();
    return allNodes.filter(
      (node) => node.name && node.name.toLowerCase().includes(name.toLowerCase())
    );
  }
  function findParentNode(parentId) {
    if (!parentId) return null;
    const byId = findNodeById(parentId);
    if (byId) return byId;
    const byName = findNodesByName(parentId);
    return byName.length > 0 ? byName : null;
  }
  function appendToParent(node, parentId) {
    if (!parentId) {
      figma.currentPage.appendChild(node);
      return;
    }
    const parent = findParentNode(parentId);
    if (parent) {
      if (Array.isArray(parent)) {
        parent.forEach((p) => {
          if ("appendChild" in p) {
            p.appendChild(node.clone());
          } else {
            figma.currentPage.appendChild(node.clone());
          }
        });
        figma.notify(`Added element inside ${parent.length} parents named '${parentId}'.`);
      } else {
        if ("appendChild" in parent) {
          parent.appendChild(node);
        } else {
          figma.currentPage.appendChild(node);
        }
      }
    } else {
      figma.currentPage.appendChild(node);
      figma.notify("Parent not found, created at root instead.");
    }
  }
  function hexToRgb(hex) {
    if (!hex || typeof hex !== "string") {
      return { r: 0, g: 0, b: 0 };
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }
})();
