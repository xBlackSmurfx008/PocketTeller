# 🎯 Transaction Categorization System

**Updated:** October 11, 2025  
**Status:** ✅ Optimized with Clear Priority Hierarchy

---

## 🏆 Categorization Priority Hierarchy

Your PocketTeller app now uses a **smart 4-tier categorization system** that ensures the most accurate data source is always used:

```
┌─────────────────────────────────────────────┐
│  Priority 1: USER MANUAL CHOICE             │  ← NEVER OVERWRITTEN
│  category_source: 'user'                    │
├─────────────────────────────────────────────┤
│  Priority 2: PLAID API DATA (Alpha Source)  │  ← AUTHORITATIVE
│  category_source: 'plaid'                   │
├─────────────────────────────────────────────┤
│  Priority 3: AI CATEGORIZATION (Gemini)     │  ← SMART FALLBACK
│  category_source: 'ai'                      │
├─────────────────────────────────────────────┤
│  Priority 4: AUTO/FALLBACK                  │  ← NEEDS IMPROVEMENT
│  category_source: 'auto' or null            │
└─────────────────────────────────────────────┘
```

---

## 📊 How It Works

### 1. Initial Transaction Import (Plaid Link)

When a bank account is first connected:

```typescript
Transaction from Plaid API
    ↓
Does Plaid provide category data?
    ↓
YES → Map to app category → category_source: 'plaid' ✅
NO  → Default to 'Other'  → category_source: 'auto'  ⚠️
```

**Example:**
- Starbucks purchase: Plaid says "Coffee Shops" → **Food & Dining** (`plaid`)
- Unknown merchant: No Plaid category → **Other** (`auto`) → Available for AI

### 2. Ongoing Transaction Sync

When transactions are synced from Plaid:

```typescript
Modified Transaction from Plaid
    ↓
Check existing category_source
    ↓
┌─ 'user'  → Keep user's choice, never overwrite
├─ 'plaid' → Update if Plaid has new/better data
├─ 'ai'    → Update ONLY if Plaid now has good data
└─ 'auto'  → Update with Plaid data
```

**Key Rule:** **Plaid data is authoritative and will overwrite AI categories** when Plaid has good information.

### 3. AI Categorization (Gemini)

AI categorization **only targets** transactions that need help:

```typescript
Filter for AI Categorization:
    ✅ category = 'Other' or null
    ✅ category_source = 'auto' or null

Will NOT categorize:
    ❌ category_source = 'user'  (user's choice)
    ❌ category_source = 'plaid' (Plaid's authoritative data)
    ❌ category_source = 'ai'    (already AI-categorized)
```

**Example Query:**
```sql
SELECT * FROM transactions
WHERE user_id = 'xxx'
  AND category IN ('Other', null)
  AND category_source IN ('auto', null)
ORDER BY date DESC
LIMIT 50;
```

### 4. User Manual Categorization

When a user manually changes a category:

```typescript
User selects category
    ↓
category_source = 'user'
    ↓
LOCKED ✅ - Never changed by Plaid or AI
```

---

## 🔄 Real-World Scenarios

### Scenario 1: Well-Categorized Transaction
```
1. Plaid import: "Walmart - Groceries" → Food & Dining (plaid) ✅
2. Sync update: Plaid confirms → Stays Food & Dining (plaid) ✅
3. AI categorize: Skipped (already plaid-sourced) ✅
```

### Scenario 2: Unknown Transaction Gets AI Help
```
1. Plaid import: "Unknown Merchant" → Other (auto) ⚠️
2. AI categorize: Analyzes description → Shopping (ai, 85% confidence) ✅
3. Sync update: Plaid still has no data → Keeps Shopping (ai) ✅
```

### Scenario 3: Plaid Updates After AI
```
1. Plaid import: "XYZ Corp" → Other (auto) ⚠️
2. AI categorize: Best guess → Entertainment (ai, 70% confidence) 📊
3. Sync update: Plaid now has data "Utilities" → Utilities (plaid) ✅
   ↳ AI category was good, but Plaid data is authoritative!
```

### Scenario 4: User Override (Always Wins)
```
1. Plaid import: "Coffee Shop" → Food & Dining (plaid) ☕
2. User changes: "No, this is Entertainment" → Entertainment (user) ✅
3. Sync update: Plaid still says Food & Dining → Stays Entertainment (user) ✅
4. AI categorize: Skipped (user-categorized) ✅
```

---

## 🎯 Category Sources Explained

| Source | Description | Can Be Overwritten By |
|--------|-------------|----------------------|
| `user` | Manually set by user | **Nothing** - Permanent |
| `plaid` | From Plaid API category data | User only |
| `ai` | Categorized by Gemini AI | User, Plaid (when it has data) |
| `auto` | Fallback/keyword-based | User, Plaid, AI |

---

## 🧪 Testing the System

### Test 1: Verify Plaid Priority
```sql
-- Check transactions with Plaid categories
SELECT 
  description, 
  category, 
  category_source,
  plaid_category
FROM transactions
WHERE category_source = 'plaid'
LIMIT 10;
```

### Test 2: Find AI-Categorized Transactions
```sql
-- Transactions that AI helped with
SELECT 
  description, 
  category, 
  category_source,
  category_confidence,
  category_reason
FROM transactions
WHERE category_source = 'ai'
ORDER BY date DESC
LIMIT 10;
```

### Test 3: Transactions Needing Help
```sql
-- Transactions that could use AI categorization
SELECT 
  description, 
  category, 
  category_source,
  date
FROM transactions
WHERE category IN ('Other', null)
  AND category_source IN ('auto', null)
ORDER BY date DESC
LIMIT 20;
```

---

## 🚀 How to Use

### Automatic Categorization
Everything happens automatically:
1. **Connect bank** → Plaid categorizes what it can
2. **Transactions sync** → Plaid updates keep data fresh
3. **Click "Auto-Categorize"** → AI fills in the gaps

### Manual Categorization
Users have full control:
1. Click transaction → Change category
2. System marks as `category_source: 'user'`
3. Never overwritten by Plaid or AI ✅

---

## 📈 Expected Results

With this system, you should see:

**Well-Categorized Transactions:** ~85-90%
- Plaid data: ~70-75% (most common merchants)
- AI categorization: ~15-20% (unknown merchants)
- Manual user fixes: ~5%

**Uncategorized (Other):** ~10-15%
- Truly ambiguous transactions
- Generic descriptions
- Pending transactions

---

## 🔧 Configuration

### AI Categorization Settings

In your app, when calling the AI categorization:

```typescript
// Default settings (recommended)
{
  limit: 50,        // Process up to 50 transactions
  threshold: 0.55   // Only apply if 55%+ confident
}

// For more aggressive categorization
{
  limit: 100,
  threshold: 0.45   // Accept lower confidence
}

// For conservative categorization
{
  limit: 50,
  threshold: 0.70   // Only very confident predictions
}
```

### Category Mapping

The system maps Plaid's 100+ categories to your app's 9 categories:

```typescript
App Categories:
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Travel
- Income
- Other (fallback)
```

---

## 🛠️ Functions Updated

### 1. `plaid-sync` (149.7 KB)
✅ Smart priority logic for modified transactions  
✅ Stores original Plaid category for reference  
✅ Respects user choices, updates when Plaid has better data

### 2. `plaid-link-exchange` (150.3 KB)
✅ Uses `plaid` source when Plaid provides category  
✅ Uses `auto` source when defaulting to Other  
✅ Consistent with sync logic

### 3. `ai-categorize-transactions` (72.48 KB)
✅ Only targets `auto` and uncategorized transactions  
✅ Never overwrites `user` or `plaid` sources  
✅ Clear comments explaining priority

---

## 🎊 Benefits

### For Users
- ✅ Better accuracy (Plaid data is authoritative)
- ✅ Less manual work (AI fills gaps intelligently)
- ✅ Full control (manual changes never overwritten)
- ✅ Transparency (can see categorization source)

### For You
- ✅ Clear priority hierarchy
- ✅ Well-documented code
- ✅ Predictable behavior
- ✅ Easy to debug

---

## 📝 Code Comments

All functions now include clear comments explaining the priority:

```typescript
// Priority: user > plaid > ai > auto
// Only update category if we have better information than what's currently stored
```

This makes the system:
- **Maintainable** - Future developers understand the logic
- **Debuggable** - Easy to see why a category was chosen
- **Extensible** - Easy to add new sources or priorities

---

## 🎯 Summary

**Your categorization system now ensures:**

1. **Plaid data is the alpha source** ✅
   - When Plaid has category data, it's authoritative
   - Marked as `category_source: 'plaid'`
   - Updates AI categories when Plaid gets better data

2. **AI fills the gaps intelligently** ✅
   - Only processes transactions Plaid couldn't categorize
   - Uses Gemini 2.5 Flash for smart categorization
   - Provides confidence scores and reasoning

3. **User control is absolute** ✅
   - Manual categories are never overwritten
   - Users have final say on any transaction
   - System respects user knowledge

4. **Clear hierarchy** ✅
   - Documented in code and in this guide
   - Predictable behavior
   - Easy to maintain and extend

---

## 🚦 Status

✅ **System Deployed and Active**

All three functions are live with the new logic:
- plaid-sync
- plaid-link-exchange
- ai-categorize-transactions

**Test it now:** Connect a bank account and watch the categorization work!

---

*System updated: October 11, 2025*  
*Plaid data is now the authoritative alpha source* ✅

