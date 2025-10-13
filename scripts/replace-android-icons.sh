#!/bin/bash

# Script to replace all Android app icons with a single robot icon
# Usage: ./scripts/replace-android-icons.sh /path/to/robot-icon.png

if [ $# -eq 0 ]; then
    echo "Usage: $0 /path/to/robot-icon.png"
    echo "Example: $0 public/lovable-uploads/robot-icon.png"
    exit 1
fi

ROBOT_ICON="$1"

if [ ! -f "$ROBOT_ICON" ]; then
    echo "Error: Robot icon file not found: $ROBOT_ICON"
    exit 1
fi

echo "Replacing Android icons with: $ROBOT_ICON"

# Android mipmap directories
MIPMAP_DIRS=(
    "android/app/src/main/res/mipmap-hdpi"
    "android/app/src/main/res/mipmap-mdpi"
    "android/app/src/main/res/mipmap-xhdpi"
    "android/app/src/main/res/mipmap-xxhdpi"
    "android/app/src/main/res/mipmap-xxxhdpi"
)

# Copy robot icon to each mipmap directory as all required files
for dir in "${MIPMAP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "Updating icons in $dir"
        cp "$ROBOT_ICON" "$dir/ic_launcher.png"
        cp "$ROBOT_ICON" "$dir/ic_launcher_foreground.png"
        cp "$ROBOT_ICON" "$dir/ic_launcher_round.png"
    else
        echo "Warning: Directory not found: $dir"
    fi
done

echo "Android icons updated successfully!"
echo "Next steps:"
echo "1. npm run build"
echo "2. npx cap sync android"
echo "3. Build your Android app"
