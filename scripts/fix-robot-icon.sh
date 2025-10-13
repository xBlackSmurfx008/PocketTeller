#!/bin/bash

# Script to fix robot icon sizing and placement
# This script will help you create properly sized icons from your robot image

echo "🤖 Robot Icon Fix Script"
echo "========================="

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install imagemagick
        else
            echo "Please install ImageMagick: https://imagemagick.org/script/download.php"
            exit 1
        fi
    else
        echo "Please install ImageMagick: https://imagemagick.org/script/download.php"
        exit 1
    fi
fi

echo "✅ ImageMagick found"

# Check if robot icon exists
if [ ! -f "public/lovable-uploads/robot-icon.png" ]; then
    echo "❌ Robot icon not found at public/lovable-uploads/robot-icon.png"
    echo ""
    echo "Please:"
    echo "1. Save your robot image as 'robot-icon.png'"
    echo "2. Place it in 'public/lovable-uploads/' directory"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Robot icon found"

# Create web icon variants
echo "📱 Creating web icon variants..."
convert "public/lovable-uploads/robot-icon.png" -resize 16x16 "public/lovable-uploads/robot-icon-16x16.png"
convert "public/lovable-uploads/robot-icon.png" -resize 32x32 "public/lovable-uploads/robot-icon-32x32.png"
convert "public/lovable-uploads/robot-icon.png" -resize 57x57 "public/lovable-uploads/robot-icon-57x57.png"
convert "public/lovable-uploads/robot-icon.png" -resize 60x60 "public/lovable-uploads/robot-icon-60x60.png"
convert "public/lovable-uploads/robot-icon.png" -resize 72x72 "public/lovable-uploads/robot-icon-72x72.png"
convert "public/lovable-uploads/robot-icon.png" -resize 76x76 "public/lovable-uploads/robot-icon-76x76.png"
convert "public/lovable-uploads/robot-icon.png" -resize 114x114 "public/lovable-uploads/robot-icon-114x114.png"
convert "public/lovable-uploads/robot-icon.png" -resize 120x120 "public/lovable-uploads/robot-icon-120x120.png"
convert "public/lovable-uploads/robot-icon.png" -resize 144x144 "public/lovable-uploads/robot-icon-144x144.png"
convert "public/lovable-uploads/robot-icon.png" -resize 152x152 "public/lovable-uploads/robot-icon-152x152.png"
convert "public/lovable-uploads/robot-icon.png" -resize 167x167 "public/lovable-uploads/robot-icon-167x167.png"
convert "public/lovable-uploads/robot-icon.png" -resize 180x180 "public/lovable-uploads/robot-icon-180x180.png"

# Create iOS icon (1024x1024)
echo "🍎 Creating iOS icon..."
convert "public/lovable-uploads/robot-icon.png" -resize 1024x1024 "ios/App/App/Assets.xcassets/AppIcon.appiconset/robot-icon.png"

# Create Android icons for all densities
echo "🤖 Creating Android icons..."

# Android icon sizes for different densities
declare -A android_sizes=(
    ["mipmap-mdpi"]="48"
    ["mipmap-hdpi"]="72"
    ["mipmap-xhdpi"]="96"
    ["mipmap-xxhdpi"]="144"
    ["mipmap-xxxhdpi"]="192"
)

for dir in "${!android_sizes[@]}"; do
    size="${android_sizes[$dir]}"
    if [ -d "android/app/src/main/res/$dir" ]; then
        echo "  Creating $dir icons (${size}x${size})"
        convert "public/lovable-uploads/robot-icon.png" -resize ${size}x${size} "android/app/src/main/res/$dir/ic_launcher.png"
        convert "public/lovable-uploads/robot-icon.png" -resize ${size}x${size} "android/app/src/main/res/$dir/ic_launcher_foreground.png"
        convert "public/lovable-uploads/robot-icon.png" -resize ${size}x${size} "android/app/src/main/res/$dir/ic_launcher_round.png"
    fi
done

# Create Open Graph image (1200x630)
echo "🌐 Creating Open Graph image..."
convert "public/lovable-uploads/robot-icon.png" -resize 1200x630! "public/lovable-uploads/robot-og-image.png"

echo ""
echo "✅ All icons created successfully!"
echo ""
echo "Next steps:"
echo "1. npm run build"
echo "2. npx cap sync ios && npx cap sync android"
echo "3. Test your app!"
echo ""
echo "Icon files created:"
echo "📱 Web: 12 different sizes in public/lovable-uploads/"
echo "🍎 iOS: robot-icon.png in ios/App/App/Assets.xcassets/AppIcon.appiconset/"
echo "🤖 Android: All densities in android/app/src/main/res/mipmap-*/"
echo "🌐 Social: robot-og-image.png for sharing"
