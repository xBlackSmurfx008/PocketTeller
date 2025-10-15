#!/bin/bash
# iOS Rebuild Script - PocketTeller
# Use this script to rebuild iOS app after code changes

set -e  # Exit on error

PROJECT_ROOT="/Users/mr.adams/pockettellerxchanges/PocketTeller"

echo "🧹 Cleaning iOS assets..."
rm -rf "$PROJECT_ROOT/ios/App/App/public/"*

echo "🔨 Building web app..."
cd "$PROJECT_ROOT"
npm run build

echo "📱 Syncing to iOS..."
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx cap sync ios

echo "✅ iOS rebuild complete!"
echo ""
echo "Next steps:"
echo "  1. cd ios/App && open App.xcworkspace"
echo "  2. Select device/simulator in Xcode"
echo "  3. Press Play button (Cmd+R)"
echo "  4. Debug in Safari: Develop → [Device] → PocketTeller"
echo ""

