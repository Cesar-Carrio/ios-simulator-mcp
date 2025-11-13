#!/bin/bash

# Verification script for iOS Simulator MCP Server installation

echo "🔍 Verifying iOS Simulator MCP Extension Installation..."
echo ""

ERRORS=0

# Check if in correct directory
if [ ! -f "install-mcp.sh" ]; then
    echo "❌ Error: Run this script from the emCap project root"
    exit 1
fi

echo "✅ In correct directory"

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    ERRORS=$((ERRORS + 1))
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js installed: $NODE_VERSION"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    ERRORS=$((ERRORS + 1))
else
    NPM_VERSION=$(npm -v)
    echo "✅ npm installed: $NPM_VERSION"
fi

# Check xcrun (iOS simulator tools)
if ! command -v xcrun &> /dev/null; then
    echo "❌ xcrun not found - Xcode may not be installed"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ xcrun available (Xcode tools)"
fi

# Check if TypeScript files exist
if [ ! -f "mcp-server/src/index.ts" ]; then
    echo "❌ Source files missing"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Source files present"
fi

# Check if dependencies are installed
if [ ! -d "mcp-server/node_modules" ]; then
    echo "⚠️  Dependencies not installed - run ./install-mcp.sh"
else
    echo "✅ Dependencies installed"
fi

# Check if built
if [ ! -f "mcp-server/dist/index.js" ]; then
    echo "⚠️  Server not built - run ./install-mcp.sh"
else
    echo "✅ Server built"
fi

# Check configuration files
if [ ! -f "cursor-mcp-config.json" ]; then
    echo "❌ cursor-mcp-config.json missing"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Cursor config present"
fi

# Check documentation
if [ ! -f "README.md" ]; then
    echo "❌ README.md missing"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Documentation present"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed!"
    echo ""
    echo "Next steps:"
    echo "1. Run: ./install-mcp.sh (if not done yet)"
    echo "2. Add config to Cursor settings"
    echo "3. Restart Cursor"
    echo "4. Start iOS simulator"
    echo "5. Ask AI to capture a screenshot!"
else
    echo "❌ Found $ERRORS error(s)"
    echo ""
    echo "Please fix the errors above before proceeding."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

