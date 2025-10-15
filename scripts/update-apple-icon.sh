#!/bin/bash

# Script to update iOS app icon with your local apple icon file
# Usage: ./scripts/update-apple-icon.sh /path/to/your/apple-icon.png

if [ $# -eq 0 ]; then
    echo "Usage: $0 /path/to/your/apple-icon.png"
    echo "Example: $0 ~/Desktop/apple-icon.png"
    echo ""
    echo "This script will convert your apple icon to all required iOS sizes and replace the existing icons."
    exit 1
fi

APPLE_ICON="$1"

if [ ! -f "$APPLE_ICON" ]; then
    echo "Error: Apple icon file not found: $APPLE_ICON"
    exit 1
fi

echo "🎯 Updating iOS app icon with: $APPLE_ICON"

# iOS AppIcon directory
IOS_ICON_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"

if [ ! -d "$IOS_ICON_DIR" ]; then
    echo "Error: iOS AppIcon directory not found: $IOS_ICON_DIR"
    exit 1
fi

# Check if ImageMagick is installed (for image conversion)
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install imagemagick
    else
        echo "Please install ImageMagick first:"
        echo "brew install imagemagick"
        echo "Or download from: https://imagemagick.org/script/download.php"
        exit 1
    fi
fi

echo "📱 Converting apple icon to all required iOS sizes..."

# Create backup of existing icons
echo "💾 Creating backup of existing icons..."
mkdir -p "$IOS_ICON_DIR/backup"
cp "$IOS_ICON_DIR"/*.png "$IOS_ICON_DIR/backup/" 2>/dev/null || true

# Convert to all required iOS icon sizes
echo "🔄 Converting to 1024x1024 (App Store)..."
convert "$APPLE_ICON" -resize 1024x1024! "$IOS_ICON_DIR/AppIcon-1024x1024.png"

echo "🔄 Converting to 180x180 (iPhone 3x)..."
convert "$APPLE_ICON" -resize 180x180! "$IOS_ICON_DIR/AppIcon-180x180.png"

echo "🔄 Converting to 167x167 (iPad Pro 2x)..."
convert "$APPLE_ICON" -resize 167x167! "$IOS_ICON_DIR/AppIcon-167x167.png"

echo "🔄 Converting to 152x152 (iPad 2x)..."
convert "$APPLE_ICON" -resize 152x152! "$IOS_ICON_DIR/AppIcon-152x152.png"

echo "🔄 Converting to 120x120 (iPhone 2x)..."
convert "$APPLE_ICON" -resize 120x120! "$IOS_ICON_DIR/AppIcon-120x120.png"

echo "🔄 Converting to 76x76 (iPad 1x)..."
convert "$APPLE_ICON" -resize 76x76! "$IOS_ICON_DIR/AppIcon-76x76.png"

echo "✅ All iOS icon sizes created successfully!"

# Verify files were created
echo "🔍 Verifying icon files..."
for size in 1024x1024 180x180 167x167 152x152 120x120 76x76; do
    if [ -f "$IOS_ICON_DIR/AppIcon-$size.png" ]; then
        echo "✅ AppIcon-$size.png created"
    else
        echo "❌ Failed to create AppIcon-$size.png"
    fi
done

echo ""
echo "🎉 iOS icon update complete!"
echo ""
echo "Next steps:"
echo "1. npm run build"
echo "2. npx cap sync ios"
echo "3. Open Xcode and build your iOS app"
echo ""
echo "Your new apple icon will now appear on iOS devices!"
