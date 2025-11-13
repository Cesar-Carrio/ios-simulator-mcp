#!/usr/bin/env node

/**
 * CLI helper for configuration and information
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const args = process.argv.slice(2);
const command = args[0];

const CONFIG_NPX = {
  mcpServers: {
    "ios-simulator": {
      command: "npx",
      args: ["-y", "@emcap/ios-simulator-mcp"],
    },
  },
};

const CONFIG_GLOBAL = {
  mcpServers: {
    "ios-simulator": {
      command: "ios-simulator-mcp",
    },
  },
};

async function checkSimulator() {
  try {
    const { stdout } = await execAsync("xcrun simctl list devices --json");
    const data = JSON.parse(stdout);

    let bootedCount = 0;
    for (const [runtime, devices] of Object.entries(data.devices)) {
      if (Array.isArray(devices)) {
        for (const device of devices) {
          if (device.state === "Booted") {
            bootedCount++;
            console.log(`✅ Booted: ${device.name} (${runtime})`);
          }
        }
      }
    }

    if (bootedCount === 0) {
      console.log("⚠️  No booted iOS simulator found");
      console.log("   Start your simulator with: npm run ios");
    }
  } catch (error) {
    console.log("❌ Error checking simulator status");
    console.log("   Make sure Xcode is installed");
  }
}

function showHelp() {
  console.log(`
iOS Simulator MCP Server - CLI Helper

Usage:
  ios-simulator-mcp [command]

Commands:
  --help, -h         Show this help message
  --version, -v      Show version information
  --config           Show Cursor configuration (npx)
  --config-global    Show Cursor configuration (global install)
  --check            Check if iOS simulator is running
  --test             Test the MCP server
  
Examples:
  ios-simulator-mcp --config         # Show config for Cursor
  ios-simulator-mcp --check          # Check simulator status
  ios-simulator-mcp                  # Start MCP server (stdio mode)

Documentation:
  https://github.com/emcap/ios-simulator-mcp

`);
}

function showVersion() {
  // Read from package.json
  console.log("iOS Simulator MCP Server v1.0.0");
}

function showConfig() {
  console.log("📋 Add this to your Cursor settings:\n");
  console.log("Path: Cursor → Settings → Features → Model Context Protocol\n");
  console.log(JSON.stringify(CONFIG_NPX, null, 2));
  console.log("\n💡 Copy and paste this into your Cursor MCP configuration");
}

function showConfigGlobal() {
  console.log("📋 Add this to your Cursor settings (global install):\n");
  console.log("Path: Cursor → Settings → Features → Model Context Protocol\n");
  console.log(JSON.stringify(CONFIG_GLOBAL, null, 2));
  console.log("\n💡 Copy and paste this into your Cursor MCP configuration");
}

async function main() {
  switch (command) {
    case "--help":
    case "-h":
      showHelp();
      break;

    case "--version":
    case "-v":
      showVersion();
      break;

    case "--config":
      showConfig();
      break;

    case "--config-global":
      showConfigGlobal();
      break;

    case "--check":
      console.log("🔍 Checking iOS Simulator status...\n");
      await checkSimulator();
      break;

    case "--test":
      console.log("🧪 Testing MCP server...\n");
      console.log("The MCP server runs in stdio mode and needs to be");
      console.log("started by Cursor. Add the config with --config");
      console.log("and restart Cursor to test.");
      break;

    default:
      // No command or unknown command - start the server
      // Import and run the main server
      await import("./index.js");
      break;
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
