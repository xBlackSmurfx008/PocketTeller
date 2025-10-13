# 💳 Stripe Payment Integration Setup Guide

**Date:** October 11, 2025  
**App:** PocketTeller  
**Payment Processor:** Stripe

---

## 💰 Pricing Structure

### Monthly Plan
- **Price:** $4.99/month
- **First Month:** FREE
- **Referral Bonus:** 1 additional free month for 3 suggestions to team
- **Stripe Price ID:** `price_monthly` (to be created)

### Yearly Plan
- **Price:** $32.99/year
- **Savings:** ~$27/year vs monthly
- **First Month Equivalent:** FREE (prorated)
- **Stripe Price ID:** `price_yearly` (to be created)

### Trial Promo Code
- **Code:** `SA2025`
- **Duration:** 30 days free trial
- **Usage:** One-time per user
- **Valid:** Until manually disabled

---

## 🚀 Step 1: Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Verify installation
stripe --version
```

---

## 📦 Step 2: Create Products and Prices

### Create Monthly Product

```bash
# Create the product
stripe products create \
  --name "PocketTeller Pro - Monthly" \
  --description "AI-powered financial coaching and budgeting tools - Monthly subscription" \
  --images "https://your-domain.com/logo.png"

# Create the price (save the price_xxx ID)
stripe prices create \
  --product prod_xxxxx \
  --unit-amount 499 \
  --currency usd \
  --recurring-interval month \
  --recurring-usage-type licensed \
  --lookup-key "pocketteller_monthly"

# Create FREE trial price for first month
stripe prices create \
  --product prod_xxxxx \
  --unit-amount 0 \
  --currency usd \
  --recurring-interval month \
  --recurring-interval-count 1 \
  --lookup-key "pocketteller_monthly_trial"
```

### Create Yearly Product

```bash
# Create yearly price
stripe prices create \
  --product prod_xxxxx \
  --unit-amount 3299 \
  --currency usd \
  --recurring-interval year \
  --recurring-usage-type licensed \
  --lookup-key "pocketteller_yearly"
```

---

## 🎟️ Step 3: Create Promo Codes

### Trial Code: SA2025 (30 days free)

```bash
# Create a coupon first
stripe coupons create \
  --id "SA2025_COUPON" \
  --name "SA2025 Trial" \
  --duration "once" \
  --duration-in-months 1 \
  --percent-off 100 \
  --max-redemptions 1000

# Create promo code
stripe promotion_codes create \
  --coupon "SA2025_COUPON" \
  --code "SA2025" \
  --max-redemptions 1000 \
  --metadata[type]="trial"
```

### Referral Bonus Coupon (1 month free)

```bash
# Create referral coupon
stripe coupons create \
  --id "REFERRAL_BONUS" \
  --name "Referral Bonus - 1 Month Free" \
  --duration "once" \
  --duration-in-months 1 \
  --percent-off 100

# Promo codes will be generated dynamically per user
```

---

## 🔌 Step 4: Configure Webhooks

### Set up webhook endpoint

```bash
# For development (forward to localhost)
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# For production, add webhook in Stripe Dashboard:
# https://dashboard.stripe.com/webhooks
# Endpoint: https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/stripe-webhook

# Events to listen for:
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
# - invoice.paid
# - invoice.payment_failed
# - checkout.session.completed
# - customer.created
# - customer.updated
```

---

## 🔑 Step 5: Set Supabase Secrets

```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller

# Get your keys from: https://dashboard.stripe.com/apikeys
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx --project-ref dscndbpqvhvylukvcgpq

# Get webhook secret from webhooks page
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx --project-ref dscndbpqvhvylukvcgpq

# Set price IDs (after creating them above)
supabase secrets set STRIPE_PRICE_MONTHLY=price_xxxxx --project-ref dscndbpqvhvylukvcgpq
supabase secrets set STRIPE_PRICE_YEARLY=price_xxxxx --project-ref dscndbpqvhvylukvcgpq

# For testing in development
supabase secrets set STRIPE_SECRET_KEY_TEST=sk_test_xxxxx --project-ref dscndbpqvhvylukvcgpq
```

---

## 📊 Step 6: Database Schema

The migration file will create:
- `subscriptions` table
- `subscription_events` table (audit log)
- RLS policies

---

## 🧪 Step 7: Test the Integration

### Test Monthly Subscription

```bash
# Create test checkout session
curl -X POST https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/stripe-create-checkout \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_xxxxx",
    "mode": "subscription"
  }'
```

### Test with Promo Code

```bash
curl -X POST https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/stripe-create-checkout \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_xxxxx",
    "mode": "subscription",
    "promoCode": "SA2025"
  }'
```

---

## 🔐 Step 8: Security Checklist

- [ ] Use test keys in development
- [ ] Use live keys only in production
- [ ] Verify webhook signatures
- [ ] Use HTTPS for all webhooks
- [ ] Store keys in Supabase Secrets (never in code)
- [ ] Enable Stripe Radar for fraud detection
- [ ] Set up email notifications for failed payments
- [ ] Configure tax collection if needed

---

## 📱 Step 9: App Store Integration

**Important:** For iOS/Android app purchases:
- App Store/Google Play handles billing
- Use StoreKit/Google Billing Library
- Map App Store products to same tiers
- Sync subscription status to your database

**Product IDs:**
- iOS: `com.pocketteller.app.monthly`
- iOS: `com.pocketteller.app.yearly`
- Android: `pocketteller_monthly_sub`
- Android: `pocketteller_yearly_sub`

---

## 🎯 Step 10: Customer Portal

Users can manage their subscription at:
```
https://your-app.com/settings/billing
```

This will call the `stripe-create-portal` function to generate a portal session.

---

## 📈 Stripe Dashboard

Monitor your subscriptions at:
- **Dashboard:** https://dashboard.stripe.com
- **Subscriptions:** https://dashboard.stripe.com/subscriptions
- **Customers:** https://dashboard.stripe.com/customers
- **Webhooks:** https://dashboard.stripe.com/webhooks
- **Coupons:** https://dashboard.stripe.com/coupons

---

## 🆘 Troubleshooting

### Webhook not receiving events
```bash
# Test webhook locally
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Verify webhook secret is set
supabase secrets list --project-ref dscndbpqvhvylukvcgpq | grep STRIPE
```

### Subscription not activating
- Check webhook logs in Stripe Dashboard
- Verify subscription status in database
- Check Supabase function logs

### Promo code not working
- Verify code is active in Stripe Dashboard
- Check redemption limits
- Ensure correct price ID is being used

---

## 💡 Next Steps

1. ✅ Run the setup commands above
2. ✅ Deploy Edge Functions (next step)
3. ✅ Test in Stripe test mode
4. ✅ Switch to live mode when ready
5. ✅ Add billing page to your app

---

*Setup Guide Created: October 11, 2025*

