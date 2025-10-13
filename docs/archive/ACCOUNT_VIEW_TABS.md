# 📑 Account View Tabs - Simple Toggle System

**Date:** October 12, 2025  
**Status:** ✅ Fully Implemented  
**Feature:** Simple tab-based switching between combined and individual account views

---

## 🎯 Overview

Users can now easily toggle between viewing:
1. **All Accounts** (Combined View) - Default, shows aggregated data
2. **Individual Banks** (Filtered Views) - One tab per connected bank

**Available on:**
- ✅ **Home/Dashboard page**
- ✅ **Transactions page**

**Features:**
- Simple tab interface (no complex dropdowns)
- One-click switching
- Shows balance in each tab
- "Add Bank" button prominently displayed
- Responsive design (mobile-friendly)

---

## 🎨 User Interface

### Tab Layout

**With 0 Banks Connected:**
```
┌────────────────────────────────────────┐
│  📦 Connect a bank to see your accounts │
│                                          │
│           [Add Bank Account]             │
└────────────────────────────────────────┘
```

**With 1 Bank Connected:**
```
┌──────────────────────────────────────────────────────┐
│ [All Accounts $12,500] │ [Chase Bank $12,500] │ [+Add Bank (2/3)] │
└──────────────────────────────────────────────────────┘
  Content shows based on selected tab
```

**With 2 Banks Connected:**
```
┌──────────────────────────────────────────────────────────────────┐
│ [All $20,000] │ [Chase $12,500] │ [BoA $7,500] │ [+Add Bank (1/3)] │
└──────────────────────────────────────────────────────────────────┘
  Content shows based on selected tab
```

**With 3 Banks (Limit Reached):**
```
┌─────────────────────────────────────────────────────────────┐
│ [All $45,000] │ [Chase $12,500] │ [BoA $20,000] │ [Wells $12,500] │
└─────────────────────────────────────────────────────────────┘
  Content shows based on selected tab
  (No "Add Bank" button - limit reached)
```

---

## 🔧 Component Architecture

### `AccountViewTabs` Component

**Purpose:** Reusable tab system for switching account views

**Props:**
```typescript
interface AccountViewTabsProps {
  onAccountChange: (accountId: string | null) => void;
  children: (accountId: string | null) => React.ReactNode;
  onAddBankClick: () => void;
}
```

**Usage Example:**
```typescript
<AccountViewTabs
  onAccountChange={(accountId) => setSelectedAccount(accountId)}
  onAddBankClick={() => setShowAddBankDialog(true)}
>
  {(accountId) => (
    // Your content here
    // accountId = null for "All Accounts"
    // accountId = item_id for specific bank
    <FinancialHealthSnapshot accountFilter={accountId} />
  )}
</AccountViewTabs>
```

**Features:**
- Auto-loads connected banks
- Calculates total balance
- Shows balance badges on each tab
- Handles loading states
- Responsive grid layout
- Shows connection count (X of 3)

---

## 📱 Implementation on Dashboard

### Dashboard Tab Behavior

**Default State (No Banks):**
- Shows welcome card with "Connect Bank" button
- No tabs displayed

**With Banks Connected:**
- Tabs appear at top
- "All Accounts" tab selected by default
- Shows aggregated financial snapshot
- Budget overview reflects combined data
- Goals and bills remain global

**Switching Tabs:**
- Click "Chase Bank" tab
- Financial snapshot updates to Chase only
- Budget updates to Chase spending
- Goals and bills remain global (not filtered)

### Code Example:
```typescript
// Dashboard.tsx
const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

return (
  <AccountViewTabs
    onAccountChange={setSelectedAccount}
    onAddBankClick={() => setShowAddBankDialog(true)}
  >
    {(accountId) => (
      <>
        <FinancialHealthSnapshot accountFilter={accountId} />
        <BudgetOverview accountFilter={accountId} />
        <GoalsOverview /> {/* Always global */}
        <UpcomingBills /> {/* Always global */}
      </>
    )}
  </AccountViewTabs>
);
```

---

## 💰 Implementation on Transactions

### Transactions Tab Behavior

**Tab Switching:**
- "All Accounts" → Shows all transactions from all banks
- "Chase Bank" → Filters to show only Chase transactions
- "BoA" → Filters to show only BoA transactions

**What Gets Filtered:**
- ✅ Transaction list
- ✅ Spending pie chart
- ✅ Spending insights
- ✅ Date range filters (applies to filtered data)

### Code Example:
```typescript
// Transactions.tsx
const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

return (
  <AccountViewTabs
    onAccountChange={setSelectedAccount}
    onAddBankClick={() => setShowAddBankDialog(true)}
  >
    {(accountId) => (
      <>
        <SpendingPieChart transactions={transactions} accountFilter={accountId} />
        <SpendingInsights accountFilter={accountId} />
        <RecentTransactions accountFilter={accountId} />
      </>
    )}
  </AccountViewTabs>
);
```

---

## 🔘 Add Bank Button

### Button Visibility

**Shown When:**
- User has 0, 1, or 2 banks connected
- Space available (remainingSlots > 0)

**Hidden When:**
- User has reached 3-bank limit
- No slots available

**Button Design:**
```typescript
<Button onClick={onAddBankClick} variant="outline" size="sm" className="gap-2">
  <Plus className="h-4 w-4" />
  <span className="hidden sm:inline">Add Bank</span>
  <Badge variant="secondary">{remainingSlots}/3</Badge>
</Button>
```

**Shows:**
- Plus icon
- "Add Bank" text (desktop only)
- Badge with remaining slots (e.g., "2/3")

---

## 💾 Data Flow

### How Filtering Works

**1. Tab Selection:**
```
User clicks "Chase Bank" tab
  ↓
AccountViewTabs.onValueChange("item_123")
  ↓
onAccountChange("item_123")
  ↓
Parent component: setSelectedAccount("item_123")
  ↓
Children receive accountFilter="item_123"
```

**2. Component Filtering:**
```
<FinancialHealthSnapshot accountFilter="item_123" />
  ↓
Fetches accounts WHERE plaid_item_id_ref = "item_123"
  ↓
Fetches transactions WHERE plaid_account_id IN (filtered accounts)
  ↓
Displays only Chase Bank data
```

**3. Combined View:**
```
User clicks "All Accounts" tab
  ↓
AccountViewTabs.onValueChange("all")
  ↓
onAccountChange(null)
  ↓
Parent component: setSelectedAccount(null)
  ↓
Children receive accountFilter=null
  ↓
No filtering - shows all data
```

---

## 🎨 Visual Design

### Tab Styles

**All Accounts Tab:**
```
┌─────────────────────┐
│ 🏦 All Accounts     │
│         $45,000     │
└─────────────────────┘
```

**Individual Bank Tab:**
```
┌─────────────────────┐
│ Chase Bank          │
│         $12,500     │
└─────────────────────┘
```

**Active Tab:**
- Primary background color
- White text
- Slightly elevated (shadow)

**Inactive Tab:**
- Muted background
- Muted text
- Hover effect (slight elevation)

---

## 📊 Tab Content Details

### Individual Bank Tab Content

When a bank tab is selected, shows:

**Header Section:**
```
┌────────────────────────────────────────────┐
│ 🏦 Chase Bank               $12,500       │
│                              2 accounts    │
│                                            │
│ [Chase Checking ••4567] [$10,000]          │
│ [Chase Savings ••8901]  [$2,500]           │
└────────────────────────────────────────────┘
```

**Then Below:**
- Filtered financial data
- Only transactions from that bank
- Spending insights for that bank

---

## 🚀 User Flows

### Flow 1: First Time User (No Banks)

```
1. User lands on Dashboard
2. Sees "Connect Your Bank" card
3. Clicks "Connect Bank Account"
4. Plaid modal opens
5. User connects Chase
6. Dashboard refreshes
7. Tabs appear: [All Accounts] [Chase Bank] [+Add Bank (2/3)]
8. Default: "All Accounts" tab active (showing Chase data)
```

---

### Flow 2: Adding Second Bank

```
1. User on Dashboard with 1 bank
2. Clicks [+Add Bank (2/3)] button
3. Dialog opens with Plaid Link
4. User connects Bank of America
5. Tabs update: [All Accounts] [Chase] [BoA] [+Add Bank (1/3)]
6. User clicks "BoA" tab
7. Dashboard updates to show only BoA data
```

---

### Flow 3: Switching Views on Transactions

```
1. User navigates to Transactions page
2. Sees tabs: [All Accounts] [Chase] [BoA] [Wells]
3. Default: "All Accounts" - sees all 500 transactions
4. Clicks "Chase" tab
5. Transaction list filters to 150 Chase transactions
6. Pie chart updates to Chase spending only
7. Insights calculate based on Chase data
8. User clicks "All Accounts" tab
9. Everything reverts to combined view
```

---

### Flow 4: Reaching Limit

```
1. User has 2 banks connected
2. Clicks [+Add Bank (1/3)]
3. Connects Wells Fargo (3rd bank)
4. Tabs update: [All Accounts] [Chase] [BoA] [Wells]
5. "Add Bank" button disappears (limit reached)
6. User can still switch between all tabs
7. To add different bank: Must go to Settings → Disconnect one bank
```

---

## 🔍 Technical Details

### State Management

**Parent Component:**
```typescript
const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
const [showAddBankDialog, setShowAddBankDialog] = useState(false);
```

**AccountViewTabs Internal State:**
```typescript
const [activeTab, setActiveTab] = useState<string>('all');
const { connectedBanks, limitInfo, loading } = useConnectedAccounts();
```

**Effect Hook:**
```typescript
useEffect(() => {
  if (activeTab === 'all') {
    onAccountChange(null);
  } else {
    onAccountChange(activeTab); // item_id
  }
}, [activeTab, onAccountChange]);
```

---

### Component Props Passed Down

**FinancialHealthSnapshot:**
```typescript
<FinancialHealthSnapshot accountFilter={accountId} />
// accountId = null → fetch all accounts
// accountId = "item_123" → fetch accounts WHERE plaid_item_id_ref = "item_123"
```

**RecentTransactions:**
```typescript
<RecentTransactions accountFilter={accountId} />
// Filters transactions by plaid_account_id
```

**SpendingPieChart:**
```typescript
<SpendingPieChart transactions={transactions} accountFilter={accountId} />
// Client-side filtering of transactions array
```

---

## 📱 Responsive Design

### Desktop View
```
[All Accounts $45K] [Chase $12.5K] [BoA $20K] [Wells $12.5K] [+Add Bank (0/3)]
```
- Full bank names
- Full balance amounts
- All tabs visible

### Tablet View
```
[All $45K] [Chase $12.5K] [BoA $20K] [Wells $12.5K] [+Add (0/3)]
```
- Shortened labels
- Abbreviated "Add Bank" to "Add"
- All tabs visible

### Mobile View
```
[All $45K] [Chase $12.5K] ...
[+Add (0/3)]
```
- Horizontal scrolling for tabs
- Icon-only "All" text
- "Add Bank" button below tabs (stacked)

---

## ✅ Accessibility

**Keyboard Navigation:**
- Tab key moves between tabs
- Enter/Space activates tab
- Arrow keys navigate between tabs

**Screen Readers:**
- Tabs announced as "All Accounts tab, selected"
- Balance badges read as amounts
- Add Bank button announced with slot count

**Focus Management:**
- Visible focus indicators
- Logical tab order
- Dialog focus trap when adding bank

---

## 🎯 Benefits

### For Users:
- ✅ **Simple Interface** - One-click tab switching
- ✅ **Clear Visual Feedback** - Active tab highlighted
- ✅ **Always Visible** - Add Bank button readily available
- ✅ **Balance at a Glance** - See amounts in tabs
- ✅ **Intuitive** - Standard tab pattern everyone knows

### For Developers:
- ✅ **Reusable Component** - Works on multiple pages
- ✅ **Render Props Pattern** - Flexible content
- ✅ **Centralized Logic** - All tab logic in one place
- ✅ **Easy to Extend** - Add more pages easily

---

## 🎉 Summary

**Feature:** ✅ **Complete**  
**Pages:** Dashboard + Transactions  
**Tabs:** All Accounts + Individual Banks  
**Add Bank Button:** Prominent & Always Visible  
**Design:** Simple, Clean, Intuitive  

**Users can now:**
- Switch between combined and individual views with one click
- See balances directly in tabs
- Add multiple banks easily (up to 3)
- Navigate complex financial data simply

**Professional, user-friendly, production-ready!** 📑✨

---

*Completed: October 12, 2025*  
*Status: Production Ready*  
*UI Pattern: Tab-based account switching*

