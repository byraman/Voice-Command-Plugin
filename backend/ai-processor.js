// AI Processor - Handles OpenAI API calls and converts speech to Figma commands
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callOpenAI(transcript) {
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
    {"op":"create_rectangle","args":{"x":int,"y":int,"width":int,"height":int,"color":"#hex","borderRadius":int,"name":"string","parentId":"nodeId"}},
    {"op":"create_circle","args":{"x":int,"y":int,"radius":int,"color":"#hex","name":"string","parentId":"nodeId"}},
    {"op":"create_ellipse","args":{"x":int,"y":int,"width":int,"height":int,"color":"#hex","name":"string","parentId":"nodeId"}},
    {"op":"create_line","args":{"x":int,"y":int,"width":int,"color":"#hex","strokeWeight":int,"name":"string","parentId":"nodeId"}},
    {"op":"create_polygon","args":{"x":int,"y":int,"width":int,"height":int,"color":"#hex","name":"string","parentId":"nodeId"}},
    {"op":"create_star","args":{"x":int,"y":int,"width":int,"height":int,"color":"#hex","name":"string","parentId":"nodeId"}},
    {"op":"create_text","args":{"x":int,"y":int,"text":"string","fontSize":int,"color":"#hex","name":"string","parentId":"nodeId"}},
    {"op":"create_frame","args":{"x":int,"y":int,"width":int,"height":int,"color":"#hex","borderRadius":int,"name":"string","parentId":"nodeId"}},
    {"op":"set_fill","target":"nodeId","args":{"color":"#hex"}},
    {"op":"set_stroke","target":"nodeId","args":{"color":"#hex","strokeWeight":int}},
    {"op":"set_opacity","target":"nodeId","args":{"opacity":float}},
    {"op":"move","target":"nodeId","args":{"x":int,"y":int}},
    {"op":"resize","target":"nodeId","args":{"width":int,"height":int}},
    {"op":"rotate","target":"nodeId","args":{"rotation":float}},
    {"op":"select","target":"nodeId"},
    {"op":"select","args":{"name":"string"}},
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
- For colors, use hex formats (and for example "#FF0000" for vague commands like "Color it red").
- For text, use the exact words spoken.
- For selection: 
  - Use "select" with "args":{"name":"layer name"} when selecting by layer name (e.g., "select app icon" → {"op":"select","args":{"name":"app icon"}}).
  - Use "select" with "target":"nodeId" only when you have a specific node ID.
  - If multiple nodes match the name, select all of them. 
  - If no nodes match, return "select" with args.name and the frontend will notify "no matching layers".
  - Use "select_all" only when the user explicitly says "select all".
- Allow "parentId" on all CREATE operations to place new nodes inside the specified parent. 
  - If multiple parent nodes match the name, add inside the most matching name. 
  - If no parent matches, create at the root.


Now process this command:
${transcript}
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    // OpenAI SDK returns structured content; extract text
    const raw = response.choices[0].message.content;
    
    // Ensure parseable JSON with error handling
    try {
      return JSON.parse(raw);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw response:', raw);
      throw new Error('Invalid JSON response from OpenAI');
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to process command with OpenAI: ' + error.message);
  }
}

module.exports = {
  callOpenAI
};
