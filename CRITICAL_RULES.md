# CRITICAL DEVELOPMENT RULES

**These rules MUST be followed to prevent breaking the app.**

---

## 🚨 RULE #1: NEVER CHANGE WORKING CODE WITHOUT UNDERSTANDING IT

### What This Means:
- If something works (like Settings page), **COPY IT EXACTLY**
- Don't "improve" or "optimize" working code
- Don't change variable names or refactor unless explicitly asked
- If unsure, ASK before changing

### Why This Matters:
- User's time is valuable
- Breaking working features wastes hours
- Simple is better than clever

---

## 🚨 RULE #2: CHECK DATABASE SCHEMA BEFORE QUERYING

### Always Verify:
```bash
# Before writing ANY database query:
1. Check the actual column name in migrations
2. Verify the table structure
3. Test the query logic

# Example: accounts table
grep -r "accounts.*ADD COLUMN\|CREATE TABLE.*accounts" supabase/migrations/
```

### Common Column Names:
```typescript
// ✅ CORRECT (check migrations first!):
accounts table: plaid_item_id_ref (current)
accounts table: available_balance, current_balance (NOT balance_available!)
transactions table: plaid_transaction_id
plaid_items table: item_id

// ❌ WRONG (don't assume!):
balance_available ❌  
balance_current ❌
plaid_account_id ❌ (this is different from item_id!)
```

---

## 🚨 RULE #3: UNDERSTAND THE FULL DATA FLOW

### Before Making Changes:
1. **Understand what data exists**
   - Do plaid_items exist?
   - Do accounts exist?
   - Do transactions exist?

2. **Understand the sync process**
   - plaid-link-exchange: Creates plaid_item
   - plaid-sync: Fetches accounts + transactions
   - **BOTH must run for data to exist!**

3. **Don't assume data exists**
   - Check if accounts table is populated
   - Check if sync was run
   - Handle empty states gracefully

---

## 🚨 RULE #4: TEST BEFORE SAYING "FIXED"

### Testing Checklist:
```bash
# Before claiming something is fixed:
- [ ] No linter errors
- [ ] No TypeScript errors  
- [ ] Read the ENTIRE file being changed
- [ ] Understand what changed and why
- [ ] Check if data exists in database
- [ ] Verify the query returns data
- [ ] Test in browser/app (if possible)
```

---

## 🚨 RULE #5: ONE CHANGE AT A TIME

### Good Approach:
```
1. Make ONE small change
2. Test it
3. If it works, move to next change
4. If it breaks, revert immediately
```

### Bad Approach:
```
1. Change 5 things at once ❌
2. Remove dialogs + change props + modify queries ❌
3. "Fix" multiple issues in one go ❌
4. Refactor while fixing bugs ❌
```

---

## 🚨 RULE #6: UNDERSTAND BEFORE CODING

### Before Writing Code:
1. **Read the existing implementation**
   - How does Settings page do it?
   - What props does the component expect?
   - What data structure is returned?

2. **Check similar working examples**
   - If Dashboard needs PlaidLink, check Settings
   - If querying accounts, check how it's done elsewhere
   - Copy working patterns, don't reinvent

3. **Ask if unsure**
   - Better to ask than break
   - User prefers questions over broken code
   - Clarify requirements first

---

## 🚨 RULE #7: RESPECT THE CODEBASE

### What NOT to Do:
- ❌ Don't remove working code "to simplify"
- ❌ Don't change APIs without checking all callers
- ❌ Don't assume column names
- ❌ Don't skip checking migrations
- ❌ Don't modify working queries
- ❌ Don't "optimize" without profiling
- ❌ Don't add complexity for "best practices"

### What TO Do:
- ✅ Read before writing
- ✅ Test before committing
- ✅ Verify before claiming fixed
- ✅ Check schema before querying
- ✅ Copy working patterns
- ✅ Keep it simple
- ✅ Ask when uncertain

---

## 📊 Current Data Flow (PocketTeller)

### Bank Connection Process:
```
1. User clicks "Connect Bank"
2. PlaidLink opens modal
3. User selects bank & logs in
4. plaid-link-exchange function:
   - Receives public_token
   - Exchanges for access_token
   - Creates plaid_item in database
   - ✅ plaid_items table now has 1 row

5. plaid-sync function (MUST BE CALLED):
   - Fetches accounts from Plaid API
   - Inserts into accounts table
   - Fetches transactions from Plaid API
   - Inserts into transactions table
   - ✅ accounts table now has data
   - ✅ transactions table now has data

6. useConnectedAccounts hook:
   - Queries plaid_items (finds items)
   - Queries accounts WHERE plaid_item_id_ref = item_id
   - Returns combined data
   - ✅ UI shows accounts
```

### The Problem:
```
❌ Current state:
- plaid_items: 3 rows ✅
- accounts: 0 rows ❌ (plaid-sync not run!)
- UI shows "No Banks Connected" because accounts is empty
```

### The Fix:
```
✅ Need to run plaid-sync for each item to populate accounts table
```

---

## 🔧 Common Debugging Steps

### When UI Shows "No Banks":

```typescript
// 1. Check plaid_items table
const { data: items } = await supabase
  .from('plaid_items')
  .select('*')
  .eq('user_id', userId);
console.log('Items:', items); // Should have rows

// 2. Check accounts table
const { data: accounts } = await supabase
  .from('accounts')
  .select('*')
  .eq('user_id', userId);
console.log('Accounts:', accounts); // Should have rows

// 3. If items exist but accounts don't → SYNC NEEDED
// Run: supabase functions invoke plaid-sync
```

---

## 🎯 Apply These Rules

### Before Every Code Change:
1. Read AGENTS.md (scope control rules)
2. Read this file (CRITICAL_RULES.md)
3. Check migrations for schema
4. Understand existing implementation
5. Test in isolation
6. Verify data exists
7. Don't assume anything

### When User Says "It's Broken":
1. **DON'T** immediately start coding
2. **DO** ask what specifically is broken
3. **DO** check console logs
4. **DO** verify data exists in database
5. **DO** understand root cause first
6. **THEN** make minimal fix
7. **THEN** test thoroughly

---

**Remember:** The user's time is valuable. Breaking things costs hours. Taking 5 extra minutes to understand saves 2 hours of debugging.

**When in doubt:** ASK. VERIFY. TEST. Don't guess.

