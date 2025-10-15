# 🚀 PRODUCTION DEPLOYMENT GUIDE
## Complete Stripe & Trial Enforcement Setup

This guide will walk you through completing the production deployment in the correct order.

---

## ✅ COMPLETED AUTOMATICALLY
- ✅ All code changes implemented
- ✅ Build created and synced to iOS, Android, Web
- ✅ Database migration created
- ✅ Edge functions updated
- ✅ Configuration files updated

---

## 🔧 MANUAL STEPS REQUIRED

### Step 1: Run Stripe Product Setup (5 minutes)

```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
bash scripts/setup-stripe-products.sh
```

**When prompted:**
1. Choose option `2` for **LIVE mode**
2. Type `yes` to confirm
3. **SAVE THE OUTPUT** - You'll need the price IDs!

**Expected Output:**
```
Product ID:       prod_xxxxx
Monthly Price:    price_xxxxx ($4.99/month)
6-Month Price:    price_xxxxx ($15.00 for 6 months)
Yearly Price:     price_xxxxx ($32.99/year)
```

---

### Step 2: Set Supabase Production Secrets (3 minutes)

Copy the price IDs from Step 1 and run:

```bash
# Replace xxxxx with actual values from Stripe setup

supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
supabase secrets set STRIPE_PRICE_MONTHLY=price_xxxxx
supabase secrets set STRIPE_PRICE_6MONTH=price_xxxxx
supabase secrets set STRIPE_PRICE_YEARLY=price_xxxxx
```

**To get your STRIPE_SECRET_KEY:**
1. Go to https://dashboard.stripe.com/apikeys
2. Click "Reveal live key token"
3. Copy the key starting with `sk_live_`

---

### Step 3: Link Supabase Project (2 minutes)

```bash
supabase link --project-ref dscndbpqvhvylukvcgpq
```

**When prompted for database password:**
- Go to: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/settings/database
- Copy your database password
- Paste it in the terminal (it won't show as you type)

---

### Step 4: Apply Database Migration (1 minute)

```bash
supabase db push --linked
```

This adds the trial warning tracking columns to your production database.

---

### Step 5: Deploy Edge Functions (3 minutes)

```bash
supabase functions deploy stripe-create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy stripe-create-portal
supabase functions deploy stripe-check-subscription
supabase functions deploy trial-expiration-checker
```

**Expected:** Each should show "✓ Deployed" message

---

### Step 6: Configure Stripe Webhook (5 minutes)

1. **Go to Stripe Dashboard:**
   https://dashboard.stripe.com/webhooks

2. **Click "Add endpoint"**

3. **Enter endpoint URL:**
   ```
   https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/stripe-webhook
   ```

4. **Select events to listen to:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `checkout.session.completed`

5. **Click "Add endpoint"**

6. **Copy the Webhook Signing Secret:**
   - Click on your newly created endpoint
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

7. **Set the webhook secret:**
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

---

### Step 7: Setup Cron Schedule for Trial Warnings (3 minutes)

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/functions

2. **Find `trial-expiration-checker` function**

3. **Click "Edit"** or configure schedule

4. **Set cron schedule:**
   ```
   0 9 * * *
   ```
   (This runs daily at 9 AM UTC)

5. **Enable the schedule**

---

### Step 8: Verify Deployment (5 minutes)

#### Test 1: Check Secrets
```bash
supabase secrets list
```

**Should see:**
- ✅ STRIPE_SECRET_KEY
- ✅ STRIPE_PRICE_MONTHLY
- ✅ STRIPE_PRICE_6MONTH
- ✅ STRIPE_PRICE_YEARLY
- ✅ STRIPE_WEBHOOK_SECRET

#### Test 2: Check Functions
```bash
supabase functions list
```

**Should see all 5 Stripe functions deployed**

#### Test 3: Test Subscription Page
1. Open: https://pocketbanker.app/subscription
2. Verify you see 3 pricing options:
   - Monthly: $4.99/month
   - **6-Month: $15 for 6 months** (featured)
   - Yearly: $32.99/year

#### Test 4: Test Subscription Check
```bash
curl -X POST \
  https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/stripe-check-subscription \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json"
```

**Should return JSON with:**
- `isTrialExpired` field
- `isPro` field
- `status` field

---

## 🎉 SUCCESS CHECKLIST

After completing all steps, verify:

- [ ] Stripe products created in LIVE mode
- [ ] All Supabase secrets set
- [ ] Project linked to Supabase
- [ ] Database migration applied
- [ ] All 5 Edge Functions deployed
- [ ] Stripe webhook configured
- [ ] Cron schedule enabled for trial warnings
- [ ] Subscription page shows 3 pricing options
- [ ] Test user can start a trial

---

## 🔍 TROUBLESHOOTING

### "Password authentication failed"
- Reset password: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/settings/database
- Try linking again

### "Function deployment failed"
- Check: `supabase login`
- Re-authenticate if needed

### "Stripe products already exist"
- That's okay! The script will skip duplicates
- Just note down the existing price IDs

### Webhook not receiving events
- Check webhook URL is correct
- Verify webhook secret is set in Supabase
- Test with: https://dashboard.stripe.com/webhooks

---

## 📞 NEXT STEPS AFTER DEPLOYMENT

1. **Test the complete flow:**
   - Create a test account
   - Start free trial
   - Wait or manually expire the trial
   - Verify lockout modal appears
   - Test upgrade flow

2. **Monitor:**
   - Check Supabase logs for any errors
   - Monitor Stripe dashboard for subscription events
   - Verify trial warning emails are sent

3. **Go live:**
   - Update DNS if needed
   - Enable production mode in all services
   - Monitor user signups and conversions

---

## 🆘 SUPPORT

If you encounter issues:
1. Check Supabase logs: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/logs
2. Check Stripe logs: https://dashboard.stripe.com/logs
3. Review Edge Function logs in Supabase Dashboard

---

**Generated:** October 14, 2025
**Status:** Ready for Production Deployment

