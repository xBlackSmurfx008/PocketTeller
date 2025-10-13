# PocketTeller - Quick Reference

**Essential information for AI agents and developers**

---

## 🎯 Project Overview

**Name:** PocketTeller (branding: Pocket Banker)  
**Type:** Full-stack SaaS - AI financial coach + bank integration  
**Stack:** React 18 + TypeScript + Vite + Tailwind + Supabase  
**Mobile:** Capacitor 7 (iOS + Android)  
**AI:** Google Gemini 2.5 Flash  
**Banking:** Plaid API  
**Payments:** Stripe

---

## 📁 Essential Documentation

1. **PRODUCTION_GUIDE.md** - Complete setup, deployment, troubleshooting
2. **AGENTS.md** - Development guidelines, code standards, setup
3. **iOS_PRODUCTION_GUIDE.md** - Detailed iOS documentation
4. **ANDROID_PRODUCTION_GUIDE.md** - Detailed Android documentation
5. **README.md** - Project overview
6. **CONTRIBUTING.md** - Contribution guidelines

**Archived:** 152 temporary/duplicate docs moved to `docs/archive/`

---

## ⚡ Quick Commands

```bash
# Web development
npm run dev

# Production build
npm run build

# iOS
npm run build && npx cap sync ios
cd ios/App && open App.xcworkspace

# Android
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug

# Quality checks
npm run lint && npm run type-check && npm run test
```

---

## 🚨 Critical Rules (NEVER VIOLATE)

### ❌ NEVER:
- Use localhost in ANY code (production URLs only)
- Use functions before defining them
- Navigate before auth state ready
- Assume database column names
- Commit .env or API keys

### ✅ ALWAYS:
- Use `app.pocketbanker.app` (production domain)
- Define functions BEFORE useEffect
- Wait for `authLoading` complete
- Check database schema for column names
- Use `available_balance`, `current_balance` (not balance_*)

---

## 🔧 Critical Configuration

### Capacitor Config
```typescript
// capacitor.config.ts
{
  appId: 'com.pocketteller.app',
  webDir: 'dist',  // ✅ Production build
  server: {
    hostname: 'app.pocketbanker.app',  // ✅ NO LOCALHOST
    androidScheme: 'https',
    iosScheme: 'ionic',
  }
}
```

### Database Columns (EXACT NAMES)
```typescript
// ✅ CORRECT:
available_balance
current_balance
credit_limit

// ❌ WRONG:
balance_available
balance_current
```

### Function Order (CRITICAL)
```typescript
// ✅ CORRECT ORDER:
const myFunction = useCallback(() => {...}, [deps]);

useEffect(() => {
  myFunction();  // Now defined
}, [myFunction]);

// ❌ WRONG - will crash:
useEffect(() => {
  myFunction();  // Not defined yet!
}, [myFunction]);

const myFunction = useCallback(() => {...}, [deps]);
```

---

## 🐛 Common Issues & Fixes

| Issue | Quick Fix |
|-------|-----------|
| "Cannot access uninitialized variable" | Move function definition before useEffect |
| "column does not exist" | Use `available_balance` not `balance_available` |
| Black screen iOS | Check Safari Web Inspector (Safari → Develop) |
| Black screen Android | Check chrome://inspect |
| No console logs | Enable for native in `src/utils/consoleCleanup.ts` |
| Error after login | Add `setTimeout(() => navigate('/home'), 100)` |
| CocoaPods fail | Set `export LANG=en_US.UTF-8` |

---

## 🔍 Debug Tools

### iOS:
```bash
# Safari Web Inspector
Safari → Develop → [Device] → PocketTeller

# Xcode Console
Cmd+Shift+Y
```

### Android:
```bash
# Chrome DevTools
chrome://inspect

# Logcat
adb logcat | grep PocketTeller
```

---

## 🏗️ Architecture

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Radix UI
- **State:** React Query + Context
- **Routing:** React Router v6

### Backend
- **Database:** Supabase PostgreSQL with RLS
- **Functions:** Supabase Edge Functions (Deno)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage

### External APIs
- **AI:** Google Gemini 2.5 Flash (server-side)
- **Banking:** Plaid API (sandbox → production)
- **Payments:** Stripe (subscriptions + webhooks)

---

## 📊 Key Tables

```
profiles          → User data + encrypted Plaid tokens
accounts          → Bank accounts (available_balance, current_balance)
transactions      → Financial transactions with AI categories
budget            → Monthly budgets
goals             → Financial goals
bills             → Bill tracking
conversations     → AI chat history
user_memories     → AI persistent context
```

---

## 🔒 Security

### Secrets (Supabase CLI)
```bash
supabase secrets set GEMINI_API_KEY=...
supabase secrets set PLAID_CLIENT_ID=...
supabase secrets set PLAID_SECRET=...
supabase secrets set PLAID_ENCRYPTION_KEY=...
supabase secrets set STRIPE_SECRET_KEY=...
supabase secrets set STRIPE_WEBHOOK_SECRET=...
```

### Environment (.env - public only)
```env
VITE_SUPABASE_URL=https://dscndbpqvhvylukvcgpq.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

### Protection
- AES-256-GCM encryption for tokens
- Row-Level Security on all tables
- HTTPS/TLS 1.3 only
- Input validation + sanitization
- Comprehensive audit logging

---

## 🚀 Deployment

### Pre-Deploy Checklist
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] No localhost references
- [ ] All secrets set

### Deploy Commands
```bash
# Backend
supabase db push
supabase functions deploy

# Frontend (auto-deploy via GitHub)
git push origin main

# iOS
# Archive in Xcode → Upload to TestFlight

# Android
cd android && ./gradlew assembleRelease
# Upload to Play Console
```

---

## 📱 Platform URLs

### iOS (Capacitor)
```
ionic://app.pocketbanker.app/home
ionic://app.pocketbanker.app/auth
```

### Android (Capacitor)
```
https://app.pocketbanker.app/home
https://app.pocketbanker.app/auth
```

### Web
```
https://pocketbanker.app
http://localhost:8080 (dev only)
```

---

## 🎯 Current Status (Oct 12, 2025)

**Production Ready:**
- ✅ Web deployed
- ✅ iOS configuration verified
- ✅ Android configuration verified
- ✅ All critical bugs fixed
- ✅ Security audit complete

**Features Working:**
- ✅ AI Financial Coach
- ✅ Plaid bank integration (3 accounts connected)
- ✅ Transaction categorization (AI + Plaid hybrid)
- ✅ Budget planning
- ✅ Bill tracking
- ✅ Goal management
- ✅ Stripe subscriptions

---

## 💡 Key Insights

### iOS Quirks
- Must use UIApplicationSceneManifest (iOS 13+)
- CocoaPods needs UTF-8 locale
- RTI warnings are normal (ignore)
- Safari Web Inspector is primary debug tool

### Android Quirks
- Uses HTTPS scheme (not ionic://)
- Chrome DevTools for debugging
- Gradle clean solves most issues
- ProGuard for release builds

### Universal Lessons
- Function order matters in React
- Database column names are exact
- Auth state timing is critical
- Console logs needed for debugging
- Production URLs everywhere

---

## 📞 Emergency Fixes

### iOS Black Screen
```bash
rm -rf ios/App/App/public/*
npm run build
npx cap sync ios
# Clean in Xcode: Cmd+Shift+K, then Cmd+R
```

### Android Build Fail
```bash
cd android
./gradlew clean
rm -rf app/build
./gradlew assembleDebug
```

### Database Error
```bash
# Check column names in Supabase dashboard
# Use exact names from schema
```

### Auth Error
```typescript
// Wait for loading complete
if (user && !authLoading) {
  setTimeout(() => navigate('/home'), 100);
}
```

---

**Quick Reference Version 1.0**  
*Last Updated: October 12, 2025*  
*All information verified and tested*

