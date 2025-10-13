#!/bin/bash

echo "📱 Installing PocketTeller to Pixel 7..."
echo ""

# Set Java home
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

cd /Users/mr.adams/pockettellerxchanges/PocketTeller

# Build
echo "1️⃣ Building web assets..."
npm run build --silent

# Sync
echo "2️⃣ Syncing to Android..."
npx cap sync android

# Build APK
echo "3️⃣ Building APK..."
cd android && ./gradlew assembleDebug --quiet
cd ..

# Uninstall old
echo "4️⃣ Uninstalling old version..."
~/Library/Android/sdk/platform-tools/adb uninstall com.pocketteller.app 2>/dev/null

# Install new
echo "5️⃣ Installing new version..."
~/Library/Android/sdk/platform-tools/adb install android/app/build/outputs/apk/debug/app-debug.apk

# Launch
echo "6️⃣ Launching app..."
~/Library/Android/sdk/platform-tools/adb shell am start -n com.pocketteller.app/.MainActivity

echo ""
echo "✅ Installation complete!"
echo "📱 App should be running on your Pixel 7"
echo ""
echo "To see console logs, open Chrome and go to: chrome://inspect#devices"

