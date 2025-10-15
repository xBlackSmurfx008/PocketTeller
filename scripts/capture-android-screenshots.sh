#!/bin/bash

# Android Screenshot Capture Script for Google Play Store
# Captures screenshots from connected device or emulator

echo "📸 PocketTeller - Android Screenshot Capture"
echo "============================================="
echo ""

# Create screenshots directory
SCREENSHOTS_DIR="../play-store-assets/screenshots"
mkdir -p "$SCREENSHOTS_DIR"

echo "✓ Screenshots will be saved to: $SCREENSHOTS_DIR"
echo ""

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ Error: No Android device or emulator connected"
    echo "Please connect a device or start an emulator and try again."
    exit 1
fi

echo "✓ Device connected"
echo ""
echo "Instructions:"
echo "1. Navigate to each screen in the app"
echo "2. Press ENTER to capture screenshot"
echo "3. Screenshot will be saved automatically"
echo ""
echo "Ready to capture? Press ENTER to start..."
read

# Screenshot 1: Auth/Welcome Screen
echo "📱 Screenshot 1: Auth/Welcome Screen"
echo "   Navigate to the authentication/welcome screen"
echo "   Press ENTER when ready..."
read
adb shell screencap -p /sdcard/screenshot1.png
adb pull /sdcard/screenshot1.png "$SCREENSHOTS_DIR/01-welcome-auth.png"
adb shell rm /sdcard/screenshot1.png
echo "   ✓ Saved: 01-welcome-auth.png"
echo ""

# Screenshot 2: Dashboard
echo "📱 Screenshot 2: Dashboard"
echo "   Navigate to the main dashboard"
echo "   Press ENTER when ready..."
read
adb shell screencap -p /sdcard/screenshot2.png
adb pull /sdcard/screenshot2.png "$SCREENSHOTS_DIR/02-dashboard.png"
adb shell rm /sdcard/screenshot2.png
echo "   ✓ Saved: 02-dashboard.png"
echo ""

# Screenshot 3: Accounts View
echo "📱 Screenshot 3: Accounts View"
echo "   Navigate to accounts list (showing multiple connected accounts)"
echo "   Press ENTER when ready..."
read
adb shell screencap -p /sdcard/screenshot3.png
adb pull /sdcard/screenshot3.png "$SCREENSHOTS_DIR/03-accounts.png"
adb shell rm /sdcard/screenshot3.png
echo "   ✓ Saved: 03-accounts.png"
echo ""

# Screenshot 4: Transactions
echo "📱 Screenshot 4: Transactions"
echo "   Navigate to transactions list"
echo "   Press ENTER when ready..."
read
adb shell screencap -p /sdcard/screenshot4.png
adb pull /sdcard/screenshot4.png "$SCREENSHOTS_DIR/04-transactions.png"
adb shell rm /sdcard/screenshot4.png
echo "   ✓ Saved: 04-transactions.png"
echo ""

# Screenshot 5: Budget
echo "📱 Screenshot 5: Budget/Goals"
echo "   Navigate to budget or goals screen"
echo "   Press ENTER when ready..."
read
adb shell screencap -p /sdcard/screenshot5.png
adb pull /sdcard/screenshot5.png "$SCREENSHOTS_DIR/05-budget-goals.png"
adb shell rm /sdcard/screenshot5.png
echo "   ✓ Saved: 05-budget-goals.png"
echo ""

# Screenshot 6: AI Coaching
echo "📱 Screenshot 6: AI Coaching Chat"
echo "   Navigate to AI coaching/chat screen"
echo "   Press ENTER when ready..."
read
adb shell screencap -p /sdcard/screenshot6.png
adb pull /sdcard/screenshot6.png "$SCREENSHOTS_DIR/06-ai-coaching.png"
adb shell rm /sdcard/screenshot6.png
echo "   ✓ Saved: 06-ai-coaching.png"
echo ""

# Screenshot 7: Insights
echo "📱 Screenshot 7: Spending Insights"
echo "   Navigate to spending insights/analytics screen"
echo "   Press ENTER when ready..."
read
adb shell screencap -p /sdcard/screenshot7.png
adb pull /sdcard/screenshot7.png "$SCREENSHOTS_DIR/07-insights.png"
adb shell rm /sdcard/screenshot7.png
echo "   ✓ Saved: 07-insights.png"
echo ""

# Screenshot 8 (Optional): Settings
echo "📱 Screenshot 8: Settings (Optional)"
echo "   Navigate to settings screen"
echo "   Press ENTER to capture, or Ctrl+C to skip..."
read
adb shell screencap -p /sdcard/screenshot8.png
adb pull /sdcard/screenshot8.png "$SCREENSHOTS_DIR/08-settings.png"
adb shell rm /sdcard/screenshot8.png
echo "   ✓ Saved: 08-settings.png"
echo ""

echo "✅ Screenshot capture complete!"
echo ""
echo "Screenshots saved to: $SCREENSHOTS_DIR"
echo ""
echo "Next steps:"
echo "1. Review screenshots and ensure they look good"
echo "2. You can add text overlays or captions using an image editor"
echo "3. Upload to Google Play Console"
echo ""
echo "Recommended dimensions: 1080x1920 (portrait)"
echo "Format: PNG or JPEG"
echo ""

