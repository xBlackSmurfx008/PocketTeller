# Plaid Integration Guide for PocketTeller

**Last Updated:** October 13, 2025  
**Plaid API Version:** 2020-09-14  
**Integration Status:** ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Plaid Products Used](#plaid-products-used)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Transaction Sync Workflow](#transaction-sync-workflow)
7. [Category Mapping](#category-mapping)
8. [Webhook Integration](#webhook-integration)
9. [Security & Encryption](#security--encryption)
10. [Rate Limiting](#rate-limiting)
11. [Error Handling](#error-handling)
12. [Testing](#testing)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)
15. [Migration Guide](#migration-guide)

---

## Overview

PocketTeller uses **Plaid** to connect users' bank accounts and automatically sync transactions. Our integration uses modern best practices including:

- ✅ **Transactions Sync API** (`/transactions/sync`) - Cursor-based incremental updates
- ✅ **Webhook-driven updates** - Real-time transaction notifications
- ✅ **Encrypted token storage** - AES-256 encryption for access tokens
- ✅ **Smart category mapping** - Plaid categories → PocketTeller categories
- ✅ **Multi-account support** - Up to 3 bank connections per user
- ✅ **Rate limiting** - Prevent abuse and API quota exhaustion
- ✅ **Audit logging** - Track all token access for security

---

## Architecture

### High-Level Flow

```
User → PlaidLink (Frontend) → Supabase Edge Functions → Plaid API → Database
                                                            ↓
                                                      Webhooks ← Plaid
```

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **PlaidLink.tsx** | Frontend component for bank connection | `src/components/PlaidLink.tsx` |
| **plaid-link-token** | Generate link tokens for Plaid Link | `supabase/functions/plaid-link-token/` |
| **plaid-link-exchange** | Exchange public token for access token | `supabase/functions/plaid-link-exchange/` |
| **plaid-sync** | Sync accounts and transactions | `supabase/functions/plaid-sync/` |
| **plaid-webhook** | Handle Plaid webhook events | `supabase/functions/plaid-webhook/` |
| **plaid-disconnect** | Remove bank connections | `supabase/functions/plaid-disconnect/` |
| **plaid-utils.ts** | Shared utilities | `supabase/functions/_shared/plaid-utils.ts` |

---

## Plaid Products Used

### 1. **Transactions** (Primary Product)
- **What it does:** Retrieves up to 24 months of transaction history
- **Update frequency:** 1-4 times per day (institution-dependent)
- **Endpoints used:**
  - `/transactions/sync` - Incremental cursor-based sync (recommended)
  - `/transactions/get` - Legacy date-based sync (deprecated in our code)
  - `/transactions/refresh` - Force immediate update

### 2. **Auth**
- **What it does:** Provides account and routing numbers
- **Use case:** Future feature for ACH transfers

### 3. **Balance**
- **What it does:** Real-time account balance information
- **Use case:** Displayed on dashboard

---

## Database Schema

### Tables

#### `profiles`
Stores encrypted Plaid access tokens per user.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id),
  encrypted_plaid_token TEXT,           -- AES-256 encrypted access token
  token_iv TEXT,                         -- Initialization vector for decryption
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `plaid_items`
Tracks Plaid Items (institution connections) per user.

```sql
CREATE TABLE plaid_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  item_id TEXT UNIQUE NOT NULL,          -- Plaid's item_id
  institution_id TEXT,                    -- Plaid institution identifier
  institution_name TEXT,                  -- Display name (e.g., "Chase")
  available_products TEXT[],              -- Products available for this Item
  billed_products TEXT[],                 -- Products we're billed for
  products TEXT[],                        -- Products currently active
  sync_cursor TEXT,                       -- Cursor for /transactions/sync
  last_synced_at TIMESTAMPTZ,            -- Last successful sync timestamp
  update_type TEXT,                       -- 'sync', 'transactions', 'error', etc.
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Fields:**
- `sync_cursor`: Critical for incremental sync. Updated after each successful `/transactions/sync` call.
- `last_synced_at`: Used to determine when to trigger next sync.

#### `accounts`
Stores bank account details from Plaid.

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plaid_account_id TEXT,                 -- Plaid's account_id
  plaid_item_id_ref TEXT,                -- References plaid_items.item_id
  account_id TEXT,                        -- Internal account ID
  name TEXT,                              -- Account name ("Chase Checking")
  official_name TEXT,                     -- Official name from institution
  type TEXT,                              -- 'depository', 'credit', 'loan', etc.
  subtype TEXT,                           -- 'checking', 'savings', 'credit card'
  mask TEXT,                              -- Last 4 digits (e.g., "1234")
  balance NUMERIC(12,2),                  -- Backward compatible balance
  available_balance NUMERIC,              -- Available balance
  current_balance NUMERIC,                -- Current balance
  credit_limit NUMERIC,                   -- Credit limit (for credit cards)
  currency_code TEXT DEFAULT 'USD',       -- ISO currency code
  institution_id TEXT,                    -- Institution identifier
  institution_name TEXT,                  -- Institution display name
  source TEXT DEFAULT 'plaid',            -- 'plaid' or 'manual'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  
  CONSTRAINT unique_user_plaid_account UNIQUE(user_id, plaid_account_id)
);

CREATE UNIQUE INDEX idx_accounts_user_plaid_acct ON accounts(user_id, plaid_account_id);
CREATE INDEX idx_accounts_plaid_account_id ON accounts(plaid_account_id);
CREATE INDEX idx_accounts_plaid_item_id ON accounts(plaid_item_id_ref);
```

**Key Fields:**
- `plaid_account_id`: Plaid's unique identifier for the account
- `plaid_item_id_ref`: Links account to a Plaid Item
- `available_balance` vs `current_balance`: Available is what can be spent; current includes pending transactions

#### `transactions`
Stores transaction data from Plaid.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plaid_transaction_id TEXT,             -- Plaid's transaction_id
  plaid_account_id TEXT,                 -- Links to accounts.plaid_account_id
  transaction_id TEXT,                   -- Internal transaction ID
  amount NUMERIC(12,2),                  -- Transaction amount (absolute value)
  date DATE,                             -- Transaction date
  datetime TIMESTAMPTZ,                  -- Transaction datetime (if available)
  authorized_date DATE,                  -- When transaction was authorized
  authorized_datetime TIMESTAMPTZ,       -- Authorization datetime
  description TEXT,                      -- Transaction description
  merchant_name TEXT,                    -- Merchant name from Plaid
  category TEXT DEFAULT 'Other',         -- Our mapped category
  category_source TEXT,                  -- 'user' | 'plaid' | 'ai' | 'auto'
  subcategory TEXT,                      -- Plaid subcategory (second element)
  plaid_category TEXT,                   -- Original Plaid category (first element)
  pending BOOLEAN DEFAULT FALSE,         -- Is transaction pending?
  iso_currency_code TEXT DEFAULT 'USD',  -- ISO currency code
  unofficial_currency_code TEXT,         -- For non-ISO currencies
  location JSONB,                        -- Location data from Plaid
  payment_meta JSONB,                    -- Payment metadata
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  
  CONSTRAINT idx_transactions_user_plaid_txn UNIQUE(user_id, plaid_transaction_id)
);

CREATE UNIQUE INDEX idx_transactions_user_plaid_txn ON transactions(user_id, plaid_transaction_id);
CREATE INDEX idx_transactions_plaid_transaction_id ON transactions(plaid_transaction_id);
CREATE INDEX idx_transactions_plaid_account_id ON transactions(plaid_account_id);
CREATE INDEX idx_transactions_pending ON transactions(pending);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_plaid_category ON transactions(plaid_category) WHERE plaid_category IS NOT NULL;
```

**Key Fields:**
- `category_source`: Critical for category priority system (see [Category Mapping](#category-mapping))
- `plaid_category`: Stores original Plaid category for reference/debugging
- `pending`: Pending transactions may change or disappear

#### `plaid_token_audit_log`
Security audit trail for token access.

```sql
CREATE TABLE plaid_token_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  access_type TEXT,                      -- 'decrypt', 'sync', 'link_exchange', etc.
  function_name TEXT,                    -- Which edge function accessed token
  ip_address TEXT,                       -- Client IP address
  user_agent TEXT,                       -- Client user agent
  success BOOLEAN,                       -- Did operation succeed?
  error_message TEXT,                    -- Error details if failed
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## API Endpoints

### Frontend-Called Endpoints

#### 1. **Create Link Token**
**Endpoint:** `plaid-link-token`  
**Method:** POST  
**Purpose:** Generate a `link_token` for Plaid Link initialization

**Request:**
```json
{
  // No body needed - uses auth token from header
}
```

**Response:**
```json
{
  "link_token": "link-sandbox-12345678-abcd-1234-abcd-123456789abc"
}
```

**Plaid API Called:** `/link/token/create`

**Implementation:**
```typescript
const data = await this.request('/link/token/create', {
  user: { client_user_id: userId },
  client_name: 'Pocket Banker',
  products: ['transactions'],
  country_codes: ['US'],
  language: 'en',
});
```

---

#### 2. **Exchange Public Token**
**Endpoint:** `plaid-link-exchange`  
**Method:** POST  
**Purpose:** Exchange public_token from Plaid Link for access_token

**Request:**
```json
{
  "public_token": "public-sandbox-12345678-abcd-1234-abcd-123456789abc",
  "institution_name": "Chase",
  "institution_id": "ins_3"
}
```

**Response:**
```json
{
  "success": true,
  "item_id": "eVBnVMp7zdTJLkRNr33Rs6zr7KNJqBFL9DrE6",
  "accounts": 2,
  "institutionName": "Chase"
}
```

**Plaid API Called:**
- `/item/public_token/exchange` - Get access token
- `/accounts/get` - Fetch account details
- `/transactions/sync` - Initial transaction sync

**What it does:**
1. Exchange public token for access token
2. Encrypt access token with AES-256
3. Store encrypted token in `profiles` table
4. Fetch and store account details
5. Perform initial transaction sync
6. Create `plaid_items` record

---

#### 3. **Sync Transactions**
**Endpoint:** `plaid-sync`  
**Method:** POST  
**Purpose:** Fetch new/updated transactions incrementally

**Request:**
```json
{
  // No body needed - uses auth token
}
```

**Response:**
```json
{
  "success": true,
  "accounts": 2,
  "transactions": 47,
  "cursor_updated": true
}
```

**Plaid API Called:**
- `/accounts/get` - Update account balances
- `/transactions/sync` - Fetch transaction updates (cursor-based)

**What it does:**
1. Decrypt user's access token
2. Fetch and update account balances
3. Use stored `sync_cursor` to fetch only new/modified transactions
4. Apply category mapping (respecting category_source priority)
5. Handle removed transactions
6. Update `sync_cursor` for next sync
7. **Auto-trigger AI categorization** for newly synced transactions

---

#### 4. **Disconnect Bank**
**Endpoint:** `plaid-disconnect`  
**Method:** POST  
**Purpose:** Remove bank connection and delete associated data

**Request:**
```json
{
  "item_id": "eVBnVMp7zdTJLkRNr33Rs6zr7KNJqBFL9DrE6"
}
```

**Response:**
```json
{
  "success": true
}
```

**Plaid API Called:** `/item/remove`

**What it does:**
1. Remove Item from Plaid
2. Delete transactions associated with Item
3. Delete accounts associated with Item
4. Delete `plaid_items` record
5. Clear encrypted token if no other Items exist

---

#### 5. **List Connected Banks**
**Endpoint:** `plaid-list-accounts`  
**Method:** GET  
**Purpose:** Get all connected bank accounts with balances

**Response:**
```json
{
  "connectedBanks": [
    {
      "itemId": "eVBnVMp7zdTJLkRNr33Rs6zr7KNJqBFL9DrE6",
      "institutionName": "Chase",
      "institutionId": "ins_3",
      "connectedAt": "2025-10-01T12:00:00Z",
      "accounts": [
        {
          "id": "uuid",
          "plaidAccountId": "BxBXxLj1hXuq1LVQVD2r",
          "name": "Chase Checking",
          "officialName": "Chase MyChecking",
          "type": "depository",
          "subtype": "checking",
          "mask": "0000",
          "balanceAvailable": 1000.00,
          "balanceCurrent": 1050.00,
          "currencyCode": "USD"
        }
      ],
      "totalBalance": 1000.00
    }
  ],
  "totalConnected": 1,
  "maxConnections": 3
}
```

---

#### 6. **Check Connection Limit**
**Endpoint:** `plaid-check-limit`  
**Method:** GET  
**Purpose:** Check if user can connect more banks (max 3)

**Response:**
```json
{
  "connectedCount": 2,
  "maxConnections": 3,
  "canConnect": true,
  "connectedBanks": [
    {
      "institutionName": "Chase",
      "institutionId": "ins_3",
      "connectedAt": "2025-10-01T12:00:00Z"
    }
  ]
}
```

---

### Webhook Endpoint

#### **Plaid Webhook Handler**
**Endpoint:** `plaid-webhook`  
**Method:** POST  
**Purpose:** Receive real-time updates from Plaid

**Webhook Events Handled:**

| Event | Code | Action |
|-------|------|--------|
| **TRANSACTIONS** | `SYNC_UPDATES_AVAILABLE` | Mark item for sync |
| | `HISTORICAL_UPDATE` | Log event (initial 24-month history available) |
| | `DEFAULT_UPDATE` | Log event (new transactions available) |
| | `TRANSACTIONS_REMOVED` | Delete removed transactions from DB |
| **ITEM** | `ERROR` | Mark item with error status |
| | `PENDING_EXPIRATION` | Log warning |
| | `USER_PERMISSION_REVOKED` | Mark item as disconnected |
| **AUTH** | (Various) | Log informational events |

**Example Webhook Payload:**
```json
{
  "webhook_type": "TRANSACTIONS",
  "webhook_code": "SYNC_UPDATES_AVAILABLE",
  "item_id": "eVBnVMp7zdTJLkRNr33Rs6zr7KNJqBFL9DrE6",
  "new_transactions": 5,
  "environment": "production"
}
```

**Security:**
- Verifies webhook signature using `PLAID_WEBHOOK_VERIFICATION_KEY`
- Uses HMAC SHA-256 signature verification
- Rejects unsigned webhooks in production

---

## Transaction Sync Workflow

### Modern Approach: `/transactions/sync` (Cursor-Based)

PocketTeller uses the **recommended** `/transactions/sync` endpoint for incremental updates.

#### Why `/transactions/sync` Over `/transactions/get`?

| Feature | `/transactions/sync` ✅ | `/transactions/get` ❌ |
|---------|----------------------|----------------------|
| **Performance** | Only fetches changes | Fetches all transactions in date range |
| **Efficiency** | Cursor-based pagination | Date-based pagination |
| **Deletions** | Explicitly returns removed transactions | Doesn't track deletions |
| **Updates** | Tracks modified transactions | Requires full re-fetch |
| **Plaid Recommendation** | ✅ Recommended | ⚠️ Legacy |

#### Sync Process

```
1. User clicks "Sync Transactions"
   ↓
2. Frontend calls plaid-sync endpoint
   ↓
3. Backend retrieves encrypted access_token
   ↓
4. Backend decrypts access_token (with audit log)
   ↓
5. Call /accounts/get → Update account balances
   ↓
6. Retrieve last sync_cursor from plaid_items
   ↓
7. Call /transactions/sync with cursor
   ↓
8. Process response:
   - added[] → Insert new transactions
   - modified[] → Update existing (respecting category_source)
   - removed[] → Delete from database
   ↓
9. Update sync_cursor in plaid_items
   ↓
10. If has_more = true → Repeat step 7 with next_cursor
    ↓
11. Return success response
```

#### Code Example

```typescript
// Initial sync (no cursor)
const initialSync = await fetch(`${plaidBaseUrl}/transactions/sync`, {
  method: 'POST',
  body: JSON.stringify({
    client_id: plaidClientId,
    secret: plaidSecret,
    access_token: decryptedToken,
    count: 100
  })
});

// Subsequent syncs (with cursor)
const nextSync = await fetch(`${plaidBaseUrl}/transactions/sync`, {
  method: 'POST',
  body: JSON.stringify({
    client_id: plaidClientId,
    secret: plaidSecret,
    access_token: decryptedToken,
    cursor: storedCursor,  // From plaid_items.sync_cursor
    count: 100
  })
});
```

#### Response Structure

```json
{
  "added": [
    {
      "transaction_id": "yBVBEwrPyJs8GvR77N7QTxnGg6wG74H7dEDN6",
      "account_id": "BxBXxLj1hXuq1LVQVD2r",
      "amount": 25.50,
      "date": "2025-10-10",
      "name": "Starbucks",
      "merchant_name": "Starbucks",
      "category": ["Food and Drink", "Restaurants", "Coffee Shop"],
      "pending": false,
      "iso_currency_code": "USD"
    }
  ],
  "modified": [
    {
      "transaction_id": "kgygNvAVPzSX9KkddNdWHaVGRVex1MHm3k9no",
      "amount": 30.00,  // Updated amount
      "pending": false   // No longer pending
    }
  ],
  "removed": [
    {
      "transaction_id": "abc123..."
    }
  ],
  "next_cursor": "CgIIARjIosGDGQ==",
  "has_more": false
}
```

#### Important Notes

1. **Cursor Persistence:** Always save `next_cursor` to `plaid_items.sync_cursor` after successful sync
2. **Pagination:** If `has_more = true`, keep calling with `next_cursor` until `has_more = false`
3. **Initial Sync:** First call without cursor returns up to 24 months of history
4. **Fast-Forward:** Can use cursor value `"now"` to skip historical data (migration only)
5. **Removed Transactions:** Must explicitly handle `removed[]` array to delete from DB

---

## Category Mapping

### Category Priority System

PocketTeller implements a **category source hierarchy** to determine which categorization to trust:

```
user > plaid > ai > auto
```

**Priority Levels:**

| Source | Priority | Can Override? | Description |
|--------|----------|---------------|-------------|
| **user** | 1 (Highest) | Never | User manually categorized - sacred |
| **plaid** | 2 | Overrides: ai, auto | Plaid provided category |
| **ai** | 3 | Overrides: auto | AI categorized |
| **auto** | 4 (Lowest) | Always overwritten | Default/fallback category |

### Mapping Logic

Plaid categories are hierarchical arrays. Example:
```json
["Food and Drink", "Restaurants", "Coffee Shop"]
```

PocketTeller maps these to our app categories:

```typescript
const categoryMap = {
  'food and drink': 'Food & Dining',
  'restaurants': 'Food & Dining',
  'fast food': 'Food & Dining',
  'coffee shops': 'Food & Dining',
  'groceries': 'Food & Dining',
  
  'transportation': 'Transportation',
  'gas stations': 'Transportation',
  'parking': 'Transportation',
  
  'shops': 'Shopping',
  'general merchandise': 'Shopping',
  'clothing and accessories': 'Shopping',
  
  'recreation': 'Entertainment',
  'entertainment': 'Entertainment',
  
  'service': 'Bills & Utilities',
  'utilities': 'Bills & Utilities',
  'telecommunication services': 'Bills & Utilities',
  
  'healthcare': 'Healthcare',
  'medical': 'Healthcare',
  
  'travel': 'Travel',
  'airlines and aviation services': 'Travel',
  'lodging': 'Travel',
  
  'payment': 'Income',
  'payroll': 'Income',
  'deposit': 'Income',
  
  'bank fees': 'Bills & Utilities',
};
```

**Default:** If no match found → `'Other'`

### Category Update Rules

When processing **modified** transactions:

```typescript
// NEVER overwrite user-categorized transactions
if (existingTransaction.category_source === 'user') {
  // Don't touch category at all
}

// Plaid has good data - update even if AI categorized
else if (plaidHasGoodCategory && (category_source === 'ai' || category_source === 'auto')) {
  updateData.category = mappedPlaidCategory;
  updateData.category_source = 'plaid';
}

// Keep AI categorization if Plaid has no good data
else if (category_source === 'ai' && !plaidHasGoodCategory) {
  // Don't touch category
}

// Update auto-categorized or uncategorized
else if (category_source === 'auto' || !category_source) {
  updateData.category = mappedPlaidCategory;
  updateData.category_source = plaidHasGoodCategory ? 'plaid' : 'auto';
}
```

**Key Insight:** This prevents overwriting user's manual categorizations while allowing Plaid to improve AI/auto categorizations.

---

## Auto-Categorization After Sync

After successfully syncing transactions from Plaid, PocketTeller **automatically triggers AI categorization** to provide immediate, intelligent category suggestions.

### Automatic Categorization Flow

```
1. Plaid Sync Completes
   ↓
2. Transactions stored with category_source:
   - 'plaid' if Plaid provided category
   - 'auto' if Plaid category was 'Other' or null
   ↓
3. AI Categorization Auto-Triggered
   ↓
4. AI analyzes transactions where:
   - category = 'Other' OR null
   - category_source = 'auto' OR null
   ↓
5. AI updates high-confidence categories (≥70%)
   - Sets category_source = 'ai'
   - Stores confidence score
   - Records reasoning
   ↓
6. User sees categorized transactions immediately
```

### Category Source Priority

The system maintains a strict hierarchy to preserve data integrity:

```
user > plaid > ai > auto
```

**What this means:**

1. **User Categories (Priority 1)** - Never overwritten
   - User manually categorizes a transaction
   - `category_source = 'user'`
   - ✅ Locked forever (unless user changes it)

2. **Plaid Categories (Priority 2)** - Authoritative
   - Bank provided category data
   - `category_source = 'plaid'`
   - ✅ Can be overwritten by user
   - ✅ Updated when Plaid modifies it

3. **AI Categories (Priority 3)** - High confidence
   - AI suggested with ≥70% confidence
   - `category_source = 'ai'`
   - ✅ Can be overwritten by user or Plaid
   - ❌ Won't overwrite user or Plaid categories

4. **Auto Categories (Priority 4)** - Fallback
   - Keyword-based categorization
   - `category_source = 'auto'`
   - ✅ Can be overwritten by anyone

### Implementation

**In plaid-sync function:**
```typescript
// After successful transaction sync
if (syncedTransactions > 0) {
  // Auto-trigger AI categorization
  const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-categorize-transactions`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      limit: 100,
      threshold: 0.70  // Only apply ≥70% confidence
    })
  });
}
```

### User Experience

**Before Auto-Categorization:**
- ❌ User connects bank → 100 transactions synced
- ❌ 60 uncategorized ('Other')
- ❌ Must manually click "AI Categorize" button
- ❌ Extra step required

**After Auto-Categorization:**
- ✅ User connects bank → 100 transactions synced
- ✅ 55 auto-categorized by AI (≥70% confidence)
- ✅ 30 categorized by Plaid
- ✅ 10 categorized by keywords
- ✅ 5 need manual review (low confidence)
- ✅ **Instant categorization** - no manual step

### Visual Indicators

Each transaction displays its category source:

- **🏦 Plaid** - Bank provided this category
- **🤖 AI 85%** - AI suggested (with confidence %)
- **👤 User** - You manually categorized
- **🔧 Auto** - Keyword-based categorization

### Monitoring Auto-Categorization

**Check categorization breakdown:**
```sql
SELECT 
  category_source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM transactions
WHERE user_id = 'user-uuid'
GROUP BY category_source
ORDER BY count DESC;
```

**Expected distribution:**
- Plaid: 30-40% (varies by institution)
- AI: 40-50%
- User: 5-15%
- Auto: 5-10%

**Check AI performance:**
```sql
SELECT 
  AVG(category_confidence) as avg_confidence,
  MIN(category_confidence) as min_confidence,
  MAX(category_confidence) as max_confidence,
  COUNT(*) as ai_count
FROM transactions
WHERE user_id = 'user-uuid'
  AND category_source = 'ai';
```

**Expected AI performance:**
- Average confidence: 75-85%
- Minimum confidence: 70% (threshold)
- Maximum confidence: 95-100%

---

## Webhook Integration

### Webhook URL Configuration

**Production:** `https://your-project.supabase.co/functions/v1/plaid-webhook`

Configure in Plaid Dashboard:
1. Go to https://dashboard.plaid.com/
2. Navigate to **API** → **Webhooks**
3. Add webhook URL
4. Select events: `TRANSACTIONS`, `ITEM`, `AUTH`

### Signature Verification

All webhooks in production are verified using HMAC SHA-256:

```typescript
const verifyWebhookSignature = async (body: string, signature: string): Promise<boolean> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plaidWebhookVerificationKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const providedSignature = signature.replace(/^sha256=/, '');
  
  return expectedSignature === providedSignature;
};
```

**Required Secret:** `PLAID_WEBHOOK_VERIFICATION_KEY`

### Webhook Event Handlers

#### SYNC_UPDATES_AVAILABLE
**Trigger:** New transactions are available  
**Action:** Mark `plaid_items.update_type = 'transactions'`  
**Client Action:** App should call `plaid-sync` on next user action

#### TRANSACTIONS_REMOVED
**Trigger:** Transactions were deleted by institution  
**Action:** Delete transactions from `transactions` table  
**Example:**
```typescript
await supabase
  .from('transactions')
  .delete()
  .eq('user_id', userId)
  .in('plaid_transaction_id', removedTransactionIds);
```

#### ITEM ERROR
**Trigger:** Item encountered error (expired login, etc.)  
**Action:** Mark item with error status  
**Client Action:** Show re-authentication prompt to user

---

## Security & Encryption

### Token Encryption

All Plaid access tokens are encrypted at rest using **AES-256** via PostgreSQL's `pgcrypto` extension.

#### Encryption Function

```sql
CREATE FUNCTION encrypt_plaid_token(token text, encryption_key text)
RETURNS jsonb AS $$
DECLARE
  iv bytea;
  encrypted_token bytea;
BEGIN
  iv := extensions.gen_random_bytes(16);
  
  encrypted_token := extensions.pgp_sym_encrypt_bytea(
    convert_to(token, 'UTF8'),
    encryption_key,
    'cipher-algo=aes256'
  );
  
  RETURN jsonb_build_object(
    'encrypted_token', encode(encrypted_token, 'base64'),
    'iv', encode(iv, 'base64'),
    'key_hint', substring(encode(extensions.digest(encryption_key, 'sha256'), 'hex'), 1, 8)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Decryption Function (with Audit)

```sql
CREATE FUNCTION decrypt_plaid_token_with_audit(
  encrypted_data jsonb,
  encryption_key text,
  function_name text,
  ip_address text,
  user_agent text,
  target_user_id uuid
)
RETURNS text AS $$
DECLARE
  decrypted_token text;
BEGIN
  -- Decrypt token
  decrypted_token := convert_from(
    extensions.pgp_sym_decrypt_bytea(
      decode(encrypted_data->>'encrypted_token', 'base64'),
      encryption_key,
      'cipher-algo=aes256'
    ),
    'UTF8'
  );
  
  -- Log access
  INSERT INTO plaid_token_audit_log (
    user_id, access_type, function_name, 
    ip_address, user_agent, success
  ) VALUES (
    target_user_id, 'decrypt', function_name,
    ip_address, user_agent, true
  );
  
  RETURN decrypted_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Required Secrets

```bash
# Set in Supabase Dashboard → Project Settings → Edge Functions → Secrets
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret_key
PLAID_ENV=production  # or 'sandbox', 'development'
PLAID_ENCRYPTION_KEY=your_32_byte_hex_key
PLAID_WEBHOOK_VERIFICATION_KEY=your_webhook_verification_key
```

**Generate encryption key:**
```bash
openssl rand -hex 32
```

### Audit Logging

Every token access is logged in `plaid_token_audit_log`:

```sql
SELECT 
  user_id,
  function_name,
  access_type,
  ip_address,
  user_agent,
  success,
  created_at
FROM plaid_token_audit_log
WHERE user_id = 'uuid'
ORDER BY created_at DESC;
```

**Monitor for:**
- Unusual access patterns (many requests from different IPs)
- Failed decryption attempts
- Access from unexpected edge functions

---

## Rate Limiting

### Rate Limit Configuration

```typescript
export const RATE_LIMITS = {
  link_token: {
    maxRequests: 50,
    windowMinutes: 60,
    errorMessage: 'Too many link token requests. Please try again in a few minutes.',
  },
  token_access: {
    maxRequests: 100,
    windowMinutes: 60,
    errorMessage: 'Too many token access attempts. Please try again later.',
  },
};
```

### Database Function

```sql
CREATE FUNCTION check_token_access_rate(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  access_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO access_count
  FROM plaid_token_audit_log
  WHERE user_id = target_user_id
    AND created_at > NOW() - INTERVAL '60 minutes';
  
  RETURN access_count < 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Usage in Edge Functions

```typescript
const { data: rateLimitCheck } = await supabase
  .rpc('check_token_access_rate', { target_user_id: user.id });

if (!rateLimitCheck) {
  throw new Error('Too many token access attempts. Please try again later.');
}
```

---

## Error Handling

### Common Plaid Errors

| Error Code | Cause | Solution |
|------------|-------|----------|
| `INVALID_ACCESS_TOKEN` | Token is invalid or revoked | Re-authenticate user (call Plaid Link update mode) |
| `ITEM_LOGIN_REQUIRED` | User needs to re-login at institution | Prompt user to update login via Plaid Link |
| `PRODUCTS_NOT_READY` | Transactions not yet available | Wait a few minutes, then retry |
| `RATE_LIMIT_EXCEEDED` | Too many API requests | Implement backoff, reduce sync frequency |
| `INSTITUTION_DOWN` | Bank's API is down | Retry later, show user message |
| `INVALID_CREDENTIALS` | Incorrect bank login | Prompt user to update credentials |

### Error Response Example

```json
{
  "error_type": "ITEM_ERROR",
  "error_code": "ITEM_LOGIN_REQUIRED",
  "error_message": "the login details of this item have changed",
  "display_message": "Your bank login has changed. Please reconnect your account.",
  "request_id": "x7KzJ"
}
```

### Handling in PocketTeller

```typescript
try {
  const response = await plaidClient.syncTransactions(accessToken, cursor);
} catch (error) {
  if (error.error_code === 'ITEM_LOGIN_REQUIRED') {
    // Mark item as needing update
    await supabase
      .from('plaid_items')
      .update({ update_type: 'error', error_code: 'ITEM_LOGIN_REQUIRED' })
      .eq('item_id', itemId);
    
    // Show user update prompt
    return { error: 'Please update your bank login', action: 'update_login' };
  }
  
  // Generic error
  throw error;
}
```

---

## Testing

### Sandbox Mode

Plaid provides a **Sandbox environment** for testing without real bank connections.

**Environment:** Set `PLAID_ENV=sandbox`  
**API URL:** `https://sandbox.plaid.com`

### Test Credentials

Use these credentials in Plaid Link (Sandbox):

| Institution | Username | Password | Result |
|-------------|----------|----------|--------|
| Any | `user_good` | `pass_good` | Successful connection |
| Any | `user_bad` | `pass_bad` | Invalid credentials error |
| Chase | `user_good` | `pass_good` | Sample Chase data |

### Test Data

Sandbox returns pre-populated test data:
- **Accounts:** 2-3 sample accounts per institution
- **Transactions:** Up to 2 years of synthetic transaction data
- **Balances:** Realistic balance amounts

### Testing Webhooks

Use **ngrok** or **Supabase local development** to test webhooks:

```bash
# Start local Supabase
supabase start

# Set webhook URL to local endpoint
# In Plaid Dashboard: http://localhost:54321/functions/v1/plaid-webhook

# Trigger webhook manually in Plaid Dashboard
# API → Sandbox → Fire a webhook
```

### Test Scenarios

1. **✅ Connect Bank Account**
   - Call `plaid-link-token`
   - Initialize Plaid Link
   - Select institution, enter credentials
   - Complete connection
   - Verify accounts in `accounts` table

2. **✅ Sync Transactions**
   - Call `plaid-sync`
   - Verify transactions in `transactions` table
   - Check `sync_cursor` updated in `plaid_items`

3. **✅ Handle Modified Transaction**
   - Sync initially
   - Trigger update in Sandbox (Plaid Dashboard)
   - Sync again
   - Verify transaction updated

4. **✅ Handle Removed Transaction**
   - Sync initially
   - Remove transaction in Sandbox
   - Sync again
   - Verify transaction deleted from DB

5. **✅ Disconnect Bank**
   - Call `plaid-disconnect`
   - Verify item removed from Plaid
   - Verify data deleted from database

---

## Best Practices

### 1. Always Use Cursor-Based Sync

✅ **DO:**
```typescript
const response = await plaidClient.syncTransactions(accessToken, storedCursor);
```

❌ **DON'T:**
```typescript
// Avoid using /transactions/get
const response = await plaidClient.getTransactions(accessToken, startDate, endDate);
```

### 2. Persist Cursors Immediately

✅ **DO:**
```typescript
const { next_cursor } = await plaidClient.syncTransactions(accessToken, cursor);

await supabase
  .from('plaid_items')
  .update({ sync_cursor: next_cursor })
  .eq('item_id', itemId);
```

❌ **DON'T:**
```typescript
// Don't skip cursor updates - you'll re-fetch all data next time
const { next_cursor } = await plaidClient.syncTransactions(accessToken, cursor);
// Forgot to save cursor!
```

### 3. Respect Category Source Hierarchy

✅ **DO:**
```typescript
if (existingTransaction.category_source === 'user') {
  // Never overwrite user categories
  return;
}
```

❌ **DON'T:**
```typescript
// Don't blindly overwrite categories
await supabase
  .from('transactions')
  .update({ category: newCategory }) // Bad!
  .eq('id', transactionId);
```

### 4. Handle Pagination

✅ **DO:**
```typescript
let hasMore = true;
let cursor = storedCursor;

while (hasMore) {
  const response = await plaidClient.syncTransactions(accessToken, cursor);
  
  // Process transactions...
  
  cursor = response.next_cursor;
  hasMore = response.has_more;
  
  // Save cursor after each page
  await saveCursor(cursor);
}
```

❌ **DON'T:**
```typescript
// Don't ignore has_more flag
const response = await plaidClient.syncTransactions(accessToken, cursor);
// Missing transactions if has_more = true!
```

### 5. Implement Webhook Verification

✅ **DO:**
```typescript
if (environment !== 'sandbox') {
  const isValid = await verifyWebhookSignature(body, signature);
  if (!isValid) {
    return new Response('Unauthorized', { status: 401 });
  }
}
```

❌ **DON'T:**
```typescript
// Don't skip signature verification in production
const payload = await req.json(); // Dangerous!
```

### 6. Encrypt Tokens at Rest

✅ **DO:**
```typescript
const encrypted = await supabase.rpc('encrypt_plaid_token', {
  token: accessToken,
  encryption_key: encryptionKey
});

await supabase
  .from('profiles')
  .update({ 
    encrypted_plaid_token: encrypted.encrypted_token,
    token_iv: encrypted.iv 
  });
```

❌ **DON'T:**
```typescript
// NEVER store tokens in plain text
await supabase
  .from('profiles')
  .update({ plaid_access_token: accessToken }); // DANGER!
```

### 7. Use Audit Logging

✅ **DO:**
```typescript
await supabase.rpc('decrypt_plaid_token_with_audit', {
  encrypted_data: encryptedToken,
  encryption_key: key,
  function_name: 'plaid-sync',
  ip_address: clientIP,
  user_agent: userAgent
});
```

### 8. Implement Rate Limiting

✅ **DO:**
```typescript
const { data: rateLimitCheck } = await supabase
  .rpc('check_token_access_rate', { target_user_id: user.id });

if (!rateLimitCheck) {
  throw new Error('Rate limit exceeded');
}
```

### 9. Handle Removed Transactions

✅ **DO:**
```typescript
if (response.removed && response.removed.length > 0) {
  await supabase
    .from('transactions')
    .delete()
    .in('plaid_transaction_id', response.removed.map(t => t.transaction_id));
}
```

### 10. Monitor Sync Frequency

✅ **DO:**
- Listen to `SYNC_UPDATES_AVAILABLE` webhook
- Sync when user opens app or requests update
- Don't sync more than once every 5 minutes per user

❌ **DON'T:**
- Poll Plaid API continuously
- Sync on every page load
- Ignore webhook notifications

---

## Troubleshooting

### Issue: Transactions Not Syncing

**Symptoms:**
- `plaid-sync` returns success but no new transactions
- Users report missing recent transactions

**Diagnosis:**
```sql
-- Check last sync time
SELECT item_id, last_synced_at, sync_cursor
FROM plaid_items
WHERE user_id = 'user-uuid';

-- Check transaction count
SELECT COUNT(*) 
FROM transactions 
WHERE user_id = 'user-uuid' AND date >= CURRENT_DATE - 30;
```

**Solutions:**
1. Check `plaid_items.last_synced_at` - if never synced, cursor might be null
2. Verify cursor is being saved after each sync
3. Check if Plaid returned `has_more = true` (need to paginate)
4. Call `/transactions/refresh` to force Plaid to check for updates
5. Verify `SYNC_UPDATES_AVAILABLE` webhook is firing

---

### Issue: "Access Token Invalid" Errors

**Symptoms:**
- `INVALID_ACCESS_TOKEN` error from Plaid API
- Users unable to sync

**Diagnosis:**
```sql
-- Check if token exists and is encrypted
SELECT 
  user_id,
  encrypted_plaid_token IS NOT NULL as has_token,
  token_iv IS NOT NULL as has_iv
FROM profiles
WHERE user_id = 'user-uuid';
```

**Solutions:**
1. User needs to re-authenticate via Plaid Link (update mode)
2. Token may have been revoked by user at bank
3. Check `plaid_token_audit_log` for decryption failures
4. Verify `PLAID_ENCRYPTION_KEY` is correct

---

### Issue: Duplicate Transactions

**Symptoms:**
- Same transaction appears multiple times
- Database unique constraint violations

**Diagnosis:**
```sql
-- Check for duplicates
SELECT plaid_transaction_id, COUNT(*) 
FROM transactions 
WHERE user_id = 'user-uuid'
GROUP BY plaid_transaction_id 
HAVING COUNT(*) > 1;
```

**Solutions:**
1. Ensure unique constraint exists: `UNIQUE(user_id, plaid_transaction_id)`
2. Use `upsert` with `onConflict` parameter:
```typescript
await supabase
  .from('transactions')
  .upsert(transaction, { onConflict: 'user_id,plaid_transaction_id' });
```

---

### Issue: Wrong Categories

**Symptoms:**
- User-categorized transactions being overwritten
- Categories reverting to auto-assigned values

**Diagnosis:**
```sql
-- Check category sources
SELECT 
  description,
  category,
  category_source,
  plaid_category
FROM transactions
WHERE user_id = 'user-uuid' AND category_source = 'user'
LIMIT 20;
```

**Solutions:**
1. Verify category update logic respects `category_source = 'user'`
2. Check `mapPlaidCategory` function is not overwriting user categories
3. Ensure AI categorization doesn't override user choices

---

### Issue: Webhook Not Firing

**Symptoms:**
- No webhook events received
- `SYNC_UPDATES_AVAILABLE` not triggering

**Diagnosis:**
1. Check Plaid Dashboard → API → Webhooks
2. Verify webhook URL is correct
3. Check Supabase logs for webhook requests

**Solutions:**
1. Ensure webhook URL is publicly accessible (not localhost)
2. Verify SSL certificate is valid
3. Check webhook signature verification isn't rejecting valid requests
4. Test with Plaid Dashboard's "Fire a webhook" button

---

### Issue: Rate Limit Exceeded

**Symptoms:**
- `RATE_LIMIT_EXCEEDED` error from Plaid
- Users unable to sync

**Diagnosis:**
```sql
-- Check recent API calls
SELECT 
  function_name,
  COUNT(*) as call_count,
  MAX(created_at) as last_call
FROM plaid_token_audit_log
WHERE user_id = 'user-uuid' 
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY function_name;
```

**Solutions:**
1. Implement exponential backoff
2. Reduce sync frequency
3. Cache account balances (don't call `/accounts/get` on every page load)
4. Upgrade Plaid plan if hitting API quota limits

---

## Migration Guide

### Migrating from `/transactions/get` to `/transactions/sync`

If upgrading from an older implementation using `/transactions/get`:

#### Step 1: Add Cursor Column

```sql
ALTER TABLE plaid_items
ADD COLUMN IF NOT EXISTS sync_cursor TEXT;
```

#### Step 2: Fast-Forward Existing Items

For each existing Plaid Item, use the special `"now"` cursor:

```typescript
const response = await plaidClient.syncTransactions(accessToken, "now");
// This skips historical data and sets cursor to current position
```

#### Step 3: Update Edge Function

Replace `/transactions/get` calls with `/transactions/sync`:

**Before:**
```typescript
const response = await fetch(`${plaidBaseUrl}/transactions/get`, {
  body: JSON.stringify({
    access_token: accessToken,
    start_date: '2024-01-01',
    end_date: '2025-01-01',
  })
});
```

**After:**
```typescript
const response = await fetch(`${plaidBaseUrl}/transactions/sync`, {
  body: JSON.stringify({
    access_token: accessToken,
    cursor: storedCursor,
    count: 100
  })
});
```

#### Step 4: Handle Pagination

Add while loop to handle `has_more`:

```typescript
let hasMore = true;
let cursor = storedCursor;

while (hasMore) {
  const response = await plaidClient.syncTransactions(accessToken, cursor);
  
  // Process added, modified, removed...
  
  cursor = response.next_cursor;
  hasMore = response.has_more;
  
  // Save cursor
  await supabase
    .from('plaid_items')
    .update({ sync_cursor: cursor })
    .eq('item_id', itemId);
}
```

#### Step 5: Handle Removed Transactions

Add logic to delete removed transactions:

```typescript
if (response.removed && response.removed.length > 0) {
  await supabase
    .from('transactions')
    .delete()
    .in('plaid_transaction_id', response.removed.map(t => t.transaction_id));
}
```

#### Step 6: Update Webhooks

Change from `DEFAULT_UPDATE` to `SYNC_UPDATES_AVAILABLE`:

```typescript
switch (payload.webhook_code) {
  case 'SYNC_UPDATES_AVAILABLE':  // New webhook
    // Trigger sync
    break;
  case 'DEFAULT_UPDATE':  // Old webhook (deprecated)
    // Can still handle for backward compatibility
    break;
}
```

---

## Appendix: Plaid API Reference Links

**Official Documentation:**
- [Transactions Overview](https://plaid.com/docs/api/products/transactions/)
- [/transactions/sync](https://plaid.com/docs/api/products/transactions/#transactionssync)
- [Webhooks](https://plaid.com/docs/api/webhooks/)
- [Error Codes](https://plaid.com/docs/errors/)
- [Link Integration](https://plaid.com/docs/link/)

**Migration Guides:**
- [Transactions Sync Migration Guide](https://plaid.com/docs/api/products/transactions/#migrating-to-transactionssync)

**Dashboard:**
- [Plaid Dashboard](https://dashboard.plaid.com/)

---

## Summary

PocketTeller's Plaid integration is **production-ready** with:

✅ Modern cursor-based sync  
✅ Encrypted token storage  
✅ Smart category mapping  
✅ Webhook-driven updates  
✅ Comprehensive audit logging  
✅ Rate limiting protection  
✅ Multi-account support  

**Key Files:**
- `supabase/functions/plaid-sync/index.ts` - Main sync logic
- `supabase/functions/_shared/plaid-utils.ts` - Shared utilities
- `src/components/PlaidLink.tsx` - Frontend integration

**For Questions:**
- Check [Plaid Documentation](https://plaid.com/docs/)
- Review code in `supabase/functions/plaid-*`
- Check this guide's [Troubleshooting](#troubleshooting) section

---

**Document Version:** 1.0.0  
**Last Reviewed:** October 13, 2025  
**Next Review:** January 2026

