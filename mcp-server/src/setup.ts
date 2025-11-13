#!/usr/bin/env node

/**
 * Post-install setup script
 * Displays installation instructions after npm install
 */

const CONFIG_JSON = {
  mcpServers: {
    "ios-simulator": {
      command: "npx",
      args: ["-y", "@emcap/ios-simulator-mcp"],
    },
  },
};

const CONFIG_JSON_GLOBAL = {
  mcpServers: {
    "ios-simulator": {
      command: "ios-simulator-mcp",
    },
  },
};

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ✅  iOS Simulator MCP Server installed successfully!        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

📋 Next Steps:

1️⃣  Add to your Cursor settings:

   Open Cursor → Settings (⌘,) → Features → Model Context Protocol
   
   Then add this configuration:

${JSON.stringify(CONFIG_JSON, null, 2)}

   💡 Or if installed globally (-g), use:

${JSON.stringify(CONFIG_JSON_GLOBAL, null, 2)}

2️⃣  Restart Cursor

3️⃣  Start your iOS simulator:
   
   npm run ios
   # or
   yarn ios

4️⃣  Ask Cursor's AI:

   "Can you capture a screenshot of the simulator?"
   "Show me the latest screenshot"
   "Analyze the current UI layout"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 Documentation: https://github.com/emcap/ios-simulator-mcp
💬 Issues: https://github.com/emcap/ios-simulator-mcp/issues
⭐ Star us on GitHub!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Happy coding with AI-powered visual feedback!

`);
