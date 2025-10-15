#!/bin/bash

# PocketTeller iOS - App Store Deployment Script
# Uses App Store Connect API Key for automated deployment

set -e  # Exit on error

echo "🍎 PocketTeller - App Store Deployment"
echo "======================================"
echo ""

# Configuration
KEY_ID="V43L3BZNA9"
TEAM_ID="Z3L3NYSA9D"
APP_ID="com.pocketteller.app"
KEY_FILE="ios/AuthKey_V43L3BZNA9.p8"

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if Fastlane is installed
if ! command -v fastlane &> /dev/null; then
    echo "❌ Fastlane not found"
    echo ""
    echo "Install Fastlane:"
    echo "  gem install fastlane"
    echo ""
    echo "Or using Bundler:"
    echo "  cd ios && bundle install"
    exit 1
fi

echo "✅ Fastlane installed"

# Check if API key file exists
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ API key file not found: $KEY_FILE"
    echo ""
    echo "Please place your AuthKey_V43L3BZNA9.p8 file in the ios directory"
    exit 1
fi

echo "✅ API key file found"

# Check if .env file exists
if [ ! -f "ios/.env" ]; then
    echo "⚠️  .env file not found, creating from template..."
    cd ios
    bash setup-api-key.sh
    cd ..
    echo ""
    echo "⚠️  Please update ios/.env with your Issuer ID and Apple ID"
    echo "   Get Issuer ID from: https://appstoreconnect.apple.com/access/api"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

echo "✅ Configuration files ready"
echo ""

# Set UTF-8 locale (required for iOS builds)
echo "🌍 Setting up locale..."
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
echo ""

# Clean iOS assets
echo "🧹 Cleaning iOS assets..."
rm -rf ios/App/App/public/*
echo ""

# Build web app
echo "📦 Building web app..."
npm run build
echo ""

# Sync to iOS
echo "🔄 Syncing to iOS..."
npx cap sync ios
echo ""

# Check CocoaPods
if [ ! -d "ios/App/Pods" ]; then
    echo "📦 Installing CocoaPods dependencies..."
    cd ios/App
    pod install
    cd ../..
    echo ""
fi

echo "======================================"
echo "🚀 Deployment Options"
echo "======================================"
echo ""
echo "1) TestFlight (Beta Testing)"
echo "2) App Store (Production Release)"
echo "3) Build Only (No Upload)"
echo "4) Cancel"
echo ""

read -p "Select option [1-4]: " option

cd ios

case $option in
    1)
        echo ""
        echo "🚀 Deploying to TestFlight..."
        echo ""
        fastlane beta
        echo ""
        echo "✅ Build uploaded to TestFlight!"
        echo "   Check App Store Connect to manage testers"
        ;;
    2)
        echo ""
        echo "🚀 Deploying to App Store..."
        echo ""
        fastlane release
        echo ""
        echo "✅ Build uploaded to App Store!"
        echo "   Go to App Store Connect to submit for review"
        ;;
    3)
        echo ""
        echo "🔨 Building app..."
        echo ""
        fastlane build_only
        echo ""
        echo "✅ Build complete!"
        echo "   IPA file location: ios/App.ipa"
        ;;
    4)
        echo ""
        echo "❌ Deployment cancelled"
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Invalid option"
        exit 1
        ;;
esac

cd ..

echo ""
echo "======================================"
echo "🎉 Deployment Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "  • Check App Store Connect: https://appstoreconnect.apple.com"
echo "  • Monitor build processing status"
echo "  • Add testers (TestFlight) or submit for review (App Store)"
echo ""
echo "Documentation:"
echo "  • iOS Guide: iOS_PRODUCTION_GUIDE.md"
echo "  • App Store Submission: APP_STORE_SUBMISSION_GUIDE.md"
echo ""

