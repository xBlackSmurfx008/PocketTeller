# Plaid Quick Reference

**Quick commands and code snippets for PocketTeller's Plaid integration**

---

## 🔧 Required Secrets

Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```bash
PLAID_CLIENT_ID=<your_client_id>
PLAID_SECRET=<your_secret>
PLAID_ENV=production  # or 'sandbox' for testing
PLAID_ENCRYPTION_KEY=<32_byte_hex_key>
PLAID_WEBHOOK_VERIFICATION_KEY=<webhook_key>
```

Generate encryption key:
```bash
openssl rand -hex 32
```

---

## 🚀 Common Operations

### 1. Connect Bank Account (Frontend)

```typescript
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '@/integrations/supabase/client';

// Get link token
const { data } = await supabase.functions.invoke('plaid-link-token');

// Initialize Plaid Link
const { open } = usePlaidLink({
  token: data.link_token,
  onSuccess: async (public_token, metadata) => {
    // Exchange token
    await supabase.functions.invoke('plaid-link-exchange', {
      body: { 
        public_token,
        institution_name: metadata.institution.name,
        institution_id: metadata.institution.institution_id
      }
    });
  }
});

// Open Plaid Link
open();
```

---

### 2. Sync Transactions (Frontend)

```typescript
const { data, error } = await supabase.functions.invoke('plaid-sync');

if (error) {
  console.error('Sync failed:', error);
} else {
  console.log(`Synced ${data.transactions} transactions`);
}
```

---

### 3. List Connected Banks

```typescript
const { data } = await supabase.functions.invoke('plaid-list-accounts');

console.log(`Connected banks: ${data.totalConnected}/${data.maxConnections}`);
data.connectedBanks.forEach(bank => {
  console.log(`${bank.institutionName}: $${bank.totalBalance}`);
});
```

---

### 4. Disconnect Bank

```typescript
const { data } = await supabase.functions.invoke('plaid-disconnect', {
  body: { item_id: 'your-item-id' }
});
```

---

## 📊 Database Queries

### Check Recent Transactions

```sql
SELECT 
  date,
  description,
  amount,
  category,
  category_source,
  pending
FROM transactions
WHERE user_id = 'user-uuid'
ORDER BY date DESC
LIMIT 20;
```

---

### Check Sync Status

```sql
SELECT 
  institution_name,
  last_synced_at,
  sync_cursor IS NOT NULL as has_cursor,
  update_type
FROM plaid_items
WHERE user_id = 'user-uuid';
```

---

### Find User-Categorized Transactions

```sql
SELECT 
  description,
  category,
  plaid_category,
  category_source
FROM transactions
WHERE user_id = 'user-uuid' 
  AND category_source = 'user'
ORDER BY date DESC;
```

---

### Check Account Balances

```sql
SELECT 
  name,
  type,
  subtype,
  mask,
  available_balance,
  current_balance,
  institution_name
FROM accounts
WHERE user_id = 'user-uuid';
```

---

### Monitor Token Access

```sql
SELECT 
  function_name,
  access_type,
  ip_address,
  success,
  created_at
FROM plaid_token_audit_log
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 50;
```

---

### Check for Duplicate Transactions

```sql
SELECT 
  plaid_transaction_id,
  COUNT(*) as count
FROM transactions
WHERE user_id = 'user-uuid'
GROUP BY plaid_transaction_id
HAVING COUNT(*) > 1;
```

---

## 🔨 Edge Function Code Snippets

### Decrypt Access Token

```typescript
const { data: decryptedToken } = await supabase.rpc('decrypt_plaid_token_with_audit', {
  encrypted_data: {
    encrypted_token: profile.encrypted_plaid_token,
    iv: profile.token_iv
  },
  encryption_key: Deno.env.get('PLAID_ENCRYPTION_KEY'),
  function_name: 'my-function-name',
  ip_address: clientIP,
  user_agent: userAgent,
  target_user_id: user.id
});
```

---

### Call Plaid API

```typescript
const plaidBaseUrl = 'https://production.plaid.com';

const response = await fetch(`${plaidBaseUrl}/transactions/sync`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: Deno.env.get('PLAID_CLIENT_ID'),
    secret: Deno.env.get('PLAID_SECRET'),
    access_token: decryptedToken,
    cursor: storedCursor,
    count: 100
  })
});

const data = await response.json();
```

---

### Upsert Transaction

```typescript
await supabase
  .from('transactions')
  .upsert({
    user_id: user.id,
    plaid_transaction_id: transaction.transaction_id,
    plaid_account_id: transaction.account_id,
    amount: Math.abs(transaction.amount),
    date: transaction.date,
    description: transaction.name,
    merchant_name: transaction.merchant_name,
    category: mappedCategory,
    category_source: 'plaid',
    subcategory: transaction.category?.[1],
    plaid_category: transaction.category?.[0],
    pending: transaction.pending,
    iso_currency_code: transaction.iso_currency_code || 'USD'
  }, {
    onConflict: 'user_id,plaid_transaction_id'
  });
```

---

### Update Sync Cursor

```typescript
await supabase
  .from('plaid_items')
  .update({
    sync_cursor: nextCursor,
    last_synced_at: new Date().toISOString()
  })
  .eq('item_id', itemId);
```

---

## 🧪 Testing

### Sandbox Test Credentials

| Username | Password | Result |
|----------|----------|--------|
| `user_good` | `pass_good` | ✅ Successful connection |
| `user_bad` | `pass_bad` | ❌ Invalid credentials |

---

### Force Transaction Refresh

```typescript
const response = await fetch(`${plaidBaseUrl}/transactions/refresh`, {
  method: 'POST',
  body: JSON.stringify({
    client_id: plaidClientId,
    secret: plaidSecret,
    access_token: accessToken
  })
});
```

---

### Trigger Webhook (Sandbox)

1. Go to [Plaid Dashboard](https://dashboard.plaid.com/)
2. Navigate to **API** → **Sandbox**
3. Find your Item
4. Click **Fire a webhook**
5. Select webhook type: `SYNC_UPDATES_AVAILABLE`
6. Check your webhook endpoint logs

---

## 🐛 Debugging

### Check Plaid Item Details

```typescript
const response = await fetch(`${plaidBaseUrl}/item/get`, {
  method: 'POST',
  body: JSON.stringify({
    client_id: plaidClientId,
    secret: plaidSecret,
    access_token: accessToken
  })
});

const data = await response.json();
console.log('Item status:', data.item);
```

---

### Verify Webhook Signature

```typescript
const signature = req.headers.get('plaid-signature');
const body = await req.text();

const isValid = await verifyWebhookSignature(body, signature);
console.log('Webhook signature valid:', isValid);
```

---

### Check Rate Limit

```typescript
const { data: allowed } = await supabase.rpc('check_token_access_rate', {
  target_user_id: userId
});

if (!allowed) {
  console.warn('Rate limit exceeded for user:', userId);
}
```

---

## 📈 Performance Tips

### 1. Cache Account Balances
Don't call `/accounts/get` on every page load. Cache for 5-10 minutes.

### 2. Use Cursor Pagination
Always use `cursor` parameter to fetch only new data:

```typescript
// ✅ Good - incremental
const data = await syncTransactions(accessToken, storedCursor);

// ❌ Bad - fetches everything
const data = await getTransactions(accessToken, '2024-01-01', '2025-01-01');
```

### 3. Listen to Webhooks
Don't poll. Use `SYNC_UPDATES_AVAILABLE` webhook to know when to sync.

### 4. Batch Updates
Process all transactions in a single database operation:

```typescript
const transactions = syncData.added.map(t => ({
  // ... map transaction
}));

await supabase
  .from('transactions')
  .upsert(transactions, { onConflict: 'user_id,plaid_transaction_id' });
```

---

## 🔐 Security Checklist

- [ ] Tokens encrypted with AES-256
- [ ] Webhook signature verification enabled (production)
- [ ] Rate limiting implemented
- [ ] Audit logging active
- [ ] User-categorized transactions never overwritten
- [ ] Environment variables set in Supabase (not in code)
- [ ] No plain-text tokens in database
- [ ] RLS policies enabled on all tables

---

## 📞 Support

**Plaid Documentation:** https://plaid.com/docs/  
**Plaid Dashboard:** https://dashboard.plaid.com/  
**Plaid Status:** https://status.plaid.com/

**Internal Docs:**
- [Full Integration Guide](./PLAID_INTEGRATION_GUIDE.md)
- [Troubleshooting Guide](./PLAID_INTEGRATION_GUIDE.md#troubleshooting)

---

**Last Updated:** October 13, 2025

