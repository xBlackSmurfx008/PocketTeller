# Deep Linking Quick Start

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get iOS Team ID
```bash
# Go to: https://developer.apple.com/account
# Copy Team ID from Membership page
```

### Step 2: Update iOS Verification File
```bash
# Edit: public/.well-known/apple-app-site-association
# Replace: TEAM_ID with your actual Team ID
```

### Step 3: Get Android SHA-256 Fingerprint
```bash
./scripts/get-android-fingerprint.sh
```

### Step 4: Update Android Verification File
```bash
# Edit: public/.well-known/assetlinks.json
# Replace: REPLACE_WITH_YOUR_RELEASE_KEY_SHA256_FINGERPRINT
# With: Your actual fingerprint from Step 3
```

### Step 5: Deploy Verification Files
```bash
npm run build
# Deploy dist/ folder to your hosting
# Verify: curl https://pocketbanker.app/.well-known/apple-app-site-association
```

### Step 6: Configure Supabase (15-Min OTP Expiration)
```
1. Go to: https://supabase.com/dashboard
2. Select project: dscndbpqvhvylukvcgpq
3. Navigate: Authentication → Settings → Auth Configuration
4. Set: MAILER_OTP_EXP = 900
5. Click: Save
```

### Step 7: Enable Associated Domains in Xcode
```bash
cd ios/App && open App.xcworkspace
# Xcode: Select App target
# Xcode: Signing & Capabilities
# Xcode: + Capability → Associated Domains
# Add: applinks:pocketbanker.app
# Add: applinks:app.pocketbanker.app
```

### Step 8: Build & Test
```bash
# iOS
npm run build && npx cap sync ios
cd ios/App && open App.xcworkspace
# Xcode: Cmd+R to run on device

# Android
npm run build && npx cap sync android
cd android && ./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

---

## ✅ Testing

Send yourself this email link:
```
https://pocketbanker.app/confirm?token=test123
```

**Expected:** App opens to /confirm page (not browser)

---

## 🐛 Troubleshooting

**Opens in browser?**
- Check verification files are deployed and accessible
- Verify Team ID and SHA-256 fingerprint are correct
- Ensure Associated Domains enabled in Xcode

**Token expired?**
- Verify MAILER_OTP_EXP=900 in Supabase dashboard
- Wait a few minutes for Supabase config to take effect

---

## 📚 Full Documentation

See: `DEEP_LINKING_SETUP_GUIDE.md` for complete details

