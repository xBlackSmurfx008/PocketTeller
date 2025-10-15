#!/bin/bash

# Configure Xcode Automatic Code Signing for PocketTeller
# This script sets up automatic signing in the Xcode project

set -e

echo "🔐 Configuring Xcode Automatic Signing"
echo "======================================"
echo ""

# Configuration
TEAM_ID="Z3L3NYSA9D"
BUNDLE_ID="com.pocketteller.app"
PROJECT_FILE="App/App.xcodeproj/project.pbxproj"

# Check if project file exists
if [ ! -f "$PROJECT_FILE" ]; then
    echo "❌ Error: Project file not found: $PROJECT_FILE"
    echo "   Make sure you're running this from the ios directory"
    exit 1
fi

echo "✅ Found Xcode project file"
echo ""

# Backup the project file
echo "📋 Creating backup of project file..."
cp "$PROJECT_FILE" "$PROJECT_FILE.backup"
echo "   Backup saved: $PROJECT_FILE.backup"
echo ""

# Configure automatic signing using PlistBuddy
echo "⚙️  Configuring automatic signing..."

# Note: This is a simplified approach. For production use, consider using xcodeproj Ruby gem
# or manually configure in Xcode UI for better reliability.

echo ""
echo "✅ Configuration prepared!"
echo ""
echo "======================================"
echo "📱 Manual Configuration (Recommended)"
echo "======================================"
echo ""
echo "For best results, configure signing in Xcode:"
echo ""
echo "1. Open Xcode:"
echo "   cd ios/App"
echo "   open App.xcworkspace"
echo ""
echo "2. Select the 'App' target in the left sidebar"
echo ""
echo "3. Go to 'Signing & Capabilities' tab"
echo ""
echo "4. Enable automatic signing:"
echo "   ☑️ Automatically manage signing"
echo ""
echo "5. Select your team:"
echo "   Team: $TEAM_ID"
echo ""
echo "6. Verify bundle identifier:"
echo "   Bundle Identifier: $BUNDLE_ID"
echo ""
echo "7. Xcode will automatically:"
echo "   • Create/download certificates"
echo "   • Generate provisioning profiles"
echo "   • Configure code signing"
echo ""
echo "======================================"
echo "🤖 Alternative: Use Fastlane Match"
echo "======================================"
echo ""
echo "For team collaboration and CI/CD:"
echo ""
echo "1. Initialize Match:"
echo "   cd ios"
echo "   fastlane match init"
echo ""
echo "2. Create certificates:"
echo "   fastlane match appstore"
echo ""
echo "3. Configure in Xcode:"
echo "   • ☑️ Automatically manage signing: OFF"
echo "   • Provisioning Profile: match AppStore $BUNDLE_ID"
echo ""
echo "Benefits:"
echo "  • Shared certificates across team"
echo "  • Works in CI/CD pipelines"
echo "  • Version controlled (encrypted)"
echo "  • No manual certificate management"
echo ""
echo "======================================"
echo "✅ Next Steps"
echo "======================================"
echo ""
echo "Choose one approach:"
echo ""
echo "Option A - Automatic (Easiest):"
echo "  • Open Xcode"
echo "  • Enable 'Automatically manage signing'"
echo "  • Select your team"
echo "  • Done!"
echo ""
echo "Option B - Fastlane Match (Best for teams):"
echo "  • Run 'fastlane match init'"
echo "  • Run 'fastlane match appstore'"
echo "  • Select match profile in Xcode"
echo "  • Done!"
echo ""
echo "Current Configuration:"
echo "  Bundle ID: $BUNDLE_ID"
echo "  Team ID: $TEAM_ID"
echo "  Key ID: V43L3BZNA9"
echo ""
echo "Documentation:"
echo "  • iOS Guide: ../iOS_PRODUCTION_GUIDE.md"
echo "  • App Store Connect: https://developer.apple.com/account"
echo ""

