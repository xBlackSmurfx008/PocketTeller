# 🧪 Test Your Stripe Integration NOW!

**Takes 5 minutes** - Follow these exact steps

---

## ⚡ Quick Test

### 1. Start Your App
```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
npm run dev
```

### 2. Navigate to Subscription Page
Open browser: **http://localhost:5173/subscription**

You should see:
- ✅ Beautiful pricing cards
- ✅ Monthly: $4.99/month
- ✅ Yearly: $32.99/year
- ✅ "30 days FREE" badges
- ✅ Promo code input field

### 3. Click "Start Free Trial"
Click on the **Monthly plan** button

You should be redirected to: **Stripe Checkout**

### 4. Complete Test Checkout

**Use these test details:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
Email: test@pocketteller.app
Name: Test User
```

Click **Subscribe**

### 5. Verify Redirect
You should be redirected back to:
`http://localhost:5173/subscription?checkout=success`

### 6. Check Your Subscription
Navigate to: **http://localhost:5173/account**

Scroll down, you should see:
- ✅ **"PocketTeller Pro"** card
- ✅ Status: "Free trial active"
- ✅ Trial days: ~30 days remaining
- ✅ "Manage Subscription" button

### 7. Test Customer Portal
Click **"Manage Subscription"** button

You should be redirected to:
- ✅ **Stripe Customer Portal**
- ✅ Can see subscription details
- ✅ Can update payment method
- ✅ Can cancel subscription
- ✅ Can view invoices

### 8. Test Promo Code (Optional)
1. Go back to /subscription
2. Enter promo code: **SA2025**
3. Click "Apply"
4. Message should confirm code will be applied
5. Start a new checkout
6. Promo should be applied at checkout

---

## ✅ Success Checklist

After testing, verify:

- [ ] Subscription page loads and looks good
- [ ] Checkout redirect works
- [ ] Test card payment succeeds
- [ ] Redirect back to app works
- [ ] Subscription card appears on /account
- [ ] Trial period shows ~30 days
- [ ] "Manage Subscription" button works
- [ ] Customer portal opens
- [ ] Can see subscription in Stripe Dashboard

---

## 📊 Verify in Stripe Dashboard

**Check Stripe Test Dashboard:**

1. **Customers:** https://dashboard.stripe.com/test/customers
   - Should see your test customer

2. **Subscriptions:** https://dashboard.stripe.com/test/subscriptions
   - Should see 1 active subscription
   - Status: trialing
   - Plan: Monthly or Yearly

3. **Events:** https://dashboard.stripe.com/test/events
   - Should see recent webhook events
   - checkout.session.completed
   - customer.subscription.created

---

## 🎊 If Everything Works

**Congratulations!** 🎉

Your payment system is working perfectly!

**Next steps:**
1. ✅ Test with different plans
2. ✅ Test referral program
3. ✅ When ready, switch to live mode
4. ✅ Start accepting real payments!

---

## 🐛 Troubleshooting

### Checkout doesn't open
```bash
# Check function logs
supabase functions logs stripe-create-checkout --project-ref dscndbpqvhvylukvcgpq --tail
```

### Payment doesn't process
- Verify you're using the correct test card
- Check Stripe Dashboard for errors
- View webhook logs

### Subscription doesn't show
```bash
# Check webhook logs
supabase functions logs stripe-webhook --project-ref dscndbpqvhvylukvcgpq --tail

# Check database
# (use Supabase dashboard or SQL query)
```

---

## 💡 Test Cards

```
Success:           4242 4242 4242 4242
Decline:           4000 0000 0000 9995
Requires Auth:     4000 0025 0000 3155
Insufficient Funds: 4000 0000 0000 9995
```

All use:
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

---

**Ready? Run `npm run dev` and test now!** 🚀

---

*Test guide created: October 11, 2025*  
*Everything is configured - just test it!*

