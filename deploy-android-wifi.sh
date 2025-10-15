#!/bin/bash

# PocketTeller Android WiFi Deployment Script
# Builds and prepares Android app for WiFi installation

set -e  # Exit on error

echo "🤖 PocketTeller - Android WiFi Deployment"
echo "=========================================="
echo ""

# Set Java 21 (required for Capacitor 7)
echo "☕ Setting up Java 21..."
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"
java -version
echo ""

# Build web app
echo "📦 Building web app..."
npm run build
echo ""

# Sync to Android
echo "🔄 Syncing to Android..."
npx cap sync android
echo ""

# Build APK
echo "🏗️  Building Android APK..."
cd android
./gradlew assembleDebug
cd ..
echo ""

# Copy to Desktop for easy access
echo "📋 Copying APK to Desktop..."
cp android/app/build/outputs/apk/debug/app-debug.apk ~/Desktop/PocketTeller.apk
echo "   ✅ APK saved to: ~/Desktop/PocketTeller.apk"
echo ""

# Get WiFi IP address
WIFI_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

# Check if any devices are connected
CONNECTED_DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)
FIRST_DEVICE=$(adb devices | awk '/device$/{print $1; exit}')

# Attempt WiFi connect if no devices and ADB_WIFI is set (e.g. ADB_WIFI=192.168.1.98:5555)
if [ "$CONNECTED_DEVICES" -eq 0 ] && [ -n "$ADB_WIFI" ]; then
  echo "📶 No devices connected. Attempting adb connect to $ADB_WIFI ..."
  adb connect "$ADB_WIFI" || true
  CONNECTED_DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)
  FIRST_DEVICE=$(adb devices | awk '/device$/{print $1; exit}')
fi

# Auto-install to single connected device
if [ "$CONNECTED_DEVICES" -eq 1 ] && [ -n "$FIRST_DEVICE" ]; then
  echo "📲 Installing APK to $FIRST_DEVICE ..."
  adb -s "$FIRST_DEVICE" install -r android/app/build/outputs/apk/debug/app-debug.apk || true
  echo "🚀 Launching app on $FIRST_DEVICE ..."
  adb -s "$FIRST_DEVICE" shell monkey -p com.pocketteller.app -c android.intent.category.LAUNCHER 1 || true
  echo "✅ Install & launch complete."
fi

echo "=========================================="
echo "✅ Build Complete!"
echo "=========================================="
echo ""
echo "📱 INSTALLATION OPTIONS:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Option 1: WiFi ADB (Fastest)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "On your Android device:"
echo "  1. Settings → Developer Options → Wireless Debugging"
echo "  2. Tap 'Pair device with pairing code'"
echo "  3. Note the IP:PORT and 6-digit code"
echo ""
echo "On this computer:"
echo "  \$ adb pair YOUR_DEVICE_IP:PORT"
echo "  (Enter pairing code when prompted)"
echo "  \$ adb connect YOUR_DEVICE_IP:5555"
echo "  \$ adb install -r android/app/build/outputs/apk/debug/app-debug.apk"
echo ""

if [ "$CONNECTED_DEVICES" -gt 0 ]; then
    echo "🟢 ADB devices currently connected:"
    adb devices
    echo ""
    echo "Quick install command:"
    echo "  \$ adb install -r android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
else
    echo "ℹ️  No ADB devices detected. To auto-connect over WiFi next time, export ADB_WIFI=YOUR_DEVICE_IP:PORT"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Option 2: Transfer APK File"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "APK Location: ~/Desktop/PocketTeller.apk"
echo ""
echo "Transfer methods:"
echo "  • Email the APK to yourself"
echo "  • Upload to Google Drive/Dropbox"
echo "  • Use a file transfer app"
echo "  • Visit snapdrop.net on both devices"
echo ""
echo "Then on Android:"
echo "  • Download the APK"
echo "  • Tap to install"
echo "  • Enable 'Install from Unknown Sources' if prompted"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Option 3: Local Web Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Start a web server (run in a new terminal):"
echo "  \$ cd android/app/build/outputs/apk/debug"
echo "  \$ python3 -m http.server 8000"
echo ""
echo "Then on your Android device browser, visit:"
echo "  http://$WIFI_IP:8000"
echo ""
echo "Tap 'app-debug.apk' to download and install"
echo ""

echo "=========================================="
echo "📊 Build Info"
echo "=========================================="
echo "APK Size: $(du -h android/app/build/outputs/apk/debug/app-debug.apk | cut -f1)"
echo "Your WiFi IP: $WIFI_IP"
echo "Build Date: $(date)"
echo ""
echo "🎉 Ready to install on your Android device!"

