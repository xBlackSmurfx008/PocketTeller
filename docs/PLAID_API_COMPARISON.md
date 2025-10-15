# Plaid API Comparison: /transactions/sync vs /transactions/get

**Understanding the differences and why PocketTeller uses `/transactions/sync`**

---

## Quick Comparison Table

| Feature | `/transactions/sync` ✅ | `/transactions/get` ⚠️ |
|---------|------------------------|----------------------|
| **Plaid Recommendation** | ✅ Recommended | ⚠️ Legacy (Maintenance Mode) |
| **Data Retrieval** | Incremental (cursor-based) | Full range (date-based) |
| **Performance** | ⚡ Fast (only changes) | 🐌 Slow (all data) |
| **Network Usage** | 📉 Minimal | 📈 High |
| **Deletions** | ✅ Explicitly reported | ❌ Not tracked |
| **Modifications** | ✅ Explicitly reported | ❌ Requires comparison |
| **Pagination** | Cursor-based | Offset-based |
| **Historical Data** | Up to 24 months | Up to 24 months |
| **Use Case** | ✅ Real-time sync | ⚠️ One-time bulk fetch |
| **PocketTeller Status** | ✅ **IMPLEMENTED** | ❌ Not used |

---

## `/transactions/sync` - Modern Approach (PocketTeller's Choice)

### Overview

The **Transactions Sync API** provides incremental transaction updates using a cursor-based approach. Only new, modified, or removed transactions are returned.

### How It Works

```typescript
// Initial sync (no cursor) - returns up to 24 months of history
const initialResponse = await plaidClient.syncTransactions(accessToken);

// Save cursor
const cursor = initialResponse.next_cursor;

// Subsequent syncs - only returns changes since last cursor
const updateResponse = await plaidClient.syncTransactions(accessToken, cursor);
```

### Request Format

```json
{
  "client_id": "your_client_id",
  "secret": "your_secret",
  "access_token": "access-token-123",
  "cursor": "CgIIARjIosGDGQ==",  // Optional: omit for initial sync
  "count": 100                    // Number of updates per page
}
```

### Response Format

```json
{
  "added": [
    {
      "transaction_id": "abc123",
      "account_id": "xyz789",
      "amount": 25.50,
      "date": "2025-10-10",
      "name": "Starbucks",
      "category": ["Food and Drink", "Restaurants", "Coffee Shop"],
      "pending": false
    }
  ],
  "modified": [
    {
      "transaction_id": "def456",
      "amount": 30.00,
      "pending": false  // Changed from true to false
    }
  ],
  "removed": [
    {
      "transaction_id": "ghi789"
    }
  ],
  "next_cursor": "CgIIARjJosGDGQ==",
  "has_more": false
}
```

### Key Features

#### 1. **Incremental Updates**
Only transactions that changed since last sync are returned.

**Example:**
- Initial sync: 500 transactions
- Day 2 sync: 3 new transactions
- Day 3 sync: 1 modified, 2 new transactions

Total API calls: 3  
Total data transferred: 500 + 3 + 3 = 506 transactions

#### 2. **Explicit Deletions**
The `removed` array tells you exactly which transactions to delete.

**Example:**
```json
{
  "removed": [
    { "transaction_id": "temp-pending-transaction" }
  ]
}
```

**Action:** Delete from database
```typescript
await supabase
  .from('transactions')
  .delete()
  .eq('plaid_transaction_id', 'temp-pending-transaction');
```

#### 3. **Explicit Modifications**
The `modified` array tells you which transactions changed.

**Example:**
```json
{
  "modified": [
    {
      "transaction_id": "pending-123",
      "amount": 30.00,    // Was 25.00
      "pending": false    // Was true
    }
  ]
}
```

**Action:** Update specific fields
```typescript
await supabase
  .from('transactions')
  .update({
    amount: 30.00,
    pending: false
  })
  .eq('plaid_transaction_id', 'pending-123');
```

#### 4. **Cursor Persistence**
Store cursor to maintain sync state across sessions.

```typescript
// After successful sync
await supabase
  .from('plaid_items')
  .update({ sync_cursor: response.next_cursor })
  .eq('item_id', itemId);
```

#### 5. **Pagination**
Use `has_more` to determine if more data exists.

```typescript
let hasMore = true;
let cursor = storedCursor;

while (hasMore) {
  const response = await plaidClient.syncTransactions(accessToken, cursor);
  
  // Process transactions...
  
  cursor = response.next_cursor;
  hasMore = response.has_more;
}
```

### Pros ✅

- **Performance:** Only fetches changes (99% less data after initial sync)
- **Bandwidth:** Minimal network usage
- **Deletions:** Explicitly reported
- **Updates:** Explicitly reported
- **Scalability:** Handles large transaction histories efficiently
- **Real-time:** Perfect for continuous sync
- **Recommended:** Plaid's recommended approach

### Cons ⚠️

- **Cursor Management:** Must persist cursor correctly
- **Complexity:** Slightly more complex than date-based
- **State Management:** Losing cursor means re-syncing all data

### When to Use

✅ **Use `/transactions/sync` when:**
- Building a budgeting/finance app (like PocketTeller)
- Need real-time or frequent updates
- Want to track transaction modifications
- Want to handle deleted transactions correctly
- Performance and bandwidth matter
- Building for production scale

---

## `/transactions/get` - Legacy Approach

### Overview

The **Transactions Get API** retrieves all transactions within a specific date range. Returns the same data on every call (no change tracking).

### How It Works

```typescript
// Every call fetches all transactions in date range
const response = await plaidClient.getTransactions(
  accessToken,
  '2025-01-01',  // start_date
  '2025-10-13'   // end_date
);
```

### Request Format

```json
{
  "client_id": "your_client_id",
  "secret": "your_secret",
  "access_token": "access-token-123",
  "start_date": "2025-01-01",
  "end_date": "2025-10-13",
  "options": {
    "count": 100,
    "offset": 0
  }
}
```

### Response Format

```json
{
  "transactions": [
    {
      "transaction_id": "abc123",
      "account_id": "xyz789",
      "amount": 25.50,
      "date": "2025-10-10",
      "name": "Starbucks",
      "category": ["Food and Drink", "Restaurants", "Coffee Shop"],
      "pending": false
    }
  ],
  "total_transactions": 523,
  "request_id": "xyz"
}
```

### Key Features

#### 1. **Date-Based Retrieval**
Request all transactions within a date range.

**Example:**
```typescript
// Get last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const response = await plaidClient.getTransactions(
  accessToken,
  thirtyDaysAgo.toISOString().split('T')[0],
  new Date().toISOString().split('T')[0]
);
```

#### 2. **Offset Pagination**
Page through results using offset.

```typescript
let offset = 0;
const allTransactions = [];

while (offset < totalTransactions) {
  const response = await plaidClient.getTransactions(
    accessToken,
    startDate,
    endDate,
    { offset, count: 100 }
  );
  
  allTransactions.push(...response.transactions);
  offset += 100;
}
```

#### 3. **No State Management**
No cursor to track - just specify dates.

### Pros ✅

- **Simplicity:** No cursor management
- **Stateless:** No persistent state required
- **Ad-hoc Queries:** Easy to fetch specific date ranges
- **Familiar:** Traditional REST API pattern

### Cons ⚠️

- **Performance:** Fetches all data every time
- **Bandwidth:** High network usage (especially for long date ranges)
- **No Deletions:** Can't detect removed transactions
- **No Modifications:** Can't detect which transactions changed
- **Scalability:** Gets slower as transaction history grows
- **Inefficient:** Re-fetches unchanged data
- **Legacy:** Plaid recommends migrating away

### When to Use

✅ **Use `/transactions/get` when:**
- One-time data export
- Ad-hoc analysis of specific date range
- Migrating from another system
- Backfilling historical data (then switch to `/transactions/sync`)

❌ **Don't use for:**
- Production apps with regular sync
- Real-time transaction updates
- Apps that need to scale

---

## Why PocketTeller Uses `/transactions/sync`

### 1. **Performance at Scale**

**Scenario:** User with 2 years of transaction history (1,000 transactions)

| Sync Type | Initial Sync | Daily Sync | Weekly Sync |
|-----------|--------------|------------|-------------|
| `/transactions/get` | 1,000 txns | 1,000 txns | 1,000 txns |
| `/transactions/sync` | 1,000 txns | 3 txns | 15 txns |

**Bandwidth Saved:** 99.7% after initial sync

### 2. **Accurate Data Management**

#### Deleted Transactions

**Scenario:** Pending transaction gets deleted

**With `/transactions/get`:**
```typescript
// Day 1: Fetch all transactions
const day1 = await getTransactions('2025-01-01', '2025-10-13');
// Returns: pending-transaction-123

// Day 2: Fetch all transactions again
const day2 = await getTransactions('2025-01-01', '2025-10-13');
// Returns: ... (no pending-transaction-123)

// ❓ How do we know it was deleted vs never existed?
// ❌ We don't - need to compare entire datasets
```

**With `/transactions/sync`:**
```json
{
  "added": [],
  "modified": [],
  "removed": [
    { "transaction_id": "pending-transaction-123" }
  ]
}
```
✅ Explicit deletion notification

#### Modified Transactions

**Scenario:** Pending transaction amount changes

**With `/transactions/get`:**
```typescript
// Need to:
// 1. Fetch all transactions
// 2. Compare with previous fetch
// 3. Detect changes manually
// 4. Update database

// ❌ Inefficient, error-prone
```

**With `/transactions/sync`:**
```json
{
  "modified": [
    {
      "transaction_id": "pending-123",
      "amount": 30.00  // Changed from 25.00
    }
  ]
}
```
✅ Explicit modification notification

### 3. **User Experience**

**Fast Sync Times:**
- Initial sync: 2-3 seconds (once)
- Daily sync: <1 second (only new data)
- User sees updates instantly

**Low Battery/Data Usage:**
- Mobile apps benefit from minimal data transfer
- Less server load = lower costs

### 4. **Category Priority System**

PocketTeller's category priority: `user > plaid > ai > auto`

**With `/transactions/sync`:**
```typescript
// Only update modified transactions
for (const txn of response.modified) {
  const existing = await getExistingTransaction(txn.transaction_id);
  
  if (existing.category_source === 'user') {
    // Never overwrite user's manual category
    continue;
  }
  
  // Update with new Plaid data
  await updateTransaction(txn);
}
```

**With `/transactions/get`:**
```typescript
// All transactions returned - must check each one
for (const txn of response.transactions) {
  // ❓ Is this new, modified, or unchanged?
  // ❌ Can't tell without comparing
}
```

### 5. **Webhook Integration**

**Plaid Webhooks:**
```json
{
  "webhook_type": "TRANSACTIONS",
  "webhook_code": "SYNC_UPDATES_AVAILABLE",
  "item_id": "item-123"
}
```

**Perfect pairing with `/transactions/sync`:**
```typescript
// Webhook tells us updates are ready
// Sync only fetches what changed
const response = await plaidClient.syncTransactions(accessToken, cursor);
```

**With `/transactions/get`:**
- Webhook says "updates available"
- Still need to fetch entire date range
- Can't tell what actually changed

---

## Migration from `/transactions/get` to `/transactions/sync`

If you have an existing app using `/transactions/get`:

### Step 1: Add Cursor Storage

```sql
ALTER TABLE plaid_items
ADD COLUMN sync_cursor TEXT;
```

### Step 2: Fast-Forward Existing Items

For each connected bank:
```typescript
// Use special "now" cursor to skip historical data
const response = await plaidClient.syncTransactions(accessToken, "now");

// Save cursor
await saveCursor(response.next_cursor);
```

### Step 3: Update Sync Logic

**Before:**
```typescript
const response = await plaidClient.getTransactions(
  accessToken,
  '2024-01-01',
  new Date().toISOString().split('T')[0]
);

// Process all transactions
for (const txn of response.transactions) {
  await upsertTransaction(txn);
}
```

**After:**
```typescript
const cursor = await getCursor(itemId);
const response = await plaidClient.syncTransactions(accessToken, cursor);

// Process only changes
for (const txn of response.added) {
  await insertTransaction(txn);
}

for (const txn of response.modified) {
  await updateTransaction(txn);
}

for (const txn of response.removed) {
  await deleteTransaction(txn.transaction_id);
}

// Save new cursor
await saveCursor(response.next_cursor);
```

---

## Conclusion

**PocketTeller uses `/transactions/sync` because:**

1. ✅ **Performance:** 99%+ reduction in data transfer after initial sync
2. ✅ **Accuracy:** Explicit tracking of deletions and modifications
3. ✅ **Scalability:** Efficient at any transaction volume
4. ✅ **User Experience:** Fast, responsive sync
5. ✅ **Best Practice:** Plaid's recommended approach
6. ✅ **Future-Proof:** Active development and support

**When to use `/transactions/get`:**
- ❓ You need a one-time bulk export
- ❓ You're backfilling historical data before switching to sync
- ❓ You have a very specific ad-hoc use case

**For production apps:** Always use `/transactions/sync` ✅

---

## Resources

- [Plaid Transactions Sync Documentation](https://plaid.com/docs/api/products/transactions/#transactionssync)
- [Plaid Migration Guide](https://plaid.com/docs/api/products/transactions/#migrating-to-transactionssync)
- [PocketTeller Integration Guide](./PLAID_INTEGRATION_GUIDE.md)
- [PocketTeller Quick Reference](./PLAID_QUICK_REFERENCE.md)

---

**Last Updated:** October 13, 2025

