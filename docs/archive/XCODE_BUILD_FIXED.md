# Xcode iOS Build - FIXED ✅

**Date:** October 12, 2025  
**Status:** ✅ **BUILD SUCCEEDS**

---

## Issue Identified

The Xcode build was failing with error:

```
error: Build input file cannot be found: 
'/Users/mr.adams/pockettellerxchanges/PocketTeller/ios/App/App/Base.lproj/Main.storyboard'. 
Did you forget to declare this file as an output of a script phase or custom build rule which produces it?
```

### Root Cause

The Xcode project file (`project.pbxproj`) had references to `Main.storyboard`, but the file didn't exist in the filesystem. This is correct per AGENTS.md - **Capacitor apps don't use Main.storyboard** (they use LaunchScreen.storyboard instead).

The Info.plist was already correctly configured without `UIMainStoryboardFile`, but the Xcode project still had build references to the missing file.

---

## Fixes Applied

### 1. Removed Main.storyboard References from Xcode Project

**File:** `ios/App/App.xcodeproj/project.pbxproj`

Removed Main.storyboard from:
- ✅ `PBXBuildFile` section (line 13)
- ✅ `PBXFileReference` section (line 25)  
- ✅ `PBXGroup` section (line 78)
- ✅ `PBXResourcesBuildPhase` section (line 165)
- ✅ `PBXVariantGroup` section (lines 220-227)

**Verification:**
```bash
cd ios/App && grep -i "Main.storyboard" App.xcodeproj/project.pbxproj
# Result: No matches found ✅
```

### 2. Disabled User Script Sandboxing

**Issue:** After fixing Main.storyboard, build failed with:
```
error: Sandbox: bash deny(1) file-read-data Pods-App-frameworks.sh
```

**Cause:** Xcode 16 enables stricter sandboxing that prevents CocoaPods scripts from accessing necessary files.

**Fix:** Changed `ENABLE_USER_SCRIPT_SANDBOXING` from `YES` to `NO` in both Debug and Release configurations.

**File:** `ios/App/App.xcodeproj/project.pbxproj`
```
ENABLE_USER_SCRIPT_SANDBOXING = NO;  // Changed from YES
```

---

## Build Result

### Before Fix:
```
** BUILD FAILED **

The following build commands failed:
    CompileStoryboard .../Main.storyboard
```

### After Fix:
```bash
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  build

# Output:
warning: Run script build phase '[CP] Embed Pods Frameworks' will be run during 
         every build because it does not specify any outputs.
** BUILD SUCCEEDED **

Exit code: 0 ✅
```

**Only a warning remains:** CocoaPods script phase performance warning (non-blocking)

---

## How to Build iOS App

### From Command Line:

```bash
# 1. Clean old build artifacts
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
rm -rf ios/App/App/public/*

# 2. Build web app
npm run build

# 3. Sync Capacitor with UTF-8 locale
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx cap sync ios

# 4. Build with xcodebuild
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  build
```

### From Xcode GUI:

```bash
# 1-3. Same as above (clean, build, sync)

# 4. Open in Xcode
cd ios/App && open App.xcworkspace

# 5. In Xcode:
#    - Select "App" scheme
#    - Select simulator (iPhone 16 or your device)
#    - Press Cmd+B to build
#    - Press Cmd+R to run
```

---

## Available Simulators

Based on your system (iOS 18.6 installed):

**iPhones:**
- iPhone 16 ✅ (used in testing)
- iPhone 16 Plus
- iPhone 16 Pro
- iPhone 16 Pro Max
- iPhone 16e

**iPads:**
- iPad (A16)
- iPad Air 11-inch (M3)
- iPad Air 13-inch (M3)
- iPad Pro 11-inch (M4)
- iPad Pro 13-inch (M4)
- iPad mini (A17 Pro)

**Physical Device:**
- iPhone (ID: 00008101-001C30A23CB9001E)

---

## Files Modified

1. **`ios/App/App.xcodeproj/project.pbxproj`**
   - Removed all Main.storyboard references (5 locations)
   - Disabled User Script Sandboxing (2 configurations)

---

## Verification Steps

### 1. No Main.storyboard References
```bash
cd ios/App
grep -i "Main.storyboard" App.xcodeproj/project.pbxproj
# Expected: No output (no matches)
```

### 2. Sandboxing Disabled
```bash
grep "ENABLE_USER_SCRIPT_SANDBOXING" App.xcodeproj/project.pbxproj
# Expected: Two lines showing "= NO;"
```

### 3. Build Succeeds
```bash
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  build 2>&1 | tail -5
# Expected: "** BUILD SUCCEEDED **" and Exit code: 0
```

---

## Why This Happened

According to **AGENTS.md**:

> **CRITICAL FIX - Info.plist Configuration:**
> The Info.plist must NOT have `UIMainStoryboardFile` and MUST have `UIApplicationSceneManifest`.

The Info.plist was already correctly configured (no UIMainStoryboardFile), but the **Xcode project file** still had references to compile and include Main.storyboard. This caused a mismatch:

- ❌ Project tried to compile `Main.storyboard`
- ❌ File didn't exist on disk
- ✅ Build fails

**The fix:** Remove Main.storyboard from the Xcode project entirely, leaving only LaunchScreen.storyboard.

---

## Related Documentation

- **AGENTS.md** - Line 284: "Info.plist must NOT have UIMainStoryboardFile"
- **IOS_BUILD_INSTRUCTIONS.md** - iOS build process
- **FINAL_iOS_SOLUTION.md** - Previous iOS fixes

---

## Testing Recommendations

### Before Deploying:

1. **Clean Build:**
   ```bash
   cd ios/App
   rm -rf ~/Library/Developer/Xcode/DerivedData/App-*
   xcodebuild clean
   ```

2. **Build and Run:**
   ```bash
   npm run build
   npx cap sync ios
   cd ios/App && open App.xcworkspace
   # In Xcode: Cmd+R to build and run
   ```

3. **Test on Simulator:**
   - Launch app
   - Verify no black screen
   - Check routing (should go to `/auth` not `/`)
   - Test basic navigation

4. **Test on Device:**
   - Connect iPhone
   - Select device in Xcode
   - Build and run
   - Test in production-like environment

### Safari Web Inspector Debugging:

If you encounter issues:

1. Run app in Xcode (Cmd+R)
2. Safari → Develop → [Your Device/Simulator] → PocketTeller
3. Check Console for JavaScript errors
4. Verify environment variables loaded
5. Check Supabase initialization

---

## Summary

### What Was Wrong:
- Xcode project referenced Main.storyboard that doesn't exist
- User Script Sandboxing blocked CocoaPods scripts

### What Was Fixed:
- ✅ Removed all Main.storyboard references from project
- ✅ Disabled User Script Sandboxing for CocoaPods compatibility
- ✅ Build now succeeds

### Result:
- **Build Status:** ✅ SUCCEEDING
- **Exit Code:** 0
- **Ready for:** Simulator and device testing

---

**Next Steps:**
1. Open App.xcworkspace in Xcode
2. Select a simulator or device
3. Press Cmd+R to build and run
4. Test the app thoroughly

---

*Fixed by: AI Assistant*  
*Date: October 12, 2025*  
*Compliance: AGENTS.md iOS standards*

