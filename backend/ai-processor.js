// AI Processor - Handles Claude API calls and converts speech to Figma commands
const Anthropic = require("@anthropic-ai/sdk");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('API Key loaded:', process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No');
console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'undefined');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function callClaude(transcript) {
  const prompt = `
You are a Figma command parser. Convert natural language design commands into JSON actions
that can be executed by the Figma Plugin API.

Available Actions:
- CREATE: create_rectangle, create_circle, create_ellipse, create_line, create_polygon, create_star, create_text, create_frame
- STYLE: set_fill, set_stroke, set_opacity
- TRANSFORM: move, resize, rotate
- SELECT: select, select_all, deselect
- LAYER: bring_to_front, send_to_back
- DELETE: delete, delete_selection
- GROUP: group, ungroup
- ZOOM: zoom_to_fit, zoom_to_selection

Schema:
{
  "actions":[
    {"op":"create_rectangle","args":{"x":int,"y":int,"width":int,"height":int,"color":"#hex","borderRadius":int,"name":"string"}},
    {"op":"create_circle","args":{"x":int,"y":int,"radius":int,"color":"#hex","name":"string"}},
    {"op":"create_ellipse","args":{"x":int,"y":int,"width":int,"height":int,"color":"#hex","name":"string"}},
    {"op":"create_line","args":{"x":int,"y":int,"width":int,"color":"#hex","strokeWeight":int,"name":"string"}},
    {"op":"create_polygon","args":{"x":int,"y":int,"width":int,"height":int,"color":"#hex","name":"string"}},
    {"op":"create_star","args":{"x":int,"y":int,"width":int,"height":int,"color":"#hex","name":"string"}},
    {"op":"create_text","args":{"x":int,"y":int,"text":"string","fontSize":int,"color":"#hex","name":"string"}},
    {"op":"create_frame","args":{"x":int,"y":int,"width":int,"height":int,"color":"#hex","borderRadius":int,"name":"string"}},
    {"op":"set_fill","target":"nodeId","args":{"color":"#hex"}},
    {"op":"set_stroke","target":"nodeId","args":{"color":"#hex","strokeWeight":int}},
    {"op":"set_opacity","target":"nodeId","args":{"opacity":float}},
    {"op":"move","target":"nodeId","args":{"x":int,"y":int}},
    {"op":"resize","target":"nodeId","args":{"width":int,"height":int}},
    {"op":"rotate","target":"nodeId","args":{"rotation":float}},
    {"op":"select","target":"nodeId"},
    {"op":"select_all"},
    {"op":"deselect"},
    {"op":"bring_to_front","target":"nodeId"},
    {"op":"send_to_back","target":"nodeId"},
    {"op":"delete","target":"nodeId"},
    {"op":"delete_selection"},
    {"op":"group","args":{"name":"string"}},
    {"op":"ungroup"},
    {"op":"zoom_to_fit"},
    {"op":"zoom_to_selection"}
  ]
}

Rules:
- Output ONLY valid JSON.
- No commentary or text outside JSON.
- Use the exact schema format above.
- For positioning, extract x,y coordinates from phrases like "at x 400 and y 1500", "at position 200,300", "at coordinates 100,200".
- If no position specified, use reasonable defaults (x:100, y:100).
- For colors, use hex format like "#FF0000" for red.
- For text, use the exact words spoken.
- For selection operations, use "select_all" or "deselect" instead of targeting specific nodes.

Now process this command:
${transcript}
`;

  try {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    // Anthropic SDK returns structured content; extract text
    const raw = response.content[0].text;
    
    // Ensure parseable JSON with error handling
    try {
      return JSON.parse(raw);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw response:', raw);
      throw new Error('Invalid JSON response from Claude');
    }
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Failed to process command with Claude: ' + error.message);
  }
}

module.exports = {
  callClaude
};
