# Plaid Developer Checklist

**Pre-deployment and development checklists for Plaid integration**

---

## 🚀 Initial Setup Checklist

### 1. Plaid Account Setup

- [ ] Create Plaid account at https://dashboard.plaid.com/
- [ ] Verify email address
- [ ] Complete company information
- [ ] Note your `client_id` (visible in dashboard)
- [ ] Generate and save `secret` keys (Sandbox, Development, Production)

### 2. Supabase Configuration

- [ ] Set environment secrets in Supabase Dashboard:
  ```
  PLAID_CLIENT_ID=<client_id>
  PLAID_SECRET=<secret_for_environment>
  PLAID_ENV=sandbox  # Change to 'production' when ready
  PLAID_ENCRYPTION_KEY=<generate_with_openssl>
  PLAID_WEBHOOK_VERIFICATION_KEY=<from_plaid_dashboard>
  ```

- [ ] Generate encryption key:
  ```bash
  openssl rand -hex 32
  ```

- [ ] Deploy edge functions:
  ```bash
  supabase functions deploy plaid-link-token
  supabase functions deploy plaid-link-exchange
  supabase functions deploy plaid-sync
  supabase functions deploy plaid-webhook
  supabase functions deploy plaid-disconnect
  supabase functions deploy plaid-list-accounts
  supabase functions deploy plaid-check-limit
  ```

### 3. Database Setup

- [ ] Run all Plaid-related migrations:
  ```bash
  supabase db push
  ```

- [ ] Verify tables exist:
  - [ ] `profiles` (with `encrypted_plaid_token`, `token_iv`)
  - [ ] `plaid_items` (with `sync_cursor`, `last_synced_at`)
  - [ ] `accounts` (with Plaid columns)
  - [ ] `transactions` (with `plaid_transaction_id`, `category_source`, `plaid_category`)
  - [ ] `plaid_token_audit_log`

- [ ] Verify indexes exist:
  - [ ] `idx_accounts_user_plaid_acct`
  - [ ] `idx_transactions_user_plaid_txn`
  - [ ] `idx_transactions_user_date`

- [ ] Test database functions:
  ```sql
  SELECT encrypt_plaid_token('test-token', 'test-key-32-chars-long-hex-str');
  SELECT check_token_access_rate('00000000-0000-0000-0000-000000000000');
  ```

### 4. Webhook Setup

- [ ] Configure webhook URL in Plaid Dashboard:
  ```
  https://<your-project>.supabase.co/functions/v1/plaid-webhook
  ```

- [ ] Select webhook events:
  - [ ] `TRANSACTIONS` → All events
  - [ ] `ITEM` → All events
  - [ ] `AUTH` → All events

- [ ] Test webhook with Plaid Dashboard's "Fire a webhook" feature

- [ ] Verify webhook signature verification is active (production only)

### 5. Frontend Integration

- [ ] Install Plaid Link SDK:
  ```bash
  npm install react-plaid-link
  ```

- [ ] Implement `PlaidLink` component (already done in `src/components/PlaidLink.tsx`)

- [ ] Test bank connection flow:
  - [ ] Generate link token
  - [ ] Open Plaid Link
  - [ ] Select institution
  - [ ] Enter credentials (`user_good` / `pass_good` in sandbox)
  - [ ] Exchange public token
  - [ ] Verify accounts appear in database

---

## 🧪 Pre-Production Testing Checklist

### Sandbox Testing

- [ ] **Connect Bank Account**
  - [ ] Call `plaid-link-token` successfully
  - [ ] Plaid Link UI opens correctly
  - [ ] Can select institution
  - [ ] Can enter credentials
  - [ ] Receives success callback
  - [ ] `plaid-link-exchange` completes
  - [ ] Accounts appear in `accounts` table
  - [ ] Plaid item created in `plaid_items` table
  - [ ] Access token encrypted in `profiles` table

- [ ] **Sync Transactions**
  - [ ] Call `plaid-sync` successfully
  - [ ] Transactions appear in `transactions` table
  - [ ] `sync_cursor` saved in `plaid_items`
  - [ ] Categories mapped correctly
  - [ ] `category_source` set to `plaid` for Plaid-categorized
  - [ ] `plaid_category` stored for reference

- [ ] **Update Existing Transaction**
  - [ ] Modify transaction in Plaid Sandbox
  - [ ] Sync again
  - [ ] Verify transaction updated in database
  - [ ] Verify `category_source = 'user'` transactions NOT overwritten

- [ ] **Remove Transaction**
  - [ ] Delete transaction in Plaid Sandbox
  - [ ] Sync again
  - [ ] Verify transaction removed from database

- [ ] **Disconnect Bank**
  - [ ] Call `plaid-disconnect`
  - [ ] Verify item removed from Plaid
  - [ ] Verify transactions deleted from database
  - [ ] Verify accounts deleted from database
  - [ ] Verify `plaid_items` record deleted

- [ ] **Webhook Events**
  - [ ] Trigger `SYNC_UPDATES_AVAILABLE` webhook
  - [ ] Verify webhook received and logged
  - [ ] Verify `plaid_items.update_type` updated
  - [ ] Trigger `TRANSACTIONS_REMOVED` webhook
  - [ ] Verify transactions deleted

- [ ] **Error Handling**
  - [ ] Test with invalid credentials (`user_bad` / `pass_bad`)
  - [ ] Test rate limiting (make 100+ requests in 1 hour)
  - [ ] Test with expired token (revoke in Plaid Dashboard)
  - [ ] Verify error messages user-friendly

- [ ] **Multi-Account Support**
  - [ ] Connect 3 different banks
  - [ ] Verify all 3 appear in `plaid-list-accounts`
  - [ ] Try connecting 4th bank (should fail)
  - [ ] Disconnect one bank
  - [ ] Verify can connect new bank again

### Security Testing

- [ ] **Token Encryption**
  - [ ] Verify tokens never stored in plain text
  - [ ] Verify `encrypted_plaid_token` is base64 encoded ciphertext
  - [ ] Verify `token_iv` is stored
  - [ ] Verify decryption works correctly

- [ ] **Audit Logging**
  - [ ] Every token access logged in `plaid_token_audit_log`
  - [ ] IP address captured
  - [ ] User agent captured
  - [ ] Success/failure status recorded
  - [ ] Function name recorded

- [ ] **Rate Limiting**
  - [ ] Make 100+ requests in 1 hour
  - [ ] Verify 101st request blocked
  - [ ] Verify error message returned
  - [ ] Wait 1 hour, verify requests allowed again

- [ ] **Webhook Verification**
  - [ ] Signature verification enabled (non-sandbox)
  - [ ] Valid signature accepted
  - [ ] Invalid signature rejected
  - [ ] Missing signature rejected

- [ ] **RLS Policies**
  - [ ] Users can only see their own `plaid_items`
  - [ ] Users can only see their own `accounts`
  - [ ] Users can only see their own `transactions`
  - [ ] Service role can access all data

---

## 🌍 Production Deployment Checklist

### Pre-Deployment

- [ ] **Plaid Account**
  - [ ] Submit company information
  - [ ] Complete Plaid onboarding
  - [ ] Receive production credentials
  - [ ] Update Terms of Service with Plaid requirements
  - [ ] Add Privacy Policy with Plaid data usage

- [ ] **Environment Update**
  - [ ] Update `PLAID_ENV` to `production`
  - [ ] Update `PLAID_SECRET` to production secret
  - [ ] Verify `PLAID_CLIENT_ID` correct for production
  - [ ] Verify `PLAID_WEBHOOK_VERIFICATION_KEY` set

- [ ] **Database**
  - [ ] Run migrations on production database
  - [ ] Verify all indexes created
  - [ ] Verify all functions deployed
  - [ ] Enable RLS on all Plaid tables

- [ ] **Edge Functions**
  - [ ] Deploy all Plaid functions to production
  - [ ] Verify secrets set correctly
  - [ ] Test each function manually

- [ ] **Webhook**
  - [ ] Update webhook URL in Plaid Dashboard to production
  - [ ] Verify webhook signature verification enabled
  - [ ] Test webhook with production endpoint

### Post-Deployment

- [ ] **Monitoring**
  - [ ] Set up error alerts in Supabase
  - [ ] Monitor `plaid_token_audit_log` for suspicious activity
  - [ ] Monitor Plaid API usage in Plaid Dashboard
  - [ ] Set up log aggregation (e.g., Datadog, LogDNA)

- [ ] **User Testing**
  - [ ] Have 5-10 beta users connect real bank accounts
  - [ ] Verify transactions sync correctly
  - [ ] Monitor for errors
  - [ ] Collect feedback

- [ ] **Performance**
  - [ ] Monitor edge function execution time
  - [ ] Monitor database query performance
  - [ ] Check for slow queries
  - [ ] Optimize if sync takes > 10 seconds

---

## 🔄 Ongoing Maintenance Checklist

### Daily

- [ ] Check for Plaid API errors in logs
- [ ] Monitor webhook failures
- [ ] Review `plaid_token_audit_log` for anomalies

### Weekly

- [ ] Review Plaid API usage (Dashboard)
- [ ] Check for rate limit warnings
- [ ] Review user-reported sync issues
- [ ] Update category mappings if needed

### Monthly

- [ ] Review Plaid changelog for API updates
- [ ] Update SDK versions if needed
- [ ] Review and optimize database indexes
- [ ] Audit token encryption keys

### Quarterly

- [ ] Security audit of token storage
- [ ] Review and update error handling
- [ ] Performance optimization review
- [ ] Update documentation

---

## 🆕 Adding New Features Checklist

### Adding Support for New Plaid Product

Example: Adding **Identity** product for KYC

- [ ] **Plaid Dashboard**
  - [ ] Enable product in Plaid Dashboard
  - [ ] Review product documentation
  - [ ] Understand billing implications

- [ ] **Database Migration**
  - [ ] Create migration for new data (e.g., `identity_data` table)
  - [ ] Add indexes
  - [ ] Add RLS policies
  - [ ] Test migration on development

- [ ] **Edge Function**
  - [ ] Create new edge function (e.g., `plaid-get-identity`)
  - [ ] Implement Plaid API call
  - [ ] Store data in database
  - [ ] Add error handling
  - [ ] Add audit logging
  - [ ] Add rate limiting

- [ ] **Frontend**
  - [ ] Update link token creation to include new product
  - [ ] Create UI to display new data
  - [ ] Handle loading states
  - [ ] Handle errors

- [ ] **Testing**
  - [ ] Test in sandbox
  - [ ] Test with real data (development environment)
  - [ ] Load testing
  - [ ] Security review

- [ ] **Documentation**
  - [ ] Update `PLAID_INTEGRATION_GUIDE.md`
  - [ ] Update `PLAID_QUICK_REFERENCE.md`
  - [ ] Update `AGENTS.md`
  - [ ] Create internal runbook

---

## 🐛 Debugging Checklist

### Transaction Not Syncing

- [ ] Check user has connected bank account
  ```sql
  SELECT * FROM plaid_items WHERE user_id = 'uuid';
  ```

- [ ] Check last sync time
  ```sql
  SELECT last_synced_at FROM plaid_items WHERE user_id = 'uuid';
  ```

- [ ] Check sync cursor exists
  ```sql
  SELECT sync_cursor FROM plaid_items WHERE user_id = 'uuid';
  ```

- [ ] Check Plaid item status
  ```typescript
  const response = await plaidClient.getItem(accessToken);
  ```

- [ ] Check for Plaid API errors in logs

- [ ] Force transaction refresh
  ```typescript
  await plaidClient.refreshTransactions(accessToken);
  ```

- [ ] Check webhook events
  ```sql
  SELECT * FROM plaid_webhook_log WHERE item_id = 'item-id';
  ```

### User Can't Connect Bank

- [ ] Check link token generation
- [ ] Verify Plaid credentials correct
- [ ] Check network connectivity
- [ ] Verify Plaid SDK loaded
- [ ] Check browser console for errors
- [ ] Verify institution supported by Plaid
- [ ] Check Plaid Status Page: https://status.plaid.com/

### Webhook Not Firing

- [ ] Verify webhook URL correct in Plaid Dashboard
- [ ] Check webhook signature verification not blocking
- [ ] Test with Plaid Dashboard "Fire a webhook"
- [ ] Check edge function logs
- [ ] Verify webhook URL publicly accessible
- [ ] Check SSL certificate valid

---

## 📊 Monitoring Metrics

### Key Metrics to Track

- **Sync Success Rate**
  ```sql
  SELECT 
    COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*) as success_rate
  FROM plaid_token_audit_log
  WHERE function_name = 'plaid-sync' 
    AND created_at > NOW() - INTERVAL '24 hours';
  ```

- **Average Sync Duration**
  Monitor in Supabase edge function logs

- **Webhook Delivery Success Rate**
  Monitor in Plaid Dashboard → API → Webhooks

- **Token Access Frequency**
  ```sql
  SELECT 
    function_name,
    COUNT(*) as access_count
  FROM plaid_token_audit_log
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY function_name;
  ```

- **Rate Limit Hits**
  ```sql
  SELECT COUNT(*)
  FROM plaid_token_audit_log
  WHERE error_message LIKE '%rate limit%'
    AND created_at > NOW() - INTERVAL '24 hours';
  ```

- **Active Connected Banks**
  ```sql
  SELECT COUNT(DISTINCT user_id)
  FROM plaid_items;
  ```

---

## 🔐 Security Audit Checklist

### Quarterly Security Review

- [ ] **Token Storage**
  - [ ] All tokens encrypted with AES-256
  - [ ] No plain-text tokens in database
  - [ ] Encryption keys rotated (if needed)
  - [ ] IVs unique per token

- [ ] **Audit Logs**
  - [ ] All token access logged
  - [ ] No suspicious access patterns
  - [ ] IP addresses captured correctly
  - [ ] User agents logged

- [ ] **Rate Limiting**
  - [ ] Rate limits enforced
  - [ ] No legitimate users blocked
  - [ ] Limits appropriate for usage

- [ ] **Webhook Security**
  - [ ] Signature verification enabled (production)
  - [ ] No webhooks bypassing verification
  - [ ] HTTPS enforced

- [ ] **RLS Policies**
  - [ ] All Plaid tables have RLS enabled
  - [ ] Users can only access their own data
  - [ ] Service role access appropriate

- [ ] **Code Review**
  - [ ] No secrets in code
  - [ ] No console.log of sensitive data
  - [ ] Error messages don't leak sensitive info
  - [ ] Input validation on all user inputs

---

## 📚 Resources

- [Plaid API Documentation](https://plaid.com/docs/)
- [Plaid Dashboard](https://dashboard.plaid.com/)
- [Plaid Status Page](https://status.plaid.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PocketTeller Plaid Integration Guide](./PLAID_INTEGRATION_GUIDE.md)
- [PocketTeller Plaid Quick Reference](./PLAID_QUICK_REFERENCE.md)

---

**Last Updated:** October 13, 2025  
**Next Review:** January 2026

