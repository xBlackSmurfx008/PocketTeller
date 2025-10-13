# 🚀 Quick Deployment - Plaid Fixes

## What Was Fixed

✅ **Connection Detection** - All pages now use `plaid_items` table consistently  
✅ **Institution Names** - Banks now show real names, not "Connected Bank"  
✅ **Rate Limiting** - Re-enabled for production security (50/hour)  
✅ **Multi-Account** - Properly supports multiple bank connections  

---

## Deploy Now (2 minutes)

### Step 1: Deploy Edge Functions
```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller

# Deploy all 3 modified functions
supabase functions deploy plaid-link-token
supabase functions deploy plaid-link-exchange
supabase functions deploy plaid-sync
```

### Step 2: Verify Deployment
```bash
# Check functions are live
supabase functions list

# Watch for any errors
supabase functions logs plaid-link-exchange --tail
```

### Step 3: Test Connection
1. Go to your app
2. Navigate to Account page
3. Click "Connect Bank Account"
4. Complete connection
5. Verify bank name shows correctly
6. Check Dashboard shows connection
7. Try syncing data

---

## What to Monitor

### Check plaid_items Table:
```sql
SELECT 
  user_id,
  institution_name,
  institution_id,
  created_at
FROM plaid_items
ORDER BY created_at DESC
LIMIT 10;
```

### Check Audit Logs:
```sql
SELECT 
  function_name,
  success,
  error_message,
  created_at
FROM plaid_token_audit_log
ORDER BY created_at DESC
LIMIT 20;
```

---

## If Something Breaks

### Connection Not Detected:
- Check: `SELECT * FROM plaid_items WHERE user_id = 'USER_ID';`
- Should have records after connection
- If empty, check function logs

### Bank Name Shows "Connected Bank":
- Old connections may not have name yet
- Disconnect and reconnect
- Or sync data to update

### Rate Limit Errors:
- Expected if user tries >50 connections/hour
- Error message: "Too many link token requests. Please try again in a few minutes."
- This is correct behavior

### Function Errors:
```bash
# View real-time logs
supabase functions logs plaid-link-exchange --tail
supabase functions logs plaid-sync --tail
supabase functions logs plaid-link-token --tail
```

---

## Production Checklist

Before going live:
- [ ] All 3 functions deployed
- [ ] Test bank connection works
- [ ] Institution names display correctly
- [ ] Connection persists across page refreshes
- [ ] Sync works without errors
- [ ] Rate limiting active (check logs)

---

## Rollback (If Needed)

If you need to rollback:
```bash
# Get previous version
git log --oneline

# Rollback files
git checkout HEAD~1 src/components/PlaidLink.tsx
git checkout HEAD~1 src/pages/Account.tsx
git checkout HEAD~1 supabase/functions/plaid-link-exchange/index.ts
git checkout HEAD~1 supabase/functions/plaid-sync/index.ts
git checkout HEAD~1 supabase/functions/plaid-link-token/index.ts

# Redeploy old versions
supabase functions deploy plaid-link-token
supabase functions deploy plaid-link-exchange
supabase functions deploy plaid-sync
```

---

## Support Commands

```bash
# Check all Plaid connections
supabase db sql "SELECT COUNT(*) as total_connections FROM plaid_items"

# Check rate limit usage
supabase db sql "SELECT user_id, COUNT(*) as attempts FROM plaid_token_audit_log WHERE access_type = 'link_token' AND created_at > NOW() - INTERVAL '1 hour' GROUP BY user_id"

# Clear a user's rate limit (emergency)
supabase db sql "DELETE FROM plaid_token_audit_log WHERE user_id = 'USER_ID' AND access_type = 'link_token'"
```

---

**Ready to deploy!** 🚀

All changes are production-safe and backwards compatible.

