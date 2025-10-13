# 🔍 Android App Black Screen - Diagnosis & Solutions

**Issue:** App installs and launches but shows only a black screen  
**Device:** Android Emulator (emulator-5554)  
**Date:** October 12, 2025

---

## 🐛 Problem Summary

The PocketTeller Android app:
- ✅ **Installs successfully** (10.2 MB APK)
- ✅ **Launches successfully** (MainActivity starts)
- ✅ **Loads assets** (Capacitor loads JS/CSS files)
- ❌ **Shows black screen** (WebView not rendering UI)

---

## 🔎 Root Cause Analysis

This is a **Capacitor WebView rendering issue**. The app is a hybrid app (web app in native container), and the web content isn't rendering.

### Likely Causes:

1. **Missing Supabase Environment Variables**
   - App can't connect to backend
   - React app fails to initialize
   - Black screen while waiting for connection

2. **Authentication Redirect Loop**
   - App requires login
   - No auth state found
   - Stuck on black auth screen

3. **JavaScript Runtime Error**
   - React initialization fails
   - Unhandled exception stops rendering
   - Capacitor shows blank screen

4. **CSS/Styling Issue**
   - Background color is black
   - All content is black text on black background
   - Content exists but invisible

---

## 🔧 Solutions to Try

### Solution 1: Check Emulator Display

**The emulator might be locked or have display issues.**

```bash
# Wake up the emulator
adb shell input keyevent KEYCODE_WAKEUP

# Unlock screen
adb shell input keyevent KEYCODE_MENU

# Relaunch app
adb shell am start -n com.pocketteller.app/.MainActivity

# Take screenshot
adb shell screencap -p /sdcard/test.png && adb pull /sdcard/test.png
```

### Solution 2: Check Console Logs

**Look for JavaScript errors:**

```bash
# Clear logs and watch for errors
adb logcat -c
adb shell am start -n com.pocketteller.app/.MainActivity
adb logcat | grep -i "console\|error\|exception"
```

**Look for these errors:**
- `Cannot read properties of undefined`
- `Network error`
- `Supabase`  
- `Auth`

### Solution 3: Test in Demo Mode

**The app might require authentication. Test with demo mode:**

1. Open the web version: `http://localhost:5173/demo`
2. Test if demo mode works
3. If it does, the issue is authentication

### Solution 4: Verify Environment Variables

**Check if Supabase config is available:**

```bash
# Check capacitor config
cat android/app/src/main/assets/capacitor.config.json

# Should contain Supabase URLs
```

### Solution 5: Enable WebView Debugging

**Add to MainActivity.java:**

```java
import android.webkit.WebView;

// In onCreate():
WebView.setWebContentsDebuggingEnabled(true);
```

Then open: `chrome://inspect` in Chrome to debug the WebView.

### Solution 6: Test on Physical Device

**Emulators can have rendering issues:**

```bash
# Connect physical Android device
# Enable USB debugging
# Then install:
cd android && ./gradlew installDebug

# Launch and test
```

### Solution 7: Simplify the App

**Create a minimal test to isolate the issue:**

Create `android/app/src/main/assets/public/test.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            background: white; 
            padding: 20px; 
        }
        h1 { 
            color: #7C3AED; 
            font-size: 32px; 
        }
    </style>
</head>
<body>
    <h1>PocketTeller Test Page</h1>
    <p style="color: black; font-size: 18px;">
        If you can see this, the WebView is working!
    </p>
    <script>
        console.log('JavaScript is working!');
        alert('WebView is functional!');
    </script>
</body>
</html>
```

Then modify MainActivity to load this test page temporarily.

---

## 📊 Diagnostic Commands

### Check App State
```bash
adb shell dumpsys activity com.pocketteller.app
```

### Check Memory
```bash
adb shell dumpsys meminfo com.pocketteller.app
```

### Check Processes
```bash
adb shell ps | grep pocketteller
```

### Force Stop and Restart
```bash
adb shell am force-stop com.pocketteller.app
adb shell am start -n com.pocketteller.app/.MainActivity
```

### Clear App Data
```bash
adb shell pm clear com.pocketteller.app
adb shell am start -n com.pocketteller.app/.MainActivity
```

---

## 🎯 Most Likely Solution

**Based on the error logs seen earlier:**

```
E Capacitor/Console: Cannot read properties of undefined (reading 'triggerEvent')
```

**This suggests:**
1. A Capacitor plugin is trying to initialize before it's ready
2. The app is trying to access a plugin that doesn't exist
3. A race condition in plugin initialization

**Fix:** Check `capacitor.config.ts` and ensure all plugins are properly configured.

---

## 🚀 Alternative: Test Web Version First

**Since this is a Capacitor app (web + native), test the web version first:**

```bash
# Start dev server
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
npm run dev

# Open in browser
open http://localhost:5173
```

**If web version works:**
- The issue is Capacitor-specific
- Focus on native bridge configuration

**If web version has same issue:**
- The issue is in the React app
- Fix the web app first, then rebuild Android

---

## 💡 Quick Test Strategy

1. **Test web version** (http://localhost:5173)
2. **If web works:** Issue is Capacitor native bridge
3. **If web fails:** Fix React app first
4. **Enable WebView debugging:** chrome://inspect
5. **Test on physical device:** Emulators can be buggy
6. **Check logs:** Look for JavaScript errors

---

## 📱 Recommended Next Steps

###  IMMEDIATE ACTION:

```bash
# 1. Test web version
npm run dev
open http://localhost:5173

# 2. If web works, enable WebView debugging
# Edit: android/app/src/main/java/com/pocketteller/app/MainActivity.java
# Add: WebView.setWebContentsDebuggingEnabled(true);

# 3. Rebuild and install
cd android && ./gradlew installDebug

# 4. Open Chrome and debug
open -a "Google Chrome" chrome://inspect
```

---

## 🎨 Material Design 3 Status

**Important Note:** The Material Design 3 theme we implemented is at the **NATIVE ANDROID LEVEL**, not the WebView level.

**What works:**
- ✅ Native Android theming (status bar, navigation bar)
- ✅ Native components (if used)
- ✅ System UI colors

**What needs the WebView to render:**
- ❌ Your React app UI
- ❌ Buttons, cards, forms
- ❌ All web content

**Once the WebView renders, you'll see:**
- Your violet brand colors
- Rounded corners
- Modern Material Design 3 UI
- Everything from the web app

---

## 🔍 Debug Checklist

- [ ] Web version works in browser
- [ ] No JavaScript console errors
- [ ] Supabase config is present
- [ ] WebView debugging enabled
- [ ] Tested on physical device
- [ ] Cleared app data and retried
- [ ] Checked for authentication issues
- [ ] Verified all assets copied

---

## 📞 Support

**If issue persists:**

1. Share the output of:
   ```bash
   adb logcat | grep -i "pocketteller\|capacitor\|console" > error_log.txt
   ```

2. Test web version and report if it works

3. Enable WebView debugging and inspect in Chrome

4. Try on physical device (emulators can have issues)

---

*Diagnosis created: October 12, 2025*  
*Status: Black screen issue identified*  
*Next: Test web version and enable WebView debugging*
