# 🎯 FINAL DEPLOYMENT STEPS - COPY & PASTE READY

## ✅ WHAT'S ALREADY DONE (95% Complete!)

### Deployed to Production:
- ✅ All 5 Stripe Edge Functions deployed and live
- ✅ iOS, Android, Web all built and synced (identical code)
- ✅ Trial expiration modal implemented
- ✅ 6-month plan UI ready
- ✅ 14-day warning email system ready
- ✅ All test mode references removed

---

## 📋 3 FINAL STEPS (Copy & Paste - 10 minutes)

### STEP 1: Create 6-Month Stripe Product (5 min)

**You need to create this in Stripe Dashboard (CLI has restricted permissions):**

1. Go to: https://dashboard.stripe.com/products

2. Click "Add product"

3. Fill in:
   - **Name:** PocketTeller Pro
   - **Description:** AI-powered financial coaching and budgeting tools with intelligent insights
   - **Pricing:**
     - **Monthly:** $4.99/month (recurring)
     - **Yearly:** $32.99/year (recurring)
     - **6-Month:** $15.00 every 6 months (recurring)

4. For the 6-month price:
   - Click "Add another price"
   - Amount: $15.00
   - Billing period: Custom → Every 6 months
   - Nickname: "PocketTeller Pro - 6 Months"

5. **Copy the price IDs** from each price row

6. Set the secrets:
```bash
supabase secrets set STRIPE_PRICE_MONTHLY=price_xxxxx
supabase secrets set STRIPE_PRICE_6MONTH=price_xxxxx
supabase secrets set STRIPE_PRICE_YEARLY=price_xxxxx
```

---

### STEP 2: Apply Database Migration (2 min)

1. Go to: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/sql/new

2. **Copy and paste this SQL:**

```sql
-- Add trial warning tracking columns to subscriptions table
-- This allows us to track when trial expiration warnings have been sent

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS trial_warning_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_warning_sent_at TIMESTAMPTZ;

-- Add index for efficient querying of trials expiring soon that haven't been warned
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_warning 
ON subscriptions(status, trial_end, trial_warning_sent) 
WHERE status = 'trialing' AND trial_warning_sent = false;

-- Add comment
COMMENT ON COLUMN subscriptions.trial_warning_sent IS 'Whether a 14-day warning email has been sent for trial expiration';
COMMENT ON COLUMN subscriptions.trial_warning_sent_at IS 'Timestamp when the trial warning was sent';
```

3. Click "Run" (bottom right)

4. Verify success message appears

---

### STEP 3: Enable Trial Warning Cron Schedule (3 min)

**Note:** Supabase cron jobs are configured via Dashboard or platform.toml

**Option A - Via Dashboard (Easiest):**

1. Go to: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/database/cron-jobs

2. Click "Create a new cron job"

3. Fill in:
   - **Name:** trial-expiration-checker
   - **Schedule:** `0 9 * * *` (daily at 9 AM UTC)
   - **SQL Command:**
   ```sql
   SELECT net.http_post(
     'https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/trial-expiration-checker',
     '{}',
     '{"Content-Type":"application/json"}'
   );
   ```

4. Click "Create"

**Option B - Via SQL Editor:**

1. Go to: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/sql/new

2. Run this SQL:
```sql
SELECT cron.schedule(
  'trial-expiration-checker',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    'https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/trial-expiration-checker',
    '{}',
    '{"Content-Type":"application/json"}'::jsonb
  );
  $$
);
```

---

## ✅ VERIFICATION CHECKLIST

After completing all 3 steps, verify:

### Test 1: Subscription Page
- [ ] Visit: https://pocketbanker.app/subscription
- [ ] See 3 pricing cards (Monthly, 6-Month, Yearly)
- [ ] 6-Month card is featured with "LIMITED TIME" badge
- [ ] Click on 6-Month plan opens Stripe checkout

### Test 2: Create Test Account
- [ ] Sign up for new account
- [ ] Trial starts automatically
- [ ] Can access all Pro features
- [ ] Dashboard, AI Coach, Bank connections all work

### Test 3: Check Edge Functions
- [ ] Go to: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/functions
- [ ] All 5 functions show "Deployed"
- [ ] Click on each to verify they're active

### Test 4: Check Secrets
```bash
supabase secrets list
```
Should include:
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PRICE_MONTHLY
- [ ] STRIPE_PRICE_6MONTH
- [ ] STRIPE_PRICE_YEARLY
- [ ] STRIPE_WEBHOOK_SECRET

### Test 5: Check Database
Run in SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name LIKE 'trial_warning%';
```
Should return 2 columns:
- [ ] trial_warning_sent
- [ ] trial_warning_sent_at

---

## 🎉 SUCCESS INDICATORS

When everything is complete, you should see:

1. **Subscription page has 3 plans**
2. **New users get 30-day trial**
3. **After trial expires, complete lockout modal appears**
4. **14-day warning emails start sending (after first trial user)**
5. **All platforms (iOS, Android, Web) work identically**

---

## 🆘 TROUBLESHOOTING

### Stripe Products Won't Create
- Use Dashboard instead of CLI: https://dashboard.stripe.com/products
- CLI has restricted permissions when paired

### Database Migration Fails
- Use SQL Editor in Dashboard (easiest)
- The `IF NOT EXISTS` clauses prevent duplicate errors

### Cron Job Not Running
- Check Supabase logs: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/logs
- Verify cron extension is enabled
- Test function manually first

---

**Created:** October 14, 2025 at 21:50 PDT  
**Status:** Ready for final 3 steps  
**Time Required:** ~10 minutes
