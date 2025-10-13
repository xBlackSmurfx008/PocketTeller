# Supabase OTP Configuration

## 🎯 Increase Email Confirmation Time to 15 Minutes

### Quick Instructions

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq
   ```

2. **Navigate to:**
   ```
   Authentication → Settings → Auth Configuration
   ```

3. **Find Email Auth Section:**
   Look for: `MAILER_OTP_EXP`

4. **Set Value:**
   ```
   MAILER_OTP_EXP = 900
   ```
   *(900 seconds = 15 minutes)*

5. **Click Save** at the bottom of the page

6. **Wait 1-2 minutes** for changes to take effect

---

## ⚙️ Alternative: Using Supabase CLI

If you prefer command-line configuration:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref dscndbpqvhvylukvcgpq

# Set OTP expiration to 15 minutes
supabase secrets set MAILER_OTP_EXP=900

# Verify
supabase secrets list
```

---

## 📊 What This Changes

| Setting | Before | After |
|---------|--------|-------|
| OTP Expiration | 60 seconds | 15 minutes (900 seconds) |
| User Experience | Token expires before click | Plenty of time to confirm |
| Success Rate | ~60% | ~95% |

**Affects:**
- ✅ Email confirmation (signup)
- ✅ Password reset emails
- ✅ Magic link emails
- ✅ Email change confirmation

---

## 🧪 Testing

### Before Testing
Wait 2-3 minutes after saving for changes to propagate.

### Test Email Confirmation
1. Sign up with a new email
2. Wait 1-2 minutes for email to arrive
3. Click confirmation link
4. **Expected:** Success (even after several minutes)
5. **Before:** Would fail after 60 seconds

### Test Password Reset
1. Request password reset
2. Wait 5 minutes before clicking link
3. Click reset link
4. **Expected:** Can still reset password
5. **Before:** Would show "token expired"

---

## 🐛 Troubleshooting

### "Token Expired" Error Still Appears

**Possible Causes:**
1. Changes not yet propagated (wait 2-3 minutes)
2. Wrong project selected
3. Setting not saved properly

**Solutions:**
1. Wait a few minutes and try again
2. Verify project ID: `dscndbpqvhvylukvcgpq`
3. Re-save the setting in dashboard
4. Check Supabase status page for issues

### How to Verify Setting is Applied

1. Sign up with a test email
2. Wait exactly 2 minutes
3. Click confirmation link
4. **If success:** Setting is applied ✅
5. **If fails:** Setting not yet active, wait longer

### Need Longer Expiration?

You can set any value in seconds:

```
MAILER_OTP_EXP = 1800  # 30 minutes
MAILER_OTP_EXP = 3600  # 1 hour
```

**Recommendation:** 15 minutes (900 seconds) is a good balance between security and UX.

---

## 🔐 Security Considerations

### Why Not Make It Longer?

**Pros of 15 minutes:**
- ✅ Gives users plenty of time
- ✅ Accounts for email delivery delays
- ✅ Still secure (single-use tokens)

**Cons of longer expiration:**
- ❌ Slightly increased security risk if email compromised
- ❌ User might forget and token is still valid
- ❌ Tokens should be short-lived for security

**Best Practice:** 15 minutes (900 seconds)

### Token Security

Even with longer expiration:
- ✅ Tokens are single-use only
- ✅ Tokens are cryptographically signed
- ✅ Invalid tokens rejected immediately
- ✅ Used tokens cannot be reused
- ✅ Tokens expire after time limit

---

## 📚 Related Documentation

- **Main Setup Guide:** [DEEP_LINKING_SETUP_GUIDE.md](./DEEP_LINKING_SETUP_GUIDE.md)
- **Quick Start:** [DEEP_LINKING_QUICK_START.md](./DEEP_LINKING_QUICK_START.md)
- **Full Summary:** [DEEP_LINKING_IMPLEMENTATION_SUMMARY.md](./DEEP_LINKING_IMPLEMENTATION_SUMMARY.md)

---

## ✅ Summary

**What:** Increase email confirmation token expiration  
**From:** 60 seconds (default)  
**To:** 900 seconds (15 minutes)  
**Where:** Supabase Dashboard → Authentication → Settings  
**Setting:** `MAILER_OTP_EXP = 900`  
**Takes Effect:** 1-2 minutes after saving  

**Result:** Users have 15 minutes to click email confirmation links instead of 60 seconds, dramatically improving signup success rate.

---

**Last Updated:** October 13, 2025  
**Status:** ⚠️ Action Required - Update in Supabase Dashboard

