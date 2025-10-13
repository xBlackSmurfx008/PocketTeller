# iOS Build & Testing Instructions
## PocketTeller iOS App

**Date:** October 12, 2025  
**Build Status:** ✅ Ready for Testing  
**Xcode Project:** ios/App/App.xcworkspace

---

## 🚀 QUICK START

### Xcode is Now Open!

The iOS project has been opened in Xcode. Follow these steps to build and test:

---

## 📱 BUILDING IN XCODE

### Step 1: Select Target Device
1. In Xcode, click on the device selector (top toolbar, next to "App" scheme)
2. Choose either:
   - **iOS Simulator** (for quick testing)
     - iPhone 15 Pro (recommended)
     - iPhone 14
     - iPad Pro
   - **Physical Device** (for real-world testing)
     - Connect your iPhone/iPad via USB
     - Trust the computer on your device
     - Select your device from the list

### Step 2: Configure Signing
1. Click on "App" project in the left sidebar
2. Select "App" target
3. Go to "Signing & Capabilities" tab
4. Set your Team:
   - If you have an Apple Developer account: Select your team
   - For personal testing: Select your Apple ID (free provisioning)
5. Xcode will automatically create a provisioning profile

### Step 3: Build & Run
1. Click the **Play button** (▶️) in the top left corner
2. Or press **Cmd + R**
3. Wait for the build to complete (first build may take 2-3 minutes)
4. App will launch on your selected device/simulator

---

## 🧪 TESTING CHECKLIST

### Initial Launch
- [ ] App launches without crashing
- [ ] Splash screen displays correctly
- [ ] App redirects to /auth screen (not marketing page)
- [ ] UI renders properly on device

### Authentication Flow
- [ ] Sign up with new email works
- [ ] Email validation works
- [ ] Sign in with existing account works
- [ ] Password reset flow works
- [ ] Magic link login works

### Core Features
- [ ] Dashboard loads correctly
- [ ] Can connect to Plaid (bank linking)
- [ ] Transactions display properly
- [ ] Budget creation works
- [ ] Goals can be created/edited
- [ ] AI chat functions correctly

### Mobile-Specific
- [ ] Touch interactions work smoothly
- [ ] Keyboard appears/dismisses correctly
- [ ] Navigation gestures work (swipe back)
- [ ] Splash screen works on launch
- [ ] App works in both portrait and landscape
- [ ] Dark mode toggle works

### Performance
- [ ] App feels responsive
- [ ] No lag in transitions
- [ ] Scrolling is smooth
- [ ] Images load properly
- [ ] No memory warnings

---

## 🔧 TROUBLESHOOTING

### Build Fails with "Could not find module"
**Solution:**
```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
rm -rf ios/App/Pods ios/App/Podfile.lock
export LANG=en_US.UTF-8
npx cap sync ios
```

### App Shows Black Screen
**Possible Causes:**
1. Check Xcode console for JavaScript errors
2. Verify dist/ folder has built files
3. Check that index.html exists in ios/App/App/public/

**Solution:**
```bash
npm run build
npx cap copy ios
```

### Signing Issues
1. Go to Xcode → Preferences → Accounts
2. Add your Apple ID
3. In project settings, change Bundle Identifier to something unique:
   - Change: `com.pocketteller.app`
   - To: `com.yourname.pocketteller` (or similar)

### WebView Debugging
1. Open **Safari** on your Mac
2. Go to **Develop** menu
3. Select your device → PocketTeller
4. Opens Web Inspector with console logs

---

## 📦 BUILDING FOR DISTRIBUTION

### Archive Build (for TestFlight/App Store)
1. In Xcode, select **Any iOS Device (arm64)** as the target
2. Go to **Product** → **Archive**
3. Wait for archive to complete
4. In the Organizer window, click **Distribute App**
5. Follow the wizard:
   - Select **App Store Connect** or **Ad Hoc**
   - Upload or export

### TestFlight Distribution
1. Archive the app (see above)
2. Distribute to App Store Connect
3. Log in to [App Store Connect](https://appstoreconnect.apple.com)
4. Go to TestFlight
5. Add internal/external testers
6. Submit for review (external testers only)

---

## 🔑 KEY FILES FOR iOS

### Important iOS Files
```
ios/App/
├── App.xcworkspace          # Open this in Xcode (not .xcodeproj)
├── Podfile                  # CocoaPods dependencies
├── Podfile.lock            # Locked dependency versions
└── App/
    ├── Info.plist          # App configuration
    ├── Assets.xcassets/    # App icons, splash screens
    └── public/             # Web assets (from dist/)
```

### Configuration Files
- **capacitor.config.ts** - Capacitor configuration
- **App/App/Info.plist** - iOS app metadata
- **App/App/Assets.xcassets** - Icons and images

---

## 📊 BUILD INFORMATION

### Current Build Details
- **App ID:** com.pocketteller.app
- **App Name:** PocketTeller
- **Version:** 1.0.0 (from package.json)
- **Capacitor Version:** 7.4.3
- **iOS Deployment Target:** iOS 13.0+

### Bundle Contents
- **Web Assets:** Successfully copied from dist/
- **Native Plugins:** @capacitor/splash-screen
- **Bundle Size:** ~148 KB (gzipped web assets)
- **Total App Size:** ~15-20 MB (including native code)

---

## 🎯 WHAT'S BEEN TESTED

### ✅ Build System
- Web app builds successfully
- Capacitor sync completes
- CocoaPods dependencies installed
- Project opens in Xcode

### ✅ Code Quality
- TypeScript strict mode enabled
- All types validated
- No build errors
- Security headers configured

### ✅ Mobile Compatibility
- Dedicated mobile routing (App.mobile.tsx)
- Mobile-first responsive design
- Touch-optimized components
- Splash screen configured

---

## 🐛 DEBUGGING TIPS

### View Console Logs in Xcode
1. Build and run the app
2. Open **Debug Area** (Cmd + Shift + Y)
3. Look for JavaScript console logs
4. Filter by "console" to see web app logs

### Enable WebView Debugging
1. Run app on simulator or device
2. Open Safari → Develop → [Your Device] → PocketTeller
3. Web Inspector will show:
   - Console logs
   - Network requests
   - DOM inspection
   - JavaScript debugging

### Common Issues
| Issue | Solution |
|-------|----------|
| Black screen | Check console for errors, rebuild web app |
| Can't sign in | Verify Supabase URL in environment |
| Plaid doesn't work | Check Plaid configuration in Supabase |
| App crashes | Check Xcode console for native errors |

---

## 📞 SUPPORT

### Resources
- **Capacitor Docs:** https://capacitorjs.com/docs/ios
- **Apple Developer:** https://developer.apple.com
- **Xcode Help:** https://developer.apple.com/xcode/

### Local Documentation
- See `AGENTS.md` for general project info
- See `IOS_TESTING_GUIDE.md` for more iOS details
- See `REFACTORING_SUMMARY.md` for recent changes

---

## ✅ PRE-FLIGHT CHECKLIST

Before testing, verify:
- [x] Web app built successfully
- [x] Capacitor sync completed
- [x] Xcode project opened
- [ ] Device/simulator selected
- [ ] Signing configured
- [ ] Ready to press Play!

---

## 🎉 YOU'RE READY TO TEST!

**Xcode is now open with your iOS project loaded.**

**Next Steps:**
1. Select your target device (simulator or physical device)
2. Configure signing if needed
3. Click the **Play button** (▶️)
4. Test the app thoroughly
5. Report any issues found

**Good luck with testing!** 🚀📱

---

**Last Updated:** October 12, 2025  
**Status:** Ready for Testing  
**Build:** Successful

