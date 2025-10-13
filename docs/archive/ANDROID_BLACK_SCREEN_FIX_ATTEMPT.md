# 🔧 Android Black Screen - Fix Attempt #1

**Date:** October 12, 2025  
**Issue:** Black screen on Android app launch  
**Root Cause Identified:** Routing issue - app landing on marketing page instead of auth

---

## 📋 AGENTS.md Created

Following best practices from [https://agents.md/](https://agents.md/), I created a comprehensive `AGENTS.md` file containing:

✅ Project overview and architecture  
✅ Setup commands  
✅ Code style guidelines  
✅ Testing instructions  
✅ Environment variables  
✅ Mobile-specific rules  
✅ Common tasks  
✅ Troubleshooting guide  

This will serve as the single source of truth for all AI agents working on this project.

---

## 🎯 Problem Analysis

### The Issue
**Current Behavior:**
- App opens at `/` route (Index - marketing/hero page)
- Index page is designed for web browsers
- Not appropriate for mobile apps
- WebView shows black while loading/routing

**What Should Happen:**
- Mobile apps skip marketing pages
- Land directly on `/auth` if not authenticated
- Land directly on `/home` if authenticated

### Why This Causes Black Screen
1. App loads at `/` route
2. Index component checks authentication
3. Shows loading state (possibly rendering as black)
4. Tries to render marketing page (not optimized for mobile WebView)
5. Gets stuck in loading/rendering state

---

## 🛠️ Solution Implemented

### 1. Created Mobile-Specific App Component

**File:** `src/App.mobile.tsx`

**Key Features:**
- Dedicated routing for mobile apps
- No marketing pages
- Direct auth/dashboard routing
- Optimized loading states

**Mobile Root Logic:**
```typescript
function MobileRoot() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }

  // Skip marketing - go straight to auth or dashboard
  return <Navigate to={user ? "/home" : "/auth"} replace />;
}
```

### 2. Platform Detection in main.tsx

**File:** `src/main.tsx`

**Logic:**
```typescript
import { Capacitor } from '@capacitor/core'

// Detect if running in native mobile app
const isMobileApp = Capacitor.isNativePlatform();

// Use appropriate app component
const AppComponent = isMobileApp ? AppMobile : App;
```

**Logging:**
```typescript
console.log(`🚀 PocketTeller starting in ${isMobileApp ? 'MOBILE' : 'WEB'} mode`);
```

### 3. Mobile Routes

**Routes in App.mobile.tsx:**
- `/` → Redirects to `/auth` or `/home` based on auth state
- `/auth` → Login/signup page (✅ This is where mobile should land)
- `/home` → Dashboard (protected route)
- `/chat`, `/goals`, `/transactions`, `/budget`, `/account` → Protected routes
- No marketing pages (`/for-institutions`, `/for-nonprofits`, etc.)

---

## 📦 Build & Deploy Process

### Step 1: Build Web Assets
```bash
npm run build
✓ Built in 6.23s
```

### Step 2: Sync to Android
```bash
npx cap sync android
✔ Copying web assets
✔ Creating capacitor.config.json
✔ copy android in 132.92ms
✔ Sync finished in 0.247s
```

### Step 3: Build Android APK
```bash
cd android && ./gradlew assembleDebug
BUILD SUCCESSFUL in 11s
```

### Step 4: Install on Emulator
```bash
adb install -r app-debug.apk
✅ App reinstalled
```

### Step 5: Launch
```bash
adb shell am start -n com.pocketteller.app/.MainActivity
✅ App launched
```

---

## ⏳ Current Status

**After Fix:**
- ❌ Still showing black screen
- ✅ Build successful
- ✅ App installs
- ✅ App launches
- ❌ UI not visible

---

## 🔍 Next Debugging Steps

### 1. Check Console Logs
```bash
adb logcat | grep "PocketTeller\|MOBILE\|WEB mode"
```

**Looking for:**
- "🚀 PocketTeller starting in MOBILE mode"
- Route changes
- JavaScript errors
- Capacitor plugin errors

### 2. Verify Platform Detection
The log should show "MOBILE mode" when running in Capacitor.
If it shows "WEB mode", the detection isn't working.

### 3. Check if Auth is Loading
- Is `useAuth()` loading state completing?
- Is it getting stuck?
- Are there errors in auth initialization?

### 4. Possible Issues

**Issue A: Platform Detection Not Working**
- `Capacitor.isNativePlatform()` returns false
- App uses web routing instead of mobile
- Falls back to Index page

**Issue B: Auth Loading Never Completes**
- `useAuth()` hook stuck in loading state
- Supabase connection issue
- Environment variables missing

**Issue C: WebView Still Not Rendering**
- Even with correct routing, WebView has rendering issue
- Might be deeper Capacitor issue
- Could be CSS/styling making everything invisible

---

## 💡 Alternative Approaches to Try

### Option 1: Simplify Loading State
Make loading state visible (not just black):
```typescript
if (loading) {
  return (
    <div style={{ 
      background: 'white', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ color: '#7C3AED', fontSize: '24px' }}>
        Loading PocketTeller...
      </div>
    </div>
  );
}
```

### Option 2: Force Route to /auth
Bypass all logic and hardcode route to auth:
```typescript
// In App.mobile.tsx
<Route path="/" element={<Auth />} />
```

### Option 3: Add Debug Logging
Add visible debug info to see what's happening:
```typescript
// Show current state on screen
<div style={{ position: 'fixed', top: 0, background: 'white', zIndex: 9999 }}>
  Loading: {loading ? 'YES' : 'NO'}
  User: {user ? 'YES' : 'NO'}
  Platform: {Capacitor.getPlatform()}
</div>
```

### Option 4: Test Minimal HTML
Create ultra-simple test page to verify WebView works:
```html
<!DOCTYPE html>
<html>
<body style="background: white;">
  <h1 style="color: #7C3AED;">Test Page</h1>
  <p>If you see this, WebView is working!</p>
</body>
</html>
```

---

## 📊 What We Know

### Definitely Working
✅ Material Design 3 theme (native Android level)  
✅ APK builds successfully  
✅ App installs on emulator  
✅ MainActivity launches  
✅ Capacitor framework loads  

### Definitely Not Working
❌ WebView rendering (black screen persists)  
❌ UI visibility  
❌ User interaction  

### Unknown (Need to Check)
⏳ Is platform detection working?  
⏳ Is mobile routing being used?  
⏳ Is auth loading completing?  
⏳ Are there JavaScript errors?  
⏳ Is it routing to /auth correctly?  

---

## 🎯 Recommended Next Action

**IMMEDIATE:**
1. Check logs for "MOBILE mode" message
2. If shows "WEB mode", platform detection failed
3. If shows "MOBILE mode", check for route changes in logs
4. Look for JavaScript errors

**IF MOBILE MODE IS WORKING:**
- The routing fix should work
- Black screen is likely a rendering issue
- Need to check CSS/styling

**IF WEB MODE IS DETECTED:**
- Platform detection isn't working
- Need different approach to detect mobile
- Could use window.location or user agent

---

## 📝 Code Changes Summary

**Files Created:**
- `AGENTS.md` - Project documentation for AI agents
- `src/App.mobile.tsx` - Mobile-optimized app component

**Files Modified:**
- `src/main.tsx` - Added platform detection and routing

**Build Status:**
- ✅ TypeScript compilation
- ✅ Vite build
- ✅ Capacitor sync
- ✅ Gradle build
- ✅ APK generated

---

*Fix attempted: October 12, 2025*  
*Status: Implemented but black screen persists*  
*Next: Check logs for platform detection and routing*

