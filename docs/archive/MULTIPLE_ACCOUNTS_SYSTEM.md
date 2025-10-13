# 🏦 Multi-Account System - Up to 3 Banks

**Date:** October 12, 2025  
**Status:** ✅ Fully Implemented  
**Feature:** Users can connect up to 3 different banks with smart data interweaving

---

## 🎯 Overview

PocketTeller now supports connecting **up to 3 different bank accounts**, with intelligent data management that provides:

1. **Combined Snapshot View** (default) - All accounts aggregated
2. **Individual Account Views** - Filter by specific bank/account
3. **Smart Limit Enforcement** - Max 3 connections enforced at database level
4. **Easy Management** - Connect, disconnect, sync individual banks

---

## 🗄️ Database Architecture

### Tables & Relationships

**`plaid_items` Table:**
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- item_id: TEXT (Plaid's unique item ID)
- institution_name: TEXT (e.g., "Chase Bank")
- institution_id: TEXT (Plaid's institution ID)
- created_at: TIMESTAMP
```
- **Purpose:** Tracks each Plaid connection (bank link)
- **Limit:** Max 3 rows per user_id (enforced by trigger)

**`accounts` Table:**
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- plaid_account_id: TEXT (Plaid's account ID)
- plaid_item_id_ref: TEXT (links to plaid_items.item_id)
- institution_name: TEXT
- name: TEXT (e.g., "Chase Checking")
- type: TEXT (checking, savings, credit, etc.)
- subtype: TEXT
- mask: TEXT (e.g., "4567" for ••4567)
- balance_available: NUMERIC
- balance_current: NUMERIC
```
- **Purpose:** Each individual account within a bank
- **Relationship:** Many accounts can belong to one plaid_item

**`transactions` Table:**
```sql
- id: UUID (primary key)
- user_id: UUID
- plaid_account_id: TEXT (links to accounts.plaid_account_id)
- description: TEXT
- amount: NUMERIC
- category: TEXT
- date: DATE
... (other transaction fields)
```
- **Purpose:** All transactions across all accounts
- **Filtering:** Can filter by plaid_account_id to show one account

---

## 🚀 Backend Functions

### 1. `plaid-check-limit`
**Purpose:** Check if user can connect another bank

**Request:**
```typescript
// No body needed - uses JWT for user_id
```

**Response:**
```json
{
  "connectedCount": 2,
  "maxConnections": 3,
  "canConnect": true,
  "remainingSlots": 1,
  "connectedBanks": [
    {
      "id": "uuid",
      "institutionName": "Chase Bank",
      "institutionId": "ins_1",
      "connectedAt": "2025-10-12T10:00:00Z"
    }
  ]
}
```

---

### 2. `plaid-list-accounts`
**Purpose:** List all connected banks with their accounts and balances

**Request:**
```typescript
// No body needed - uses JWT for user_id
```

**Response:**
```json
{
  "connectedBanks": [
    {
      "itemId": "item_123",
      "institutionName": "Chase Bank",
      "institutionId": "ins_1",
      "connectedAt": "2025-10-12T10:00:00Z",
      "totalBalance": 15234.56,
      "accounts": [
        {
          "id": "uuid",
          "plaidAccountId": "acc_123",
          "name": "Chase Checking",
          "officialName": "Chase Total Checking",
          "type": "depository",
          "subtype": "checking",
          "mask": "4567",
          "balanceAvailable": 12500.00,
          "balanceCurrent": 12500.00,
          "currencyCode": "USD"
        }
      ]
    }
  ],
  "totalConnected": 2,
  "maxConnections": 3
}
```

---

### 3. `plaid-disconnect` (Enhanced)
**Purpose:** Disconnect a specific bank (not all banks)

**Request:**
```typescript
{
  "item_id": "item_123" // specific bank to disconnect
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bank disconnected successfully"
}
```

---

## 🎨 Frontend Components

### 1. `useConnectedAccounts` Hook

**Purpose:** Centralized hook for managing multiple accounts

```typescript
const {
  connectedBanks,    // Array of all connected banks
  limitInfo,         // Connection limit details
  loading,           // Loading state
  error,             // Error state
  refetch,           // Manually refresh data
} = useConnectedAccounts();
```

**Example:**
```typescript
const { connectedBanks, limitInfo } = useConnectedAccounts();

console.log(`${limitInfo.connectedCount} of ${limitInfo.maxConnections} banks connected`);
console.log(`${limitInfo.remainingSlots} slots remaining`);

connectedBanks.forEach(bank => {
  console.log(`${bank.institutionName}: $${bank.totalBalance}`);
});
```

---

### 2. `AccountSelector` Component

**Purpose:** Dropdown to filter by account (or show all)

**Usage:**
```tsx
import { AccountSelector } from '@/components/AccountSelector';

function Transactions() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  return (
    <div>
      <AccountSelector
        value={selectedAccountId || 'all'}
        onChange={(accountId) => setSelectedAccountId(accountId)}
      />
      
      {/* Your transactions list - filtered by selectedAccountId */}
    </div>
  );
}
```

**Features:**
- Shows "All Accounts" option (combined view)
- Groups accounts by bank
- Shows account balance next to name
- Search functionality
- Responsive design

---

### 3. `ConnectedAccountsList` Component

**Purpose:** Manage connected banks (disconnect, view details)

**Usage:**
```tsx
import { ConnectedAccountsList } from '@/components/ConnectedAccountsList';

function Account() {
  return (
    <div>
      <ConnectedAccountsList />
    </div>
  );
}
```

**Features:**
- Lists all connected banks
- Shows all accounts within each bank
- Individual account balances
- Total balance per bank
- Disconnect button with confirmation dialog
- Refresh button
- Shows connection status (X of 3 banks)

---

### 4. Enhanced `PlaidLink` Component

**New Features:**
- Checks connection limit before allowing new connections
- Shows "Connect Another Bank (X/3)" when connected
- Prevents connecting 4th bank
- "Sync All Banks" button
- Visual connection count indicator

**Behavior:**

**No Banks Connected:**
```
[Connect Bank Account]
```

**1-2 Banks Connected:**
```
[Sync All Banks] [Connect Another Bank (1/3)]
1 of 3 banks connected
```

**3 Banks Connected (Limit Reached):**
```
[Sync All Banks]
3 of 3 banks connected • Manage accounts in Settings to add more
```

---

## 📊 Data Interweaving Logic

### Combined View (Default)

**How it Works:**
1. Fetch ALL accounts for user (no filter)
2. Fetch ALL transactions for user (no filter)
3. Aggregate balances across all accounts
4. Show combined spending insights

**SQL Example:**
```sql
-- Total Balance (all accounts)
SELECT SUM(balance_available) as total
FROM accounts
WHERE user_id = 'user_id';

-- All Transactions (all accounts)
SELECT *
FROM transactions
WHERE user_id = 'user_id'
ORDER BY date DESC;
```

**Result:**
- User sees unified financial picture
- All accounts aggregated as one
- Spending insights across all banks

---

### Individual Account View

**How it Works:**
1. User selects specific account from dropdown
2. Filter transactions by `plaid_account_id`
3. Show only that account's balance
4. Spending insights for that account only

**SQL Example:**
```sql
-- Specific Account Balance
SELECT balance_available
FROM accounts
WHERE user_id = 'user_id' AND plaid_account_id = 'acc_123';

-- Transactions for Specific Account
SELECT *
FROM transactions
WHERE user_id = 'user_id' AND plaid_account_id = 'acc_123'
ORDER BY date DESC;
```

**Result:**
- User sees transactions from only one bank
- Balances reflect only that account
- Insights specific to that spending pattern

---

## 🔐 Security & Limits

### Database-Level Limit Enforcement

**Trigger Function:**
```sql
CREATE OR REPLACE FUNCTION check_plaid_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM plaid_items WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum of 3 bank connections allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_plaid_item_limit
  BEFORE INSERT ON plaid_items
  FOR EACH ROW
  EXECUTE FUNCTION check_plaid_item_limit();
```

**Result:**
- Attempting to insert 4th plaid_item = database error
- No way to bypass limit (enforced at DB level)
- Frontend checks prevent user reaching limit

---

### Frontend Validation

**PlaidLink Component:**
```typescript
const checkConnectionLimit = async () => {
  const { data } = await supabase.functions.invoke('plaid-check-limit');
  
  if (!data.canConnect) {
    toast({
      title: "Connection Limit Reached",
      description: "You have reached the maximum of 3 bank connections.",
      variant: "destructive",
    });
    return false;
  }
  
  return true;
};
```

**Result:**
- User sees error message before attempting Plaid link
- Prevents unnecessary Plaid Link token generation
- Clear feedback about limit

---

## 🎯 User Flows

### Flow 1: Connecting First Bank

```
1. User clicks "Connect Bank Account"
2. PlaidLink checks: 0 of 3 → ✅ Can connect
3. Plaid modal opens
4. User selects Chase Bank
5. Backend receives token
6. Creates plaid_item row (item_id: "chase_item_123")
7. Creates account rows (2 Chase accounts)
8. Syncs transactions
9. User sees combined view (Chase only)
```

---

### Flow 2: Connecting Second Bank

```
1. User clicks "Connect Another Bank (2/3)"
2. PlaidLink checks: 1 of 3 → ✅ Can connect
3. Plaid modal opens
4. User selects Bank of America
5. Backend creates second plaid_item (item_id: "boa_item_456")
6. Creates account rows (3 BoA accounts)
7. Syncs transactions
8. User sees combined view (Chase + BoA)
```

---

### Flow 3: Connecting Third Bank

```
1. User clicks "Connect Another Bank (1/3)"
2. PlaidLink checks: 2 of 3 → ✅ Can connect
3. Plaid modal opens
4. User selects Wells Fargo
5. Backend creates third plaid_item (item_id: "wells_item_789")
6. Creates account rows (2 Wells accounts)
7. Syncs transactions
8. User sees combined view (Chase + BoA + Wells)
9. "Connect Another Bank" button disappears
```

---

### Flow 4: Attempting Fourth Bank (BLOCKED)

```
1. User doesn't see "Connect Another Bank" button (3/3)
2. If they somehow try: PlaidLink checks: 3 of 3 → ❌ Cannot connect
3. Toast error: "You have reached the maximum of 3 bank connections"
4. Suggestion: "Disconnect an existing account in Settings"
5. No Plaid modal opens
6. Database trigger would reject anyway
```

---

### Flow 5: Disconnecting a Bank

```
1. User goes to Account → Connected Banks
2. Sees list of 3 banks
3. Clicks trash icon on Bank of America
4. Confirmation dialog: "This will remove X accounts"
5. User confirms
6. Backend deletes plaid_item row (CASCADE deletes accounts)
7. Transactions preserved (not deleted)
8. User now sees 2 of 3 banks
9. "Connect Another Bank (1/3)" button appears
```

---

### Flow 6: Filtering Transactions by Account

```
1. User goes to Transactions page
2. Sees "All Accounts" dropdown at top
3. Has 7 total accounts (Chase: 2, BoA: 3, Wells: 2)
4. Clicks dropdown
5. Sees options:
   - All Accounts (combined)
   - Chase Bank
     - Chase Checking (••4567) $12,500
     - Chase Savings (••8901) $5,000
   - Bank of America
     - BoA Checking (••2345) $3,200
     - BoA Savings (••6789) $8,900
     - BoA Credit Card (••1234) -$1,500
   - Wells Fargo
     - Wells Checking (••5678) $4,100
     - Wells Savings (••9012) $11,200
6. User selects "Chase Checking"
7. Transactions list updates to show only Chase Checking txns
8. Balance shows $12,500 (just that account)
9. Insights based on Chase Checking only
```

---

## 💡 Implementation Benefits

### For Users:
- ✅ Connect multiple banks (checking, savings, credit)
- ✅ See complete financial picture (all accounts aggregated)
- ✅ Drill down into specific accounts when needed
- ✅ Easy management (disconnect specific banks)
- ✅ No confusion (clear visual indicators)

### For Developers:
- ✅ Database-level limit enforcement (bulletproof)
- ✅ Reusable hooks and components
- ✅ Clean separation of concerns
- ✅ Scalable architecture
- ✅ Easy to extend (just change maxConnections constant)

### For Business:
- ✅ Control over connection limits
- ✅ Upsell opportunity ("Upgrade for unlimited")
- ✅ Better data aggregation
- ✅ More accurate insights
- ✅ Professional UX

---

## 🔧 Configuration

### Change Connection Limit

**Database (migration):**
```sql
-- Change trigger to allow 5 connections
CREATE OR REPLACE FUNCTION check_plaid_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM plaid_items WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 bank connections allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Backend Function:**
```typescript
// In plaid-check-limit/index.ts
const maxConnections = 5; // Change here
```

**Frontend Component:**
```typescript
// In PlaidLink.tsx and useConnectedAccounts.tsx
const [limitInfo, setLimitInfo] = useState({ 
  maxConnections: 5 // Change here
});
```

---

## 🎉 Summary

**Feature:** ✅ **Complete**  
**Limit:** 3 banks per user  
**Enforcement:** Database + Frontend  
**UI:** Seamless combined/individual views  
**Management:** Easy connect/disconnect  

**Your users can now:**
- Connect up to 3 different banks
- See unified financial picture
- Drill down into specific accounts
- Manage connections easily
- Get accurate insights across all accounts

**Professional, scalable, production-ready!** 🏆

---

*Completed: October 12, 2025*  
*Status: Production Ready*  
*Architecture: Multi-bank support with smart data interweaving*

