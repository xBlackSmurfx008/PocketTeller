# API Keys Configuration - PocketTeller

**Date:** October 12, 2025  
**Status:** ✅ Configuration Guide  
**Purpose:** Proper API key setup for production

---

## 🔑 API Keys Overview

PocketTeller uses three external services:
1. **Supabase** - Database, Auth, Edge Functions
2. **Gemini AI** - AI Chat and transaction categorization
3. **Stripe** - Payment processing

---

## 📍 Where Keys Are Used

### Client-Side Keys (.env file)
These are baked into the JavaScript bundle at build time.

**Location:** `.env` (root directory, gitignored)

```env
# Supabase Configuration (REQUIRED for app to work)
VITE_SUPABASE_URL=https://dscndbpqvhvylukvcgpq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=dscndbpqvhvylukvcgpq

# App Configuration (Optional)
VITE_APP_NAME=PocketTeller
VITE_APP_VERSION=1.0.0
```

**Used By:**
- `src/integrations/supabase/client.ts` - Supabase client initialization
- `src/config/environment.ts` - App configuration
- All frontend code that needs Supabase access

**Status:** ✅ **CONFIGURED** (keys are in .env)

---

### Server-Side Keys (Supabase Secrets)
These are stored securely in Supabase and injected into Edge Functions.

**Location:** Supabase Dashboard or CLI

```bash
# View current secrets
supabase secrets list

# Set secrets
supabase secrets set GEMINI_API_KEY=your_key_here
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🔐 Required Secrets for Edge Functions

### 1. **GEMINI_API_KEY** (Google AI)

**Purpose:** AI chat, transaction categorization, spending insights

**Used By:**
- `supabase/functions/gemini-chat/index.ts`
- `supabase/functions/ai-categorize-transactions/index.ts`
- `supabase/functions/ai-spending-insights/index.ts`

**How to Get:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create new API key
3. Copy the key

**How to Set:**
```bash
supabase secrets set GEMINI_API_KEY=your_actual_api_key_here
```

**Status:** ⚠️ **NEEDS VERIFICATION**

---

### 2. **STRIPE_SECRET_KEY** (or STRIPE_SECRET_KEY_TEST)

**Purpose:** Payment processing, subscription management

**Used By:**
- `supabase/functions/stripe-create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/stripe-create-portal/index.ts`
- `supabase/functions/stripe-check-subscription/index.ts`
- `supabase/functions/stripe-apply-referral-credit/index.ts`

**How to Get:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. For testing: Use "Test mode" key (starts with `sk_test_`)
3. For production: Use "Live mode" key (starts with `sk_live_`)

**How to Set:**
```bash
# For testing
supabase secrets set STRIPE_SECRET_KEY_TEST=sk_test_...

# For production
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

**Status:** ⚠️ **NEEDS VERIFICATION**

---

### 3. **STRIPE_WEBHOOK_SECRET**

**Purpose:** Verify webhook requests from Stripe

**Used By:**
- `supabase/functions/stripe-webhook/index.ts`

**How to Get:**
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Create endpoint pointing to: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the "Signing secret" (starts with `whsec_`)

**How to Set:**
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

**Status:** ⚠️ **NEEDS VERIFICATION**

---

### 4. **SUPABASE_URL** (Auto-provided)

**Purpose:** Supabase project URL

**Used By:** All edge functions

**Value:** `https://dscndbpqvhvylukvcgpq.supabase.co`

**Status:** ✅ **AUTO-PROVIDED by Supabase**

---

### 5. **SUPABASE_ANON_KEY** (Auto-provided)

**Purpose:** Public anon key for client requests

**Used By:** Edge functions that need to authenticate users

**Status:** ✅ **AUTO-PROVIDED by Supabase**

---

### 6. **SUPABASE_SERVICE_ROLE_KEY** (Auto-provided)

**Purpose:** Admin access for server operations

**Used By:** Edge functions that need elevated permissions

**Status:** ✅ **AUTO-PROVIDED by Supabase**

---

## 📋 Current Configuration Status

### Client-Side (.env)
```bash
✅ VITE_SUPABASE_URL - Configured
✅ VITE_SUPABASE_ANON_KEY - Configured
✅ VITE_SUPABASE_PROJECT_ID - Configured
```

### Server-Side (Supabase Secrets)
```bash
⚠️  GEMINI_API_KEY - NEEDS VERIFICATION
⚠️  STRIPE_SECRET_KEY or STRIPE_SECRET_KEY_TEST - NEEDS VERIFICATION
⚠️  STRIPE_WEBHOOK_SECRET - NEEDS VERIFICATION
✅ SUPABASE_URL - Auto-provided
✅ SUPABASE_ANON_KEY - Auto-provided
✅ SUPABASE_SERVICE_ROLE_KEY - Auto-provided
```

---

## 🛠️ Setup Instructions

### Step 1: Verify Client-Side Keys (Already Done ✅)

Your `.env` file is correctly configured with:
- Supabase URL
- Supabase Anon Key
- Project ID

**Action:** None needed - these are working.

---

### Step 2: Configure Gemini API Key

**Get the Key:**
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the generated key (starts with `AIza...`)

**Set in Supabase:**
```bash
# From project root
cd /Users/mr.adams/pockettellerxchanges/PocketTeller

# Link to your Supabase project (if not already linked)
supabase link --project-ref dscndbpqvhvylukvcgpq

# Set the secret
supabase secrets set GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

**Test It:**
```bash
# After setting the secret, test the gemini-chat function
curl -X POST \
  https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/gemini-chat \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "conversation_history": []}'
```

---

### Step 3: Configure Stripe Keys

**Get the Keys:**
1. Go to https://dashboard.stripe.com/apikeys
2. Toggle to "Test mode" (for testing) or "Live mode" (for production)
3. Copy the "Secret key" (starts with `sk_test_` or `sk_live_`)

**Set in Supabase:**
```bash
# For testing environment
supabase secrets set STRIPE_SECRET_KEY_TEST=sk_test_...

# For production environment
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

**Configure Webhook:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/stripe-webhook`
4. Description: "PocketTeller Webhook"
5. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Click "Add endpoint"
7. Copy the "Signing secret" (starts with `whsec_`)

**Set Webhook Secret:**
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### Step 4: Verify Secrets Are Set

**Check all secrets:**
```bash
# View list of secrets (won't show values, just names)
supabase secrets list
```

**Expected output:**
```
GEMINI_API_KEY
STRIPE_SECRET_KEY (or STRIPE_SECRET_KEY_TEST)
STRIPE_WEBHOOK_SECRET
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

### Step 5: Test Edge Functions

**Test Gemini Chat:**
```bash
# From your app, try the AI chat feature
# Should work without errors
```

**Test Stripe Checkout:**
```bash
# From your app, try to subscribe to a plan
# Should redirect to Stripe checkout
```

---

## 🔍 Verification Commands

### Check .env File
```bash
cat .env | grep VITE_SUPABASE
# Should show:
# VITE_SUPABASE_URL=https://dscndbpqvhvylukvcgpq.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
# VITE_SUPABASE_PROJECT_ID=dscndbpqvhvylukvcgpq
```

### Check Supabase Secrets
```bash
supabase secrets list
# Should show all required secrets
```

### Test Supabase Connection (Frontend)
```bash
# In browser console after app loads:
# Should log: ✅ Configuration validation passed
```

### Test Edge Function (Backend)
```bash
# Test gemini-chat function
curl -i https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/gemini-chat/health

# Should return 200 OK
```

---

## 🚨 Security Notes

### DO NOT:
- ❌ Commit `.env` file to git (already gitignored)
- ❌ Share API keys in code or documentation
- ❌ Use production keys in development
- ❌ Hardcode any API keys in source code
- ❌ Expose service role key in frontend

### DO:
- ✅ Use environment variables for all keys
- ✅ Keep `.env` file in gitignore
- ✅ Use test keys for development
- ✅ Rotate keys periodically
- ✅ Use Supabase secrets for server-side keys
- ✅ Monitor API usage in dashboards

---

## 🔄 Key Rotation Procedure

If you need to rotate keys:

### Rotate Gemini API Key:
```bash
# 1. Generate new key in Google AI Studio
# 2. Set new key in Supabase
supabase secrets set GEMINI_API_KEY=new_key_here
# 3. Wait 1 minute for edge functions to restart
# 4. Test AI chat feature
# 5. Disable old key in Google AI Studio
```

### Rotate Stripe Keys:
```bash
# 1. Generate new secret key in Stripe Dashboard
# 2. Set new key in Supabase
supabase secrets set STRIPE_SECRET_KEY=new_key_here
# 3. Test checkout feature
# 4. Roll old key in Stripe Dashboard
```

### Rotate Supabase Keys:
```bash
# 1. In Supabase Dashboard → Settings → API
# 2. Generate new anon key
# 3. Update .env file
VITE_SUPABASE_ANON_KEY=new_key_here
# 4. Rebuild and redeploy
npm run build
npx cap sync ios
npx cap sync android
# 5. Revoke old key in dashboard
```

---

## 📊 API Usage Monitoring

### Gemini API:
- Dashboard: https://aistudio.google.com/app/apikey
- Monitor: Requests per day, quota usage
- Limits: Free tier has daily limits

### Stripe API:
- Dashboard: https://dashboard.stripe.com
- Monitor: API requests, webhook deliveries
- Limits: No hard limits, but monitor for unusual activity

### Supabase API:
- Dashboard: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/settings/api
- Monitor: API requests, edge function invocations
- Limits: Based on plan

---

## 🆘 Troubleshooting

### "Missing Supabase config" Error
**Cause:** .env file missing or not loaded  
**Fix:**
```bash
# Verify .env exists
ls -la .env

# Rebuild with env vars
npm run build
npx cap sync ios
```

### "GEMINI_API_KEY not configured" Error
**Cause:** Secret not set in Supabase  
**Fix:**
```bash
supabase secrets set GEMINI_API_KEY=your_key
```

### "Stripe secret key not configured" Error
**Cause:** Stripe secret not set  
**Fix:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

### Webhook Not Receiving Events
**Cause:** Webhook secret mismatch  
**Fix:**
1. Get new webhook secret from Stripe
2. Update in Supabase:
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## ✅ Final Checklist

Before going to production:

**Client-Side:**
- [ ] .env file exists with all VITE_ variables
- [ ] Supabase URL is production URL
- [ ] Supabase Anon Key is production key
- [ ] Rebuild done: `npm run build`
- [ ] iOS synced: `npx cap sync ios`
- [ ] Android synced: `npx cap sync android`

**Server-Side:**
- [ ] GEMINI_API_KEY set in Supabase secrets
- [ ] STRIPE_SECRET_KEY (live) set in Supabase secrets
- [ ] STRIPE_WEBHOOK_SECRET set in Supabase secrets
- [ ] Webhook endpoint configured in Stripe dashboard
- [ ] All edge functions deployed: `supabase functions deploy`

**Testing:**
- [ ] AI chat feature works
- [ ] Transaction categorization works
- [ ] Stripe checkout works
- [ ] Webhook events are received
- [ ] No API key errors in logs

---

## 📞 Support

### Get Help:
- Supabase: https://supabase.com/docs
- Gemini API: https://ai.google.dev/docs
- Stripe: https://stripe.com/docs

### Check Logs:
```bash
# Supabase edge function logs
supabase functions logs gemini-chat
supabase functions logs stripe-webhook

# Or in dashboard:
# https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/logs/edge-functions
```

---

**Last Updated:** October 12, 2025  
**Status:** ✅ Configuration guide complete  
**Next Action:** Verify and set server-side secrets in Supabase

---

*Keep this document as reference for API key management.*

