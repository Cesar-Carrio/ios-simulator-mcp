# iOS Simulator MCP for Cursor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Pre-Release](https://img.shields.io/badge/Status-Pre--Release-orange.svg)]()

> Enable Cursor's AI to "see" your iOS simulator and provide visual feedback on your React Native app.

> **Note:** This package is currently in development and not yet published to npm.

## ✨ Features

- 📸 **Automatic Screenshot Capture** - Captures screenshots when UI files change
- 🎯 **Manual Capture** - Ask AI to capture screenshots on-demand
- 👁️ **AI Vision Analysis** - AI analyzes layouts, colors, spacing, and alignment
- 🔍 **Smart Detection** - Intelligently detects UI-related file changes
- 📚 **Screenshot History** - Maintains history of recent screenshots
- 🎨 **React Native Optimized** - Built specifically for React Native development

## 🚀 Quick Start

### Installation

**Current Method (Development):**

```bash
# From the project root
./install-mcp.sh
```

### Configuration

Add to your Cursor settings:

**Settings Path:** `Cursor → Settings (⌘,) → Features → Model Context Protocol`

**Current Configuration:**
```json
{
  "mcpServers": {
    "ios-simulator": {
      "command": "node",
      "args": ["/absolute/path/to/emCap/mcp-server/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/emCap` with your actual installation path.

---

### Future: npm Installation (Coming Soon)

Once published, installation will be much simpler:

```bash
# Using npx (no installation needed)
npx @emcap/ios-simulator-mcp

# Or install globally
npm install -g @emcap/ios-simulator-mcp
```

And configuration:
```json
{
  "mcpServers": {
    "ios-simulator": {
      "command": "npx",
      "args": ["-y", "@emcap/ios-simulator-mcp"]
    }
  }
}
```

### Usage

1. **Start your iOS simulator:**
   ```bash
   npm run ios
   ```

2. **Ask Cursor's AI:**
   ```
   "Can you capture a screenshot of the simulator?"
   "Show me the latest screenshot"
   "Analyze the current UI layout"
   ```

3. **Make UI changes** and screenshots are captured automatically! ✨

## 📋 Requirements

- macOS (required for iOS Simulator)
- Xcode and iOS Simulator
- Node.js 18+
- Cursor Editor

## 🎯 What Can You Do?

### Visual Feedback
Ask AI to review your UI changes:
```
"I just updated the login screen. Can you capture a screenshot and give feedback?"
```

### Bug Detection
Verify visual bugs are fixed:
```
"I fixed the button alignment. Take a screenshot and verify it looks correct."
```

### Design Comparison
Compare with design specs:
```
"Here's the design mockup. Take a screenshot and tell me what doesn't match."
```

### Layout Analysis
Get AI insights on layout:
```
"Analyze the spacing and alignment in the current screen."
```

## 📖 Available MCP Resources

- `simulator://latest-screenshot` - Most recent screenshot
- `simulator://screenshot-history` - JSON list of all screenshots
- `simulator://screenshot/{timestamp}` - Specific screenshot by timestamp

## 🛠️ Available MCP Tools

- `capture_simulator_screenshot` - Manually capture a screenshot
- `get_simulator_status` - Check if simulator is running
- `toggle_auto_capture` - Enable/disable automatic capture
- `get_watcher_status` - Get file watcher status

## 🔧 CLI Commands

> **Note:** These commands will be available after npm publishing. For now, use the MCP tools via Cursor's AI.

```bash
# Show help
ios-simulator-mcp --help

# Show version
ios-simulator-mcp --version

# Show Cursor configuration
ios-simulator-mcp --config

# Check simulator status
ios-simulator-mcp --check
```

**Current Alternative:** 
Ask Cursor's AI to check status: `"Is the iOS simulator running?"`

## 🏗️ How It Works

```
Edit UI file → File Watcher detects → 2s debounce → 
Screenshot captured → Exposed to AI → AI provides feedback
```

The MCP server:
1. Watches your React Native files for UI changes
2. Automatically captures screenshots using `xcrun simctl`
3. Exposes screenshots to Cursor's AI via MCP protocol
4. AI can analyze and provide visual feedback

## ⚙️ Configuration

Screenshots are automatically captured when UI-related files change. You can:

- **Enable/disable auto-capture**: Ask AI to "disable auto-capture"
- **Manual capture**: Ask AI to "capture a screenshot"
- **View history**: Ask AI to "show screenshot history"

## 📸 Screenshot Storage

Screenshots are stored in `.emcap-screenshots/` directory (automatically git-ignored). The server keeps the 50 most recent screenshots.

## 🐛 Troubleshooting

### "No booted iOS simulator found"

**Solution:** Make sure your iOS simulator is running:
```bash
npm run ios
```

### Screenshots not being captured automatically

**Check:**
1. Auto-capture is enabled (ask AI: "Is auto-capture enabled?")
2. Simulator is running (ask AI: "Is the iOS simulator running?")
3. You're editing UI files (.tsx, .jsx in components/screens directories)
4. File watcher is running (ask AI: "What's the watcher status?")

### MCP server not connecting

**Solution:**
1. Verify the server is built: Check that `mcp-server/dist/index.js` exists
2. Verify the absolute path in Cursor's MCP configuration is correct
3. Check Node.js version: `node --version` (requires 18+)
4. Restart Cursor after configuration changes
5. Check Cursor's MCP logs for errors (View → Output → select "ios-simulator")

## 📚 Documentation

- [Complete Documentation](https://github.com/emcap/ios-simulator-mcp)
- [Quick Start Guide](https://github.com/emcap/ios-simulator-mcp/blob/main/docs/QUICKSTART.md)
- [Usage Examples](https://github.com/emcap/ios-simulator-mcp/blob/main/docs/EXAMPLES.md)
- [Architecture Guide](https://github.com/emcap/ios-simulator-mcp/blob/main/docs/ARCHITECTURE.md)
- [Publishing Guide](https://github.com/emcap/ios-simulator-mcp/blob/main/docs/PUBLISHING.md) (for maintainers)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © emCap

## 🌟 Show Your Support

If this tool helps your development workflow, please consider:
- ⭐ Starring the repository
- 🐦 Sharing on Twitter
- 📝 Writing a blog post about your experience

## 🔗 Links

- [GitHub Repository](https://github.com/emcap/ios-simulator-mcp)
- [npm Package](https://www.npmjs.com/package/@emcap/ios-simulator-mcp)
- [Report Issues](https://github.com/emcap/ios-simulator-mcp/issues)
- [Model Context Protocol](https://modelcontextprotocol.io)

---

**Made with ❤️ for React Native developers using Cursor**

