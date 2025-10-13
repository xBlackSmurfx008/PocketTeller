# PocketTeller Pages Reference

**Last Updated:** October 13, 2025

This document provides a complete reference of all pages/screens in the PocketTeller app across iOS, Android, and Web platforms.

---

## 📱 iOS Pages

**Entry Point:** `ionic://app.pocketbanker.app`

### Navigation Flow
- **Unauthenticated Users:** App launches → Redirects to `/auth`
- **Authenticated Users:** App launches → Redirects to `/home`

### Available Pages

| Route | File | Authentication | Description |
|-------|------|----------------|-------------|
| `/` | `Index.tsx` | ❌ No | **SKIPPED ON iOS** - Redirects to `/auth` |
| `/auth` | `Auth.tsx` | ❌ No | **Landing page** - Login/signup screen |
| `/test` | `TestPage.tsx` | ❌ No | Test page for debugging |
| `/home` | `Dashboard.tsx` (component) | ✅ Yes | Main dashboard - accounts overview |
| `/demo` | `Demo.tsx` | ❌ No | Demo mode showcase |
| `/confirm` | `EmailConfirmation.tsx` | ❌ No | Email verification confirmation |
| `/reset-password` | `ResetPassword.tsx` | ❌ No | Password reset flow |
| `/chat` | `ConversationalAI.tsx` | ✅ Yes | AI financial coach chat |
| `/chat/:threadId` | `ConversationalAI.tsx` | ✅ Yes | Specific chat thread |
| `/goals` | `Goals.tsx` | ✅ Yes | Financial goals tracking |
| `/transactions` | `Transactions.tsx` | ✅ Yes | Transaction history & management |
| `/budget` | `Budget.tsx` | ✅ Yes | Budget planning & tracking |
| `/account` | `Account.tsx` | ✅ Yes | User account settings & profile |
| `/subscription` | `Subscription.tsx` | ❌ No | Subscription & billing management |
| `/share/budget/:token` | `SharedBudget.tsx` | ❌ No | Shared budget view (public link) |
| `/for-institutions` | `ForInstitutions.tsx` | ❌ No | Marketing - not typically used on iOS |
| `/for-nonprofits` | `ForNonProfits.tsx` | ❌ No | Marketing - not typically used on iOS |
| `/privacy` | `Privacy.tsx` | ❌ No | Privacy policy |
| `/terms` | `Terms.tsx` | ❌ No | Terms of service |
| `*` (404) | `NotFound.tsx` | ❌ No | 404 error page |

### iOS-Specific Notes
- ✅ Marketing pages (Index, ForInstitutions, ForNonProfits) are **skipped** on iOS
- ✅ App always starts at `/auth` (unauthenticated) or `/home` (authenticated)
- ✅ Uses `ionic://` URL scheme
- ✅ Production URL: `ionic://app.pocketbanker.app`
- ❌ Never uses `capacitor://localhost`

---

## 🤖 Android Pages

**Entry Point:** `https://app.pocketbanker.app`

### Navigation Flow
- **Unauthenticated Users:** App launches → Redirects to `/auth`
- **Authenticated Users:** App launches → Redirects to `/home`

### Available Pages

| Route | File | Authentication | Description |
|-------|------|----------------|-------------|
| `/` | `Index.tsx` | ❌ No | **SKIPPED ON ANDROID** - Redirects to `/auth` |
| `/auth` | `Auth.tsx` | ❌ No | **Landing page** - Login/signup screen |
| `/test` | `TestPage.tsx` | ❌ No | Test page for debugging |
| `/home` | `Dashboard.tsx` (component) | ✅ Yes | Main dashboard - accounts overview |
| `/demo` | `Demo.tsx` | ❌ No | Demo mode showcase |
| `/confirm` | `EmailConfirmation.tsx` | ❌ No | Email verification confirmation |
| `/reset-password` | `ResetPassword.tsx` | ❌ No | Password reset flow |
| `/chat` | `ConversationalAI.tsx` | ✅ Yes | AI financial coach chat |
| `/chat/:threadId` | `ConversationalAI.tsx` | ✅ Yes | Specific chat thread |
| `/goals` | `Goals.tsx` | ✅ Yes | Financial goals tracking |
| `/transactions` | `Transactions.tsx` | ✅ Yes | Transaction history & management |
| `/budget` | `Budget.tsx` | ✅ Yes | Budget planning & tracking |
| `/account` | `Account.tsx` | ✅ Yes | User account settings & profile |
| `/subscription` | `Subscription.tsx` | ❌ No | Subscription & billing management |
| `/share/budget/:token` | `SharedBudget.tsx` | ❌ No | Shared budget view (public link) |
| `/for-institutions` | `ForInstitutions.tsx` | ❌ No | Marketing - not typically used on Android |
| `/for-nonprofits` | `ForNonProfits.tsx` | ❌ No | Marketing - not typically used on Android |
| `/privacy` | `Privacy.tsx` | ❌ No | Privacy policy |
| `/terms` | `Terms.tsx` | ❌ No | Terms of service |
| `*` (404) | `NotFound.tsx` | ❌ No | 404 error page |

### Android-Specific Notes
- ✅ Marketing pages (Index, ForInstitutions, ForNonProfits) are **skipped** on Android
- ✅ App always starts at `/auth` (unauthenticated) or `/home` (authenticated)
- ✅ Uses HTTPS URL scheme
- ✅ Production URL: `https://app.pocketbanker.app`
- ❌ Never uses `capacitor://localhost`

---

## 🌐 Web Pages

**Entry Point:** `https://app.pocketbanker.app`

### Navigation Flow
- **Unauthenticated Users:** Lands on `/` (marketing hero page)
- **Authenticated Users:** Can navigate to `/home` or any page

### Available Pages

| Route | File | Authentication | Description |
|-------|------|----------------|-------------|
| `/` | `Index.tsx` | ❌ No | **Landing/Hero Page** - Marketing & features |
| `/auth` | `Auth.tsx` | ❌ No | Login/signup screen |
| `/test` | `TestPage.tsx` | ❌ No | Test page for debugging |
| `/home` | `Dashboard.tsx` (component) | ✅ Yes | Main dashboard - accounts overview |
| `/demo` | `Demo.tsx` | ❌ No | Demo mode showcase |
| `/confirm` | `EmailConfirmation.tsx` | ❌ No | Email verification confirmation |
| `/reset-password` | `ResetPassword.tsx` | ❌ No | Password reset flow |
| `/chat` | `ConversationalAI.tsx` | ✅ Yes | AI financial coach chat |
| `/chat/:threadId` | `ConversationalAI.tsx` | ✅ Yes | Specific chat thread |
| `/goals` | `Goals.tsx` | ✅ Yes | Financial goals tracking |
| `/transactions` | `Transactions.tsx` | ✅ Yes | Transaction history & management |
| `/budget` | `Budget.tsx` | ✅ Yes | Budget planning & tracking |
| `/account` | `Account.tsx` | ✅ Yes | User account settings & profile |
| `/subscription` | `Subscription.tsx` | ❌ No | Subscription & billing management |
| `/share/budget/:token` | `SharedBudget.tsx` | ❌ No | Shared budget view (public link) |
| `/for-institutions` | `ForInstitutions.tsx` | ❌ No | Marketing page for financial institutions |
| `/for-nonprofits` | `ForNonProfits.tsx` | ❌ No | Marketing page for non-profit organizations |
| `/privacy` | `Privacy.tsx` | ❌ No | Privacy policy |
| `/terms` | `Terms.tsx` | ❌ No | Terms of service |
| `*` (404) | `NotFound.tsx` | ❌ No | 404 error page |

### Web-Specific Notes
- ✅ Marketing pages (Index, ForInstitutions, ForNonProfits) are **fully accessible**
- ✅ Users can land on `/` (hero page) and explore before signing up
- ✅ SEO-optimized pages for discoverability
- ✅ Full navigation menu with all pages

---

## 📊 Page Categories

### Authentication Pages
- `/auth` - Login & signup
- `/confirm` - Email verification
- `/reset-password` - Password recovery

### Core App Pages (Protected)
- `/home` - Dashboard with accounts overview
- `/transactions` - Transaction history
- `/budget` - Budget management
- `/goals` - Financial goals
- `/chat` - AI financial coach
- `/account` - User settings

### Marketing Pages (Web Only)
- `/` - Hero/landing page
- `/for-institutions` - B2B marketing
- `/for-nonprofits` - Non-profit marketing

### Utility Pages
- `/demo` - Demo mode
- `/subscription` - Billing management
- `/share/budget/:token` - Shared budget links
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/test` - Testing/debugging

---

## 🔐 Authentication Requirements

### Public Pages (No Auth Required)
```
/ (web only)
/auth
/demo
/confirm
/reset-password
/subscription
/share/budget/:token
/for-institutions (web only)
/for-nonprofits (web only)
/privacy
/terms
/test
* (404)
```

### Protected Pages (Auth Required)
```
/home
/chat
/chat/:threadId
/goals
/transactions
/budget
/account
```

**Protection Mechanism:** `<ProtectedRoute>` wrapper redirects unauthenticated users to `/auth`

---

## 🧭 Navigation Components

### Main Navigation
- **Web:** Full navigation menu with all pages
- **Mobile:** Bottom navigation bar with core pages:
  - Home (`/home`)
  - Transactions (`/transactions`)
  - Budget (`/budget`)
  - Goals (`/goals`)
  - Chat (`/chat`)
  - Account (`/account`)

### Deep Linking Support
All routes support deep linking on iOS and Android:
- iOS: `ionic://app.pocketbanker.app/transactions`
- Android: `https://app.pocketbanker.app/transactions`

---

## 📝 File Locations

### Page Components
```
src/pages/
├── Account.tsx                 # User account settings
├── Auth.tsx                    # Login/signup
├── Budget.tsx                  # Budget management
├── ConversationalAI.tsx        # AI chat
├── Demo.tsx                    # Demo mode
├── EmailConfirmation.tsx       # Email verification
├── ForInstitutions.tsx         # B2B marketing
├── ForNonProfits.tsx          # Non-profit marketing
├── Goals.tsx                   # Financial goals
├── Index.tsx                   # Hero/landing page
├── NotFound.tsx               # 404 page
├── Privacy.tsx                # Privacy policy
├── ResetPassword.tsx          # Password reset
├── SharedBudget.tsx           # Shared budget view
├── Subscription.tsx           # Billing management
├── Terms.tsx                  # Terms of service
├── TestPage.tsx               # Testing page
└── Transactions.tsx           # Transaction history
```

### Dashboard Component
```
src/components/Dashboard.tsx    # Main dashboard (/home route)
```

### Routing Configuration
```
src/App.tsx                     # Main routing logic
```

---

## 🎯 Platform Differences Summary

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Entry Point | `/auth` | `/auth` | `/` |
| Marketing Pages | ❌ Skip | ❌ Skip | ✅ Show |
| URL Scheme | `ionic://` | `https://` | `https://` |
| Navigation | Bottom Nav | Bottom Nav | Full Menu |
| Deep Links | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🔍 Quick Reference

**Need to find a page?**
```bash
# Search by route
grep -r "Route path=\"/chat\"" src/App.tsx

# Search by page name
ls src/pages/ | grep -i "budget"

# Find component usage
grep -r "ConversationalAI" src/
```

**Need to add a new page?**
1. Create component in `src/pages/YourPage.tsx`
2. Add lazy import in `src/App.tsx`
3. Add route in `<Routes>` section
4. Wrap with `<ProtectedRoute>` if auth required
5. Add to navigation if needed

---

*Last updated: October 13, 2025*  
*For routing questions, see `src/App.tsx`*  
*For mobile-specific behavior, see `iOS_PRODUCTION_GUIDE.md` and `ANDROID_PRODUCTION_GUIDE.md`*

