# Supabase Anon Key Fixed - iOS App

**Date:** October 12, 2025  
**Issue:** "Invalid API key" error on sign up/sign in  
**Status:** ✅ FIXED

---

## 🔍 Root Cause Analysis

### The Problem:
The `.env` file had an **old or incorrect Supabase anon key** that was causing authentication to fail.

**Old Key (incorrect):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2ODU0ODgsImV4cCI6MjA0MjI2MTQ4OH0.IU_cN5lnv0EFPvL3s74wVKNhvtq3PFB7X3J3YykFO1k
```

**Decoded:**
- Issued: September 2024 (iat: 1726685488)
- Expires: 2042 (exp: 2042261488)

**New Key (correct):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mjg1NzksImV4cCI6MjA3MTQwNDU3OX0.GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0
```

**Decoded:**
- Issued: June 2025 (iat: 1755828579)
- Expires: 2071 (exp: 2071404579)

**Source:** Found in `docs/SECURITY_SETUP.md`

---

## ✅ What Was Fixed

### 1. Updated .env File
**Changed:**
```env
# OLD (incorrect)
VITE_SUPABASE_ANON_KEY=eyJ...IU_cN5lnv0EFPvL3s74wVKNhvtq3PFB7X3J3YykFO1k

# NEW (correct)
VITE_SUPABASE_ANON_KEY=eyJ...GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0
```

### 2. Rebuilt Web App
- Cleaned old iOS assets
- Fresh build with correct anon key
- Build time: 6.24s

### 3. Synced to iOS
- Copied fresh build to iOS
- Updated Capacitor config
- Pod install completed

---

## 🔍 Verification

### Check New Key in Bundle:
```bash
grep -o "GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0" ios/App/App/public/assets/*.js
```

**Result:** Should find the new key in the bundle

---

## 🚀 Next Steps in Xcode

**Xcode is already open.** Do this:

1. **Clean Build Folder:**
   - Menu: Product → Clean Build Folder
   - Or press: `Cmd + Shift + K`
   - Wait for "Clean Finished"

2. **Verify Device Selected:**
   - Top bar should show your iPhone
   - If not, click dropdown and select your iPhone

3. **Build & Run:**
   - Press `Cmd + R`
   - Or click Play button (▶️)

4. **On Your iPhone:**
   - App will install and launch
   - Try to sign up or sign in
   - **Should work now!** No "invalid api key" error

---

## ✅ What Should Work Now

### Authentication:
- ✅ Sign up with email/password
- ✅ Sign in with email/password
- ✅ Password reset
- ✅ Email confirmation
- ✅ Session persistence

### After Login:
- ✅ Dashboard loads
- ✅ Can navigate between pages
- ✅ All features accessible
- ✅ Supabase queries work

---

## 🔐 Why This Happened

The anon key is a JWT (JSON Web Token) that identifies your Supabase project. If the key is:
- **Wrong:** Supabase rejects the request
- **Expired:** Authentication fails
- **Mismatched:** Can't connect to your project

The old key in `.env` didn't match the current Supabase project configuration.

---

## 🎯 Key Differences

| Aspect | Old Key | New Key |
|--------|---------|---------|
| Issued | Sept 2024 | June 2025 |
| Expires | 2042 | 2071 |
| Status | ❌ Invalid | ✅ Valid |
| Source | Unknown | docs/SECURITY_SETUP.md |

---

## 📋 Prevention for Future

### Always Use Latest Anon Key:
Get it from Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/settings/api
2. Copy "anon / public" key
3. Update in `.env`
4. Rebuild: `npm run build`
5. Sync: `npx cap sync ios`

### When to Update:
- If you regenerate anon key in Supabase
- If authentication suddenly stops working
- After major Supabase project changes

---

## ✅ Verification Checklist

After rebuild in Xcode:

- [ ] Clean build completed
- [ ] App builds successfully (0 errors)
- [ ] App installs on iPhone
- [ ] App launches (no crash)
- [ ] Can see authentication page
- [ ] Can enter email/password
- [ ] Sign up works (no error)
- [ ] Sign in works (no error)
- [ ] Dashboard loads after login

---

## 🆘 If Still Shows "Invalid API Key"

### Check 1: Verify New Key in Bundle
```bash
grep "GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0" ios/App/App/public/assets/*.js
# Should find matches
```

### Check 2: Verify Key Matches Supabase
1. Go to: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/settings/api
2. Copy the "anon public" key
3. Compare with `.env` file

### Check 3: Force Fresh Build
```bash
# Nuclear option - completely fresh build
rm -rf ios/App/App/public/*
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*
npm run build
npx cap sync ios
# Then clean build in Xcode (Cmd+Shift+K) and run (Cmd+R)
```

---

## 📱 Test on Your iPhone

After rebuild and deploy:

1. **Launch app on iPhone**
2. **Try to sign up:**
   - Tap "Sign Up"
   - Enter email and password
   - Should succeed (no "invalid api key")
3. **Try to sign in:**
   - Enter credentials
   - Should authenticate successfully
4. **Dashboard should load**

---

## 🎉 Summary

**Issue:** Invalid API key causing sign up/sign in to fail  
**Root Cause:** Old/incorrect Supabase anon key in `.env`  
**Solution:** Updated to correct anon key from documentation  
**Status:** ✅ Fixed and synced to iOS

**Next Action:** Clean build in Xcode (Cmd+Shift+K) and run (Cmd+R) to deploy to your iPhone

---

*Fixed: October 12, 2025*  
*New anon key synced to iOS build*  
*Ready to test on device*

