/**
 * Type definitions for the iOS Simulator MCP Server
 */

export interface ScreenshotMetadata {
  timestamp: number;
  filename: string;
  path: string;
  deviceInfo?: DeviceInfo;
  triggeredBy?: string;
  description?: string;
  fileChanges?: RecentChange[];
  suggestions?: string[];
}

export interface DeviceInfo {
  udid: string;
  name: string;
  state: string;
  runtime: string;
}

export interface SimulatorStatus {
  isRunning: boolean;
  devices: DeviceInfo[];
  bootedDevice?: DeviceInfo;
}

export interface EnhancedSimulatorStatus extends SimulatorStatus {
  healthCheck: HealthCheck;
  suggestions: string[];
  nextActions: string[];
  autoFixAvailable: boolean;
}

export interface HealthCheck {
  xcodeInstalled: boolean;
  simctlAvailable: boolean;
  simulatorAppFound: boolean;
  nodeVersionValid: boolean;
  issues: string[];
}

export interface ScreenshotComparison {
  timestamp1: number;
  timestamp2: number;
  screenshot1: ScreenshotMetadata;
  screenshot2: ScreenshotMetadata;
  timeDifference: number;
  changes: string[];
}

export interface SetupVerification {
  isValid: boolean;
  checks: {
    xcode: VerificationCheck;
    simctl: VerificationCheck;
    simulator: VerificationCheck;
    node: VerificationCheck;
    permissions: VerificationCheck;
  };
  issues: string[];
  fixCommands: string[];
}

export interface VerificationCheck {
  passed: boolean;
  message: string;
  version?: string;
  fixCommand?: string;
}

export interface RecentChange {
  filepath: string;
  timestamp: number;
  type: 'add' | 'change' | 'unlink';
}

export interface EnhancedError {
  error: string;
  reason: string;
  suggestion: string;
  command?: string;
  autoFixAvailable: boolean;
}

