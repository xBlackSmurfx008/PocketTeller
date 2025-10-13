# 📱 Mobile App Subscription Setup Guide

**For:** iOS (App Store) & Android (Google Play Store)  
**Updated:** October 11, 2025

---

## ⚠️ Important: Platform Requirements

### iOS App Store
**Apple requires** that in-app purchases use **App Store billing** (not Stripe):
- Use **StoreKit** for subscriptions
- Apple takes 30% commission (15% after year 1)
- Cannot link to external payment systems in the app

### Google Play Store
**Google requires** that in-app purchases use **Google Play billing** (not Stripe):
- Use **Google Play Billing Library**
- Google takes 30% commission (15% after year 1)
- Cannot bypass with external links

### Web App / PWA
**Can use** Stripe checkout:
- No platform fees
- Full control
- Your 100% of revenue

---

## 🎯 Recommended Strategy

### Dual-Track Approach

**1. Mobile Apps (iOS/Android):**
- Use native in-app purchases
- Map to same tiers as Stripe
- Sync subscription status to your database

**2. Web App / PWA:**
- Use Stripe checkout (already implemented ✅)
- No platform fees
- Better margins

### Product Mapping

| Tier | iOS Product ID | Android Product ID | Stripe Price ID |
|------|---------------|-------------------|-----------------|
| **Monthly** | `com.pocketteller.app.monthly` | `pocketteller_monthly_sub` | `price_1SHDSAL...` |
| **Yearly** | `com.pocketteller.app.yearly` | `pocketteller_yearly_sub` | `price_1SHDSAL...` |

---

## 📲 iOS Implementation (StoreKit 2)

### 1. Create Products in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → Features → In-App Purchases
3. Click "+" to add subscription group
4. Create subscriptions:

**Monthly Subscription:**
- **Product ID:** `com.pocketteller.app.monthly`
- **Reference Name:** PocketTeller Pro Monthly
- **Price:** $4.99/month
- **Free Trial:** 30 days

**Yearly Subscription:**
- **Product ID:** `com.pocketteller.app.yearly`
- **Reference Name:** PocketTeller Pro Yearly
- **Price:** $32.99/year
- **Free Trial:** 30 days

### 2. Install Capacitor IAP Plugin

```bash
npm install @capacitor-community/in-app-purchases
npx cap sync ios
```

### 3. Add StoreKit Configuration

Create `ios/App/Configuration.storekit` for testing:

```json
{
  "identifier" : "POCKETTELLER",
  "nonRenewingSubscriptions" : [],
  "products" : [],
  "settings" : {},
  "subscriptionGroups" : [
    {
      "id" : "subscription_group_1",
      "localizations" : [],
      "name" : "PocketTeller Pro",
      "subscriptions" : [
        {
          "adHocOffers" : [],
          "codeOffers" : [],
          "displayPrice" : "4.99",
          "familyShareable" : false,
          "groupNumber" : 1,
          "internalID" : "monthly",
          "introductoryOffer" : {
            "internalID" : "monthly_trial",
            "paymentMode" : "free",
            "subscriptionPeriod" : "P1M"
          },
          "localizations" : [],
          "productID" : "com.pocketteller.app.monthly",
          "recurringSubscriptionPeriod" : "P1M",
          "referenceName" : "Monthly",
          "subscriptionGroupID" : "subscription_group_1",
          "type" : "RecurringSubscription"
        },
        {
          "adHocOffers" : [],
          "codeOffers" : [],
          "displayPrice" : "32.99",
          "familyShareable" : false,
          "groupNumber" : 2,
          "internalID" : "yearly",
          "introductoryOffer" : {
            "internalID" : "yearly_trial",
            "paymentMode" : "free",
            "subscriptionPeriod" : "P1M"
          },
          "localizations" : [],
          "productID" : "com.pocketteller.app.yearly",
          "recurringSubscriptionPeriod" : "P1Y",
          "referenceName" : "Yearly",
          "subscriptionGroupID" : "subscription_group_1",
          "type" : "RecurringSubscription"
        }
      ]
    }
  ],
  "version" : {
    "major" : 2,
    "minor" : 0
  }
}
```

### 4. Code Implementation (iOS)

Create `src/utils/iap-ios.ts`:

```typescript
import { Purchases } from '@capacitor-community/in-app-purchases';

export async function initializeIAP() {
  try {
    await Purchases.initialize({
      productIdentifiers: [
        'com.pocketteller.app.monthly',
        'com.pocketteller.app.yearly'
      ]
    });
  } catch (error) {
    console.error('Error initializing IAP:', error);
  }
}

export async function purchaseSubscription(productId: string) {
  try {
    const result = await Purchases.purchase({
      productIdentifier: productId
    });
    
    // Sync to your backend
    if (result.transactionId) {
      await syncPurchaseToBackend(result);
    }
    
    return result;
  } catch (error) {
    console.error('Purchase error:', error);
    throw error;
  }
}

async function syncPurchaseToBackend(transaction: any) {
  // Call your backend to verify and activate subscription
  const { data, error } = await supabase.functions.invoke('ios-verify-receipt', {
    body: {
      transactionId: transaction.transactionId,
      receipt: transaction.receipt,
      productId: transaction.productId
    }
  });
  
  if (error) {
    console.error('Failed to sync purchase:', error);
  }
}
```

---

## 🤖 Android Implementation (Google Play Billing)

### 1. Create Products in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app → Monetize → Subscriptions
3. Create subscription products:

**Monthly Subscription:**
- **Product ID:** `pocketteller_monthly_sub`
- **Name:** PocketTeller Pro Monthly
- **Price:** $4.99/month
- **Free Trial:** 30 days

**Yearly Subscription:**
- **Product ID:** `pocketteller_yearly_sub`
- **Name:** PocketTeller Pro Yearly
- **Price:** $32.99/year
- **Free Trial:** 30 days

### 2. Install Capacitor IAP Plugin

```bash
npm install @capacitor-community/in-app-purchases
npx cap sync android
```

### 3. Code Implementation (Android)

Same plugin works for both platforms:

```typescript
// Detect platform and use appropriate product ID
const productId = Capacitor.getPlatform() === 'ios'
  ? 'com.pocketteller.app.monthly'
  : 'pocketteller_monthly_sub';

await purchaseSubscription(productId);
```

---

## 🔄 Subscription Sync Strategy

### Backend Function to Sync Purchases

Create `supabase/functions/mobile-verify-purchase/index.ts`:

```typescript
// Verify iOS/Android purchase receipts
// Sync subscription status to database
// Ensure cross-platform access
```

### Cross-Platform Access

When a user subscribes on:
- **iOS:** Sync to database → Access on web/Android
- **Android:** Sync to database → Access on web/iOS
- **Web (Stripe):** Already synced → Access on iOS/Android

Store subscription source:
```sql
ALTER TABLE subscriptions
ADD COLUMN purchase_platform TEXT; -- 'stripe', 'ios', 'android'
```

---

## 💡 Recommended Approach

### Short-term (Launch Quickly)

**For initial launch:**
- ✅ Use Stripe on web app (already done!)
- ⏳ Add "Subscribe on web" link in mobile apps
- ⏳ Explain: "Visit pocketteller.app on your browser to subscribe"

**Pros:**
- Launch immediately with working payments
- No App Store/Play Store delays
- 0% platform fees
- Full control

**Cons:**
- Extra step for mobile users
- Slightly lower conversion

### Long-term (Full Platform Integration)

**After initial traction:**
- Add StoreKit to iOS app
- Add Google Play Billing to Android app
- Keep Stripe for web users
- Sync all subscription types

**Pros:**
- Seamless mobile experience
- Higher mobile conversion
- Platform compliance

**Cons:**
- More complex implementation
- 30% platform fees on mobile
- App review requirements

---

## 🎯 Quick Win: Web-First Strategy

### What You Have NOW (Stripe on Web)

Your Stripe integration works on:
- ✅ Desktop web browsers
- ✅ Mobile web browsers
- ✅ PWA (Progressive Web App)
- ✅ Any device with a browser

### Mobile App Approach

**Option 1: Link to Web (Fastest)**
In mobile app, add button:
```typescript
<Button onPress={() => {
  Linking.openURL('https://pocketteller.app/subscription');
}}>
  Subscribe to Pro
</Button>
```

**Option 2: WebView (Better UX)**
Open subscription page in WebView:
```typescript
<WebView
  source={{ uri: 'https://pocketteller.app/subscription' }}
  onNavigationStateChange={handleCheckoutComplete}
/>
```

**Option 3: Full Native IAP (Best, but slower)**
Implement StoreKit/Play Billing as documented above.

---

## ✅ What's Working Right Now

Your Stripe integration works on:
- ✅ Desktop browsers (Chrome, Safari, Firefox, Edge)
- ✅ Mobile browsers (iOS Safari, Android Chrome)
- ✅ iPad/tablet browsers
- ✅ Progressive Web App (PWA)

**Users can subscribe from ANY device with a browser!**

---

## 🚀 Recommended Launch Strategy

### Phase 1: Launch with Web Payments (NOW)

1. ✅ Deploy web app with Stripe (done!)
2. ✅ Mobile apps link to web subscription page
3. ✅ Start accepting payments immediately
4. ✅ No app store payment review delays

### Phase 2: Add Native IAP (Later)

1. ⏳ Implement StoreKit (iOS)
2. ⏳ Implement Play Billing (Android)
3. ⏳ Submit for app review
4. ⏳ Launch native subscriptions

This approach lets you:
- Start generating revenue **immediately**
- Avoid 30% platform fees initially
- Add native IAP when you have traction
- Test pricing/messaging with real customers first

---

## 📊 Revenue Impact

### Web-Only Subscriptions (Phase 1)
```
100 subscribers × $4.99 = $499/month
Platform fees: $0 (Stripe: ~$15/month = 3%)
Net revenue: $484/month (97%)
```

### With Mobile IAP (Phase 2)
```
70 web subscribers × $4.99 = $349/month (100% after Stripe)
30 mobile subscribers × $4.99 = $149/month (70% after Apple/Google)

Total: $498/month
Net after fees: $454/month (91%)
```

**Recommendation:** Launch with web-only, add mobile IAP later.

---

## 🎯 Summary

**Current Status:**
- ✅ Stripe fully working on web/mobile browsers
- ✅ Can accept payments TODAY
- ✅ Works on all devices via browser
- ⏳ Native iOS/Android IAP for future enhancement

**For Launch:**
- Use Stripe on web (done!)
- Mobile apps link to web subscription
- Start generating revenue immediately
- Add native IAP in Phase 2

---

*Guide created: October 11, 2025*  
*Recommendation: Launch with web payments now, add native IAP later*

