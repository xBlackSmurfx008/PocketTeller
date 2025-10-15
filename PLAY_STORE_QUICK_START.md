# Google Play Store - Quick Start Guide

**Ready to publish PocketTeller!** 🚀

---

## ✅ What's Already Done

- [x] **Production AAB Built** ✨
  - Location: `android/app/build/outputs/bundle/release/app-release.aab`
  - Size: 24 MB
  - Version: 1.0.1 (Build 2)
  - **Signed and ready for upload!**

- [x] App Configuration Complete
  - App ID: `com.pocketteller.app`
  - Signing key configured
  - All permissions declared
  - Deep linking configured
  - Production URLs set

---

## 📋 Next Steps (In Order)

### 1. Capture Screenshots (15 minutes)

```bash
# Option A: Run automated script
cd scripts
./capture-android-screenshots.sh

# Option B: Manual capture
# 1. Install app on device/emulator
# 2. Navigate to key screens
# 3. Take screenshots with adb:
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png
```

**Required Screenshots:**
1. Welcome/Auth screen
2. Dashboard with accounts
3. Transactions list
4. Budget/Goals screen
5. AI coaching chat
6. Spending insights
7. Settings (optional)

**Format:** PNG or JPEG, minimum 320px on short side

---

### 2. Create Feature Graphic (20 minutes)

**Dimensions:** 1024 x 500 px  
**Format:** PNG or JPEG  
**Content Ideas:**
- App icon + "PocketTeller"
- Tagline: "Your AI-Powered Financial Coach"
- Key visual: Phone mockup showing dashboard
- Colors: Use brand violet (#7C3AED)

**Tools:**
- Canva (easiest): https://canva.com
- Figma
- Photoshop
- GIMP (free)

**Template structure:**
```
[App Icon]  PocketTeller
           Your AI-Powered Financial Coach
           [Phone mockup showing app]
```

---

### 3. Create Google Play Developer Account (10 minutes)

1. Go to: https://play.google.com/console
2. Sign in with Google account
3. Pay $25 one-time fee
4. Complete developer profile:
   - Developer name
   - Email: support@pocketbanker.app
   - Website: https://pocketbanker.app

---

### 4. Create App Listing (30 minutes)

**Go to Play Console → Create App**

#### App Details:
- **App name:** PocketTeller
- **Default language:** English (United States)
- **App type:** App
- **Free or paid:** Free (with in-app purchases)

#### Complete Setup Tasks:

**App Access:**
- All functionality available without restrictions

**Ads:**
- No, my app does not contain ads

**Content Rating:**
- Complete questionnaire
- Category: Finance
- Target age: 18+

**Target Audience:**
- Age: 18 and older

**Data Safety:**
- Personal info: Name, Email
- Financial info: Bank accounts, transactions
- Data encrypted in transit and at rest
- Users can request data deletion

**Privacy Policy:**
- URL: https://pocketbanker.app/privacy
- (Make sure this page exists!)

---

### 5. Upload Assets (15 minutes)

**Store Listing → Main Store Listing**

Upload:
- [x] App icon (512x512) - Use from `android/app/src/main/res/`
- [ ] Feature graphic (1024x500) - Create new
- [ ] Screenshots (4-8) - Capture from app

**Descriptions:**

**Short (80 chars):**
```
AI-powered personal finance coach. Budget, save, and achieve your goals.
```

**Full Description:**
(See `GOOGLE_PLAY_STORE_DEPLOYMENT.md` for complete description)

---

### 6. Upload AAB (5 minutes)

**Production → Create New Release**

1. Upload: `android/app/build/outputs/bundle/release/app-release.aab`
2. Release name: `1.0.1 - Initial Release`
3. Release notes:
```
Welcome to PocketTeller! 🎉

✨ Features:
• Connect bank accounts securely
• Automatic transaction tracking
• Smart budgeting with visual progress
• AI-powered financial coaching
• Spending insights and analytics

🔒 Bank-level security
💎 14-day free trial
```

---

### 7. Configure Subscriptions (15 minutes)

**Monetize → Subscriptions**

**Monthly Premium:**
- Product ID: `premium_monthly`
- Price: $9.99/month
- Free trial: 14 days

**Annual Premium:**
- Product ID: `premium_annual`
- Price: $95.88/year ($7.99/month)
- Free trial: 14 days

---

### 8. Submit for Review (5 minutes)

1. Review all sections (green checkmarks)
2. Select countries (All or USA first)
3. Click "Start rollout to Production"
4. Wait 2-7 days for review

---

## 🎯 Total Time Estimate

- Screenshots: 15 min
- Feature graphic: 20 min
- Developer account: 10 min
- App listing: 30 min
- Upload assets: 15 min
- Upload AAB: 5 min
- Subscriptions: 15 min
- Submit: 5 min

**Total: ~2 hours**

---

## 🚨 Critical Checklist

Before submitting:

- [ ] AAB uploaded successfully
- [ ] All 4-8 screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] App icon uploaded (512x512)
- [ ] Privacy policy URL live
- [ ] Terms of service URL live
- [ ] Content rating completed
- [ ] Data safety completed
- [ ] All sections have green checkmarks
- [ ] App tested on real device
- [ ] No critical bugs

---

## 📞 Need Help?

**Full Guide:** `GOOGLE_PLAY_STORE_DEPLOYMENT.md`  
**Android Guide:** `ANDROID_PRODUCTION_GUIDE.md`  
**Support:** support@pocketbanker.app

---

## 🎉 After Approval

1. You'll receive email (2-7 days)
2. If using Managed Publishing, click "Go live"
3. App appears on Play Store within hours
4. Share your Play Store link!
5. Monitor reviews and analytics

---

**Your AAB is ready! You're 2 hours away from being live on Google Play Store! 🚀**

*Last updated: October 15, 2025*

