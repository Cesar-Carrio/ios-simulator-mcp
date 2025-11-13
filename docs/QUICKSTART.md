# Quick Start Guide

Get up and running with the iOS Simulator MCP Extension in 5 minutes!

## Prerequisites Checklist

- [ ] macOS with Xcode installed
- [ ] Node.js 18+ installed
- [ ] Cursor Editor installed
- [ ] iOS Simulator available

## Installation Steps

### 1. Clone and Build (3 minutes)

> **Note:** The package is not yet published to npm. You'll need to install from source.

1. Clone the repository:
```bash
git clone https://github.com/emcap/ios-simulator-mcp.git
cd ios-simulator-mcp
```

2. Install and build:
```bash
./install-mcp.sh
```

This script will:
- Install dependencies in the mcp-server directory
- Build the TypeScript source
- Create the dist/ directory with compiled JavaScript

### 2. Configure Cursor (1 minute)

1. Open Cursor
2. Press `Cmd+,` to open Settings
3. Go to **Features** → **Model Context Protocol**
4. Click **"Edit Config"** or **"Add Server"**
5. Add this configuration (replace the path with your actual path):

```json
{
  "mcpServers": {
    "ios-simulator": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/path/to/ios-simulator-mcp/mcp-server/dist/index.js"]
    }
  }
}
```

> **Important:** Use the absolute path to where you cloned the repository.

6. Save and restart Cursor

### 3. Test It (1 minute)

1. Start your iOS simulator:
```bash
npm run ios
# or
yarn ios
```

2. In Cursor, ask the AI:
```
"Can you check if the iOS simulator is running?"
```

3. Then try:
```
"Capture a screenshot of the simulator"
```

4. Finally:
```
"Show me the latest screenshot"
```

## That's It! 🎉

You're ready to use the extension. Here's what you can do:

### Automatic Mode
Just edit your React Native UI files and save. Screenshots will be automatically captured after 2 seconds.

### Manual Mode
Ask the AI to capture screenshots anytime:
- "Take a screenshot"
- "Show me what the app looks like"
- "Capture the current screen and analyze the layout"

## Next Steps

- Read the full [README.md](README.md) for advanced usage
- Customize configuration in `mcp-server/src/config.ts`
- Check troubleshooting section if you encounter issues

## Common First-Time Issues

### "MCP server not found"
- Make sure you restarted Cursor after adding the configuration
- Verify the path in your config points to the correct location
- Check that `mcp-server/dist/index.js` exists (run `./install-mcp.sh` if not)

### "Cannot find module" errors
- Make sure you ran `./install-mcp.sh` to install dependencies
- Check that `mcp-server/node_modules/` directory exists
- Try manually: `cd mcp-server && npm install && npm run build`

### "No simulator found"
- Start your iOS simulator first: `npm run ios`
- Check simulator is booted: Open Simulator app from Xcode

### "Command failed" or Node errors
- Check Node.js version: `node --version` (needs 18+)
- Ensure you used the absolute path (not relative) in Cursor config
- Check Cursor's MCP output panel for detailed error messages

## Getting Help

If something doesn't work:
1. Check the [Troubleshooting section](../README.md#troubleshooting) in README
2. Look at Cursor's MCP output panel for errors (View → Output → select "ios-simulator")
3. Try running the server manually: `cd mcp-server && npm start`
4. Verify the build: `ls -la mcp-server/dist/` should show compiled .js files

---

## Future: npm Installation (Coming Soon)

Once this package is published to npm, installation will be much simpler:

```bash
# Just add to Cursor config - no installation needed!
{
  "mcpServers": {
    "ios-simulator": {
      "command": "npx",
      "args": ["-y", "@emcap/ios-simulator-mcp"]
    }
  }
}
```

Enjoy building with AI-powered visual feedback! 🚀

