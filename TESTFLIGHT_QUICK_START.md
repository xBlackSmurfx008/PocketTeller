# TestFlight Quick Start

**One-line deployment:**
```bash
./deploy-ios-testflight.sh
```

---

## 🚀 Common Commands

### Deploy to TestFlight
```bash
./deploy-ios-testflight.sh
```

### Manual Steps
```bash
# 1. Build
npm run build && npx cap sync ios

# 2. Archive
cd ios
xcodebuild -workspace App/App.xcworkspace -scheme App -archivePath ~/Library/Developer/Xcode/Archives/App.xcarchive archive

# 3. Export
xcodebuild -exportArchive -archivePath ~/Library/Developer/Xcode/Archives/App.xcarchive -exportPath ./build -exportOptionsPlist exportOptions.plist

# 4. Upload
xcrun altool --upload-app --type ios --file build/App.ipa --apiKey V43L3BZNA9 --apiIssuer e63db961-afb6-44db-a75b-64174d1dea17
```

### Via Xcode
```bash
npm run build && npx cap sync ios
open ios/App/App.xcworkspace
# Then: Product → Archive → Distribute
```

---

## 📋 Configuration

**API Key Location:**
```
~/.appstoreconnect/private_keys/AuthKey_V43L3BZNA9.p8
```

**Key Details:**
- Key ID: `V43L3BZNA9`
- Issuer ID: `e63db961-afb6-44db-a75b-64174d1dea17`
- Team: `Z3L3NYSA9D`
- Bundle: `com.pocketteller.app`

---

## ✅ Pre-Flight Checklist

- [ ] Code tested locally
- [ ] `npm run build` succeeds
- [ ] API key in `~/.appstoreconnect/private_keys/`
- [ ] exportOptions.plist exists in `ios/`

---

## 🆘 Troubleshooting

**API key not found:**
```bash
mkdir -p ~/.appstoreconnect/private_keys
cp ios/AuthKey_V43L3BZNA9.p8 ~/.appstoreconnect/private_keys/
chmod 600 ~/.appstoreconnect/private_keys/AuthKey_V43L3BZNA9.p8
```

**Upload failed:**
```bash
# Retry with existing IPA
cd ios
xcrun altool --upload-app --type ios --file build/App.ipa --apiKey V43L3BZNA9 --apiIssuer e63db961-afb6-44db-a75b-64174d1dea17
```

**Build not appearing:**
- Wait 5-30 minutes for processing
- Check email for confirmation
- Verify at: https://appstoreconnect.apple.com

---

## 📚 Full Documentation

See `IOS_TESTFLIGHT_DEPLOYMENT.md` for complete guide.

---

**App Store Connect:** https://appstoreconnect.apple.com  
**TestFlight Guide:** https://developer.apple.com/testflight/

