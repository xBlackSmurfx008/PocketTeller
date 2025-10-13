# iOS Device Testing Setup

**Date:** October 12, 2025  
**Status:** Xcode opened, ready for device testing

---

## Setup Complete

1. ✅ CocoaPods dependencies installed
2. ✅ Xcode workspace opened
3. ✅ Ready to connect iOS device

---

## Next Steps in Xcode

### 1. Connect Your iPhone/iPad
- Plug in your iOS device via USB
- Unlock the device
- If prompted, tap "Trust This Computer"

### 2. Select Your Device
- In Xcode, at the top near the play button
- Click the device dropdown (probably shows "Any iOS Device")
- Select your connected iPhone/iPad

### 3. Configure Signing
- Click on "App" in the left sidebar (blue icon)
- Select "Signing & Capabilities" tab
- Check "Automatically manage signing"
- Select your Team (Apple ID)
- Bundle Identifier: `com.pocketteller.app`

### 4. Build and Run
- Click the Play button (▶️) or press Cmd+R
- Xcode will build and install to your device
- First time: You may need to trust the developer certificate
  - On iPhone: Settings → General → VPN & Device Management
  - Tap your Apple ID → Trust

---

## Expected Behavior

### App Launch:
1. Splash screen (violet branding)
2. Auth/Sign-in page
3. Material Design UI (matching Android)

### Features to Test:
- ✅ Plaid connection (Connect Bank button)
- ✅ Multi-account tabs
- ✅ Learning button in chat
- ✅ Empty states (Goals, Transactions)
- ✅ UI improvements (borders, text size)

---

## Troubleshooting

### If Build Fails:
1. Product → Clean Build Folder (Cmd+Shift+K)
2. Try building again

### If "Untrusted Developer" on Device:
1. Go to Settings → General → VPN & Device Management
2. Find your Apple ID under "Developer App"
3. Tap → Trust

### If Device Not Showing:
1. Unplug and replug cable
2. Restart Xcode
3. Check device is unlocked

---

## Build Configuration

**Xcode Version:** Should be 15.0 or later  
**iOS Deployment Target:** iOS 13.0+  
**Bundle ID:** com.pocketteller.app  
**App Name:** PocketTeller  

---

## Compare with Android

After testing on iOS:
- Verify UI matches Android (Material Design 3)
- Test Plaid on both platforms
- Confirm all features work identically
- Check responsive design

---

All set! Your iOS device is ready for testing.

