# 📱 App Store Links Setup Guide

**Purpose:** Update app store download links when apps are published  
**Updated:** October 11, 2025

---

## 🎯 Overview

App Store and Google Play download buttons are now on your homepage hero section. They currently show "Coming Soon" messages. Update the links when your apps are published.

---

## 📍 Where the Buttons Are

### Homepage Hero
- **Location:** `/` (Index page)
- **Component:** `src/components/AppStoreButtons.tsx`
- **Position:** Below "Get Started" and "Try Demo" buttons
- **Style:** Professional black buttons with store logos

### Visual Design
```
┌─────────────────────────────────────┐
│  Get Started Free  │  Try Demo      │
└─────────────────────────────────────┘
         Also available on:
┌──────────────┐  ┌──────────────┐
│  📱 App Store│  │ 🤖 Google Play│
└──────────────┘  └──────────────┘
```

---

## 🔧 How to Update Links

### Method 1: Environment Variables (Recommended)

**1. Update your `.env` file:**
```env
# iOS App Store URL
VITE_APP_STORE_URL=https://apps.apple.com/app/pocketteller/idXXXXXXXXX

# Google Play Store URL
VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.pocketteller.app
```

**2. Rebuild your app:**
```bash
npm run build
```

**3. Redeploy:**
```bash
vercel --prod  # or your hosting
```

### Method 2: Direct Code Update

**Edit:** `src/components/AppStoreButtons.tsx`

**Find these lines (7-8):**
```typescript
const APP_STORE_URL = process.env.VITE_APP_STORE_URL || '#';
const PLAY_STORE_URL = process.env.VITE_PLAY_STORE_URL || '#';
```

**Replace with your URLs:**
```typescript
const APP_STORE_URL = 'https://apps.apple.com/app/pocketteller/idXXXXXXXXX';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.pocketteller.app';
```

---

## 📝 Getting Your App Store URLs

### iOS App Store

**After app is approved:**

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to "App Information"
4. Copy the App Store URL (looks like: `https://apps.apple.com/app/pocketteller/idXXXXXXXXX`)

**URL Format:**
```
https://apps.apple.com/app/pocketteller/id[YOUR_APP_ID]
```

**Example:**
```
https://apps.apple.com/app/pocketteller/id1234567890
```

### Google Play Store

**After app is published:**

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to "Store presence" → "Main store listing"
4. Copy the Store URL

**URL Format:**
```
https://play.google.com/store/apps/details?id=com.pocketteller.app
```

---

## 🎨 Button Component Features

### Current Behavior

**Before Apps Published:**
- Clicking shows "Coming Soon!" toast notification
- Links are `#` (no navigation)
- User-friendly messaging

**After URLs Updated:**
- Clicking opens respective app store
- Opens in new tab (`target="_blank"`)
- Secure (`rel="noopener noreferrer"`)

### Customization Options

**Show/Hide Label:**
```tsx
<AppStoreButtons showLabel={false} />
// Hides "Also available on:" text
```

**Custom Styling:**
```tsx
<AppStoreButtons className="my-8" />
// Add custom spacing/positioning
```

---

## 📍 Button Locations

### Currently Implemented

1. **Homepage Hero** (`/`)
   - Below main CTAs
   - Prominent placement
   - Mobile-responsive

### Recommended Additional Placements

**2. Subscription Page** (`/subscription`)
```tsx
// After FAQ section
<AppStoreButtons showLabel={true} className="mt-12" />
```

**3. Footer** (All pages)
```tsx
// In PublicFooter component
<AppStoreButtons showLabel={false} className="my-6" />
```

**4. Auth Page** (`/auth`)
```tsx
// Below sign-in form
<div className="mt-6">
  <p className="text-center text-sm text-muted-foreground mb-3">
    Or download our mobile app:
  </p>
  <AppStoreButtons showLabel={false} />
</div>
```

---

## 🧪 Testing

### Test Before Publishing

**1. Check buttons appear:**
```bash
npm run dev
# Visit: http://localhost:5173
# Buttons should be visible below main CTAs
```

**2. Click buttons:**
- Should show "Coming Soon!" toast
- Should not navigate anywhere

**3. Check responsiveness:**
- Desktop: Buttons side-by-side
- Mobile: Buttons stack vertically

### Test After Publishing

**1. Update URLs in `.env`**

**2. Test links:**
- iOS button → Opens App Store
- Android button → Opens Google Play
- Links open in new tab
- Links work on mobile devices

---

## 🎯 When to Update

### iOS App

**Trigger:** App approved in App Store

**Steps:**
1. Get App Store URL from App Store Connect
2. Update `VITE_APP_STORE_URL` in `.env`
3. Rebuild and redeploy web app
4. Test button on production site

### Android App

**Trigger:** App published on Google Play

**Steps:**
1. Get Play Store URL from Google Play Console
2. Update `VITE_PLAY_STORE_URL` in `.env`
3. Rebuild and redeploy web app
4. Test button on production site

---

## 📊 Expected Impact

### User Experience
- ✅ Clear, prominent download CTAs
- ✅ Professional app store buttons
- ✅ Multi-platform awareness
- ✅ Easy access to mobile apps

### Conversion
- Increases mobile app downloads
- Reduces friction for mobile users
- Cross-platform visibility
- Professional appearance

### SEO
- Shows you have native apps
- Increases trust/credibility
- Better for app store optimization

---

## 🎨 Button Design

### Visual Style
- **Background:** Black (light mode), White (dark mode)
- **Text:** White (light mode), Black (dark mode)
- **Icons:** Official Apple/Google logos
- **Hover:** Scale up 5%
- **Active:** Scale down 5%
- **Shadow:** Subtle shadow

### Responsive Behavior
- **Desktop:** Side-by-side with label
- **Mobile:** Stacked with label above
- **Tablet:** Side-by-side

---

## 💡 Tips

### Marketing
- Update URLs immediately when apps are live
- Test on actual devices
- Share app store links in marketing
- Add QR codes to printed materials

### Analytics
Consider tracking button clicks:
```typescript
onClick={() => {
  // Track event
  analytics.track('app_store_button_clicked', { platform: 'ios' });
  window.open(APP_STORE_URL, '_blank');
}}
```

### A/B Testing
Test different placements:
- Hero only
- Hero + footer
- Hero + subscription page
- All pages

---

## 🚀 Quick Update Guide

**When apps are live:**

```bash
# 1. Update .env
echo "VITE_APP_STORE_URL=https://apps.apple.com/app/pocketteller/id1234567890" >> .env
echo "VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.pocketteller.app" >> .env

# 2. Rebuild
npm run build

# 3. Deploy
vercel --prod

# 4. Test
# Visit your site and click buttons
# Should open respective stores
```

---

## ✅ Checklist

### Implementation
- [x] AppStoreButtons component created
- [x] Added to homepage hero
- [x] Placeholder URLs set
- [x] "Coming Soon" behavior active
- [x] Mobile-responsive design
- [x] Accessibility features
- [x] Documentation complete

### When Apps Are Published
- [ ] Get App Store URL from Apple
- [ ] Get Play Store URL from Google
- [ ] Update environment variables
- [ ] Rebuild application
- [ ] Deploy to production
- [ ] Test buttons on live site
- [ ] Verify links open correctly
- [ ] Test on mobile devices

---

## 📞 Support

**Questions?**
- Component location: `src/components/AppStoreButtons.tsx`
- Usage: `<AppStoreButtons />`
- Configuration: `.env` file or direct in component

**Issues?**
- Check console for errors
- Verify URLs are valid
- Test in different browsers
- Check mobile responsiveness

---

*Guide created: October 11, 2025*  
*Status: ✅ Buttons implemented, awaiting app store URLs*  
*Ready to update when apps are published!*

