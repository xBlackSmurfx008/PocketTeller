#!/bin/bash

# PocketTeller iOS WiFi Deployment Script
# Builds and prepares iOS app for wireless installation

set -e  # Exit on error

echo "🍎 PocketTeller - iOS WiFi Deployment"
echo "======================================"
echo ""

# Set UTF-8 locale (required for iOS builds)
echo "🌍 Setting up locale..."
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
echo ""

# Clean iOS assets (prevents stale files)
echo "🧹 Cleaning iOS assets..."
rm -rf ios/App/App/public/*
echo ""

# Build web app
echo "📦 Building web app..."
npm run build
echo ""

# Sync to iOS
echo "🔄 Syncing to iOS..."
npx cap sync ios
echo ""

# Check if CocoaPods needs installation
if [ ! -d "ios/App/Pods" ]; then
    echo "📦 Installing CocoaPods dependencies..."
    cd ios/App
    pod install
    cd ../..
    echo ""
fi

echo "======================================"
echo "✅ Build Complete!"
echo "======================================"
echo ""
echo "📱 INSTALLATION OPTIONS:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Option 1: Xcode Wireless (Recommended)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Opening Xcode now..."
echo ""

# Open Xcode
cd ios/App
open App.xcworkspace

echo "In Xcode:"
echo ""
echo "First-Time Setup (if not already paired):"
echo "  1. Connect iPhone via USB cable"
echo "  2. Window → Devices and Simulators"
echo "  3. Select your iPhone"
echo "  4. Check ✅ 'Connect via network'"
echo "  5. Wait for network icon (📶) to appear"
echo "  6. Disconnect USB cable"
echo ""
echo "Build & Install:"
echo "  1. Select your device from device dropdown"
echo "     (Should show 📶 icon if wireless)"
echo "  2. Press Cmd+R to build and run"
echo "  3. App will install and launch on your iPhone"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Option 2: TestFlight (For Multiple Users)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Best for distributing to multiple testers:"
echo ""
echo "Setup:"
echo "  1. In Xcode: Product → Archive"
echo "  2. Distribute App → App Store Connect"
echo "  3. Upload to TestFlight"
echo "  4. In App Store Connect, add testers"
echo "  5. Testers install via TestFlight app"
echo ""
echo "Learn more:"
echo "  https://developer.apple.com/testflight/"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Option 3: Command Line Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If your device is already paired wirelessly:"
echo ""
echo "List available devices:"
echo "  \$ xcrun xctrace list devices"
echo ""
echo "Build and deploy (replace YOUR_DEVICE_NAME):"
echo "  \$ xcodebuild -workspace ios/App/App.xcworkspace \\"
echo "      -scheme App \\"
echo "      -configuration Debug \\"
echo "      -destination 'platform=iOS,name=YOUR_DEVICE_NAME' \\"
echo "      build"
echo ""

echo "======================================"
echo "🔍 Troubleshooting"
echo "======================================"
echo ""
echo "Device not showing in Xcode?"
echo "  • Reconnect via USB once"
echo "  • Re-enable 'Connect via network'"
echo "  • Restart Xcode"
echo ""
echo "Build errors?"
echo "  • Clean build folder: Cmd+Shift+K"
echo "  • Close and reopen Xcode"
echo "  • Check iOS_PRODUCTION_GUIDE.md"
echo ""
echo "'Untrusted Developer' message?"
echo "  • Settings → General → VPN & Device Management"
echo "  • Trust your developer certificate"
echo ""

echo "======================================"
echo "📚 Documentation"
echo "======================================"
echo ""
echo "Complete iOS Guide: iOS_PRODUCTION_GUIDE.md"
echo "WiFi Installation: WIFI_INSTALLATION_GUIDE.md"
echo "Quick Start: START_HERE.md"
echo ""

echo "🎉 Ready to deploy to your iPhone!"
echo ""
echo "Note: Xcode should be opening now..."
echo "      Select your device and press Cmd+R to build!"

