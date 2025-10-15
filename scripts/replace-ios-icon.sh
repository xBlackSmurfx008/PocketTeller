#!/bin/bash

# Script to replace iOS app icon with a single robot icon
# Usage: ./scripts/replace-ios-icon.sh /path/to/robot-icon.png

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

echo "Replacing iOS icon with: $ROBOT_ICON"

# iOS AppIcon directory
IOS_ICON_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"

if [ -d "$IOS_ICON_DIR" ]; then
    echo "Updating iOS icon in $IOS_ICON_DIR"
    cp "$ROBOT_ICON" "$IOS_ICON_DIR/robot-icon.png"
    echo "iOS icon updated successfully!"
else
    echo "Error: iOS AppIcon directory not found: $IOS_ICON_DIR"
    exit 1
fi

echo "Next steps:"
echo "1. npm run build"
echo "2. npx cap sync ios"
echo "3. Build your iOS app in Xcode"
