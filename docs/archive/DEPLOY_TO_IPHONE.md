# Deploy iOS App to Your iPhone - PocketTeller

**Date:** October 12, 2025  
**Status:** Ready to deploy to physical device

---

## 🎯 Quick Deploy Steps

### Method 1: Xcode (Easiest - Recommended)

**Prerequisites:**
- iPhone connected via USB cable
- iPhone unlocked and trusted on Mac
- Xcode already open with App.xcworkspace

**Steps:**

1. **Connect Your iPhone:**
   - Plug iPhone into Mac via USB
   - On iPhone: Tap "Trust This Computer" if prompted
   - Enter iPhone passcode

2. **Open Xcode (if not already open):**
   ```bash
   cd /Users/mr.adams/pockettellerxchanges/PocketTeller/ios/App
   open App.xcworkspace
   ```

3. **Select Your iPhone:**
   - In Xcode top bar, click the device dropdown (currently shows simulator name)
   - Select your iPhone from the list (should show your iPhone's name)
   - Example: "John's iPhone" or "iPhone"

4. **Configure Signing:**
   - Click on "App" project in left panel (blue icon)
   - Select "App" target
   - Go to "Signing & Capabilities" tab
   - **Team:** Select your Apple ID team
   - **Signing Certificate:** Automatic signing should work
   - If you don't have a team, click "Add Account" and sign in with Apple ID

5. **Build & Run:**
   - Press `Cmd + R` or click the Play button (▶️)
   - Xcode will:
     - Build the app
     - Code sign it
     - Install it on your iPhone
     - Launch it

6. **First Launch on Device:**
   - If you get "Untrusted Developer" message on iPhone:
     - On iPhone: Settings → General → VPN & Device Management
     - Tap your Apple ID
     - Tap "Trust [Your Apple ID]"
     - Go back to home screen and launch PocketTeller

---

## 📱 Expected Behavior on Your iPhone

### On First Launch:
1. ✅ Splash screen (3 seconds, white with spinner)
2. ✅ Authentication page appears
3. ✅ Bottom navigation visible
4. ✅ Can sign up or sign in
5. ✅ Dashboard loads after login

### All Features Work:
- ✅ AI Chat with Gemini
- ✅ Transaction categorization
- ✅ Stripe payments ($4.99/mo or $32.99/yr)
- ✅ Bank account linking
- ✅ Budget management
- ✅ Goals tracking
- ✅ Transaction history

---

## 🐛 Troubleshooting

### Issue 1: "iPhone is Busy"
**Solution:** Wait for Xcode to finish preparing the device (shows in top bar)

### Issue 2: "Failed to Register Bundle Identifier"
**Solution:** 
- In Xcode: Signing & Capabilities → Change Bundle Identifier
- Use: `com.yourappleid.pocketteller` (replace with your team)

### Issue 3: "No Connected Devices"
**Solution:**
```bash
# Check if iPhone is detected
xcrun xctrace list devices

# If not showing:
# 1. Unplug and replug iPhone
# 2. On iPhone: Trust This Computer
# 3. Restart Xcode
```

### Issue 4: "Untrusted Developer"
**Solution:**
- On iPhone: Settings → General → VPN & Device Management
- Tap your Apple ID email
- Tap "Trust"
- Launch app again

### Issue 5: "Code Signing Error"
**Solution:**
- Go to: Signing & Capabilities in Xcode
- Enable "Automatically manage signing"
- Select your team (Apple ID)
- Xcode will handle the rest

---

## 🔧 Advanced: Build from Command Line

If you want to build without Xcode UI:

```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller

# Find your device UDID
xcrun xctrace list devices | grep iPhone

# Build and install (replace DEVICE_UDID)
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination 'id=DEVICE_UDID' \
  build install
```

---

## 📋 Pre-Deploy Checklist

Before deploying to iPhone:

- [x] iOS app built successfully
- [x] All environment variables synced
- [x] All Supabase secrets configured
- [x] SceneDelegate properly configured
- [ ] iPhone connected via USB
- [ ] iPhone unlocked and trusted
- [ ] Apple ID signed in to Xcode
- [ ] Automatic signing enabled

---

## 🚀 Alternative Method: TestFlight (For Distribution)

If you want to share with others or test like a real App Store app:

### Step 1: Archive the App
1. In Xcode: Product → Archive
2. Wait for archive to complete
3. Archives window opens

### Step 2: Distribute to TestFlight
1. Click "Distribute App"
2. Choose "App Store Connect"
3. Follow the wizard
4. Upload to TestFlight

### Step 3: Install on iPhone
1. Install TestFlight app from App Store
2. Open TestFlight link
3. Install PocketTeller beta

**Note:** Requires Apple Developer Program membership ($99/year)

---

## 📱 What Your iPhone Will Show

### Home Screen:
- App icon: PocketTeller
- Tap to launch

### First Launch:
1. Splash screen (white, 3s)
2. Authentication page
3. Sign up or sign in
4. Dashboard with bottom nav

### Full App Experience:
- Native iOS app performance
- Offline capable
- Push notifications ready (if configured)
- Full screen, no browser chrome
- App Store quality experience

---

## ✅ Verification After Install

### On Your iPhone:
1. **Check App Icon:** Should appear on home screen
2. **Launch App:** Tap icon
3. **Test Splash:** Should show 3-second splash
4. **Test Auth:** Sign up or sign in
5. **Test Navigation:** Bottom nav should work
6. **Test Features:**
   - AI Chat (send a message)
   - View transactions
   - Check budget
   - View goals

### Check for Issues:
- No black screen ✅
- No crashes ✅
- All pages load ✅
- Navigation smooth ✅
- Can interact with UI ✅

---

## 🔍 Debug on Physical Device

If you encounter issues on the physical device:

### Safari Web Inspector (Best Tool):
1. **On iPhone:** Settings → Safari → Advanced → Web Inspector: ON
2. **On Mac:** Open Safari
3. **Connect:** Safari → Develop → [Your iPhone Name] → PocketTeller
4. **Debug:** Check Console for errors

### Xcode Console:
- While app is running on device
- View → Debug Area → Show Debug Area (`Cmd + Shift + Y`)
- Check console logs for errors

---

## 📊 Build Configurations

### Debug Build (Current):
- **Uses:** Sign to Run Locally (free)
- **Good for:** Development and testing
- **Limitations:** App expires after 7 days
- **Code optimization:** None (faster builds)

### Release Build (For Production):
- **Uses:** App Store distribution certificate
- **Good for:** TestFlight and App Store
- **Limitations:** Requires paid Apple Developer account
- **Code optimization:** Full (smaller, faster app)

---

## 🎯 Quick Command Reference

### Connect iPhone and Deploy:
```bash
# 1. Connect iPhone via USB
# 2. Open Xcode
cd /Users/mr.adams/pockettellerxchanges/PocketTeller/ios/App
open App.xcworkspace

# 3. In Xcode:
# - Select your iPhone in device dropdown
# - Press Cmd+R
```

### Check Connected Devices:
```bash
xcrun xctrace list devices
```

### View Xcode Logs:
```bash
# After running app
# Xcode: Cmd+Shift+Y (show debug area)
```

### Rebuild if Needed:
```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
npm run build
npx cap sync ios
# Then build in Xcode (Cmd+R)
```

---

## 🔐 Code Signing Notes

### Automatic Signing (Recommended):
- Xcode handles everything
- Uses your Apple ID
- Creates certificates automatically
- Free for development

### Manual Signing (Advanced):
- Requires Apple Developer account
- Manage certificates manually
- More control but complex

**For your first deploy, use automatic signing!**

---

## 🎊 Success!

Once the app is running on your iPhone:

1. ✅ App launches from home screen
2. ✅ Runs natively (not in browser)
3. ✅ Full iOS experience
4. ✅ All features functional:
   - AI Chat
   - Payments
   - Bank Linking
   - Budgets
   - Goals
   - Transactions

---

## 📞 Support

If you encounter issues:

1. **Check Safari Web Inspector** (most helpful)
2. **Check Xcode console logs**
3. **Verify iPhone is trusted**
4. **Try different USB cable**
5. **Restart Xcode and iPhone**

Common issues are usually:
- iPhone not trusted → Trust in Settings
- Signing error → Enable automatic signing
- Build error → Clean build folder

---

**Ready to deploy!** Just connect your iPhone and press Cmd+R in Xcode! 🚀

---

*Last Updated: October 12, 2025*  
*iOS App Status: Ready for device deployment*  
*All secrets verified and configured*

