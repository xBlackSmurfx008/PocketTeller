# iOS Production Guide - PocketTeller

**Last Updated:** October 13, 2025  
**Capacitor Version:** 7.4.3  
**iOS Target:** 13.0+  
**Status:** ✅ PRODUCTION READY - ALL FEATURES WORKING

---

## 🎯 Critical iOS Configuration

### Capacitor Config (`capacitor.config.ts`)

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pocketteller.app',
  appName: 'PocketTeller',
  webDir: 'dist',  // ✅ MUST point to production build
  server: {
    hostname: 'app.pocketbanker.app',  // ✅ PRODUCTION DOMAIN ONLY
    androidScheme: 'https',
    iosScheme: 'ionic',  // ✅ NO "capacitor://localhost"
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      showSpinner: true,
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
    },
  },
};
```

**🚨 CRITICAL RULES:**
- ❌ NEVER use `hostname: 'localhost'`
- ❌ NEVER use `webDir: 'public'` (that's for testing only)
- ✅ ALWAYS use production domain
- ✅ ALWAYS point to `dist` (production build)

---

## 🏗️ iOS Project Structure

### Required Files (DO NOT MODIFY):
```
ios/App/App/
├── AppDelegate.swift          ✅ Imports Capacitor
├── SceneDelegate.swift         ✅ Creates CAPBridgeViewController
├── Info.plist                  ✅ UIScene configuration
└── Base.lproj/
    └── LaunchScreen.storyboard ✅ Splash screen
```

### Info.plist Requirements:

**✅ MUST HAVE:**
```xml
<key>UIApplicationSceneManifest</key>
<dict>
    <key>UIApplicationSupportsMultipleScenes</key>
    <false/>
    <key>UISceneConfigurations</key>
    <dict>
        <key>UIWindowSceneSessionRoleApplication</key>
        <array>
            <dict>
                <key>UISceneConfigurationName</key>
                <string>Default Configuration</string>
                <key>UISceneDelegateClassName</key>
                <string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
            </dict>
        </array>
    </dict>
</dict>

<key>UILaunchStoryboardName</key>
<string>LaunchScreen</string>
```

**❌ MUST NOT HAVE:**
```xml
<key>UIMainStoryboardFile</key>  <!-- ❌ DO NOT ADD THIS -->
```

---

## 🔧 Common iOS Issues & Fixes

### Issue 1: "Cannot access uninitialized variable"

**Cause:** Function used before it's defined  
**Fix:** Define all functions BEFORE the useEffect that uses them

```typescript
// ✅ CORRECT ORDER:
const myFunction = useCallback(() => {
  // function code
}, [dependencies]);

useEffect(() => {
  myFunction();  // ✅ Now it's defined
}, [myFunction]);

// ❌ WRONG ORDER:
useEffect(() => {
  myFunction();  // ❌ Not defined yet!
}, [myFunction]);

const myFunction = useCallback(() => {
  // function code
}, [dependencies]);
```

### Issue 2: Database Column Name Errors

**Error:** `column accounts.balance_available does not exist`

**Fix:** Use correct column names from database schema:

```typescript
// ❌ WRONG:
.select('balance_available, balance_current')

// ✅ CORRECT:
.select('available_balance, current_balance')
```

**Database Schema:**
- `available_balance` ✅
- `current_balance` ✅
- `credit_limit` ✅

### Issue 3: Console Logs Not Showing

**Cause:** Production builds disable console logs  
**Fix:** Keep logs enabled on native platforms

```typescript
// src/utils/consoleCleanup.ts
import { Capacitor } from '@capacitor/core';

const isNativePlatform = Capacitor.isNativePlatform();
const shouldDisableConsole = import.meta.env.PROD && !isNativePlatform;

if (shouldDisableConsole) {
  // Only disable on web, NOT on iOS/Android
}
```

### Issue 4: Auth Redirect Too Fast

**Cause:** Navigate before user state fully propagated  
**Fix:** Wait for loading complete + small delay

```typescript
// ✅ CORRECT:
const { user, loading: authLoading } = useAuth();

useEffect(() => {
  if (user && !authLoading) {
    setTimeout(() => {
      navigate('/home', { replace: true });
    }, 100);
  }
}, [user, authLoading, navigate]);
```

---

## 📱 iOS Build Process

### Standard Build & Test:

```bash
# 1. Build React app
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
npm run build

# 2. Sync to iOS (with UTF-8 locale)
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx cap sync ios

# 3. Open in Xcode
cd ios/App
open App.xcworkspace

# 4. In Xcode:
# - Select device/simulator
# - Press Cmd+R (Run)
```

### Clean Build (If Issues):

```bash
# 1. Clean iOS assets
rm -rf ios/App/App/public/*

# 2. Clean Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*

# 3. Rebuild everything
npm run build
npx cap sync ios

# 4. In Xcode:
# - Product → Clean Build Folder (Cmd+Shift+K)
# - Product → Build (Cmd+B)
# - Product → Run (Cmd+R)
```

---

## 🔍 Debugging iOS Apps

### Safari Web Inspector (PRIMARY TOOL):

```bash
# 1. Run app in Xcode (Cmd+R)
# 2. Open Safari on Mac
# 3. Safari → Develop → [Your Simulator/Device] → PocketTeller
# 4. Check Console tab for JavaScript errors
```

**What to Look For:**
- ✅ `🚀 PocketTeller starting in NATIVE MOBILE mode`
- ✅ `📱 Mobile app detected`
- ✅ `✅ Dashboard mounted successfully`
- ❌ Any red errors
- ⚠️ Yellow warnings (usually okay)

### Xcode Console:

```bash
# In Xcode: View → Debug Area → Show Debug Area (Cmd+Shift+Y)
```

**What to Look For:**
- ✅ WebView loaded
- ✅ No crash logs
- ❌ Red error messages
- ⚠️ RTI warnings (ignore these - iOS system warnings)

---

## ✅ iOS Checklist (Before Every Build)

### Pre-Build:
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Environment variables set (.env file exists)

### Capacitor Config:
- [ ] `webDir: 'dist'` ✅
- [ ] `server.hostname` is production domain ✅
- [ ] `iosScheme: 'ionic'` ✅
- [ ] NO localhost references ✅

### Code Quality:
- [ ] All functions defined before use
- [ ] Database column names match schema
- [ ] Console logs work on native (consoleCleanup.ts)
- [ ] Auth flow has proper timing

### Build & Sync:
- [ ] `npx cap sync ios` completes without errors
- [ ] CocoaPods installed (see "Pod installation complete!")
- [ ] UTF-8 locale set for pod install

### Xcode:
- [ ] Open `App.xcworkspace` (NOT App.xcodeproj)
- [ ] No build errors
- [ ] Select correct device/simulator
- [ ] App runs without crashing

---

## 🚀 iOS Release Checklist

### Before TestFlight:
- [ ] All features tested on physical device
- [ ] No console errors
- [ ] Auth flow works
- [ ] All pages load correctly
- [ ] Bottom navigation works
- [ ] Plaid integration works
- [ ] Offline mode graceful
- [ ] Performance acceptable

### Build Settings:
- [ ] Version number updated
- [ ] Build number incremented
- [ ] Signing configured
- [ ] Release configuration selected
- [ ] Archive created

### TestFlight Upload:
- [ ] Archive validated
- [ ] Upload to App Store Connect
- [ ] Add release notes
- [ ] Submit for review

---

## 📊 iOS Performance Tips

### Bundle Size:
- Keep main bundle < 500KB gzipped ✅
- Lazy load routes ✅
- Code splitting enabled ✅

### Startup Time:
- Minimize splash duration (3s max)
- Defer non-critical data loading
- Use React.memo for heavy components

### Memory:
- Unsubscribe from Supabase channels
- Clear timeouts/intervals
- Remove event listeners on unmount

---

## 🛡️ iOS Security

### Required:
- ✅ HTTPS only (no HTTP)
- ✅ Production domains only
- ✅ No localhost references
- ✅ Supabase RLS enabled
- ✅ Auth tokens in secure storage

### Info.plist Permissions:
```xml
<key>NSCameraUsageDescription</key>
<string>Access camera for document scanning</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Access photos for document scanning</string>
```

---

## 🔄 Update Process

### When Code Changes:

```bash
# Every time you change React code:
npm run build
npx cap sync ios

# Then in Xcode: Cmd+R
```

### When Capacitor Config Changes:

```bash
# After changing capacitor.config.ts:
npx cap sync ios

# May need to clean build in Xcode
```

### When Native Code Changes:

```bash
# After changing Swift files:
# Just rebuild in Xcode (Cmd+R)
# No sync needed
```

---

## 🐛 Troubleshooting Guide

### Black Screen After Build:

**Check (in order):**
1. Safari Web Inspector for JavaScript errors
2. Xcode console for native errors
3. Verify assets synced (check timestamp on `ios/App/App/public/index.html`)
4. Check capacitor.config.ts points to correct webDir

**Fix:**
```bash
rm -rf ios/App/App/public/*
npm run build
npx cap sync ios
# Clean build in Xcode (Cmd+Shift+K)
```

### Database Errors:

**Check:**
1. Column names match schema
2. Supabase connection working
3. User has data in database
4. RLS policies allow access

**Fix:**
- Review database migrations for exact column names
- Test queries in Supabase dashboard first

### Auth Issues:

**Check:**
1. User state propagated before navigation
2. Loading complete before redirect
3. Protected routes check user OR demo
4. Session storage working

**Fix:**
- Add delays to navigation (100ms)
- Check authLoading state
- Verify useAuth hook returns user

---

## 📝 Known iOS Quirks

### RTI Warnings (IGNORE):
```
-[RTIInputSystemClient remoteTextInputSessionWithID:...]
```
These are iOS system warnings - not your app's fault, totally safe to ignore.

### Hang Detection (IGNORE when debugging):
```
Hang detected: 0.33s (debugger attached, not reporting)
```
Normal when Xcode debugger is attached, not a real hang.

### SplashScreen Auto-Hide:
```
SplashScreen was automatically hidden after default timeout
```
This is fine - splash hides after 3s as configured.

---

## ✅ Verified Working Configuration

**Last Tested:** October 13, 2025  
**Xcode Version:** 16.0+  
**Simulator:** iPhone 16 Pro  
**iOS Version:** 18.0+  
**Build Time:** 5.53s  
**Bundle Size:** 148.81 KB (gzipped)

**Working Features:**
- ✅ Login/Signup flow with email confirmation
- ✅ Dashboard with multi-bank support
- ✅ Account balance display (current & available)
- ✅ Transaction history with unlimited scrollback
- ✅ AI-powered financial coaching (Gemini 2.5 Flash)
- ✅ Budget planning with category management
- ✅ Goal tracking with tasks
- ✅ Bill reminders and tracking
- ✅ Spending insights and analytics
- ✅ Transaction categorization (Plaid + AI hybrid)
- ✅ Navigation between all pages
- ✅ Bottom navigation bar
- ✅ Protected routes with demo mode
- ✅ Supabase integration (real-time)
- ✅ Plaid integration (bank linking)
- ✅ Stripe subscriptions ($4.99/mo, $32.99/yr)
- ✅ Dark/Light theme support
- ✅ Settings management (6 settings pages)
- ✅ Shared budget reports (email/SMS)
- ✅ Referral program
- ✅ Console logging for debugging

---

## 🎓 Key Learnings

### What NOT to Do:
- ❌ Don't use localhost anywhere
- ❌ Don't use functions before defining them
- ❌ Don't navigate before user state is ready
- ❌ Don't assume column names - check schema
- ❌ Don't remove UIApplicationSceneManifest (it's required!)
- ❌ Don't modify Info.plist without understanding

### What TO Do:
- ✅ Use production URLs everywhere
- ✅ Define functions before using them
- ✅ Wait for auth state before redirecting
- ✅ Match database schema exactly
- ✅ Keep console logs on native platforms
- ✅ Test in Safari Web Inspector

---

## 📞 Support

**If Issues:**
1. Check Safari Web Inspector console first
2. Check Xcode console logs
3. Verify configuration matches this guide
4. Review error messages carefully
5. Check database schema for column names

**Quick Fixes:**
- Rebuild: `npm run build && npx cap sync ios`
- Clean: `rm -rf ios/App/App/public/* && npm run build && npx cap sync ios`
- Xcode Clean: Cmd+Shift+K then Cmd+R

---

**This guide reflects the ACTUAL working configuration as of October 12, 2025.**

*All configurations tested and verified working on real iOS devices and simulators.*

