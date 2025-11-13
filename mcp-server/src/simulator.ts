/**
 * iOS Simulator screenshot capture and management
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { DeviceInfo, ScreenshotMetadata, SimulatorStatus } from "./types.js";
import { config } from "./config.js";

// Create execAsync with timeout and detached stdio to prevent conflicts with MCP stdio communication
const execAsync = (command: string) => {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(command, {
      timeout: 10000,
      maxBuffer: 1024 * 1024 * 10,
      // Detach from parent's stdio to prevent conflicts with MCP stdio communication
      env: process.env,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

export class SimulatorManager {
  private screenshotsDir: string;

  constructor(screenshotsDir: string = config.screenshotsDir) {
    this.screenshotsDir = screenshotsDir;
  }

  /**
   * Initialize the screenshots directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.screenshotsDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create screenshots directory:", error);
      throw error;
    }
  }

  /**
   * Get the status of iOS simulators
   */
  async getSimulatorStatus(): Promise<SimulatorStatus> {
    try {
      const { stdout } = await execAsync("xcrun simctl list devices --json");
      const data = JSON.parse(stdout);

      const devices: DeviceInfo[] = [];
      let bootedDevice: DeviceInfo | undefined;

      for (const [runtime, deviceList] of Object.entries(data.devices)) {
        if (Array.isArray(deviceList)) {
          for (const device of deviceList) {
            const deviceInfo: DeviceInfo = {
              udid: device.udid,
              name: device.name,
              state: device.state,
              runtime: runtime,
            };
            devices.push(deviceInfo);

            if (device.state === "Booted") {
              bootedDevice = deviceInfo;
            }
          }
        }
      }

      return {
        isRunning: bootedDevice !== undefined,
        devices,
        bootedDevice,
      };
    } catch (error) {
      console.error("Failed to get simulator status:", error);
      return {
        isRunning: false,
        devices: [],
      };
    }
  }

  /**
   * Capture a screenshot from the iOS simulator
   */
  async captureScreenshot(
    description?: string,
    triggeredBy?: string,
  ): Promise<ScreenshotMetadata | null> {
    try {
      // Check if simulator is running
      const status = await this.getSimulatorStatus();
      if (!status.isRunning || !status.bootedDevice) {
        throw new Error("No booted iOS simulator found");
      }

      // Generate filename with timestamp
      const timestamp = Date.now();
      const filename = `screenshot-${timestamp}.png`;
      const filepath = path.join(this.screenshotsDir, filename);

      // Capture screenshot
      await execAsync(`xcrun simctl io booted screenshot "${filepath}"`);

      // Verify screenshot was created
      try {
        await fs.access(filepath);
      } catch {
        throw new Error("Screenshot file was not created");
      }

      const metadata: ScreenshotMetadata = {
        timestamp,
        filename,
        path: filepath,
        deviceInfo: status.bootedDevice,
        triggeredBy,
        description,
      };

      // Cleanup old screenshots
      await this.cleanupOldScreenshots();

      return metadata;
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
      return null;
    }
  }

  /**
   * Get all screenshots metadata
   */
  async getScreenshots(): Promise<ScreenshotMetadata[]> {
    try {
      const files = await fs.readdir(this.screenshotsDir);
      const screenshots: ScreenshotMetadata[] = [];

      for (const file of files) {
        if (file.endsWith(".png") && file.startsWith("screenshot-")) {
          const filepath = path.join(this.screenshotsDir, file);
          const stats = await fs.stat(filepath);

          // Extract timestamp from filename
          const timestampMatch = file.match(/screenshot-(\d+)\.png/);
          const timestamp = timestampMatch
            ? parseInt(timestampMatch[1])
            : stats.mtimeMs;

          screenshots.push({
            timestamp,
            filename: file,
            path: filepath,
          });
        }
      }

      // Sort by timestamp, newest first
      return screenshots.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Failed to get screenshots:", error);
      return [];
    }
  }

  /**
   * Get the latest screenshot
   */
  async getLatestScreenshot(): Promise<ScreenshotMetadata | null> {
    const screenshots = await this.getScreenshots();
    return screenshots.length > 0 ? screenshots[0] : null;
  }

  /**
   * Get screenshot by timestamp
   */
  async getScreenshotByTimestamp(
    timestamp: number,
  ): Promise<ScreenshotMetadata | null> {
    const screenshots = await this.getScreenshots();
    return screenshots.find((s) => s.timestamp === timestamp) || null;
  }

  /**
   * Read screenshot file as base64
   */
  async readScreenshotAsBase64(filepath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filepath);
      return buffer.toString("base64");
    } catch (error) {
      console.error("Failed to read screenshot:", error);
      throw error;
    }
  }

  /**
   * Cleanup old screenshots to maintain max limit
   */
  private async cleanupOldScreenshots(): Promise<void> {
    try {
      const screenshots = await this.getScreenshots();

      if (screenshots.length > config.maxScreenshots) {
        const toDelete = screenshots.slice(config.maxScreenshots);

        for (const screenshot of toDelete) {
          try {
            await fs.unlink(screenshot.path);
          } catch (error) {
            // Silently ignore deletion errors for old screenshots
          }
        }
      }
    } catch (error) {
      console.error("Failed to cleanup screenshots:", error);
    }
  }

  /**
   * Delete all screenshots
   */
  async clearAllScreenshots(): Promise<void> {
    try {
      const files = await fs.readdir(this.screenshotsDir);

      for (const file of files) {
        if (file.endsWith(".png")) {
          await fs.unlink(path.join(this.screenshotsDir, file));
        }
      }
    } catch (error) {
      console.error("Failed to clear screenshots:", error);
    }
  }

  /**
   * List recent screenshots with limit
   */
  async listRecentScreenshots(limit: number = 5): Promise<ScreenshotMetadata[]> {
    const screenshots = await this.getScreenshots();
    return screenshots.slice(0, limit);
  }

  /**
   * Compare two screenshots
   */
  async compareScreenshots(timestamp1: number, timestamp2: number): Promise<any> {
    const screenshot1 = await this.getScreenshotByTimestamp(timestamp1);
    const screenshot2 = await this.getScreenshotByTimestamp(timestamp2);

    if (!screenshot1 || !screenshot2) {
      throw new Error("One or both screenshots not found");
    }

    const timeDifference = Math.abs(timestamp2 - timestamp1);
    const changes: string[] = [];

    // Compare metadata
    if (screenshot1.deviceInfo?.name !== screenshot2.deviceInfo?.name) {
      changes.push(`Device changed from ${screenshot1.deviceInfo?.name} to ${screenshot2.deviceInfo?.name}`);
    }

    if (screenshot1.triggeredBy !== screenshot2.triggeredBy) {
      changes.push(`Trigger changed from "${screenshot1.triggeredBy}" to "${screenshot2.triggeredBy}"`);
    }

    // File changes comparison
    if (screenshot1.fileChanges && screenshot2.fileChanges) {
      const files1 = new Set(screenshot1.fileChanges.map(f => f.filepath));
      const files2 = new Set(screenshot2.fileChanges.map(f => f.filepath));
      
      const newFiles = [...files2].filter(f => !files1.has(f));
      if (newFiles.length > 0) {
        changes.push(`New files modified: ${newFiles.join(', ')}`);
      }
    }

    return {
      timestamp1,
      timestamp2,
      screenshot1,
      screenshot2,
      timeDifference,
      timeDifferenceFormatted: `${Math.floor(timeDifference / 1000)} seconds`,
      changes: changes.length > 0 ? changes : ['No significant metadata changes detected'],
    };
  }

  /**
   * Boot the iOS simulator
   */
  async bootSimulator(deviceName?: string): Promise<{ success: boolean; message: string; device?: DeviceInfo }> {
    try {
      // Check current status
      const status = await this.getSimulatorStatus();
      
      if (status.isRunning && status.bootedDevice) {
        return {
          success: true,
          message: `Simulator already running: ${status.bootedDevice.name}`,
          device: status.bootedDevice,
        };
      }

      // Find device to boot
      let targetDevice: DeviceInfo | undefined;
      
      if (deviceName) {
        targetDevice = status.devices.find(d => 
          d.name.toLowerCase().includes(deviceName.toLowerCase()) && 
          d.state === "Shutdown"
        );
      } else {
        // Find latest iPhone that's shutdown
        targetDevice = status.devices.find(d => 
          d.name.includes("iPhone") && 
          d.state === "Shutdown"
        );
      }

      if (!targetDevice) {
        return {
          success: false,
          message: "No available device found to boot. All devices may already be running or no devices match the criteria.",
        };
      }

      // Boot the device
      await execAsync(`xcrun simctl boot ${targetDevice.udid}`);
      
      // Wait a moment for it to boot
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Open Simulator.app
      await execAsync('open -a Simulator');

      return {
        success: true,
        message: `Successfully booted ${targetDevice.name}`,
        device: targetDevice,
      };
    } catch (error) {
      console.error("Failed to boot simulator:", error);
      return {
        success: false,
        message: `Failed to boot simulator: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Reload React Native app
   */
  async reloadApp(bundleId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const status = await this.getSimulatorStatus();
      
      if (!status.isRunning || !status.bootedDevice) {
        return {
          success: false,
          message: "No booted simulator found. Start the simulator first.",
        };
      }

      // Send reload command to React Native via simctl
      await execAsync(`xcrun simctl notify_post ${status.bootedDevice.udid} com.apple.mobile.simulator.service.reload`);
      
      return {
        success: true,
        message: "Reload command sent to React Native app",
      };
    } catch (error) {
      console.error("Failed to reload app:", error);
      return {
        success: false,
        message: `Failed to reload app: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Verify setup and dependencies
   */
  async verifySetup(): Promise<any> {
    const checks: any = {
      xcode: { passed: false, message: "" },
      simctl: { passed: false, message: "" },
      simulator: { passed: false, message: "" },
      node: { passed: false, message: "" },
      permissions: { passed: false, message: "" },
    };

    const issues: string[] = [];
    const fixCommands: string[] = [];

    // Check Xcode
    try {
      const { stdout } = await execAsync('xcodebuild -version');
      const version = stdout.split('\n')[0];
      checks.xcode = {
        passed: true,
        message: `Xcode is installed: ${version}`,
        version: version,
      };
    } catch (error) {
      checks.xcode = {
        passed: false,
        message: "Xcode is not installed or not in PATH",
        fixCommand: "Install Xcode from the Mac App Store",
      };
      issues.push("Xcode not found");
      fixCommands.push("Install Xcode from Mac App Store and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer");
    }

    // Check simctl
    try {
      const { stdout } = await execAsync('xcrun simctl help');
      checks.simctl = {
        passed: true,
        message: "xcrun simctl is available",
      };
    } catch (error) {
      checks.simctl = {
        passed: false,
        message: "xcrun simctl is not available",
        fixCommand: "Install Xcode Command Line Tools: xcode-select --install",
      };
      issues.push("simctl not available");
      fixCommands.push("xcode-select --install");
    }

    // Check Simulator.app
    try {
      await fs.access('/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app');
      checks.simulator = {
        passed: true,
        message: "iOS Simulator app found",
      };
    } catch (error) {
      checks.simulator = {
        passed: false,
        message: "iOS Simulator app not found",
        fixCommand: "Ensure Xcode is properly installed",
      };
      issues.push("Simulator.app not found");
      fixCommands.push("Reinstall Xcode or repair installation");
    }

    // Check Node.js version
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion >= 18) {
        checks.node = {
          passed: true,
          message: `Node.js version is compatible: ${nodeVersion}`,
          version: nodeVersion,
        };
      } else {
        checks.node = {
          passed: false,
          message: `Node.js version ${nodeVersion} is too old (need 18+)`,
          fixCommand: "Update Node.js to version 18 or higher",
        };
        issues.push("Node.js version too old");
        fixCommands.push("Update Node.js: https://nodejs.org/");
      }
    } catch (error) {
      checks.node = {
        passed: false,
        message: "Could not determine Node.js version",
      };
    }

    // Check permissions (can we execute commands)
    try {
      await execAsync('xcrun simctl list devices');
      checks.permissions = {
        passed: true,
        message: "Command execution permissions are correct",
      };
    } catch (error) {
      checks.permissions = {
        passed: false,
        message: "Permission issues detected when running simctl commands",
        fixCommand: "Check terminal permissions in System Settings > Privacy & Security",
      };
      issues.push("Permission issues");
      fixCommands.push("Grant terminal permissions in System Settings");
    }

    const allPassed = Object.values(checks).every((check: any) => check.passed);

    return {
      isValid: allPassed,
      checks,
      issues,
      fixCommands,
      summary: allPassed 
        ? "All checks passed! Your setup is ready to use."
        : `Found ${issues.length} issue(s) that need attention.`,
    };
  }
}
