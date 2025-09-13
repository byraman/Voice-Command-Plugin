"use strict";
(() => {
  // src/plugin/code.ts
  figma.showUI(__html__, { width: 600, height: 300 });
  console.log("\u{1F3A4} Voice Commands Plugin loaded!");
  figma.ui.onmessage = (msg) => {
    console.log("\u{1F4E8} Message received from UI:", msg);
    if (msg.type === "voice-command") {
      console.log("\u{1F3AF} Processing voice command:", msg.command);
      processVoiceCommand(msg.command);
    }
  };
  setInterval(async () => {
    try {
      const response = await fetch("http://localhost:3000/api/commands");
      const data = await response.json();
      if (data.command) {
        console.log("\u{1F3A4} Voice command received from server:", data.command);
        processVoiceCommand(data.command);
        await fetch("http://localhost:3000/api/commands", { method: "DELETE" });
      }
    } catch (error) {
    }
  }, 1e3);
  async function processVoiceCommand(transcript) {
    try {
      console.log("\u{1F680} Sending to Claude API:", transcript);
      const response = await fetch("http://localhost:3000/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transcript })
      });
      const data = await response.json();
      console.log("\u{1F916} Claude response:", data);
      if (data.actions && data.actions.length > 0) {
        console.log("\u2705 Executing actions:", data.actions);
        executeActions(data.actions);
      } else {
        console.log("\u274C No actions in response");
        figma.notify("No actions generated from command");
      }
    } catch (error) {
      console.error("\u{1F4A5} Error processing command:", error);
      figma.notify("Error processing voice command: " + (error instanceof Error ? error.message : String(error)));
    }
  }
  function executeActions(actions) {
    console.log("\u{1F3A8} Executing actions on canvas:", actions);
    actions.forEach((action, index) => {
      console.log(`Action ${index + 1}:`, action);
      try {
        executeAction(action);
      } catch (error) {
        console.error("\u{1F4A5} Error executing action:", error);
      }
    });
    figma.notify(`Executed ${actions.length} actions on canvas!`);
  }
  function executeAction(action) {
    const { op, args = {}, target } = action;
    switch (op) {
      // CREATE SHAPES
      case "create_rectangle":
        const rect = figma.createRectangle();
        rect.x = args.x || 100;
        rect.y = args.y || 100;
        rect.resize(args.width || 100, args.height || 100);
        if (args.color) rect.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.borderRadius) rect.cornerRadius = args.borderRadius;
        if (args.name) rect.name = args.name;
        figma.currentPage.appendChild(rect);
        console.log("\u2705 Rectangle created");
        break;
      case "create_circle":
        const circle = figma.createEllipse();
        circle.x = args.x || 100;
        circle.y = args.y || 100;
        const radius = args.radius || 50;
        circle.resize(radius * 2, radius * 2);
        if (args.color) circle.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.name) circle.name = args.name;
        figma.currentPage.appendChild(circle);
        console.log("\u2705 Circle created");
        break;
      case "create_ellipse":
        const ellipse = figma.createEllipse();
        ellipse.x = args.x || 100;
        ellipse.y = args.y || 100;
        ellipse.resize(args.width || 100, args.height || 100);
        if (args.color) ellipse.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.name) ellipse.name = args.name;
        figma.currentPage.appendChild(ellipse);
        console.log("\u2705 Ellipse created");
        break;
      case "create_line":
        const line = figma.createLine();
        line.x = args.x || 100;
        line.y = args.y || 100;
        line.resize(args.width || 100, 0);
        if (args.color) line.strokes = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.strokeWeight) line.strokeWeight = args.strokeWeight;
        if (args.name) line.name = args.name;
        figma.currentPage.appendChild(line);
        console.log("\u2705 Line created");
        break;
      case "create_polygon":
        const polygon = figma.createPolygon();
        polygon.x = args.x || 100;
        polygon.y = args.y || 100;
        polygon.resize(args.width || 100, args.height || 100);
        if (args.color) polygon.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.name) polygon.name = args.name;
        figma.currentPage.appendChild(polygon);
        console.log("\u2705 Polygon created");
        break;
      case "create_star":
        const star = figma.createStar();
        star.x = args.x || 100;
        star.y = args.y || 100;
        star.resize(args.width || 100, args.height || 100);
        if (args.color) star.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.name) star.name = args.name;
        figma.currentPage.appendChild(star);
        console.log("\u2705 Star created");
        break;
      // TEXT
      case "create_text":
        const text = figma.createText();
        text.x = args.x || 100;
        text.y = args.y || 100;
        text.characters = args.text || "Hello";
        if (args.fontSize) text.fontSize = args.fontSize;
        if (args.color) text.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
        if (args.name) text.name = args.name;
        figma.currentPage.appendChild(text);
        console.log("\u2705 Text created");
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
        figma.currentPage.appendChild(frame);
        console.log("\u2705 Frame created");
        break;
      // STYLING
      case "set_fill":
        if (target) {
          const node = findNodeById(target);
          if (node && "fills" in node) {
            node.fills = [{ type: "SOLID", color: hexToRgb(args.color) }];
            console.log("\u2705 Fill set");
          }
        }
        break;
      case "set_stroke":
        if (target) {
          const node = findNodeById(target);
          if (node && "strokes" in node) {
            node.strokes = [{ type: "SOLID", color: hexToRgb(args.color) }];
            if (args.strokeWeight) node.strokeWeight = args.strokeWeight;
            console.log("\u2705 Stroke set");
          }
        }
        break;
      case "set_opacity":
        if (target) {
          const node = findNodeById(target);
          if (node && "opacity" in node) {
            node.opacity = args.opacity;
            console.log("\u2705 Opacity set");
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
            console.log("\u2705 Node moved");
          }
        }
        break;
      case "resize":
        if (target) {
          const node = findNodeById(target);
          if (node && "resize" in node) {
            node.resize(args.width || node.width, args.height || node.height);
            console.log("\u2705 Node resized");
          }
        }
        break;
      case "rotate":
        if (target) {
          const node = findNodeById(target);
          if (node && "rotation" in node) {
            node.rotation = args.rotation || 0;
            console.log("\u2705 Node rotated");
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
            console.log("\u2705 Node selected");
          }
        }
        break;
      case "select_all":
        const allNodes = figma.currentPage.children;
        figma.currentPage.selection = allNodes;
        console.log("\u2705 All nodes selected");
        break;
      case "deselect":
        figma.currentPage.selection = [];
        console.log("\u2705 Selection cleared");
        break;
      // LAYERS
      case "bring_to_front":
        if (target) {
          const node = findNodeById(target);
          if (node) {
            figma.currentPage.appendChild(node);
            console.log("\u2705 Brought to front");
          }
        }
        break;
      case "send_to_back":
        if (target) {
          const node = findNodeById(target);
          if (node) {
            figma.currentPage.insertChild(0, node);
            console.log("\u2705 Sent to back");
          }
        }
        break;
      // DELETE
      case "delete":
        if (target) {
          const node = findNodeById(target);
          if (node) {
            node.remove();
            console.log("\u2705 Node deleted");
          }
        }
        break;
      case "delete_selection":
        figma.currentPage.selection.forEach((node) => node.remove());
        console.log("\u2705 Selection deleted");
        break;
      // GROUP/UNGROUP
      case "group":
        if (figma.currentPage.selection.length > 1) {
          const group = figma.group(figma.currentPage.selection, figma.currentPage);
          if (args.name) group.name = args.name;
          console.log("\u2705 Grouped");
        }
        break;
      case "ungroup":
        const groups = figma.currentPage.selection.filter((node) => node.type === "GROUP");
        groups.forEach((group) => figma.ungroup(group));
        console.log("\u2705 Ungrouped");
        break;
      // ZOOM
      case "zoom_to_fit":
        figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
        console.log("\u2705 Zoomed to fit");
        break;
      case "zoom_to_selection":
        if (figma.currentPage.selection.length > 0) {
          figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
          console.log("\u2705 Zoomed to selection");
        }
        break;
      default:
        console.log("\u274C Unknown action:", op);
        figma.notify(`Unknown action: ${op}`);
    }
  }
  function findNodeById(id) {
    if (!id || typeof id !== "string") {
      console.warn("Invalid node ID:", id);
      return null;
    }
    return figma.currentPage.findOne((node) => node.id === id);
  }
  function hexToRgb(hex) {
    if (!hex || typeof hex !== "string") {
      console.warn("Invalid hex color:", hex);
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
