# Deep Linking & Email Confirmation Setup Guide

This guide explains how to configure deep linking so that email confirmation links open your mobile app instead of the browser, and how to increase the OTP/confirmation token expiration time to 15 minutes.

## 🎯 What This Solves

**Before:**
- User clicks email confirmation link on phone → Opens in browser (bad UX)
- Confirmation token expires in 60 seconds → User can't confirm in time
- URL doesn't properly handle the confirmation → Account remains unconfirmed

**After:**
- User clicks email confirmation link on phone → Opens in app (great UX!)
- Confirmation token valid for 15 minutes → Plenty of time to confirm
- App properly handles the confirmation → Account confirmed successfully

---

## 📱 Part 1: Deep Linking Configuration

### How It Works

1. **Supabase** sends email with link: `https://pocketbanker.app/confirm?token=abc123...`
2. **iOS/Android** intercepts the HTTPS URL (via Universal Links/App Links)
3. **App** receives the URL and navigates to `/confirm` route
4. **EmailConfirmation page** processes the token and confirms the account

### Files Modified

✅ **iOS Configuration:**
- `ios/App/App/Info.plist` - Added URL schemes and associated domains
- `public/.well-known/apple-app-site-association` - iOS verification file

✅ **Android Configuration:**
- `android/app/src/main/AndroidManifest.xml` - Added intent filters for app links
- `public/.well-known/assetlinks.json` - Android verification file

✅ **React App:**
- `src/hooks/useDeepLinks.ts` - Deep link handler hook
- `src/components/DeepLinkHandler.tsx` - Component that listens for deep links
- `src/App.tsx` - Integrated DeepLinkHandler
- `src/utils/authConfig.ts` - Updated with deep link documentation

### Prerequisites Needed

Before deep linking works, you need:

1. **iOS Team ID** (for Apple Developer account)
2. **Android Release Key SHA-256 Fingerprint**
3. **Domain hosting** for verification files

---

## 🔧 Part 2: Configuration Steps

### Step 1: Get Your iOS Team ID

1. Go to [Apple Developer Account](https://developer.apple.com/account)
2. Click on "Membership" in the sidebar
3. Copy your **Team ID** (looks like: `AB1C2D3E4F`)

### Step 2: Update iOS Verification File

Edit: `public/.well-known/apple-app-site-association`

Replace `TEAM_ID` with your actual Team ID:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.pocketteller.app",
        "paths": [
          "/confirm",
          "/confirm/*",
          "/reset-password",
          "/reset-password/*",
          "/auth/callback",
          "/auth/callback/*"
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["YOUR_TEAM_ID.com.pocketteller.app"]
  }
}
```

### Step 3: Get Android Release Key Fingerprint

Run this command to get your SHA-256 fingerprint:

```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller/android/app
keytool -list -v -keystore pocketteller-release-key.keystore -alias pocketteller-key
```

Enter your keystore password, then copy the **SHA-256** fingerprint.

### Step 4: Update Android Verification File

Edit: `public/.well-known/assetlinks.json`

Replace the fingerprint placeholder:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.pocketteller.app",
      "sha256_cert_fingerprints": [
        "YOUR_ACTUAL_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

### Step 5: Deploy Verification Files

The verification files MUST be accessible at these URLs:

**iOS:**
- `https://pocketbanker.app/.well-known/apple-app-site-association`
- No file extension, content-type: `application/json`

**Android:**
- `https://pocketbanker.app/.well-known/assetlinks.json`

**How to deploy:**

1. Build your web app:
   ```bash
   npm run build
   ```

2. The `.well-known` folder will be copied to `dist/` automatically

3. Deploy `dist/` folder to your hosting (Vercel, Netlify, etc.)

4. Verify files are accessible:
   ```bash
   curl https://pocketbanker.app/.well-known/apple-app-site-association
   curl https://pocketbanker.app/.well-known/assetlinks.json
   ```

### Step 6: Enable Associated Domains in Xcode

1. Open Xcode: `cd ios/App && open App.xcworkspace`
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability** → **Associated Domains**
5. Add these domains:
   - `applinks:pocketbanker.app`
   - `applinks:app.pocketbanker.app`

### Step 7: Build & Test Mobile Apps

**iOS:**
```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
npm run build
npx cap sync ios
cd ios/App && open App.xcworkspace
# Build and run on device (Cmd+R)
```

**Android:**
```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

### Step 8: Test Deep Linking

1. Install the app on your device
2. Send yourself an email with this link:
   ```
   https://pocketbanker.app/confirm?token=test123
   ```
3. Click the link on your device
4. **Expected:** App opens to the /confirm page
5. **If browser opens:** Verification files not deployed correctly or domains not configured

**Debugging:**
- **iOS:** Check Settings → Safari → Advanced → Website Data → Look for pocketbanker.app
- **Android:** Run `adb shell pm verify-app-links` to check app link verification

---

## ⏱️ Part 3: Increase OTP Expiration to 15 Minutes

### Supabase Dashboard Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **dscndbpqvhvylukvcgpq**
3. Navigate to: **Authentication** → **Settings** → **Auth Configuration**
4. Find section: **Email Auth**
5. Set these values:

   ```
   MAILER_OTP_EXP = 900
   ```

   *900 seconds = 15 minutes*

6. Click **Save** at the bottom

### What This Changes

- **Before:** Email confirmation links expire in 60 seconds
- **After:** Email confirmation links valid for 15 minutes
- **Affects:** All OTP-based emails (signup confirmation, password reset, magic links)

### Alternative: Using Supabase CLI

If you prefer CLI configuration:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref dscndbpqvhvylukvcgpq

# Update auth config
supabase secrets set MAILER_OTP_EXP=900
```

---

## 🧪 Testing Checklist

### Test Email Confirmation Flow

- [ ] User signs up with email/password
- [ ] Receives confirmation email
- [ ] Clicks link on mobile device
- [ ] App opens (not browser)
- [ ] Navigates to /confirm page
- [ ] Token is processed successfully
- [ ] User is confirmed and redirected to /home
- [ ] Link remains valid for 15 minutes

### Test Password Reset Flow

- [ ] User requests password reset
- [ ] Receives reset email
- [ ] Clicks link on mobile device
- [ ] App opens (not browser)
- [ ] Navigates to /reset-password page
- [ ] Can set new password successfully

---

## 🐛 Troubleshooting

### Issue: Link Opens in Browser Instead of App

**Causes:**
1. Verification files not deployed or accessible
2. iOS Team ID incorrect in verification file
3. Android SHA-256 fingerprint incorrect
4. Associated Domains not enabled in Xcode
5. App not installed on device

**Solutions:**
1. Verify files are accessible via curl
2. Double-check Team ID in Apple Developer account
3. Re-run keytool command to get correct fingerprint
4. Add Associated Domains capability in Xcode
5. Install app on device before testing

### Issue: "Token Expired" Error

**Causes:**
1. MAILER_OTP_EXP not updated in Supabase
2. Email took too long to arrive
3. User waited too long to click link

**Solutions:**
1. Verify MAILER_OTP_EXP=900 in Supabase dashboard
2. Check spam folder for emails
3. Request new confirmation email
4. Use "Resend confirmation" button in app

### Issue: Deep Link Not Caught on Cold Start

**Causes:**
1. DeepLinkHandler not integrated in App.tsx
2. App plugin not installed
3. URL listener not registered properly

**Solutions:**
1. Verify `<DeepLinkHandler />` is in BrowserRouter
2. Run `npm install @capacitor/app`
3. Check Safari Web Inspector (iOS) for errors
4. Use `getLaunchUrl()` to handle cold start URLs

---

## 📚 Additional Resources

- [Apple Universal Links Documentation](https://developer.apple.com/ios/universal-links/)
- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [Capacitor Deep Links Guide](https://capacitorjs.com/docs/guides/deep-links)
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-email)

---

## ✅ Summary

**What Was Done:**

1. ✅ Added iOS Universal Links support
2. ✅ Added Android App Links support
3. ✅ Created verification files for both platforms
4. ✅ Implemented deep link handler in React app
5. ✅ Updated auth configuration with proper URLs
6. ✅ Documented OTP expiration increase to 15 minutes

**Next Steps:**

1. ⚠️ Update `apple-app-site-association` with your iOS Team ID
2. ⚠️ Update `assetlinks.json` with your Android SHA-256 fingerprint
3. ⚠️ Deploy verification files to your domain
4. ⚠️ Enable Associated Domains in Xcode
5. ⚠️ Update MAILER_OTP_EXP=900 in Supabase Dashboard
6. ✅ Build and test on real devices

---

**Questions? Issues?**
Check the troubleshooting section above or review the iOS/Android production guides.

