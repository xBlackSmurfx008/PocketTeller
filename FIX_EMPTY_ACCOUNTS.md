# Fix Empty Accounts Issue

**Problem:** You have 3 Plaid items but 0 accounts showing  
**Cause:** plaid-sync was never run after bank connections  
**Status:** DATA ISSUE (not code issue)

---

## 🔍 What Happened

```
✅ plaid_items table: 3 rows (banks connected)
❌ accounts table: 0 rows (sync never run!)
```

**Console logs show:**
```
📋 Accounts for item gyLRWJvnDnhwJbRMqBjDsXvLqDy5PefgAzKML: {"accounts":[],"accountsError":null}
📋 Accounts for item DgV398rrKWcGo1wJ8gkPSLk68GnN6buvd6y1G: {"accounts":[],"accountsError":null}
📋 Accounts for item jmRdpeaBVrTYaxw4E3bJtaMvyEjRbBhRjRLpb: {"accounts":[],"accountsError":null}
```

---

## ✅ The Fix

### Option 1: Run Sync for All Items (Recommended)

```bash
# Call plaid-sync for each bank
supabase functions invoke plaid-sync --body '{}'
```

This will:
1. Fetch all connected items from plaid_items table
2. For each item, fetch accounts from Plaid API
3. Insert accounts into accounts table
4. Fetch transactions
5. Insert transactions into transactions table

### Option 2: Reconnect Banks

If sync doesn't work, reconnect each bank:
1. Go to Settings → Bank Connection
2. Click "Add Bank"
3. Select the bank again
4. Complete authentication
5. **Make sure plaid-sync runs after connection**

---

## 🔍 How to Verify It's Fixed

### Check Database:

```sql
-- Should show 3 items
SELECT id, item_id, institution_name FROM plaid_items WHERE user_id = '[your-user-id]';

-- Should show accounts (not empty!)
SELECT id, name, plaid_account_id, plaid_item_id_ref FROM accounts WHERE user_id = '[your-user-id]';

-- Verify accounts match items
SELECT 
  i.item_id,
  i.institution_name,
  COUNT(a.id) as account_count
FROM plaid_items i
LEFT JOIN accounts a ON a.plaid_item_id_ref = i.item_id AND a.user_id = i.user_id
WHERE i.user_id = '[your-user-id]'
GROUP BY i.item_id, i.institution_name;
```

### Check Console:
After sync, you should see:
```
📋 Accounts for item XXX: {"accounts":[...array of accounts...],"accountsError":null}
```

---

## 🎯 Root Cause

The bank connection flow is:

```
1. plaid-link-exchange ✅ (Creates plaid_item)
2. plaid-sync ❌ (NEVER RUN - creates accounts + transactions)
```

Without step 2, you have:
- Plaid items exist ✅
- But no accounts ❌
- So UI shows "No Banks Connected"

---

## 🚀 Prevention

### Make Sure Sync Runs After Connection:

**In PlaidLink component (`src/components/PlaidLink.tsx`):**

After successful connection, the component should:
1. Exchange public token → creates plaid_item ✅
2. **Automatically trigger sync** → creates accounts ❌ (THIS IS MISSING!)

### Add Auto-Sync:

```typescript
// In PlaidLink.tsx, onSuccess function:
const onSuccess = useCallback(async (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => {
  // ... existing exchange code ...
  
  // After exchange succeeds, trigger sync
  try {
    await supabase.functions.invoke('plaid-sync');
    console.log('✅ Auto-sync completed');
  } catch (error) {
    console.error('❌ Auto-sync failed:', error);
    // Don't fail the connection, just log
  }
  
  onConnectionChange();
}, []);
```

---

## ✅ Summary

**Issue:** Accounts table empty  
**Cause:** Sync never run  
**Fix:** Run `plaid-sync` function  
**Prevention:** Auto-trigger sync after connection

**Next Steps:**
1. Run plaid-sync to populate accounts
2. Verify accounts appear in database
3. Refresh Dashboard - should show accounts
4. Add auto-sync to PlaidLink for future connections

