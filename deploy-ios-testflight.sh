#!/bin/bash

# PocketTeller - iOS TestFlight Deployment Script
# Automated deployment to TestFlight using Apple's official tools
# Last Updated: October 15, 2025

set -e  # Exit on error

echo "🚀 PocketTeller - iOS TestFlight Deployment"
echo "=========================================="
echo ""

# Configuration
APP_NAME="App"
SCHEME="App"
WORKSPACE="App/App.xcworkspace"
EXPORT_OPTIONS="exportOptions.plist"
API_KEY="V43L3BZNA9"
API_ISSUER="e63db961-afb6-44db-a75b-64174d1dea17"
PROJECT_ROOT="/Users/mr.adams/pockettellerxchanges/PocketTeller"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root"
    echo "   Current directory: $(pwd)"
    echo "   Expected: $PROJECT_ROOT"
    exit 1
fi

# Check if API key exists
if [ ! -f "$HOME/.appstoreconnect/private_keys/AuthKey_$API_KEY.p8" ]; then
    echo "❌ Error: API key not found"
    echo "   Expected location: $HOME/.appstoreconnect/private_keys/AuthKey_$API_KEY.p8"
    echo ""
    echo "Run this to fix:"
    echo "  mkdir -p ~/.appstoreconnect/private_keys"
    echo "  cp ios/AuthKey_$API_KEY.p8 ~/.appstoreconnect/private_keys/"
    echo "  chmod 600 ~/.appstoreconnect/private_keys/AuthKey_$API_KEY.p8"
    exit 1
fi

echo "✅ Pre-flight checks passed"
echo ""

# Set locale for iOS builds
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Step 1: Clean iOS assets
echo "🧹 Cleaning iOS assets..."
rm -rf ios/App/App/public/*
echo ""

# Step 2: Build web app
echo "📦 Building web app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Web app build failed"
    exit 1
fi
echo ""

# Step 3: Sync to iOS
echo "🔄 Syncing to iOS..."
npx cap sync ios
if [ $? -ne 0 ]; then
    echo "❌ iOS sync failed"
    exit 1
fi
echo ""

# Step 4: Navigate to iOS directory
cd ios

# Check if exportOptions.plist exists
if [ ! -f "$EXPORT_OPTIONS" ]; then
    echo "⚠️  Creating exportOptions.plist..."
    cat > "$EXPORT_OPTIONS" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>Z3L3NYSA9D</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOF
    echo "✅ Created exportOptions.plist"
    echo ""
fi

# Step 5: Create archive
echo "📦 Creating archive..."
TIMESTAMP=$(date +"%Y-%m-%d %H.%M.%S")
ARCHIVE_DIR="$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)"
mkdir -p "$ARCHIVE_DIR"
ARCHIVE_PATH="$ARCHIVE_DIR/App $TIMESTAMP.xcarchive"

xcodebuild -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -archivePath "$ARCHIVE_PATH" \
  archive

if [ $? -ne 0 ]; then
    echo "❌ Archive creation failed"
    exit 1
fi
echo "✅ Archive created: $ARCHIVE_PATH"
echo ""

# Step 6: Export IPA
echo "📤 Exporting IPA..."
rm -rf ./build
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath ./build \
  -exportOptionsPlist "$EXPORT_OPTIONS"

if [ $? -ne 0 ]; then
    echo "❌ IPA export failed"
    exit 1
fi

# Check if IPA was created
if [ ! -f "./build/App.ipa" ]; then
    echo "❌ IPA file not found at ./build/App.ipa"
    exit 1
fi

IPA_SIZE=$(ls -lh ./build/App.ipa | awk '{print $5}')
echo "✅ IPA exported: $IPA_SIZE"
echo ""

# Step 7: Upload to TestFlight
echo "☁️  Uploading to TestFlight..."
echo "This may take 2-5 minutes depending on your connection..."
echo ""

xcrun altool --upload-app \
  --type ios \
  --file build/App.ipa \
  --apiKey "$API_KEY" \
  --apiIssuer "$API_ISSUER"

if [ $? -ne 0 ]; then
    echo "❌ Upload failed"
    echo ""
    echo "IPA is ready at: $(pwd)/build/App.ipa"
    echo "You can retry upload with:"
    echo "  cd ios"
    echo "  xcrun altool --upload-app --type ios --file build/App.ipa --apiKey $API_KEY --apiIssuer $API_ISSUER"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📱 Next Steps:"
echo "  1. Check your email for build processing confirmation"
echo "  2. Go to App Store Connect: https://appstoreconnect.apple.com"
echo "  3. Navigate to: My Apps → PocketTeller → TestFlight"
echo "  4. Your build will be ready in 5-30 minutes"
echo ""
echo "📊 Build Info:"
echo "  Archive: $ARCHIVE_PATH"
echo "  IPA Size: $IPA_SIZE"
echo "  Upload Time: $(date)"
echo ""
echo "🎉 Your app is on its way to TestFlight!"
echo ""

