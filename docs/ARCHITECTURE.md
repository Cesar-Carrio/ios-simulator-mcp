# Architecture Overview

Visual guide to understanding how the iOS Simulator MCP Extension works.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CURSOR EDITOR                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Claude AI (Sonnet)                      │  │
│  │                                                            │  │
│  │  "Can you capture a screenshot and analyze the layout?"   │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                      │
│                           │ MCP Protocol (stdio)                 │
│                           ↓                                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                   MCP SERVER (Node.js)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     index.ts                              │  │
│  │  • Handles MCP requests                                   │  │
│  │  • Exposes resources (latest screenshot, history)         │  │
│  │  • Provides tools (capture, status, toggle)               │  │
│  └──────────┬──────────────────────────────┬─────────────────┘  │
│             │                              │                     │
│             │                              │                     │
│  ┌──────────▼─────────────┐    ┌──────────▼─────────────────┐  │
│  │   simulator.ts         │    │      watcher.ts             │  │
│  │  • Screenshot capture  │    │  • File watching            │  │
│  │  • xcrun simctl calls  │    │  • Change detection         │  │
│  │  • Metadata management │    │  • Debouncing               │  │
│  │  • Cleanup old files   │    │  • UI file filtering        │  │
│  └────────────┬───────────┘    └────────────┬────────────────┘  │
│               │                              │                   │
└───────────────┼──────────────────────────────┼───────────────────┘
                │                              │
                │                              │
     ┌──────────▼──────────┐        ┌─────────▼──────────┐
     │   xcrun simctl      │        │  File System       │
     │  (macOS tool)       │        │  (Chokidar)        │
     └──────────┬──────────┘        └─────────┬──────────┘
                │                              │
                │                              │
     ┌──────────▼──────────┐        ┌─────────▼──────────┐
     │  iOS Simulator      │        │  React Native      │
     │  (Booted device)    │        │  Source Files      │
     │                     │        │  (.tsx, .jsx)      │
     │  📱 Screenshot →    │        │                    │
     └─────────────────────┘        └────────────────────┘
                │
                │
     ┌──────────▼──────────┐
     │  .emcap-screenshots/│
     │  • screenshot-*.png │
     │  • Timestamped      │
     │  • With metadata    │
     └─────────────────────┘
```

## Data Flow

### 1. Automatic Capture Flow

```
User edits ProfileScreen.tsx
         │
         │ File saved
         ↓
   Chokidar detects change
         │
         │ Check patterns
         ↓
   Is it a UI file?
    (Check keywords,
     directory, ext)
         │
         │ Yes
         ↓
   Add to pending changes
         │
         │ Start/reset 2s timer
         ↓
   2 seconds pass...
         │
         ↓
   Capture screenshot
    (simulator.captureScreenshot)
         │
         │ xcrun simctl io booted screenshot
         ↓
   Save PNG to disk
    (.emcap-screenshots/)
         │
         ↓
   Store metadata
    (timestamp, device,
     triggered by file)
         │
         ↓
   Cleanup old screenshots
    (keep latest 50)
         │
         ↓
   Available to AI via
    simulator://latest-screenshot
```

### 2. Manual Capture Flow

```
User asks AI:
"Take a screenshot"
         │
         │ AI interprets request
         ↓
   AI calls MCP tool:
   capture_simulator_screenshot
         │
         │ Request via stdio
         ↓
   MCP Server receives request
         │
         │ CallToolRequestSchema
         ↓
   simulator.captureScreenshot()
         │
         │ Check simulator status
         ↓
   Is simulator running?
         │
         │ Yes (booted device found)
         ↓
   xcrun simctl io booted
   screenshot "/path/file.png"
         │
         │ PNG file created
         ↓
   Read file metadata
         │
         ↓
   Return metadata to AI
    (timestamp, filename,
     device info)
         │
         ↓
   AI shows success message
   + resource URI
```

### 3. Screenshot Viewing Flow

```
User asks AI:
"Show me the latest screenshot"
         │
         │ AI interprets request
         ↓
   AI reads MCP resource:
   simulator://latest-screenshot
         │
         │ Request via stdio
         ↓
   MCP Server receives request
         │
         │ ReadResourceRequestSchema
         ↓
   simulator.getLatestScreenshot()
         │
         │ Query filesystem
         ↓
   Find latest PNG file
         │
         │ Read file
         ↓
   Convert to base64
         │
         ↓
   Return as MCP resource
    (mime: image/png,
     blob: base64 data)
         │
         ↓
   AI receives image
         │
         ↓
   AI's vision analyzes
    (layout, colors,
     spacing, etc.)
         │
         ↓
   AI provides feedback
   to user
```

## Component Details

### Index.ts (Main Server)

**Responsibilities:**
- MCP protocol handling
- Resource and tool registration
- Request routing
- Initialization and shutdown

**Key Handlers:**
- `ListResourcesRequestSchema` → Returns available screenshots
- `ReadResourceRequestSchema` → Returns screenshot data
- `ListToolsRequestSchema` → Returns available tools
- `CallToolRequestSchema` → Executes tools

### Simulator.ts

**Responsibilities:**
- Screenshot capture
- Simulator status detection
- File management
- Cleanup operations

**Key Methods:**
```
captureScreenshot(description?, triggeredBy?)
  → ScreenshotMetadata | null

getSimulatorStatus()
  → SimulatorStatus

getLatestScreenshot()
  → ScreenshotMetadata | null

readScreenshotAsBase64(filepath)
  → string (base64)

cleanupOldScreenshots()
  → void
```

### Watcher.ts

**Responsibilities:**
- File system monitoring
- UI change detection
- Debouncing logic
- Auto-capture triggering

**Key Methods:**
```
start()
  → Initializes chokidar watcher

handleFileChange(filepath)
  → Debounces and triggers capture

isUIRelatedChange(filepath)
  → boolean

setEnabled(enabled)
  → Enable/disable auto-capture
```

### Config.ts

**Configuration Options:**
```typescript
{
  screenshotsDir: '.emcap-screenshots',
  maxScreenshots: 50,
  watchPatterns: ['**/*.tsx', '**/*.jsx', ...],
  ignorePatterns: ['**/node_modules/**', ...],
  debounceDelay: 2000,
  uiKeywords: ['View', 'Text', 'Button', ...]
}
```

## File Structure

```
mcp-server/
├── src/
│   ├── index.ts        [MCP Server Entry]
│   │   • 370 lines
│   │   • Handles MCP protocol
│   │   • Exports 3 resources, 4 tools
│   │
│   ├── simulator.ts    [Screenshot Logic]
│   │   • 200 lines
│   │   • SimulatorManager class
│   │   • xcrun simctl interface
│   │
│   ├── watcher.ts      [File Watching]
│   │   • 170 lines
│   │   • FileWatcher class
│   │   • Chokidar integration
│   │
│   ├── types.ts        [Type Definitions]
│   │   • Interfaces for data structures
│   │   • Type safety
│   │
│   └── config.ts       [Configuration]
│       • Centralized settings
│       • Easy customization
│
├── package.json        [Dependencies]
│   • @modelcontextprotocol/sdk: ^0.5.0
│   • chokidar: ^3.5.3
│   • fast-glob: ^3.3.2
│
└── tsconfig.json       [TypeScript Config]
    • ES2022 target
    • Node16 modules
```

## MCP Resources Explained

### 1. simulator://latest-screenshot
**Type:** image/png (base64 blob)
**Purpose:** Always provides the most recent screenshot
**Use Case:** "Show me what the app looks like now"

### 2. simulator://screenshot-history
**Type:** application/json
**Purpose:** List of all screenshots with metadata
**Use Case:** "Show me all screenshots from the last hour"

### 3. simulator://screenshot/{timestamp}
**Type:** image/png (base64 blob)
**Purpose:** Retrieve a specific historical screenshot
**Use Case:** "Show me the screenshot from 3:45 PM"

## MCP Tools Explained

### 1. capture_simulator_screenshot
**Input:** `{ description?: string }`
**Output:** Success message with metadata
**Use Case:** Manual screenshot capture

### 2. get_simulator_status
**Input:** None
**Output:** Simulator status and device list
**Use Case:** Check if simulator is ready

### 3. toggle_auto_capture
**Input:** `{ enabled: boolean }`
**Output:** Confirmation message
**Use Case:** Enable/disable automatic capture

### 4. get_watcher_status
**Input:** None
**Output:** Watcher configuration and state
**Use Case:** Debug file watching issues

## Communication Protocol

The server uses **stdio** (standard input/output) to communicate with Cursor:

```
Cursor (stdin)  →  MCP Server  →  Cursor (stdout)
    JSON             Process         JSON
   Request           Handler        Response
```

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "capture_simulator_screenshot",
    "arguments": {
      "description": "Login screen after styling"
    }
  }
}
```

**Example Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "Screenshot captured successfully!..."
    }]
  }
}
```

## Performance Considerations

### Debouncing
- 2-second delay prevents excessive screenshots
- Accumulates multiple file changes
- Only captures once after changes stabilize

### Cleanup
- Maintains only 50 most recent screenshots
- Prevents disk space issues
- Runs automatically after each capture

### File Watching
- Excludes node_modules, tests, build dirs
- Uses efficient chokidar library
- Waits for file write to stabilize

### Screenshot Format
- PNG format for quality
- Base64 encoding for MCP transport
- Typical size: 100-500KB per screenshot

## Security & Privacy

### Local Only
- All data stays on your machine
- No external API calls
- No data sent to cloud

### File Permissions
- Only writes to .emcap-screenshots/
- Reads only watched directories
- No system file access

### Safe Defaults
- .gitignore prevents screenshot commits
- Automatic cleanup limits storage
- Read-only simulator access

## Extension Points

Want to customize? Edit these:

### Watch Different Files
Edit `config.ts` → `watchPatterns`

### Change Debounce Time
Edit `config.ts` → `debounceDelay`

### Adjust Screenshot Limit
Edit `config.ts` → `maxScreenshots`

### Add UI Keywords
Edit `config.ts` → `uiKeywords`

### Change Storage Location
Edit `config.ts` → `screenshotsDir`

## Integration with Development Workflow

```
Traditional Workflow:
Edit code → Save → Switch to simulator → 
Look at screen → Switch back to editor → 
Ask AI about issue

With MCP Extension:
Edit code → Save → Ask AI "how does it look?" →
AI captures, analyzes, provides feedback →
Continue coding
```

**Time Saved:** ~30 seconds per check
**Context Switches:** Reduced from 2 to 0

---

This architecture enables a seamless, integrated experience where the AI can truly "see" your app and provide visual feedback, just like a human pair programmer would!

