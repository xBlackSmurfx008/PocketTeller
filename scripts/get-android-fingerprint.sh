#!/bin/bash

# Script to get Android SHA-256 certificate fingerprint
# This fingerprint is needed for Android App Links verification

echo "🔐 Getting Android Release Key SHA-256 Fingerprint..."
echo ""

KEYSTORE_PATH="android/app/pocketteller-release-key.keystore"
KEY_ALIAS="pocketteller-key"

if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "❌ Error: Keystore not found at $KEYSTORE_PATH"
  echo ""
  echo "Please make sure you've generated a release keystore first:"
  echo "  keytool -genkeypair -v -keystore $KEYSTORE_PATH -alias $KEY_ALIAS -keyalg RSA -keysize 2048 -validity 10000"
  exit 1
fi

echo "📂 Keystore: $KEYSTORE_PATH"
echo "🔑 Alias: $KEY_ALIAS"
echo ""
echo "You will be prompted for your keystore password..."
echo ""

# Get the SHA-256 fingerprint
keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$KEY_ALIAS" | grep "SHA256:" | cut -d " " -f 3

echo ""
echo "✅ Copy this fingerprint and paste it into:"
echo "   public/.well-known/assetlinks.json"
echo ""
echo "Replace: REPLACE_WITH_YOUR_RELEASE_KEY_SHA256_FINGERPRINT"
echo "With the fingerprint above (including colons)"
echo ""

