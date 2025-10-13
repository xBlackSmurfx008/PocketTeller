# 🚀 Quick Start Guide: Production Deployment

This guide will get PocketTeller deployed to production in ~30 minutes.

---

## Step 1: Configure Your Environment (5 minutes)

### A. Set Up Java 21 for Android Builds

Add to `~/.zshrc` or `~/.bashrc`:
```bash
# PocketTeller Android Builds
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.8/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

Verify:
```bash
java -version  # Should show version 21.0.8
```

---

## Step 2: Configure Supabase Production Secrets (5 minutes)

```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller

# Link to your production Supabase project (if not already linked)
supabase link --project-ref dscndbpqvhvylukvcgpq

# Set required secrets
supabase secrets set GEMINI_API_KEY=your_production_gemini_key
supabase secrets set PLAID_CLIENT_ID=your_production_plaid_id
supabase secrets set PLAID_SECRET=your_production_plaid_secret
supabase secrets set PLAID_ENV=production
supabase secrets set PLAID_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Optional but recommended
supabase secrets set RESEND_API_KEY=your_resend_key
```

Verify secrets:
```bash
bash scripts/verify-supabase-secrets.sh
```

---

## Step 3: Deploy Supabase Backend (5 minutes)

```bash
# Deploy database migrations
supabase db push

# Deploy all edge functions
supabase functions deploy gemini-chat
supabase functions deploy plaid-link-exchange
supabase functions deploy plaid-sync
supabase functions deploy ai-categorize-transactions
supabase functions deploy ai-spending-insights
supabase functions deploy plaid-webhook
supabase functions deploy send-budget-email
supabase functions deploy send-budget-sms
supabase functions deploy send-notification
supabase functions deploy submit-contact-form

# Verify deployment
supabase functions list
```

---

## Step 4: Deploy Web Application (5 minutes)

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

---

## Step 5: Build Mobile Apps (10 minutes)

### Android Release Build

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Build release AAB for Play Store
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

**Upload to Google Play Console:**
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app (if first time)
3. Upload `app-release.aab`
4. Complete store listing
5. Submit for review

### iOS Release Build

```bash
# Build web app
npm run build

# Sync to iOS
npx cap sync ios

# Install pods
cd ios/App
pod install

# Open in Xcode
open App.xcworkspace
```

**In Xcode:**
1. Select target device: "Any iOS Device"
2. Product → Archive
3. Distribute App → App Store Connect
4. Upload

**Upload to App Store Connect:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app (if first time)
3. Complete app information
4. Add screenshots
5. Submit for review

---

## Step 6: Post-Deployment Testing (5 minutes)

### Test Production APIs

```bash
# Get a test auth token by:
# 1. Open your production app
# 2. Sign in
# 3. Open browser console
# 4. Run: localStorage.getItem('supabase.auth.token')

export TEST_AUTH_TOKEN="your_jwt_token"
export GEMINI_API_KEY="your_gemini_key"
export PLAID_CLIENT_ID="your_plaid_id"
export PLAID_SECRET="your_plaid_secret"

deno run --allow-net --allow-env scripts/test-api-functions.ts
```

### Manual Testing Checklist

- [ ] Sign up new account
- [ ] Login with existing account
- [ ] Reset password
- [ ] Connect bank account
- [ ] Verify transactions load
- [ ] Test AI chat
- [ ] Create budget
- [ ] Set financial goal
- [ ] Test mobile app navigation

---

## Common Issues & Solutions

### Issue: Android build fails with "invalid source release: 21"

**Solution:**
```bash
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.8/libexec/openjdk.jdk/Contents/Home
java -version  # Verify it shows 21.0.8
```

### Issue: iOS CocoaPods fails with encoding error

**Solution:**
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
cd ios/App && pod install
```

### Issue: Plaid not working in production

**Solution:**
- Verify `PLAID_ENV=production` in Supabase secrets
- Ensure you're using production Plaid credentials
- Check that Plaid has approved your production account

### Issue: Gemini API not responding

**Solution:**
- Verify `GEMINI_API_KEY` is set in Supabase secrets
- Check API key has correct permissions in Google Cloud Console
- Verify rate limits haven't been exceeded

---

## Production Monitoring Setup (Recommended)

### Error Tracking with Sentry

```bash
npm install @sentry/react @sentry/vite-plugin

# Add to vite.config.ts:
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default {
  plugins: [
    sentryVitePlugin({
      org: "your-org",
      project: "pocketteller"
    })
  ]
}
```

### Uptime Monitoring

Set up monitoring with:
- [UptimeRobot](https://uptimerobot.com) (Free)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

Monitor these endpoints:
- Web app homepage
- Supabase health check
- Edge functions health

---

## Security Checklist

Before going live:

- [ ] Rotate all API keys for production
- [ ] Enable 2FA on all admin accounts
- [ ] Review Row-Level Security policies
- [ ] Configure rate limiting
- [ ] Set up security alerts
- [ ] Review audit logs
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Review environment variables
- [ ] Backup database configuration

---

## Performance Optimization (Optional)

### Enable CDN for Static Assets

Configure in your hosting platform:
- Vercel: Automatic
- Netlify: Automatic
- Cloudflare: Add as proxy

### Database Indexing

```sql
-- Add indexes for common queries (if not already present)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
  ON transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_category 
  ON transactions(user_id, category);

CREATE INDEX IF NOT EXISTS idx_budgets_user 
  ON budgets(user_id, month, year);
```

### Image Optimization

```bash
npm install -D vite-plugin-image-optimizer

# Add to vite.config.ts
import { imageOptimizer } from 'vite-plugin-image-optimizer';

export default {
  plugins: [imageOptimizer()]
}
```

---

## Support Resources

- 📖 [Full Production Readiness Report](./PRODUCTION_READINESS_REPORT.md)
- 🔒 [Security Setup Guide](./SECURITY_SETUP.md)
- 📱 [Mobile Development Guide](./DEVELOPMENT_DOCUMENTATION.md)
- 🧪 [Testing Checklist](./TESTING_CHECKLIST.md)

---

## Need Help?

If you encounter issues:

1. Check logs:
   ```bash
   # Supabase function logs
   supabase functions logs gemini-chat --tail
   
   # Web app console (browser dev tools)
   
   # Android logs
   adb logcat | grep PocketTeller
   
   # iOS logs (in Xcode Console)
   ```

2. Run verification scripts:
   ```bash
   bash scripts/verify-production-readiness.sh
   bash scripts/verify-supabase-secrets.sh
   ```

3. Review error reports in production monitoring tools

---

## 🎉 You're Ready!

Your PocketTeller app is now live and ready to help users manage their finances. 

**Next steps:**
- Monitor error rates
- Gather user feedback
- Plan feature iterations
- Celebrate your launch! 🚀

---

*Updated: October 11, 2025*

