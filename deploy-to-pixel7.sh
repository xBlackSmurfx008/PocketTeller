#!/bin/bash

# Deploy PocketTeller to Pixel 7
# Run this script to install the updated app

echo "🚀 Deploying PocketTeller to Pixel 7..."

# Set Java home
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Navigate to project
cd /Users/mr.adams/pockettellerxchanges/PocketTeller

# Uninstall old version
echo "📱 Uninstalling old version..."
~/Library/Android/sdk/platform-tools/adb uninstall com.pocketteller.app

# Install new version
echo "📦 Installing updated app..."
~/Library/Android/sdk/platform-tools/adb install android/app/build/outputs/apk/debug/app-debug.apk

# Launch app
echo "🎉 Launching PocketTeller..."
~/Library/Android/sdk/platform-tools/adb shell am start -n com.pocketteller.app/.MainActivity

echo "✅ Deployment complete!"
echo "📱 Check your Pixel 7 - app should be running"
echo ""
echo "To view logs in real-time:"
echo "~/Library/Android/sdk/platform-tools/adb logcat | grep -i \"console\|plaid\|error\""

