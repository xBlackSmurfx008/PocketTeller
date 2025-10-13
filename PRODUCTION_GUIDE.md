# PocketTeller - Complete Production Guide

**Last Updated:** October 12, 2025  
**Status:** ✅ PRODUCTION READY  
**Version:** 1.0

---

## 📚 Quick Navigation

- [🚀 Quick Start](#-quick-start)
- [📱 Platform Guides](#-platform-guides)
- [🔧 Configuration](#-configuration)
- [🐛 Troubleshooting](#-troubleshooting)
- [🔒 Security](#-security)
- [📦 Deployment](#-deployment)

---

## 🚀 Quick Start

### Web Development
```bash
npm install
npm run dev
# Open http://localhost:8080
```

### iOS Build
```bash
npm run build
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx cap sync ios
cd ios/App && open App.xcworkspace
# Press Cmd+R in Xcode
```

### Android Build
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 Platform Guides

### iOS Production Setup

**Configuration (`capacitor.config.ts`):**
```typescript
const config: CapacitorConfig = {
  appId: 'com.pocketteller.app',
  appName: 'PocketTeller',
  webDir: 'dist',
  server: {
    hostname: 'app.pocketbanker.app',
    androidScheme: 'https',
    iosScheme: 'ionic',
  },
};
```

**Critical iOS Rules:**
- ✅ Use `ionic://app.pocketbanker.app` URLs
- ✅ Define functions BEFORE useEffect that uses them
- ✅ Use correct column names: `available_balance`, `current_balance`
- ✅ Wait for `authLoading` complete before navigation
- ✅ Keep console logs enabled on native platforms
- ❌ NEVER use localhost
- ❌ NEVER remove UIApplicationSceneManifest from Info.plist

**Debug iOS:**
```bash
# Safari Web Inspector
Safari → Develop → [Device] → PocketTeller

# Xcode Console
View → Debug Area → Show Debug Area (Cmd+Shift+Y)
```

**Common iOS Errors:**

| Error | Fix |
|-------|-----|
| Cannot access uninitialized variable | Move function definition before useEffect |
| column does not exist | Use `available_balance` not `balance_available` |
| Black screen | Check Safari Web Inspector for JS errors |
| No console logs | Enable for native in `consoleCleanup.ts` |
| Error after login | Wait for authLoading complete |

### Android Production Setup

**Configuration (Same as iOS):**
- Uses HTTPS scheme: `https://app.pocketbanker.app`
- Same database column fixes apply
- Same function definition order rules

**Build Android:**
```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

**Debug Android:**
```bash
# Chrome DevTools
chrome://inspect

# Logcat
adb logcat | grep PocketTeller
```

---

## 🔧 Configuration

### Critical Files

**Capacitor Config:**
```typescript
// capacitor.config.ts
server: {
  hostname: 'app.pocketbanker.app',  // ✅ PRODUCTION ONLY
  androidScheme: 'https',
  iosScheme: 'ionic',
}
```

**Environment Variables:**
```env
# .env (Public only)
VITE_SUPABASE_URL=https://dscndbpqvhvylukvcgpq.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Supabase Secrets:**
```bash
# Set via Supabase CLI
supabase secrets set GEMINI_API_KEY=your_key
supabase secrets set PLAID_CLIENT_ID=your_id
supabase secrets set PLAID_SECRET=your_secret
supabase secrets set PLAID_ENV=sandbox
supabase secrets set PLAID_ENCRYPTION_KEY=your_32_byte_key
supabase secrets set STRIPE_SECRET_KEY=your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_secret
```

### Database Schema

**Key Tables:**
- `profiles` - User profiles with encrypted Plaid tokens
- `accounts` - Bank accounts (`available_balance`, `current_balance`, `credit_limit`)
- `transactions` - Financial transactions with AI categorization
- `budget` - Monthly budget plans
- `goals` - Financial goals
- `bills` - Bill tracking
- `conversations` - AI chat history
- `user_memories` - Persistent AI context

**CRITICAL:** Always check database schema for exact column names!

---

## 🐛 Troubleshooting

### Universal Fixes (All Platforms)

**Cannot access uninitialized variable:**
```typescript
// ✅ CORRECT ORDER:
const myFunction = useCallback(() => {
  // code
}, [deps]);

useEffect(() => {
  myFunction();  // ✅ Defined above
}, [myFunction]);
```

**Database column errors:**
```typescript
// ✅ CORRECT:
.select('available_balance, current_balance, credit_limit')

// ❌ WRONG:
.select('balance_available, balance_current')
```

**Auth redirect too fast:**
```typescript
// ✅ CORRECT:
const { user, loading: authLoading } = useAuth();

useEffect(() => {
  if (user && !authLoading) {
    setTimeout(() => navigate('/home'), 100);
  }
}, [user, authLoading]);
```

### iOS Specific

**Black Screen:**
1. Check Safari Web Inspector for JavaScript errors
2. Verify assets synced: `ls -la ios/App/App/public/`
3. Clean build: `rm -rf ios/App/App/public/* && npm run build && npx cap sync ios`
4. Clean Xcode: Cmd+Shift+K then Cmd+R

**CocoaPods Issues:**
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
cd ios/App
rm -rf Pods Podfile.lock
pod install
```

### Android Specific

**APK Won't Install:**
```bash
adb uninstall com.pocketteller.app
adb install app-debug.apk
```

**Build Fails:**
```bash
cd android
./gradlew clean
rm -rf app/build
./gradlew assembleDebug
```

---

## 🔒 Security

### Production Rules
- ❌ NEVER use localhost anywhere
- ❌ NEVER commit .env or API keys
- ❌ NEVER expose service role key in client
- ✅ ALWAYS use production URLs (pocketbanker.app)
- ✅ ALWAYS use Row Level Security (RLS)
- ✅ ALWAYS validate user input
- ✅ ALWAYS sanitize data

### Data Protection
- AES-256-GCM encryption for Plaid tokens
- Row-Level Security on all tables
- HTTPS/TLS 1.3 for all communications
- Secure token storage with rotation
- Comprehensive audit logging

### RLS Policies
```sql
-- Users can only access their own data
auth.uid() = user_id
```

---

## 📦 Deployment

### Pre-Deployment Checklist

**Code Quality:**
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds

**Configuration:**
- [ ] Production URLs only (no localhost)
- [ ] All secrets set in Supabase
- [ ] Environment variables configured
- [ ] Database migrations applied

**Testing:**
- [ ] Web app works
- [ ] iOS app tested in Xcode
- [ ] Android APK tested on device
- [ ] All features functional
- [ ] No console errors

### Deploy Backend

```bash
# Database migrations
supabase db push

# Edge functions
supabase functions deploy

# Verify secrets
supabase secrets list
```

### Deploy Frontend

**Web (Vercel/Netlify):**
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

**iOS (TestFlight):**
1. Build in Xcode (Archive)
2. Upload to App Store Connect
3. Submit for TestFlight review

**Android (Play Store):**
1. Build release APK: `./gradlew assembleRelease`
2. Upload to Play Console
3. Submit for review

---

## 🎯 Critical Rules (NEVER FORGET)

### ❌ NEVER:
- Use localhost in any code
- Commit .env or secrets
- Use functions before defining them
- Assume database column names
- Navigate before auth state ready
- Disable console logs on mobile
- Modify Info.plist without understanding

### ✅ ALWAYS:
- Use production URLs (pocketbanker.app)
- Build before syncing mobile
- Define functions before use
- Check database schema
- Wait for loading states
- Keep console logs on native
- Test in Safari/Chrome DevTools

---

## 📞 Support

### Debug Tools:
- **iOS:** Safari Web Inspector → Develop → [Device] → PocketTeller
- **Android:** chrome://inspect
- **Xcode:** Cmd+Shift+Y (console)
- **Logcat:** `adb logcat | grep PocketTeller`

### Quick Commands:
```bash
# Start dev
npm run dev

# Build production
npm run build

# Sync iOS
npx cap sync ios

# Sync Android
npx cap sync android

# Clean iOS
rm -rf ios/App/App/public/* && npm run build && npx cap sync ios

# Clean Android
cd android && ./gradlew clean && ./gradlew assembleDebug

# Test everything
npm run lint && npm run type-check && npm run test && npm run build
```

---

## 📊 Current Status (October 12, 2025)

**Production Ready:**
- ✅ Web app deployed and working
- ✅ iOS configuration verified
- ✅ Android configuration verified
- ✅ Database optimized
- ✅ All secrets configured
- ✅ Security audit complete

**Features:**
- ✅ AI Financial Coach (Gemini 2.5 Flash)
- ✅ Bank Integration (Plaid)
- ✅ Transaction Categorization (AI + Plaid)
- ✅ Budget Planning
- ✅ Bill Tracking
- ✅ Goal Setting
- ✅ Subscription Billing (Stripe)

**Platforms:**
- ✅ Web (React + TypeScript + Vite)
- ✅ iOS (Capacitor 7 + Swift)
- ✅ Android (Capacitor 7 + Java)
- ✅ Backend (Supabase + Edge Functions)

---

## 📚 Additional Resources

### Documentation:
- `AGENTS.md` - Complete development guidelines
- `iOS_PRODUCTION_GUIDE.md` - Detailed iOS documentation
- `ANDROID_PRODUCTION_GUIDE.md` - Detailed Android documentation
- `README.md` - Project overview
- `CONTRIBUTING.md` - Contribution guidelines

### Quick References:
- Architecture: React 18 + TypeScript + Tailwind + Supabase
- AI: Google Gemini 2.5 Flash API
- Banking: Plaid API
- Payments: Stripe
- Mobile: Capacitor 7

---

**Built with ❤️ for smarter financial management**

*Last verified: October 12, 2025*

