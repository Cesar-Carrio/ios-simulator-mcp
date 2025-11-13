# Quick Start Guide

Get up and running with the iOS Simulator MCP Extension in 3 minutes!

## Prerequisites Checklist

- [ ] macOS with Xcode installed
- [ ] Node.js 18+ installed
- [ ] Cursor Editor installed
- [ ] iOS Simulator available

## Installation Steps

### 1. Configure Cursor (1 minute)

No installation needed! Just configure Cursor:

1. Open Cursor
2. Press `Cmd+,` to open Settings
3. Go to **Features** → **Model Context Protocol**
4. Click **"Edit Config"** or **"Add Server"**
5. Add this configuration:

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

6. Save and restart Cursor

**Alternative:** Install globally first (optional)

```bash
npm install -g @emcap/ios-simulator-mcp
```

Then use simpler config:
```json
{
  "mcpServers": {
    "ios-simulator": {
      "command": "ios-simulator-mcp"
    }
  }
}
```

### 2. Test It (2 minutes)

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
- Using npx? Make sure you have internet connection for first run
- Try global install: `npm install -g @emcap/ios-simulator-mcp`

### "No simulator found"
- Start your iOS simulator first: `npm run ios`
- Check simulator is booted: Open Simulator app from Xcode

### "Command failed" or "npx error"
- Check Node.js version: `node --version` (needs 18+)
- Try installing globally: `npm install -g @emcap/ios-simulator-mcp`
- Then update config to use `ios-simulator-mcp` command

## Getting Help

If something doesn't work:
1. Check the [Troubleshooting section](README.md#troubleshooting) in README
2. Look at Cursor's MCP output panel for errors
3. Try running the server manually: `cd mcp-server && npm start`

Enjoy building with AI-powered visual feedback! 🚀

