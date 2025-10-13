# Debug iOS Errors - Quick Guide

**Date:** October 12, 2025

---

## 🔍 How to Check Errors

### Safari Web Inspector (BEST METHOD):
```
1. Run iOS app in Xcode (Cmd+R)
2. Open Safari on Mac
3. Safari menu → Develop → [iPhone Simulator] → PocketTeller
4. Look at Console tab
```

**What to look for:**
- 🔴 Red errors
- ⚠️ Yellow warnings
- Network tab for failed API calls

---

## 🐛 Common Errors After Login

### Error 1: "Cannot read property of undefined"
**Cause:** Data not loaded yet  
**Fix:** Add loading states

### Error 2: Network request failed
**Cause:** API calls failing  
**Fix:** Check Supabase connection

### Error 3: localStorage is not defined
**Cause:** localStorage on native app  
**Status:** Should work (we're using it)

### Error 4: Navigation errors
**Cause:** Route not found or protected route issue  
**Fix:** Check route configuration

---

## 📋 Error Reporting Template

**Please provide:**

1. **Error Message:** (exact text from console)
2. **When it happens:** (immediately, when clicking something, etc.)
3. **What page:** (home, budget, transactions, etc.)
4. **Can you use the app?** (yes/no/partially)

**Example:**
```
Error: "Cannot read property 'map' of undefined"
When: After logging in, on home page
Page: /home (Dashboard)
Can use app: Partially - can navigate but data doesn't show
```

---

## 🔧 Quick Fixes

### If Errors About Data Loading:
```typescript
// Add loading check in components
if (!data) {
  return <div>Loading...</div>;
}
```

### If Errors About Environment Variables:
```bash
# Check if env vars are in build
grep -r "dscndbpqvhvylukvcgpq" dist/assets/*.js
```

### If Errors About Navigation:
```typescript
// Check routes in App.tsx
// Make sure all routes are defined
```

---

## ✅ Environment Check

Your Supabase config looks good:
- ✅ VITE_SUPABASE_URL set
- ✅ VITE_SUPABASE_ANON_KEY set  
- ✅ Connected to: dscndbpqvhvylukvcgpq.supabase.co

---

## 🎯 What to Report

**Copy/paste this and fill in:**

```
ERRORS FOUND:
-------------
1. Error message: [paste exact error]
2. Where: [which page/screen]
3. When: [when does it happen]
4. Console screenshot: [if possible]

WHAT WORKS:
-----------
✅ Login: [yes/no]
✅ Navigation: [yes/no]
✅ Can see home page: [yes/no]
✅ Bottom nav works: [yes/no]

WHAT DOESN'T WORK:
------------------
❌ [describe what's broken]
```

---

## 🚨 Critical Errors to Check

### 1. Supabase Connection:
Look for: "Failed to fetch" or "Network request failed"

### 2. Auth State:
Look for: "User is not authenticated" on protected pages

### 3. Data Loading:
Look for: "Cannot read property" or "undefined is not an object"

### 4. Route Errors:
Look for: "No routes matched location" or "Route not found"

---

## 💡 Most Likely Issues

Based on your setup, common issues after login:

1. **Data not loading** - API calls need time
2. **Protected routes** - Check if auth state propagates
3. **Missing environment variables in build** - Should be fine
4. **Component rendering** - Some data might be undefined

---

**Please share the errors from Safari Web Inspector console so I can fix them!**

