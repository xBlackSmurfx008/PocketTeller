# iOS Agent Documentation - PocketTeller
## Critical iOS Structure & Configuration (DO NOT CHANGE)

**Last Updated:** October 12, 2025  
**Status:** ✅ WORKING - App launches and displays correctly  
**iOS Version Target:** 14.0+  
**Capacitor Version:** 7.0.3

---

## 🚨 CRITICAL - DO NOT CHANGE THESE

### 1. **SceneDelegate.swift** - REQUIRED FOR iOS 13+

**Location:** `ios/App/App/SceneDelegate.swift`

**Critical Elements:**
```swift
import UIKit
import Capacitor

@objc(SceneDelegate)  // ← CRITICAL: Must have @objc attribute
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, 
               options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        
        window = UIWindow(windowScene: windowScene)
        
        // CRITICAL: Use CAPBridgeViewController() directly
        // DO NOT use CAPBridge.shared (doesn't exist in Capacitor 7.x)
        let rootVC = CAPBridgeViewController()
        
        window?.rootViewController = rootVC
        window?.makeKeyAndVisible()
    }
}
```

**WHY IT'S CRITICAL:**
- iOS 13+ requires scene-based lifecycle management
- `@objc(SceneDelegate)` exposes Swift class to Objective-C runtime
- Without this, Info.plist can't find the class → app won't launch
- `CAPBridgeViewController()` is the correct Capacitor 7.x API

**NEVER DO THIS:**
- ❌ Remove `@objc(SceneDelegate)` attribute
- ❌ Use `CAPBridge.shared` (doesn't exist)
- ❌ Delete this file
- ❌ Rename the class

---

### 2. **Info.plist UIApplicationSceneManifest** - REQUIRED

**Location:** `ios/App/App/Info.plist`

**Critical Configuration:**
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
```

**WHY IT'S CRITICAL:**
- Tells iOS to use scene-based lifecycle (iOS 13+)
- `$(PRODUCT_MODULE_NAME).SceneDelegate` resolves to `App.SceneDelegate` at runtime
- Module-qualified name is REQUIRED for Swift classes
- Without this, app shows black screen or hangs

**NEVER DO THIS:**
- ❌ Remove `UIApplicationSceneManifest`
- ❌ Change to just `SceneDelegate` (needs module name)
- ❌ Add `UIMainStoryboardFile` (conflicts with Capacitor)
- ❌ Set `UIApplicationSupportsMultipleScenes` to `true` (not needed)

---

### 3. **Xcode Project Structure** - MUST INCLUDE SCENEDELEGATE

**Location:** `ios/App/App.xcodeproj/project.pbxproj`

**Critical:** SceneDelegate.swift MUST be in 4 places:

1. **PBXBuildFile** - Tells Xcode to compile it
2. **PBXFileReference** - Registers the file
3. **PBXGroup (App folder)** - Shows in Project Navigator
4. **PBXSourcesBuildPhase** - Includes in build

**Verification:**
```bash
grep -c "SceneDelegate" ios/App/App.xcodeproj/project.pbxproj
# Should return: 4
```

**WHY IT'S CRITICAL:**
- If missing, Xcode won't compile SceneDelegate
- If not in sources phase, class won't exist at runtime
- Leads to "could not load class" error

**NEVER DO THIS:**
- ❌ Remove SceneDelegate.swift from Xcode project
- ❌ Manually edit project.pbxproj (use Xcode or scripts)
- ❌ Put SceneDelegate in a different target

---

### 4. **AppDelegate.swift** - Keep Original, Don't Modify

**Location:** `ios/App/App/AppDelegate.swift`

**Current State:** Standard Capacitor AppDelegate (unmodified)

**WHY IT'S CRITICAL:**
- Works with Capacitor's plugin system
- Handles deep links and universal links
- ApplicationDelegateProxy manages plugin lifecycle

**NEVER DO THIS:**
- ❌ Remove `ApplicationDelegateProxy.shared` calls
- ❌ Add `UISceneSession` methods (handled by SceneDelegate)
- ❌ Create window here (SceneDelegate handles it)

---

### 5. **Capacitor Configuration** - Production URLs Only

**Location:** `capacitor.config.ts`

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pocketteller.app',
  appName: 'PocketTeller',
  webDir: 'dist',  // ← CRITICAL: Must match build output
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      // ... other splash config
    },
  },
};

export default config;
```

**WHY IT'S CRITICAL:**
- `webDir: 'dist'` MUST match Vite output directory
- `appId` must match Xcode bundle identifier
- SplashScreen config prevents black screen during load

**NEVER DO THIS:**
- ❌ Change `webDir` to anything other than `dist`
- ❌ Add localhost URLs anywhere
- ❌ Change `appId` without updating Xcode

---

### 6. **Environment Variables** - Baked at Build Time

**Location:** `.env` (gitignored)

**Critical Variables:**
```env
VITE_SUPABASE_URL=https://dscndbpqvhvylukvcgpq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=dscndbpqvhvylukvcgpq
```

**WHY IT'S CRITICAL:**
- Environment variables are baked into JavaScript at build time
- iOS app reads them from bundled JavaScript
- Without these, Supabase client fails → app doesn't work

**NEVER DO THIS:**
- ❌ Delete `.env` file before building
- ❌ Use localhost URLs (production only)
- ❌ Expect runtime environment variable changes (they're frozen at build)

---

## 📋 Verified Working Structure

### File Hierarchy (Critical Files Only)

```
ios/App/App/
├── AppDelegate.swift          ✅ Original Capacitor delegate
├── SceneDelegate.swift        ✅ REQUIRED - Scene lifecycle
├── Info.plist                 ✅ Has UIApplicationSceneManifest
├── Assets.xcassets/           ✅ App icons
├── Base.lproj/
│   └── LaunchScreen.storyboard ✅ Splash screen
├── capacitor.config.json      ✅ Auto-generated from root config
├── config.xml                 ✅ Cordova compatibility
└── public/                    ✅ Web assets (dist/ synced here)
    ├── assets/                ← JavaScript bundles
    ├── index.html             ← App entry point
    └── ...

ios/App/App.xcodeproj/
└── project.pbxproj            ✅ SceneDelegate in 4 places

ios/App/App.xcworkspace/       ✅ Open THIS, not .xcodeproj
ios/App/Podfile                ✅ CocoaPods dependencies
ios/App/Pods/                  ✅ Installed pods (Capacitor plugins)
```

---

## 🔄 Critical Build Process (DO NOT SKIP STEPS)

### 1. **Clean iOS Assets**
```bash
rm -rf ios/App/App/public/*
```
**WHY:** Prevents stale JavaScript/assets from previous builds

### 2. **Build Web App**
```bash
npm run build
```
**WHY:** Creates fresh `dist/` with current code and environment variables

### 3. **Sync to iOS with UTF-8 Locale**
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx cap sync ios
```
**WHY:** 
- Copies `dist/` → `ios/App/App/public/`
- UTF-8 locale prevents CocoaPods encoding errors
- Updates Capacitor plugins

### 4. **Clean Xcode Build (If Issues)**
```bash
cd ios/App
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*
xcodebuild -workspace App.xcworkspace -scheme App clean
```
**WHY:** Removes cached build artifacts that can cause issues

### 5. **Build in Xcode**
```bash
# In Xcode:
# Product → Clean Build Folder (Cmd+Shift+K)
# Product → Build (Cmd+B)
# Or just Run (Cmd+R)
```

**CRITICAL ORDER:**
1. Clean iOS assets
2. Rebuild web
3. Sync to iOS (with UTF-8)
4. Clean Xcode cache (if needed)
5. Build in Xcode

**NEVER SKIP:** Steps 1-3 if you changed JavaScript/TypeScript code

---

## 🐛 Known Issues & Solutions

### Issue 1: "could not load class with name 'SceneDelegate'"

**Symptoms:**
- App launches but shows white screen
- Console: "could not load class with name 'SceneDelegate'"
- App hangs after splash screen

**Root Cause:**
- Swift class not exposed to Objective-C runtime
- Info.plist using wrong class name format

**Solution:**
1. ✅ Add `@objc(SceneDelegate)` to SceneDelegate class
2. ✅ Use `$(PRODUCT_MODULE_NAME).SceneDelegate` in Info.plist

**Verification:**
```bash
# Check SceneDelegate has @objc
grep "@objc(SceneDelegate)" ios/App/App/SceneDelegate.swift

# Check Info.plist uses module name
grep "PRODUCT_MODULE_NAME" ios/App/App/Info.plist
```

---

### Issue 2: Black Screen After Splash

**Symptoms:**
- Splash screen shows
- Then black screen
- No errors in console

**Root Causes:**
1. Missing UIApplicationSceneManifest in Info.plist
2. SceneDelegate not compiled into app
3. Wrong Capacitor bridge initialization

**Solution:**
1. ✅ Verify Info.plist has UIApplicationSceneManifest
2. ✅ Verify SceneDelegate in Xcode project
3. ✅ Use `CAPBridgeViewController()` not `CAPBridge.shared`

---

### Issue 3: "CAPBridge.shared" Compile Error

**Symptoms:**
- Build fails with: "Type 'CAPBridge' has no member 'shared'"

**Root Cause:**
- Capacitor 7.x changed API
- `CAPBridge.shared` was removed

**Solution:**
```swift
// ❌ OLD (Capacitor 6.x and earlier)
let bridge = CAPBridge.shared
let rootVC = bridge?.viewController ?? CAPBridgeViewController()

// ✅ NEW (Capacitor 7.x+)
let rootVC = CAPBridgeViewController()
```

---

### Issue 4: Environment Variables Not Loading

**Symptoms:**
- App launches but can't connect to Supabase
- Console: "Missing Supabase config"

**Root Cause:**
- `.env` file missing or not read during build
- Forgot to rebuild after changing .env

**Solution:**
1. ✅ Ensure `.env` exists with correct values
2. ✅ Rebuild web: `npm run build`
3. ✅ Sync to iOS: `npx cap sync ios`
4. ✅ Clean build in Xcode

**Verification:**
```bash
# Check if Supabase URL in bundle
grep -r "dscndbpqvhvylukvcgpq" ios/App/App/public/assets/*.js | wc -l
# Should return: 1 or more
```

---

## 📱 Mobile App Routing (CRITICAL)

### App Uses Mobile-Specific Router

**Location:** `src/App.mobile.tsx`

**How It Works:**
```typescript
// src/main.tsx detects platform
const isMobileApp = Capacitor.isNativePlatform();
const AppComponent = isMobileApp ? AppMobile : App;

// App.mobile.tsx skips marketing pages
function MobileRoot() {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  // Mobile apps go straight to auth or dashboard
  const destination = user ? "/home" : "/auth";
  return <Navigate to={destination} replace />;
}
```

**WHY IT'S CRITICAL:**
- Web app shows marketing pages (`/` → Index.tsx)
- Mobile app skips marketing → goes to `/auth` or `/home`
- This is intentional - mobile users don't need hero pages

**NEVER DO THIS:**
- ❌ Make mobile app use `App.tsx` (web router)
- ❌ Route mobile to `/` (marketing page)
- ❌ Remove `App.mobile.tsx`

---

## 🎯 Key Architectural Decisions

### 1. **Scene-Based Architecture (iOS 13+)**
- **Why:** Required by modern iOS
- **Trade-off:** More complex than single UIWindow
- **Benefit:** Proper multi-window support, modern lifecycle

### 2. **Capacitor 7.x Direct ViewController Access**
- **Why:** CAPBridge.shared removed in v7
- **Change:** Use `CAPBridgeViewController()` directly
- **Benefit:** Simpler, more predictable initialization

### 3. **Module-Qualified Swift Class Names**
- **Why:** Swift classes aren't automatically Objective-C visible
- **Solution:** Use `$(PRODUCT_MODULE_NAME).ClassName` in Info.plist
- **Alternative:** `@objc(ClassName)` attribute on class

### 4. **Mobile-Specific Router**
- **Why:** Different UX for web vs mobile
- **Benefit:** Faster mobile onboarding (skip marketing)
- **Files:** `App.tsx` (web) vs `App.mobile.tsx` (mobile)

### 5. **Environment Variables at Build Time**
- **Why:** Vite bakes env vars into JavaScript
- **Trade-off:** Can't change at runtime
- **Benefit:** Secure, fast, no runtime config needed

---

## 🛠️ Debugging Tools & Commands

### Verify SceneDelegate in Project
```bash
grep -c "SceneDelegate" ios/App/App.xcodeproj/project.pbxproj
# Expected: 4 (BuildFile, FileRef, Group, Sources)
```

### Check Info.plist Scene Configuration
```bash
plutil -p ios/App/App/Info.plist | grep -A10 UIApplicationSceneManifest
```

### Verify Environment Variables in Build
```bash
grep -o "dscndbpqvhvylukvcgpq" ios/App/App/public/assets/*.js | wc -l
# Expected: 1 or more (means Supabase URL is in bundle)
```

### Check Build Logs in Xcode
```bash
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -sdk iphonesimulator \
  clean build 2>&1 | tee build.log
```

### Safari Web Inspector (Best Debugging Tool)
1. Run app in simulator
2. Safari → Develop → [Simulator Name] → PocketTeller
3. Check Console for JavaScript errors
4. Verify logs:
   - `🚀 PocketTeller starting in MOBILE mode`
   - `📱 iOS Platform Detected`
   - `Environment check: { supabaseUrl: '✅ Set' }`

---

## 📊 Success Criteria Checklist

Before considering iOS "working":

- [ ] Build succeeds with 0 errors in Xcode
- [ ] App launches on simulator/device
- [ ] Splash screen shows (3 seconds)
- [ ] Authentication screen appears (or dashboard if logged in)
- [ ] Bottom navigation visible and functional
- [ ] Can navigate between tabs
- [ ] No black screen after splash
- [ ] No "could not load class" errors in console
- [ ] No hang detection warnings
- [ ] Safari Web Inspector shows proper logs
- [ ] Can interact with UI elements
- [ ] Supabase connection works (can sign in)

---

## 🔒 Production Deployment Checklist

Before App Store submission:

- [ ] Change signing from "Sign to Run Locally" to real certificate
- [ ] Update build number in Xcode
- [ ] Set Release configuration
- [ ] Test on physical device (not just simulator)
- [ ] Verify all privacy permissions in Info.plist have descriptions
- [ ] Test on oldest supported iOS version (14.0)
- [ ] Verify app icons at all sizes
- [ ] Test splash screen on various screen sizes
- [ ] Run in Airplane mode (test offline behavior)
- [ ] Check binary size (< 100MB recommended)

---

## 📚 Reference Documentation

### Apple Official Docs
- [UIScene Lifecycle](https://developer.apple.com/documentation/uikit/app_and_environment/scenes)
- [Info.plist Keys](https://developer.apple.com/documentation/bundleresources/information_property_list)
- [Swift Objective-C Interop](https://developer.apple.com/documentation/swift/using-objective-c-runtime-features-in-swift)

### Capacitor Docs
- [iOS Configuration](https://capacitorjs.com/docs/ios/configuration)
- [Capacitor 7.0 Migration](https://capacitorjs.com/docs/updating/7-0)
- [Plugin Development](https://capacitorjs.com/docs/plugins)

### Project-Specific
- `AGENTS.md` - Overall project guidelines
- `IOS_BUILD_READY.md` - Build instructions
- `capacitor.config.ts` - Capacitor configuration

---

## 🚨 Emergency Recovery

If iOS build is completely broken:

### 1. **Nuclear Option - Fresh iOS Setup**
```bash
# WARNING: This deletes iOS folder
rm -rf ios/
npm install
npx cap add ios
npx cap sync ios

# Then re-apply fixes:
# 1. Create SceneDelegate.swift (see above)
# 2. Add to Xcode project
# 3. Update Info.plist (see above)
```

### 2. **Clean All Caches**
```bash
# Node modules
rm -rf node_modules
npm install

# iOS assets
rm -rf ios/App/App/public/*

# Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*

# CocoaPods
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..

# Rebuild everything
npm run build
npx cap sync ios
```

### 3. **Verify Core Files Exist**
```bash
# Must all return "exists"
test -f ios/App/App/AppDelegate.swift && echo "exists"
test -f ios/App/App/SceneDelegate.swift && echo "exists"
test -f ios/App/App/Info.plist && echo "exists"
test -f ios/App/App.xcworkspace/contents.xcworkspacedata && echo "exists"
```

---

## 💡 Pro Tips for Future Development

### 1. **Always Test iOS Changes**
After any code change:
```bash
npm run build && npx cap sync ios
```
Then test in Xcode simulator.

### 2. **Use Safari Web Inspector**
Best way to debug iOS issues:
- Shows JavaScript console logs
- Reveals network errors
- Shows React component tree

### 3. **Keep CocoaPods Updated**
```bash
cd ios/App
pod update
```
But test thoroughly after updating.

### 4. **Version Lock Capacitor**
Don't auto-update Capacitor major versions. APIs change.

### 5. **Document Breaking Changes**
If you modify core iOS files, document it here.

---

## 📝 Change Log

### October 12, 2025 - Initial Working Configuration
- ✅ Added SceneDelegate.swift with @objc attribute
- ✅ Configured Info.plist with UIApplicationSceneManifest
- ✅ Fixed Capacitor bridge initialization (CAPBridgeViewController)
- ✅ Module-qualified class name in Info.plist
- ✅ Environment variables properly configured
- ✅ Mobile routing working correctly
- **Result:** App launches and displays correctly

---

## 🤝 For Future AI Agents

If you're an AI agent working on this iOS app:

1. **READ THIS ENTIRE FILE** before making iOS changes
2. **DO NOT REMOVE** any files marked "CRITICAL"
3. **DO NOT CHANGE** configurations marked "DO NOT CHANGE"
4. **ALWAYS TEST** in Xcode after changes
5. **USE SAFARI WEB INSPECTOR** for debugging
6. **FOLLOW THE BUILD PROCESS** in exact order
7. **DOCUMENT CHANGES** if you modify core structure

If something is broken:
1. Check Safari Web Inspector console first
2. Verify SceneDelegate still has @objc attribute
3. Verify Info.plist still has correct configuration
4. Try clean build process (steps 1-5 above)
5. If still broken, compare against this document

---

**Last Verified Working:** October 12, 2025  
**Verified By:** Senior iOS Developer (AI Assistant)  
**Build Status:** ✅ SUCCEEDS  
**Launch Status:** ✅ WORKS  
**Display Status:** ✅ PAGES VISIBLE

---

*This document represents the WORKING iOS configuration. Treat it as the source of truth.*

