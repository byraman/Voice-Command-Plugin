# Voice Commands for Figma

A Figma plugin that enables hands-free designing through voice commands. Converts speech to text, processes commands with AI, and executes actions directly on the Figma canvas.

## Overview

Voice-controlled design workflow for Figma. Speak design commands naturally, and the plugin translates them into Figma API actions. Maintains designer control while reducing mouse and keyboard dependency.

## Features

- Voice recognition via Web Speech API
- AI-powered command translation
- Direct Figma canvas execution
- Real-time command processing
- Natural language command support

## Installation

### Development Setup

```bash
git clone https://github.com/byraman/Voice-Command-Plugin.git
cd Voice-Command-Plugin
npm install
npm run plugin:build
```

### Figma Plugin Installation

1. Open Figma Desktop App
2. Plugins → Development → Import plugin from manifest
3. Select `src/plugin/manifest.json`
4. Plugin appears in plugins list

## Usage

1. Open the plugin in Figma
2. Open the voice interface URL in Chrome browser
3. Click microphone button to start listening
4. Speak design commands (e.g., "create a rectangle", "create a light grey auto-layout frame in 16:9 ratio")
5. Commands execute automatically on the canvas

## Example Commands

- Shape creation: "Add a cyan circle at X 400 and Y -3150", "Create a rectangle with rounded corners"
- Text operations: "Make this text bold", "Increase font size to 24px"
- Layout: "Center this element", "Distribute these items evenly"
- Styling: "Change background to #FF5733", "Add a drop shadow"
- Organization: "Group these elements", "Bring to front"

## Architecture

1. Voice input captured via browser Web Speech API
2. Transcript sent to server endpoint
3. OpenAI processes natural language into structured actions
4. Plugin polls server for commands
5. Actions executed on Figma canvas via Plugin API

## Development

### Prerequisites

- Node.js 16+
- Figma Desktop App
- OpenAI API key

### Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env` file with `OPENAI_API_KEY`
4. Start local server: `npm run dev`
5. Build plugin: `npm run plugin:build`
6. Import plugin into Figma

### Project Structure

```
├── backend/
│   ├── server.js          # Express server
│   └── ai-processor.js    # OpenAI integration
├── src/
│   ├── plugin/            # Figma plugin files
│   │   ├── code.ts        # Main plugin logic
│   │   ├── ui.html        # Plugin UI
│   │   └── manifest.json  # Plugin manifest
│   └── frontend/
│       └── voice-interface.html  # Voice input web interface
├── vercel.json            # Vercel deployment config
└── package.json
```

### Scripts

- `npm run dev` - Start local development server
- `npm run plugin:build` - Build TypeScript plugin code
- `npm run plugin:dev` - Build plugin with watch mode

## Deployment

Deployed on Vercel. Push to GitHub for automatic deployment.

1. Set environment variables in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_API_URL` (optional)

2. Plugin auto-detects localhost in development, uses Vercel URL in production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

File issues on the [GitHub repository](https://github.com/byraman/Voice-Command-Plugin/issues).
