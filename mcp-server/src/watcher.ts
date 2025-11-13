/**
 * File watcher for React Native UI changes
 */

import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import { config } from './config.js';
import { SimulatorManager } from './simulator.js';
import { RecentChange } from './types.js';

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private simulatorManager: SimulatorManager;
  private watchPath: string;
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingChanges: Set<string> = new Set();
  private isEnabled: boolean = true;
  private recentChanges: RecentChange[] = [];
  private maxRecentChanges: number = 50;

  constructor(simulatorManager: SimulatorManager, watchPath: string = process.cwd()) {
    this.simulatorManager = simulatorManager;
    this.watchPath = watchPath;
  }

  /**
   * Start watching for file changes
   */
  async start(): Promise<void> {
    if (this.watcher) {
      return;
    }

    this.watcher = chokidar.watch(config.watchPatterns, {
      cwd: this.watchPath,
      ignored: config.ignorePatterns,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    this.watcher.on('change', (filepath) => {
      if (this.isEnabled) {
        this.recordChange(filepath, 'change');
        this.handleFileChange(filepath);
      }
    });

    this.watcher.on('add', (filepath) => {
      if (this.isEnabled) {
        this.recordChange(filepath, 'add');
        this.handleFileChange(filepath);
      }
    });

    this.watcher.on('unlink', (filepath) => {
      if (this.isEnabled) {
        this.recordChange(filepath, 'unlink');
      }
    });

    this.watcher.on('error', (error) => {
      console.error('Watcher error:', error);
    });
  }

  /**
   * Stop watching for file changes
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      this.pendingChanges.clear();
    }
  }

  /**
   * Enable or disable automatic screenshot capture
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Handle file change event
   */
  private async handleFileChange(filepath: string): Promise<void> {
    // Check if this is likely a UI-related file
    const isUIRelated = await this.isUIRelatedChange(filepath);
    
    if (!isUIRelated) {
      return;
    }

    this.pendingChanges.add(filepath);

    // Debounce screenshot capture
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.captureScreenshotForChanges();
    }, config.debounceDelay);
  }

  /**
   * Determine if a file change is UI-related
   */
  private async isUIRelatedChange(filepath: string): Promise<boolean> {
    try {
      const ext = path.extname(filepath).toLowerCase();
      
      // Only consider JS/TS/JSX/TSX files
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        return false;
      }

      // Check if it's in a UI-related directory
      const lowerPath = filepath.toLowerCase();
      const uiDirs = ['components', 'screens', 'views', 'pages', 'app', 'src'];
      const isInUIDir = uiDirs.some(dir => lowerPath.includes(`/${dir}/`) || lowerPath.includes(`\\${dir}\\`));

      // Read file content to check for UI keywords
      const fullPath = path.join(this.watchPath, filepath);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const hasUIKeywords = config.uiKeywords.some(keyword => 
          content.includes(keyword)
        );

        return isInUIDir || hasUIKeywords;
      } catch {
        // If we can't read the file, fall back to directory check
        return isInUIDir;
      }
    } catch (error) {
      console.error(`Error checking if file is UI-related: ${filepath}`, error);
      return false;
    }
  }

  /**
   * Capture screenshot for accumulated changes
   */
  private async captureScreenshotForChanges(): Promise<void> {
    if (this.pendingChanges.size === 0) {
      return;
    }

    const changes = Array.from(this.pendingChanges);
    this.pendingChanges.clear();

    const triggeredBy = changes.length === 1 
      ? changes[0] 
      : `${changes.length} files: ${changes.slice(0, 3).join(', ')}${changes.length > 3 ? '...' : ''}`;

    // Get recent changes from last 5 minutes to include in metadata
    const recentFileChanges = this.getChangesFromLastMinutes(5);

    const metadata = await this.simulatorManager.captureScreenshot(
      undefined,
      triggeredBy
    );

    if (metadata) {
      // Add file changes to metadata
      metadata.fileChanges = recentFileChanges;
      metadata.suggestions = this.generateSuggestions(recentFileChanges);
    }
  }

  /**
   * Generate suggestions based on recent changes
   */
  private generateSuggestions(changes: RecentChange[]): string[] {
    const suggestions: string[] = [];

    if (changes.length === 0) {
      return suggestions;
    }

    // Count file types
    const componentFiles = changes.filter(c => 
      c.filepath.includes('component') || c.filepath.includes('Component')
    ).length;
    const screenFiles = changes.filter(c => 
      c.filepath.includes('screen') || c.filepath.includes('Screen')
    ).length;
    const styleFiles = changes.filter(c => 
      c.filepath.includes('style') || c.filepath.includes('Style')
    ).length;

    if (componentFiles > 0) {
      suggestions.push(`Check component rendering and layout for the ${componentFiles} component file(s) modified`);
    }
    if (screenFiles > 0) {
      suggestions.push(`Verify screen navigation and overall layout for the ${screenFiles} screen file(s) modified`);
    }
    if (styleFiles > 0) {
      suggestions.push(`Review styling changes, spacing, colors, and visual consistency`);
    }

    // Check for multiple files changed quickly
    if (changes.length > 5) {
      suggestions.push(`Multiple files changed (${changes.length}) - review for consistency across components`);
    }

    return suggestions;
  }

  /**
   * Get current watcher status
   */
  getStatus(): { isRunning: boolean; isEnabled: boolean; watchPath: string } {
    return {
      isRunning: this.watcher !== null,
      isEnabled: this.isEnabled,
      watchPath: this.watchPath
    };
  }

  /**
   * Record a file change
   */
  private recordChange(filepath: string, type: 'add' | 'change' | 'unlink'): void {
    const change: RecentChange = {
      filepath,
      timestamp: Date.now(),
      type,
    };

    this.recentChanges.unshift(change);

    // Keep only the most recent changes
    if (this.recentChanges.length > this.maxRecentChanges) {
      this.recentChanges = this.recentChanges.slice(0, this.maxRecentChanges);
    }
  }

  /**
   * Get recent changes
   */
  getRecentChanges(limit: number = 10): RecentChange[] {
    return this.recentChanges.slice(0, limit);
  }

  /**
   * Get changes since a specific timestamp
   */
  getChangesSince(timestamp: number): RecentChange[] {
    return this.recentChanges.filter(change => change.timestamp >= timestamp);
  }

  /**
   * Get changes from the last N minutes
   */
  getChangesFromLastMinutes(minutes: number): RecentChange[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.getChangesSince(cutoffTime);
  }

  /**
   * Clear recent changes history
   */
  clearChangeHistory(): void {
    this.recentChanges = [];
  }
}

