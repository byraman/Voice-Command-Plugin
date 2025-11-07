# Voice Commands for Figma

A Figma plugin that enables **hands-free designing** through voice commands. Convert your speech to text, let AI understand your design intent, and execute tasks directly on the Figma canvas.

## 🎯 What Makes This Different

Unlike AI design tools that make decisions for you, this plugin **keeps you in control**. You're still the designer - the AI simply helps translate your voice commands into Figma actions. Perfect for those times when you want to design without constantly reaching for the mouse and keyboard.

## ✨ Features

- 🎤 **Voice Recognition** - Speak your design commands naturally
- 🤖 **AI Translation** - LLM converts speech to Figma API calls
- 🎨 **Canvas Integration** - Direct execution on Figma canvas
- 🚀 **Hands-Free Design** - Design without touching mouse/keyboard
- ⚡ **Real-time Processing** - Instant command execution
- 🎯 **Natural Language** - Use everyday language for design tasks

## 🚀 Installation

### For Development

```bash
# Clone the repository
git clone https://github.com/byraman/Voice-Command-Plugin.git

# Navigate to the project directory
cd Voice-Command-Plugin

# Install dependencies
npm install

# Build the plugin
npm run build
```

### For Figma

1. Open Figma Desktop App
2. Go to Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` file from this project
4. The plugin will appear in your plugins list

## 🎤 Usage

1. **Open the Plugin** - Find "Voice Commands for Figma" in your plugins
2. **Start Listening** - Click the microphone button to begin
3. **Speak Naturally** - Use commands like:
   - "Create a rectangle here"
   - "Make this text bigger"
   - "Align these elements to the left"
   - "Change the color to blue"
   - "Add some padding around this"

## 🛠️ How It Works

1. **Voice Input** → Your speech is captured via Web Speech API
2. **Text Conversion** → Speech is converted to text
3. **AI Processing** → LLM understands your design intent
4. **Figma API** → Commands are translated to Figma API calls
5. **Canvas Execution** → Actions are performed on your design

## 🎨 Example Commands

- **Shape Creation**: "Add a circle", "Create a rectangle with rounded corners"
- **Text Operations**: "Make this text bold", "Increase font size to 24px"
- **Layout**: "Center this element", "Distribute these items evenly"
- **Styling**: "Change background to #FF5733", "Add a drop shadow"
- **Organization**: "Group these elements", "Bring to front"

## 🔧 Development

### Prerequisites

- Node.js 16+
- Figma Desktop App
- OpenAI API key (for OpenAI LLM processing)

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your OpenAI API key in the plugin configuration
4. Build the plugin: `npm run build`
5. Import the plugin into Figma

### Project Structure

```
├── code.js          # Main plugin logic
├── ui.html          # Plugin UI interface
├── manifest.json    # Figma plugin manifest
├── package.json     # Dependencies and scripts
└── README.md        # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.

## 🗺️ Roadmap

- [ ] **Core Voice Commands** - Basic shape creation and manipulation
- [ ] **Advanced Commands** - Complex layout and styling operations
- [ ] **Context Awareness** - Better understanding of selected elements
- [ ] **Custom Commands** - User-defined voice shortcuts
- [ ] **Multi-language Support** - Voice recognition in different languages
- [ ] **Command History** - Undo/redo voice commands
- [ ] **Batch Operations** - Multiple commands in sequence
- [ ] **Accessibility Features** - Enhanced support for users with disabilities

## 💡 Use Cases

- **Accessibility** - Design for users with mobility limitations
- **Multitasking** - Design while taking notes or referencing materials
- **Ergonomics** - Reduce repetitive mouse/keyboard use
- **Speed** - Quick design iterations through voice
- **Hands-free** - Design while standing or in different positions

---

Made with ❤️ for hands-free design workflows
