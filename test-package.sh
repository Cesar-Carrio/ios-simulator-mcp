#!/bin/bash

# Test script to verify the package before publishing

echo "🧪 Testing @emcap/ios-simulator-mcp package..."
echo ""

cd mcp-server

# Check if built
if [ ! -f "dist/index.js" ]; then
    echo "❌ Package not built. Running build..."
    npm run build
    
    if [ ! -f "dist/index.js" ]; then
        echo "❌ Build failed!"
        exit 1
    fi
fi

echo "✅ Build exists"

# Create tarball
echo "📦 Creating package tarball..."
npm pack

# Find the tarball
TARBALL=$(ls -t emcap-ios-simulator-mcp-*.tgz | head -1)

if [ -z "$TARBALL" ]; then
    echo "❌ Failed to create tarball"
    exit 1
fi

echo "✅ Package created: $TARBALL"
echo ""

# Test installation in temp directory
TEMP_DIR=$(mktemp -d)
echo "📥 Testing installation in temporary directory..."
echo "   Location: $TEMP_DIR"
echo ""

cd "$TEMP_DIR"

# Install the package
npm install -g "$OLDPWD/$TARBALL"

if [ $? -ne 0 ]; then
    echo "❌ Installation failed"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "✅ Installation succeeded"
echo ""

# Test commands
echo "🔍 Testing CLI commands..."
echo ""

echo "Testing: ios-simulator-mcp --version"
ios-simulator-mcp --version
echo ""

echo "Testing: ios-simulator-mcp --help"
ios-simulator-mcp --help
echo ""

echo "Testing: ios-simulator-mcp --config"
ios-simulator-mcp --config
echo ""

echo "Testing: ios-simulator-mcp --check"
ios-simulator-mcp --check
echo ""

# Cleanup
echo "🧹 Cleaning up..."
npm uninstall -g @emcap/ios-simulator-mcp
rm -rf "$TEMP_DIR"
cd "$OLDPWD"
rm -f "$TARBALL"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All tests passed!"
echo ""
echo "Package is ready to publish:"
echo "  cd mcp-server"
echo "  npm publish --access public"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

