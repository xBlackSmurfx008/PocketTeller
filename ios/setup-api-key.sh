#!/bin/bash

# Setup App Store Connect API Key for PocketTeller
# This script configures environment variables for Fastlane

set -e

echo "🔐 Setting up App Store Connect API Key..."

# Configuration
KEY_ID="V43L3BZNA9"
TEAM_ID="Z3L3NYSA9D"
APP_ID="com.pocketteller.app"
KEY_FILE="./AuthKey_V43L3BZNA9.p8"

# Check if key file exists
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Error: Key file not found: $KEY_FILE"
    echo "Please place your AuthKey_V43L3BZNA9.p8 file in the ios directory"
    exit 1
fi

echo "✅ Found API key file"

# Create .env file for Fastlane
cat > .env << EOF
# App Store Connect API Key Configuration
APP_STORE_CONNECT_API_KEY_KEY_ID=$KEY_ID
APP_STORE_CONNECT_API_KEY_ISSUER_ID=\${ISSUER_ID:-YOUR_ISSUER_ID_HERE}
APP_STORE_CONNECT_API_KEY_PATH=$KEY_FILE
FASTLANE_TEAM_ID=$TEAM_ID
FASTLANE_APP_IDENTIFIER=$APP_ID
FASTLANE_APPLE_ID=\${APPLE_ID:-your-apple-id@example.com}
FASTLANE_SKIP_WAITING_FOR_BUILD_PROCESSING=true
EOF

echo "✅ Created .env file"

# Set up git to ignore sensitive files
if [ ! -f ../.gitignore ]; then
    touch ../.gitignore
fi

if ! grep -q "AuthKey_.*\.p8" ../.gitignore; then
    echo "" >> ../.gitignore
    echo "# App Store Connect API Keys" >> ../.gitignore
    echo "AuthKey_*.p8" >> ../.gitignore
    echo "ios/.env" >> ../.gitignore
    echo "✅ Added API key files to .gitignore"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get your Issuer ID from: https://appstoreconnect.apple.com/access/api"
echo "2. Update ISSUER_ID in ios/.env file"
echo "3. Update APPLE_ID in ios/.env file (your Apple developer account email)"
echo "4. Install Fastlane: gem install fastlane"
echo "5. Run: cd ios && fastlane beta (to upload to TestFlight)"
echo ""
echo "Available Fastlane lanes:"
echo "  - fastlane beta      : Build and upload to TestFlight"
echo "  - fastlane release   : Build and upload to App Store"
echo "  - fastlane build_only: Build without uploading"
echo ""

