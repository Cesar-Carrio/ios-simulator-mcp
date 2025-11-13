#!/bin/bash

# Installation script for iOS Simulator MCP Server

echo "Installing iOS Simulator MCP Server..."

# Navigate to mcp-server directory
cd "$(dirname "$0")/mcp-server"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the TypeScript project
echo "Building project..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "Error: Build failed. dist/index.js not found."
    exit 1
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Add the MCP server to your Cursor settings:"
echo "   - Open Cursor Settings (Cmd+,)"
echo "   - Go to 'Features' → 'Model Context Protocol'"
echo "   - Click 'Add Server'"
echo "   - Use the configuration from cursor-mcp-config.json"
echo ""
echo "2. Or manually add to Cursor's config.json:"
echo ""
echo '   "mcpServers": {'
echo '     "ios-simulator": {'
echo '       "command": "node",'
echo "       \"args\": [\"$(pwd)/dist/index.js\"]"
echo '     }'
echo '   }'
echo ""
echo "3. Restart Cursor to load the MCP server"
echo ""
echo "4. Start your iOS simulator and try capturing a screenshot!"
echo ""

