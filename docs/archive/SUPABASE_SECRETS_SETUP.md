# Supabase Secrets Setup - PocketTeller

**Status:** Ready to configure  
**Last Updated:** October 12, 2025

---

## 🔑 Secrets Found in Documentation

### ✅ Gemini API Key (FOUND)
**Source:** `docs/GEMINI_API_SETUP.md`

```bash
GEMINI_API_KEY=AIzaSyAlFtsPR3O-zZXR84tKGgi2j2kc2xClsOg
```

**Status:** ✅ Documented and verified working  
**Used by:** AI chat, transaction categorization, spending insights

---

### ⚠️ Stripe Keys (NEED TO GET)

**Source:** `docs/STRIPE_SETUP_GUIDE.md`

You need to get these from Stripe Dashboard:
- Go to: https://dashboard.stripe.com/apikeys
- Toggle to "Test mode" (for testing) or "Live mode" (for production)

```bash
STRIPE_SECRET_KEY_TEST=sk_test_...  # For testing
STRIPE_SECRET_KEY=sk_live_...       # For production
```

**Webhook Secret:**
- Go to: https://dashboard.stripe.com/webhooks
- Create endpoint: `https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/stripe-webhook`
- Copy the webhook secret (starts with `whsec_`)

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### ⚠️ Plaid Keys (OPTIONAL - for bank linking)

**Source:** Bank linking feature

You need to get these from Plaid Dashboard:
- Go to: https://dashboard.plaid.com/developers/keys

```bash
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox  # or development/production
PLAID_ENCRYPTION_KEY=$(openssl rand -hex 32)
```

---

## 🚀 Quick Setup (Automated Script)

### Option 1: Use the automated script

```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
./set-supabase-secrets.sh
```

This script will:
1. Prompt you for your Supabase access token
2. Link to your Supabase project
3. Set the Gemini API key (already have it)
4. Prompt you for Stripe keys
5. Optionally set up Plaid keys
6. Verify all secrets are set

---

## 🔐 Manual Setup

### Step 1: Get Supabase Access Token

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click "Generate New Token"
3. Copy the token
4. Set it in your environment:

```bash
export SUPABASE_ACCESS_TOKEN=your_token_here
```

### Step 2: Link Supabase Project

```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
supabase link --project-ref dscndbpqvhvylukvcgpq
```

If it asks for a password, you can skip it since we're using the access token.

### Step 3: Set Gemini API Key

```bash
supabase secrets set GEMINI_API_KEY=AIzaSyAlFtsPR3O-zZXR84tKGgi2j2kc2xClsOg
```

### Step 4: Set Stripe Keys (Test Mode)

```bash
# Get from: https://dashboard.stripe.com/apikeys (Test mode)
supabase secrets set STRIPE_SECRET_KEY_TEST=sk_test_your_key_here

# Get from: https://dashboard.stripe.com/webhooks
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Step 5: Set Plaid Keys (Optional)

```bash
# Get from: https://dashboard.plaid.com/developers/keys
supabase secrets set PLAID_CLIENT_ID=your_client_id
supabase secrets set PLAID_SECRET=your_secret
supabase secrets set PLAID_ENV=sandbox

# Generate encryption key
supabase secrets set PLAID_ENCRYPTION_KEY=$(openssl rand -hex 32)
```

### Step 6: Verify All Secrets

```bash
supabase secrets list
```

Expected output:
```
GEMINI_API_KEY
STRIPE_SECRET_KEY_TEST
STRIPE_WEBHOOK_SECRET
PLAID_CLIENT_ID (if set)
PLAID_SECRET (if set)
PLAID_ENV (if set)
PLAID_ENCRYPTION_KEY (if set)
SUPABASE_URL (auto-provided)
SUPABASE_ANON_KEY (auto-provided)
SUPABASE_SERVICE_ROLE_KEY (auto-provided)
```

---

## 🧪 Test After Setup

### Test Gemini API

```bash
# Deploy the function
supabase functions deploy gemini-chat

# Test via the app
npm run dev
# Go to AI Chat page and send a message
```

### Test Stripe

```bash
# Deploy Stripe functions
supabase functions deploy stripe-webhook
supabase functions deploy stripe-create-checkout

# Test checkout in the app
# Go to subscription page and try to subscribe
```

---

## 🆘 Troubleshooting

### "Cannot find project ref"
**Solution:** You need to link to the project first:
```bash
export SUPABASE_ACCESS_TOKEN=your_token
supabase link --project-ref dscndbpqvhvylukvcgpq
```

### "Password authentication failed"
**Solution:** Use access token instead of password:
1. Get token from https://supabase.com/dashboard/account/tokens
2. Export it: `export SUPABASE_ACCESS_TOKEN=your_token`
3. Try again

### "GEMINI_API_KEY not configured" (in app)
**Solution:** The secret is set in Supabase, but functions might not be deployed:
```bash
supabase functions deploy gemini-chat
supabase functions deploy ai-categorize-transactions
supabase functions deploy ai-spending-insights
```

### "Stripe secret key not configured"
**Solution:** Set the Stripe test key:
```bash
supabase secrets set STRIPE_SECRET_KEY_TEST=sk_test_...
```

---

## 📊 Summary

| Secret | Status | Priority | Used For |
|--------|--------|----------|----------|
| GEMINI_API_KEY | ✅ Found | High | AI features |
| STRIPE_SECRET_KEY_TEST | ⚠️ Need | High | Payments (test) |
| STRIPE_WEBHOOK_SECRET | ⚠️ Need | High | Payment webhooks |
| PLAID_CLIENT_ID | ⚠️ Need | Medium | Bank linking |
| PLAID_SECRET | ⚠️ Need | Medium | Bank linking |
| PLAID_ENV | ⚠️ Need | Medium | Bank linking |
| PLAID_ENCRYPTION_KEY | Auto-gen | Medium | Bank linking |

---

## 🎯 Recommended Order

1. **Start Here:** Set Gemini API key (we have it)
   ```bash
   supabase secrets set GEMINI_API_KEY=AIzaSyAlFtsPR3O-zZXR84tKGgi2j2kc2xClsOg
   ```

2. **Get Stripe Test Keys** from dashboard and set them
   - This enables payments in test mode

3. **Optional:** Get Plaid keys if you want bank linking

4. **Deploy Functions:**
   ```bash
   supabase functions deploy gemini-chat
   supabase functions deploy stripe-webhook
   ```

5. **Test in App:**
   - Try AI chat
   - Try subscription
   - Verify everything works

---

**Use the automated script for easiest setup:**
```bash
./set-supabase-secrets.sh
```

Or follow the manual steps above.

---

*Last Updated: October 12, 2025*  
*Gemini API key found in documentation and ready to use*

