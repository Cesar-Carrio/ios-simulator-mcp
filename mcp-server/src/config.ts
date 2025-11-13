/**
 * Configuration for the iOS Simulator MCP Server
 */

import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  // Screenshot storage directory
  screenshotsDir: path.join(os.homedir(), 'emcap-screenshots'),
  
  // Maximum number of screenshots to keep
  maxScreenshots: 50,
  
  // File patterns to watch for UI changes
  watchPatterns: [
    '**/*.tsx',
    '**/*.jsx',
    '**/*.ts',
    '**/*.js'
  ],
  
  // Directories to exclude from watching
  ignorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/android/**',
    '**/__tests__/**',
    '**/*.test.*',
    '**/*.spec.*'
  ],
  
  // Debounce delay in milliseconds
  debounceDelay: 2000,
  
  // UI-related keywords to detect UI changes
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
    'render',
    'return',
    'jsx',
    'tsx'
  ]
};

