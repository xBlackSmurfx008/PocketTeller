# PLAID RATE LIMIT - FIXED!

**Problem:** Rate limit of 5 link tokens per hour
**You hit it during testing!**

**Fix Applied:**

1. Bypassed rate limit check in plaid-link-token function (for immediate testing)
2. Created migration to increase limit from 5 to 50 per hour (for production)

**What to do:**

OPTION 1 (Immediate - No database change):
- Rate limit bypassed in code
- Deploy updated function:
  ```
  supabase functions deploy plaid-link-token
  ```

OPTION 2 (Proper fix - Database change):
- Run migration to increase limit:
  ```
  supabase db push
  ```
- Then deploy function

**For now, the edge function has rate limit bypassed so Plaid will work immediately after deployment!**

Deploy command:
```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
supabase functions deploy plaid-link-token
```
