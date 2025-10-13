# 💳 Stripe Integration - Quick Reference Card

**Last Updated:** October 11, 2025

---

## 💰 Pricing

| Plan | Price | Trial | Savings |
|------|-------|-------|---------|
| **Monthly** | $4.99/mo | 30 days FREE | - |
| **Yearly** | $32.99/yr | 30 days FREE | $27/year |

**Promo Code:** `SA2025` = 30 days free trial  
**Referral:** 3 suggestions = 1 free month

---

## ⚡ Quick Setup Commands

```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe && stripe login

# 2. Run setup script
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
bash scripts/setup-stripe-products.sh

# 3. Set secrets (use IDs from script output)
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx --project-ref dscndbpqvhvylukvcgpq
supabase secrets set STRIPE_PRICE_MONTHLY=price_xxxxx --project-ref dscndbpqvhvylukvcgpq
supabase secrets set STRIPE_PRICE_YEARLY=price_xxxxx --project-ref dscndbpqvhvylukvcgpq
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx --project-ref dscndbpqvhvylukvcgpq

# 4. Deploy functions
supabase functions deploy stripe-create-checkout --project-ref dscndbpqvhvylukvcgpq
supabase functions deploy stripe-webhook --project-ref dscndbpqvhvylukvcgpq
supabase functions deploy stripe-create-portal --project-ref dscndbpqvhvylukvcgpq
supabase functions deploy stripe-check-subscription --project-ref dscndbpqvhvylukvcgpq
supabase functions deploy stripe-apply-referral-credit --project-ref dscndbpqvhvylukvcgpq

# 5. Test locally
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
npm run dev
```

---

## 📞 Edge Functions

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `stripe-create-checkout` | Start subscription | ✅ Yes |
| `stripe-webhook` | Process Stripe events | ❌ No |
| `stripe-create-portal` | Manage billing | ✅ Yes |
| `stripe-check-subscription` | Check status | ✅ Yes |
| `stripe-apply-referral-credit` | Submit suggestions | ✅ Yes |

---

## 🧪 Test Cards

```
Success:  4242 4242 4242 4242
Decline:  4000 0000 0000 9995
3D Secure: 4000 0025 0000 3155

Expiry: Any future date (e.g., 12/34)
CVV: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

---

## 🔍 Common Queries

```sql
-- Check subscription status
SELECT * FROM subscriptions WHERE user_id = 'xxx';

-- View pending suggestions
SELECT * FROM user_suggestions WHERE status = 'pending';

-- Active subscribers count
SELECT COUNT(*) FROM subscriptions WHERE status = 'active';

-- Monthly recurring revenue
SELECT SUM(amount_cents)/100.0 FROM subscriptions 
WHERE status = 'active' AND plan_type = 'monthly';
```

---

## 🚨 Troubleshooting

**Checkout fails:**
```bash
# Check secrets
supabase secrets list --project-ref dscndbpqvhvylukvcgpq | grep STRIPE

# Check function logs
supabase functions logs stripe-create-checkout --project-ref dscndbpqvhvylukvcgpq
```

**Webhook not working:**
```bash
# Test webhook locally
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Send test event
stripe trigger customer.subscription.created
```

---

## 📚 Documentation

- **Complete Guide:** `STRIPE_INTEGRATION_COMPLETE.md`
- **Setup Guide:** `STRIPE_SETUP_GUIDE.md`
- **This Reference:** `STRIPE_QUICK_REFERENCE.md`

---

## ✅ Deployment Checklist

- [ ] Stripe CLI installed
- [ ] Products & prices created
- [ ] SA2025 promo code created
- [ ] Supabase secrets set
- [ ] Webhook configured in Stripe Dashboard
- [ ] Edge functions deployed
- [ ] Database migrations applied
- [ ] Tested with test card
- [ ] Frontend integrated
- [ ] Ready for production

---

*Quick Reference v1.0 - October 11, 2025*

