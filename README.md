# iOS Simulator MCP Extension for Cursor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Pre-Release](https://img.shields.io/badge/Status-Pre--Release-orange.svg)]()

> **Note:** This package is currently in development and not yet published to npm. See installation instructions below.

An MCP (Model Context Protocol) server that enables Cursor's AI to "see" your iOS simulator. This extension automatically captures screenshots when you make UI changes to your React Native app and exposes them to Cursor's AI for visual analysis and feedback.

## 🚀 Quick Start

### Installation

**Current Installation Method (Development):**

1. Clone this repository:
```bash
git clone https://github.com/emcap/ios-simulator-mcp.git
cd ios-simulator-mcp
```

2. Install and build:
```bash
./install-mcp.sh
```

This will install dependencies and build the MCP server.

### Configuration

Add to your Cursor settings:

**Path:** `Cursor → Settings (⌘,) → Features → Model Context Protocol`

**Configuration:**
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

> **Important:** Replace `/absolute/path/to/emCap` with the actual absolute path where you cloned this repository.

---

### Future: npm Installation (Coming Soon)

Once published to npm, you'll be able to install via:

```bash
# Using npx (no installation needed)
npx @emcap/ios-simulator-mcp

# Or install globally
npm install -g @emcap/ios-simulator-mcp
```

And use simpler configuration:
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

1. Restart Cursor after adding the configuration
2. Start your iOS simulator: `npm run ios`
3. Ask Cursor's AI:
   ```
   "Can you capture a screenshot of the simulator?"
   "Show me the latest screenshot"
   "Analyze the current UI layout"
   ```

That's it! 🎉

## ✨ Features

- 📸 **Automatic Screenshot Capture**: Automatically takes screenshots when UI-related files change
- 🎯 **Manual Capture**: On-demand screenshot capture via AI commands
- 👁️ **AI Vision**: Exposes screenshots to Cursor's AI for visual feedback and analysis
- 🔍 **Smart Detection**: Intelligently detects UI-related file changes
- 📚 **Screenshot History**: Maintains a history of recent screenshots
- 🎨 **React Native Optimized**: Designed specifically for React Native development

## 📋 Requirements

- macOS (required for iOS Simulator)
- Xcode and iOS Simulator installed
- Node.js 18+ and npm
- Cursor Editor
- A React Native project

## 📖 Documentation

- [Quick Start Guide](docs/QUICKSTART.md)
- [Usage Examples](docs/EXAMPLES.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Publishing Guide](docs/PUBLISHING.md) (for maintainers - package not yet published)

## 🛠️ Development & Contributing

If you want to contribute or make local modifications:

1. Edit source files in `mcp-server/src/`
2. Rebuild: `npm run build-mcp` (from project root) or `npm run build` (from mcp-server directory)
3. Restart Cursor to reload the MCP server

The MCP server will use your local changes after rebuilding.

## Usage

### Starting the iOS Simulator

Before using the extension, make sure your iOS simulator is running:

```bash
# Open your React Native app
npm run ios
# or
yarn ios
```

### Automatic Screenshot Capture

The extension automatically watches for changes to UI-related files:

- `.tsx`, `.jsx`, `.ts`, `.js` files in UI directories (components, screens, views, pages, app, src)
- Files containing React Native UI components

When you save a UI file, the extension:
1. Waits 2 seconds for additional changes (debouncing)
2. Captures a screenshot from the booted simulator
3. Makes it available to Cursor's AI

### Manual Screenshot Capture

You can ask Cursor's AI to capture screenshots manually:

```
"Can you capture a screenshot of the iOS simulator?"
"Take a screenshot and tell me if the login button looks correct"
"Show me what the app looks like right now"
```

The AI will use the `capture_simulator_screenshot` tool to take a screenshot.

### Viewing Screenshots

Ask the AI to view screenshots:

```
"Show me the latest screenshot"
"What does the simulator look like?"
"Can you analyze the current UI?"
```

The AI will access the `simulator://latest-screenshot` resource.

### Checking Simulator Status

```
"Is the iOS simulator running?"
"Show me available simulators"
```

The AI will use the `get_simulator_status` tool.

### Toggling Auto-Capture

```
"Disable automatic screenshot capture"
"Enable auto-capture for screenshots"
```

The AI will use the `toggle_auto_capture` tool.

## How It Works

### Architecture

```
┌─────────────────┐
│  React Native   │
│   Source Files  │
└────────┬────────┘
         │
         │ File Changes
         ↓
┌─────────────────┐
│  File Watcher   │
│   (Chokidar)    │
└────────┬────────┘
         │
         │ UI Change Detected
         ↓
┌─────────────────┐       ┌──────────────┐
│   Simulator     │◄──────│  xcrun       │
│   Manager       │       │  simctl      │
└────────┬────────┘       └──────────────┘
         │
         │ Screenshot Captured
         ↓
┌─────────────────┐
│  MCP Resources  │
│  & Tools        │
└────────┬────────┘
         │
         │ Stdio Protocol
         ↓
┌─────────────────┐
│  Cursor AI      │
│  (Claude)       │
└─────────────────┘
```

### Components

1. **Simulator Manager** (`src/simulator.ts`)
   - Captures screenshots using `xcrun simctl io booted screenshot`
   - Manages screenshot storage and cleanup
   - Retrieves simulator status and device information

2. **File Watcher** (`src/watcher.ts`)
   - Watches React Native project files for changes
   - Detects UI-related changes using keywords and directory patterns
   - Debounces changes to avoid excessive screenshots
   - Triggers automatic screenshot capture

3. **MCP Server** (`src/index.ts`)
   - Exposes screenshots as MCP resources
   - Provides tools for manual screenshot capture and simulator management
   - Communicates with Cursor via stdio protocol

### MCP Resources

- `simulator://latest-screenshot` - Most recent screenshot (PNG image)
- `simulator://screenshot-history` - JSON list of all screenshots with metadata
- `simulator://screenshot/{timestamp}` - Specific screenshot by timestamp

### MCP Tools

- `capture_simulator_screenshot` - Manually capture a screenshot
  - Optional `description` parameter for context
- `get_simulator_status` - Check if simulator is running and list devices
- `toggle_auto_capture` - Enable or disable automatic capture
  - Required `enabled` boolean parameter
- `get_watcher_status` - Get file watcher status and configuration

## Configuration

### Screenshot Storage

Screenshots are stored in `.emcap-screenshots/` directory (git-ignored by default).

### File Watching

Configure what files to watch in `mcp-server/src/config.ts`:

```typescript
export const config = {
  // Maximum screenshots to keep
  maxScreenshots: 50,
  
  // File patterns to watch
  watchPatterns: [
    '**/*.tsx',
    '**/*.jsx',
    '**/*.ts',
    '**/*.js'
  ],
  
  // Directories to ignore
  ignorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/android/**',
    '**/__tests__/**'
  ],
  
  // Debounce delay (ms)
  debounceDelay: 2000,
  
  // UI detection keywords
  uiKeywords: [
    'View',
    'Text',
    'Image',
    'Button',
    'TouchableOpacity',
    'ScrollView',
    'FlatList',
    'StyleSheet',
    'style',
    'render'
  ]
};
```

## Development

### Building

```bash
cd mcp-server
npm run build
```

### Development Mode

Watch for changes and rebuild automatically:

```bash
cd mcp-server
npm run dev
```

### Testing

1. Start the MCP server manually:
```bash
cd mcp-server
npm start
```

2. Check logs in Cursor's MCP output panel

## Troubleshooting

### "No booted iOS simulator found"

**Solution**: Make sure your iOS simulator is running:
```bash
npm run ios
# or launch from Xcode
```

### Screenshots not being captured automatically

**Possible causes**:
1. Auto-capture is disabled
   - Ask AI: "Enable auto-capture"
2. Simulator is not running
   - Check with: "Is the iOS simulator running?"
3. File watcher is not detecting changes
   - Check patterns in `config.ts`
   - Ask AI: "What's the watcher status?"

### MCP server not connecting

**Solution**:
1. Check that the server is built: `mcp-server/dist/index.js` should exist
   - If not, run: `./install-mcp.sh` or `cd mcp-server && npm run build`
2. Verify the path in Cursor's MCP config is correct (must be absolute path)
   - Use full path like: `/Users/username/path/to/emCap/mcp-server/dist/index.js`
3. Check Node.js version: `node --version` (requires 18+)
4. Restart Cursor after configuration changes
5. Check Cursor's MCP logs for detailed errors (View → Output → select "ios-simulator")

### Screenshots directory filling up

**Solution**: The server automatically maintains only the 50 most recent screenshots. You can adjust this in `config.ts`:

```typescript
maxScreenshots: 50  // Change this value
```

## Project Structure

```
emCap/
├── mcp-server/              # MCP server source code
│   ├── src/
│   │   ├── index.ts         # Main MCP server
│   │   ├── simulator.ts     # Screenshot capture logic
│   │   ├── watcher.ts       # File watching logic
│   │   ├── types.ts         # TypeScript type definitions
│   │   └── config.ts        # Configuration
│   ├── package.json
│   └── tsconfig.json
├── .emcap-screenshots/      # Screenshot storage (git-ignored)
├── .cursorrules             # Cursor rules for MCP usage
├── cursor-mcp-config.json   # Cursor MCP configuration
├── install-mcp.sh           # Installation script
└── README.md                # This file
```

## Use Cases

### UI Development Feedback

Ask the AI to review your UI changes:
```
"I just updated the login screen styling. Can you take a screenshot and give me feedback?"
```

### Bug Verification

Verify that visual bugs are fixed:
```
"I fixed the button alignment issue. Take a screenshot and verify it looks correct now."
```

### Design Implementation

Compare implementation with designs:
```
"Here's the design spec. Take a screenshot and tell me what doesn't match."
```

### Multi-screen Workflows

Navigate through screens and capture:
```
"I'm going to navigate to the profile screen. When I'm done, capture it and check the layout."
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes in `mcp-server/src/`
4. Rebuild: `npm run build-mcp` (from project root) or `cd mcp-server && npm run build`
5. Test your changes by restarting Cursor
6. Commit your changes: `git commit -am 'Add some feature'`
7. Push to the branch: `git push origin feature/your-feature`
8. Submit a pull request

Please ensure your code:
- Follows the existing code style
- Includes appropriate type definitions
- Has been tested with a real React Native project
- Updates documentation if needed

## License

MIT

## Acknowledgments

- Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Uses [Chokidar](https://github.com/paulmillr/chokidar) for file watching
- Powered by Apple's `xcrun simctl` for iOS simulator control

