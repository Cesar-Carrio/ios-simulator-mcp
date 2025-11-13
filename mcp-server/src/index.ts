#!/usr/bin/env node

/**
 * iOS Simulator Screenshot MCP Server
 *
 * This MCP server captures iOS simulator screenshots and exposes them to Cursor AI
 * for visual analysis and feedback on React Native apps.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SimulatorManager } from "./simulator.js";
import { FileWatcher } from "./watcher.js";
import { config } from "./config.js";

// Initialize managers
const simulatorManager = new SimulatorManager();
const fileWatcher = new FileWatcher(simulatorManager);

// Create MCP server
const server = new Server(
  {
    name: "ios-simulator-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

/**
 * List available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const screenshots = await simulatorManager.getScreenshots();
  const latest = screenshots[0];
  const recentChanges = fileWatcher.getChangesFromLastMinutes(5);

  let latestDescription = "";
  if (latest) {
    const timeAgo = Math.floor((Date.now() - latest.timestamp) / 1000);
    const timeString = timeAgo < 60 
      ? `${timeAgo} seconds ago` 
      : `${Math.floor(timeAgo / 60)} minutes ago`;
    
    latestDescription = `Most recent screenshot from ${timeString}. `;
    if (latest.triggeredBy) {
      latestDescription += `Triggered by: ${latest.triggeredBy}. `;
    }
    if (latest.fileChanges && latest.fileChanges.length > 0) {
      latestDescription += `Related files: ${latest.fileChanges.slice(0, 2).map(f => f.filepath).join(", ")}. `;
    }
    if (latest.suggestions && latest.suggestions.length > 0) {
      latestDescription += `💡 ${latest.suggestions[0]}`;
    }
  } else {
    latestDescription = "No screenshots available yet. Use capture_simulator_screenshot tool to take one.";
  }

  let historyDescription = `Complete history of ${screenshots.length} screenshots with metadata. `;
  if (screenshots.length > 0) {
    const oldestTime = screenshots[screenshots.length - 1].timestamp;
    const newestTime = screenshots[0].timestamp;
    const spanMinutes = Math.floor((newestTime - oldestTime) / 60000);
    historyDescription += `Spanning ${spanMinutes} minutes of development. `;
  }
  if (recentChanges.length > 0) {
    historyDescription += `${recentChanges.length} file changes tracked in last 5 minutes.`;
  } else {
    historyDescription += `Use list_recent_screenshots tool for easier browsing.`;
  }

  const resources = [
    {
      uri: "simulator://latest-screenshot",
      name: "Latest iOS Simulator Screenshot",
      description: latestDescription,
      mimeType: "image/png",
    },
    {
      uri: "simulator://screenshot-history",
      name: "Screenshot History",
      description: historyDescription,
      mimeType: "application/json",
    },
  ];

  // Add individual screenshot resources with enhanced descriptions
  for (const screenshot of screenshots.slice(0, 10)) {
    let desc = "";
    if (screenshot.triggeredBy) {
      desc += `📝 ${screenshot.triggeredBy}. `;
    }
    if (screenshot.deviceInfo) {
      desc += `📱 ${screenshot.deviceInfo.name}. `;
    }
    if (screenshot.fileChanges && screenshot.fileChanges.length > 0) {
      desc += `Files: ${screenshot.fileChanges.slice(0, 2).map(f => f.filepath).join(", ")}${screenshot.fileChanges.length > 2 ? "..." : ""}`;
    }
    if (!desc) {
      desc = "Manual capture";
    }

    resources.push({
      uri: `simulator://screenshot/${screenshot.timestamp}`,
      name: `Screenshot ${new Date(screenshot.timestamp).toLocaleString()}`,
      description: desc,
      mimeType: "image/png",
    });
  }

  return { resources };
});

/**
 * Read resource content
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === "simulator://latest-screenshot") {
    const latest = await simulatorManager.getLatestScreenshot();
    if (!latest) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text:
              "No screenshots available. Make sure the iOS simulator is running and capture a screenshot.",
          },
        ],
      };
    }

    const base64Data = await simulatorManager.readScreenshotAsBase64(
      latest.path,
    );
    return {
      contents: [
        {
          uri,
          mimeType: "image/png",
          blob: base64Data,
        },
      ],
    };
  }

  if (uri === "simulator://screenshot-history") {
    const screenshots = await simulatorManager.getScreenshots();
    const history = screenshots.map((s) => ({
      timestamp: s.timestamp,
      date: new Date(s.timestamp).toISOString(),
      filename: s.filename,
      triggeredBy: s.triggeredBy,
      description: s.description,
      deviceInfo: s.deviceInfo,
    }));

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(history, null, 2),
        },
      ],
    };
  }

  if (uri.startsWith("simulator://screenshot/")) {
    const timestamp = parseInt(uri.split("/").pop() || "0");
    const screenshot = await simulatorManager.getScreenshotByTimestamp(
      timestamp,
    );

    if (!screenshot) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Screenshot with timestamp ${timestamp} not found.`,
          },
        ],
      };
    }

    const base64Data = await simulatorManager.readScreenshotAsBase64(
      screenshot.path,
    );
    return {
      contents: [
        {
          uri,
          mimeType: "image/png",
          blob: base64Data,
        },
      ],
    };
  }

  throw new Error(`Unknown resource URI: ${uri}`);
});

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "capture_simulator_screenshot",
        description:
          "Capture a screenshot from the currently running iOS simulator and display it immediately. Prerequisites: Simulator must be booted (use get_simulator_status to check). Use this after making UI changes, when implementing new features, or when you need to see the current visual state of the app. The screenshot will be automatically displayed in the conversation.",
        inputSchema: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description:
                'Optional description for context (e.g., "Login screen after styling changes", "New button placement"). This helps track what was being worked on.',
            },
          },
        },
      },
      {
        name: "get_simulator_status",
        description:
          "Check if the iOS simulator is currently running and list all available devices. Use this FIRST before capturing screenshots or when troubleshooting. Returns simulator status with actionable suggestions. If no simulator is running, suggests using boot_simulator tool to start one automatically.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "toggle_auto_capture",
        description:
          "Enable or disable automatic screenshot capture when UI files are saved. When enabled, screenshots are automatically taken 2 seconds after saving files in components/, screens/, or other UI directories. This enables hands-free screenshot tracking during development. Disable when making non-visual changes or when you don't want frequent screenshots.",
        inputSchema: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              description: "True to enable auto-capture, false to disable",
            },
          },
          required: ["enabled"],
        },
      },
      {
        name: "get_watcher_status",
        description:
          "Get the current status of the file watcher including recent file changes and what patterns are being watched. Use this to debug why auto-capture isn't working or to see what files triggered recent screenshots.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_recent_screenshots",
        description:
          "List the most recent screenshots with thumbnails and metadata including what triggered each capture. Use this to browse screenshot history or find a specific screenshot before analyzing it in detail.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of screenshots to return (default: 5, max: 20)",
            },
          },
        },
      },
      {
        name: "compare_screenshots",
        description:
          "Compare two screenshots to identify what changed between them. Useful after making UI changes to understand visual differences. Provide timestamps from screenshot history.",
        inputSchema: {
          type: "object",
          properties: {
            timestamp1: {
              type: "number",
              description: "Timestamp of the first screenshot",
            },
            timestamp2: {
              type: "number",
              description: "Timestamp of the second screenshot",
            },
          },
          required: ["timestamp1", "timestamp2"],
        },
      },
      {
        name: "boot_simulator",
        description:
          "Start the iOS simulator if it's not currently running. Use this automatically when simulator status check shows no booted device. Optionally specify a device name like 'iPhone 16 Pro'.",
        inputSchema: {
          type: "object",
          properties: {
            deviceName: {
              type: "string",
              description:
                'Optional device name to boot (e.g., "iPhone 16 Pro"). If not specified, boots the latest available iPhone.',
            },
          },
        },
      },
      {
        name: "verify_setup",
        description:
          "Verify that Xcode, iOS Simulator, and all dependencies are properly installed and configured. Use this when troubleshooting issues or during initial setup. Returns detailed diagnostics with fix instructions.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "clear_screenshots",
        description:
          "Delete all captured screenshots to free up disk space and start fresh. Use this to clean up the .emcap-screenshots directory. All screenshot history will be permanently removed. Use with caution.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "capture_simulator_screenshot") {
      const description = args?.description as string | undefined;
      const metadata = await simulatorManager.captureScreenshot(
        description,
        "Manual capture",
      );

      if (!metadata) {
        return {
          content: [
            {
              type: "text",
              text:
                "Failed to capture screenshot. Make sure the iOS simulator is running and booted.",
            },
          ],
        };
      }

      // Read the screenshot as base64 to display it in Cursor
      const base64Data = await simulatorManager.readScreenshotAsBase64(
        metadata.path,
      );

      return {
        content: [
          {
            type: "text",
            text: `Screenshot captured successfully!\n\nTimestamp: ${
              new Date(metadata.timestamp).toLocaleString()
            }\nDevice: ${
              metadata.deviceInfo?.name || "Unknown"
            }${description ? `\nDescription: ${description}` : ""}`,
          },
          {
            type: "image",
            data: base64Data,
            mimeType: "image/png",
          },
        ],
      };
    }

    if (name === "get_simulator_status") {
      const status = await simulatorManager.getSimulatorStatus();

      let statusText = `iOS Simulator Status:\n\n`;
      statusText += `Running: ${status.isRunning ? "✅ Yes" : "❌ No"}\n\n`;

      if (status.bootedDevice) {
        statusText += `Booted Device:\n`;
        statusText += `  Name: ${status.bootedDevice.name}\n`;
        statusText += `  UDID: ${status.bootedDevice.udid}\n`;
        statusText += `  Runtime: ${status.bootedDevice.runtime}\n\n`;
        statusText += `✅ Ready to capture screenshots!\n\n`;
      } else {
        statusText += `⚠️ No simulator is currently running.\n\n`;
        statusText += `Suggested Actions:\n`;
        statusText += `  1. Use the boot_simulator tool to start one automatically\n`;
        statusText += `  2. Or manually run: npm run ios (or yarn ios)\n`;
        statusText += `  3. Or open Simulator.app and select a device\n\n`;
      }

      statusText += `Available Devices (${status.devices.length} total):\n`;
      const shutdownDevices = status.devices.filter(d => d.state === "Shutdown");
      const bootedDevices = status.devices.filter(d => d.state === "Booted");
      const otherDevices = status.devices.filter(d => d.state !== "Shutdown" && d.state !== "Booted");
      
      if (bootedDevices.length > 0) {
        statusText += `\n  🟢 Booted:\n`;
        for (const device of bootedDevices) {
          statusText += `     • ${device.name}\n`;
        }
      }
      
      if (shutdownDevices.length > 0) {
        statusText += `\n  ⚪ Available to Boot:\n`;
        for (const device of shutdownDevices.slice(0, 5)) {
          statusText += `     • ${device.name}\n`;
        }
        if (shutdownDevices.length > 5) {
          statusText += `     ... and ${shutdownDevices.length - 5} more\n`;
        }
      }

      if (otherDevices.length > 0) {
        statusText += `\n  Other:\n`;
        for (const device of otherDevices) {
          statusText += `     • ${device.name} (${device.state})\n`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: statusText,
          },
        ],
      };
    }

    if (name === "toggle_auto_capture") {
      const enabled = args?.enabled as boolean;
      fileWatcher.setEnabled(enabled);

      return {
        content: [
          {
            type: "text",
            text: `Auto-capture ${
              enabled ? "enabled" : "disabled"
            }. Screenshots will ${
              enabled ? "now" : "no longer"
            } be automatically captured when UI files change.`,
          },
        ],
      };
    }

    if (name === "get_watcher_status") {
      const status = fileWatcher.getStatus();
      const recentChanges = fileWatcher.getRecentChanges(10);

      let statusText = `File Watcher Status:\n\n` +
        `Running: ${status.isRunning ? "Yes" : "No"}\n` +
        `Auto-capture enabled: ${status.isEnabled ? "Yes" : "No"}\n` +
        `Watch path: ${status.watchPath}\n` +
        `Debounce delay: ${config.debounceDelay}ms\n` +
        `Watch patterns: ${config.watchPatterns.join(", ")}\n\n`;

      if (recentChanges.length > 0) {
        statusText += `Recent File Changes (last 10):\n`;
        for (const change of recentChanges) {
          const timeAgo = Math.floor((Date.now() - change.timestamp) / 1000);
          statusText += `  - [${change.type}] ${change.filepath} (${timeAgo}s ago)\n`;
        }
      } else {
        statusText += `No recent file changes tracked.`;
      }

      return {
        content: [
          {
            type: "text",
            text: statusText,
          },
        ],
      };
    }

    if (name === "list_recent_screenshots") {
      const limit = Math.min((args?.limit as number) || 5, 20);
      const screenshots = await simulatorManager.listRecentScreenshots(limit);

      if (screenshots.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No screenshots found. Capture a screenshot first using the capture_simulator_screenshot tool.",
            },
          ],
        };
      }

      let listText = `Recent Screenshots (${screenshots.length}):\n\n`;
      
      for (const screenshot of screenshots) {
        const date = new Date(screenshot.timestamp);
        listText += `📸 ${date.toLocaleString()}\n`;
        listText += `   Timestamp: ${screenshot.timestamp}\n`;
        listText += `   Device: ${screenshot.deviceInfo?.name || "Unknown"}\n`;
        listText += `   Triggered by: ${screenshot.triggeredBy || "Manual"}\n`;
        
        if (screenshot.fileChanges && screenshot.fileChanges.length > 0) {
          listText += `   Files changed: ${screenshot.fileChanges.slice(0, 3).map(f => f.filepath).join(", ")}${screenshot.fileChanges.length > 3 ? "..." : ""}\n`;
        }
        
        if (screenshot.suggestions && screenshot.suggestions.length > 0) {
          listText += `   💡 ${screenshot.suggestions[0]}\n`;
        }
        
        listText += `\n`;
      }

      listText += `\nUse compare_screenshots with timestamps to compare any two screenshots.`;

      return {
        content: [
          {
            type: "text",
            text: listText,
          },
        ],
      };
    }

    if (name === "compare_screenshots") {
      const timestamp1 = args?.timestamp1 as number;
      const timestamp2 = args?.timestamp2 as number;

      const comparison = await simulatorManager.compareScreenshots(
        timestamp1,
        timestamp2,
      );

      const date1 = new Date(timestamp1).toLocaleString();
      const date2 = new Date(timestamp2).toLocaleString();

      let compareText = `Screenshot Comparison:\n\n`;
      compareText += `📸 Screenshot 1: ${date1}\n`;
      compareText += `   Device: ${comparison.screenshot1.deviceInfo?.name || "Unknown"}\n`;
      compareText += `   Triggered by: ${comparison.screenshot1.triggeredBy || "Manual"}\n\n`;
      
      compareText += `📸 Screenshot 2: ${date2}\n`;
      compareText += `   Device: ${comparison.screenshot2.deviceInfo?.name || "Unknown"}\n`;
      compareText += `   Triggered by: ${comparison.screenshot2.triggeredBy || "Manual"}\n\n`;
      
      compareText += `⏱️ Time difference: ${comparison.timeDifferenceFormatted}\n\n`;
      
      compareText += `Changes detected:\n`;
      for (const change of comparison.changes) {
        compareText += `  • ${change}\n`;
      }

      // Read both screenshots
      const base64Data1 = await simulatorManager.readScreenshotAsBase64(
        comparison.screenshot1.path,
      );
      const base64Data2 = await simulatorManager.readScreenshotAsBase64(
        comparison.screenshot2.path,
      );

      return {
        content: [
          {
            type: "text",
            text: compareText,
          },
          {
            type: "image",
            data: base64Data1,
            mimeType: "image/png",
          },
          {
            type: "image",
            data: base64Data2,
            mimeType: "image/png",
          },
        ],
      };
    }

    if (name === "boot_simulator") {
      const deviceName = args?.deviceName as string | undefined;
      const result = await simulatorManager.bootSimulator(deviceName);

      return {
        content: [
          {
            type: "text",
            text: result.success
              ? `✅ ${result.message}\n\nThe simulator should now be running. You can capture screenshots or wait for auto-capture when you save UI files.`
              : `❌ ${result.message}\n\nTroubleshooting:\n- Check that Xcode is installed\n- Try running: xcrun simctl list devices\n- Use verify_setup tool for detailed diagnostics`,
          },
        ],
      };
    }

    if (name === "verify_setup") {
      const verification = await simulatorManager.verifySetup();

      let verifyText = `Setup Verification Results:\n\n`;
      verifyText += `Overall Status: ${verification.isValid ? "✅ PASSED" : "❌ ISSUES FOUND"}\n`;
      verifyText += `${verification.summary}\n\n`;

      verifyText += `Detailed Checks:\n\n`;

      for (const [key, checkValue] of Object.entries(verification.checks)) {
        const check = checkValue as any;
        verifyText += `${check.passed ? "✅" : "❌"} ${key.toUpperCase()}:\n`;
        verifyText += `   ${check.message}\n`;
        if (check.version) {
          verifyText += `   Version: ${check.version}\n`;
        }
        if (check.fixCommand) {
          verifyText += `   Fix: ${check.fixCommand}\n`;
        }
        verifyText += `\n`;
      }

      if (verification.fixCommands.length > 0) {
        verifyText += `\nRecommended Actions:\n`;
        for (let i = 0; i < verification.fixCommands.length; i++) {
          verifyText += `${i + 1}. ${verification.fixCommands[i]}\n`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: verifyText,
          },
        ],
      };
    }

    if (name === "clear_screenshots") {
      try {
        // Get count before clearing
        const screenshots = await simulatorManager.getScreenshots();
        const count = screenshots.length;

        // Clear all screenshots
        await simulatorManager.clearAllScreenshots();

        // Clear file change history as well
        fileWatcher.clearChangeHistory();

        return {
          content: [
            {
              type: "text",
              text: `🗑️ Screenshot Cleanup Complete\n\n✅ Deleted ${count} screenshot(s)\n✅ Cleared file change history\n\nThe .emcap-screenshots directory has been cleaned up. You can start capturing fresh screenshots now.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to clear screenshots: ${error instanceof Error ? error.message : String(error)}\n\nThe screenshots directory may not exist or there may be permission issues.`,
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  try {
    // Initialize simulator manager
    await simulatorManager.initialize();
    console.error("Simulator manager initialized");

    // Start file watcher
    await fileWatcher.start();
    console.error("File watcher started");

    // Start MCP server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("iOS Simulator MCP Server running on stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.error("Shutting down...");
  await fileWatcher.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Shutting down...");
  await fileWatcher.stop();
  process.exit(0);
});

main();
