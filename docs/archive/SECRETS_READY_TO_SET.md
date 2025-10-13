# Supabase Secrets - Ready to Set

**Date:** October 12, 2025  
**Status:** Ready - Just need your Supabase access token

---

## 🔑 Secrets I Can Set Right Now

### ✅ Gemini API Key (READY)
```bash
GEMINI_API_KEY=AIzaSyAlFtsPR3O-zZXR84tKGgi2j2kc2xClsOg
```

**Status:** ✅ Found in documentation, verified working  
**Source:** `docs/GEMINI_API_SETUP.md`

---

## 🔐 What You Need to Provide

### 1. Supabase Access Token (REQUIRED)

**Get it here:** https://supabase.com/dashboard/account/tokens

**Steps:**
1. Go to the link above
2. Click "Generate New Token"
3. Give it a name (e.g., "PocketTeller Setup")
4. Copy the token
5. Set it in your terminal:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

---

### 2. Stripe Keys (OPTIONAL - Get from Dashboard)

**Test Mode Keys (for development):**

Go to: https://dashboard.stripe.com/test/apikeys

```bash
STRIPE_SECRET_KEY_TEST=sk_test_... (get from dashboard)
STRIPE_WEBHOOK_SECRET=whsec_... (get after creating webhook)
```

**To create webhook:**
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/stripe-webhook`
4. Events: Select all subscription and checkout events
5. Copy the webhook secret (whsec_...)

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Supabase Access Token
```bash
# Go to: https://supabase.com/dashboard/account/tokens
# Copy your token and export it:
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

### Step 2: Run the Setup Script
```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
./set-secrets-now.sh
```

This will:
- ✅ Link to your Supabase project
- ✅ Set GEMINI_API_KEY (we have it!)
- ℹ️  Show you how to set Stripe keys

### Step 3: Set Stripe Keys (Optional)
```bash
# After getting keys from Stripe dashboard:
supabase secrets set STRIPE_SECRET_KEY_TEST=sk_test_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

---

## ⚡ Even Faster: One Command Setup

If you already have your Supabase access token:

```bash
# Export token
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here

# Link and set Gemini key
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
supabase link --project-ref dscndbpqvhvylukvcgpq
supabase secrets set GEMINI_API_KEY=AIzaSyAlFtsPR3O-zZXR84tKGgi2j2kc2xClsOg

# Verify
supabase secrets list

# Deploy AI functions
supabase functions deploy gemini-chat
supabase functions deploy ai-categorize-transactions
supabase functions deploy ai-spending-insights
```

---

## 🔍 What Each Secret Does

### GEMINI_API_KEY
**Used by:**
- `gemini-chat` - AI financial coach
- `ai-categorize-transactions` - Auto-categorize transactions
- `ai-spending-insights` - Generate spending insights

**Priority:** HIGH - Needed for all AI features

---

### STRIPE_SECRET_KEY_TEST
**Used by:**
- `stripe-create-checkout` - Create payment sessions
- `stripe-webhook` - Handle payment events
- `stripe-create-portal` - Customer portal
- `stripe-check-subscription` - Verify subscriptions

**Priority:** HIGH - Needed for payments

---

### STRIPE_WEBHOOK_SECRET
**Used by:**
- `stripe-webhook` - Verify webhook authenticity

**Priority:** HIGH - Needed for payment webhooks

---

## 🧪 Testing After Setup

### Test Gemini API
```bash
# Deploy the function
supabase functions deploy gemini-chat

# Test in the app
# 1. Run: npm run dev
# 2. Go to AI Chat page
# 3. Send a message
# 4. Should get a response from Gemini
```

### Test Stripe
```bash
# Deploy Stripe functions
supabase functions deploy stripe-webhook
supabase functions deploy stripe-create-checkout

# Test in the app
# 1. Go to subscription page
# 2. Try to subscribe
# 3. Should redirect to Stripe checkout
```

---

## 📊 Current Status

| Secret | Status | Have Key? | Priority |
|--------|--------|-----------|----------|
| GEMINI_API_KEY | ⏳ Ready to set | ✅ Yes | HIGH |
| STRIPE_SECRET_KEY_TEST | ⏳ Need to get | ⚠️ No | HIGH |
| STRIPE_WEBHOOK_SECRET | ⏳ Need to get | ⚠️ No | HIGH |
| PLAID_CLIENT_ID | ⏳ Optional | ⚠️ No | MEDIUM |
| PLAID_SECRET | ⏳ Optional | ⚠️ No | MEDIUM |

---

## 🆘 Troubleshooting

### "Cannot find project ref"
**Solution:** Make sure you exported the access token:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token
supabase link --project-ref dscndbpqvhvylukvcgpq
```

### "Password authentication failed"
**Solution:** You're using password auth instead of token. Export the token:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token
```

### "Secret not set"
**Solution:** Check if you're linked to the correct project:
```bash
supabase projects list
# Should show dscndbpqvhvylukvcgpq
```

---

## 📝 After Setting Secrets

### Deploy Edge Functions
```bash
# Deploy AI functions (after setting GEMINI_API_KEY)
supabase functions deploy gemini-chat
supabase functions deploy ai-categorize-transactions
supabase functions deploy ai-spending-insights

# Deploy Stripe functions (after setting STRIPE keys)
supabase functions deploy stripe-webhook
supabase functions deploy stripe-create-checkout
supabase functions deploy stripe-create-portal
```

### Test the App
```bash
# Run web app
npm run dev

# Test features:
# - AI Chat (should work with Gemini key)
# - Payments (should work with Stripe keys)
# - Transaction categorization (should work with Gemini key)
```

---

## 🎯 Summary

**What I can set automatically:** Gemini API Key ✅  
**What you need to provide:** Supabase access token (to set secrets)  
**What's optional:** Stripe keys (for payments), Plaid keys (for bank linking)

**To get started:**
1. Get Supabase access token: https://supabase.com/dashboard/account/tokens
2. Export it: `export SUPABASE_ACCESS_TOKEN=your_token`
3. Run: `./set-secrets-now.sh`

---

**Ready to set up! Just need your Supabase access token to proceed.**

---

*Created: October 12, 2025*  
*Gemini API Key: Ready and verified*  
*Waiting for: Supabase access token*

