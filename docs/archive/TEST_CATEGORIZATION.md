# 🧪 Transaction Categorization Testing Guide

**Date:** October 12, 2025  
**Purpose:** Test all categorization fixes end-to-end

---

## ✅ Pre-Testing Checklist

Before testing, ensure:
- [ ] Code changes have been applied to `RecentTransactions.tsx`
- [ ] Edge Function `ai-categorize-transactions` has been updated
- [ ] Edge Function has been deployed: `supabase functions deploy ai-categorize-transactions`
- [ ] No linter errors exist
- [ ] Web app builds successfully: `npm run build`

---

## 🧪 Test Scenarios

### **Test 1: Button States**

**Expected Behavior:**
- When all transactions categorized → Button shows "All Categorized ✓" and is disabled
- When N transactions uncategorized → Button shows "AI Categorize (N)"
- When button clicked → Shows "AI Categorizing..." with spinning icon
- During processing → Button is disabled to prevent duplicate clicks

**Steps:**
1. Navigate to `/transactions` page
2. Observe button text
3. Click button (if enabled)
4. Observe loading state
5. Wait for completion

**Pass Criteria:**
✅ Button text accurately reflects uncategorized count  
✅ Button disabled when no uncategorized transactions  
✅ Loading state visible during processing  
✅ Cannot click button multiple times  

---

### **Test 2: AI Categorization Flow**

**Expected Behavior:**
- Only processes transactions with `category_source = 'auto'` or `null`
- Only applies categories with ≥70% confidence
- Shows clear success message with statistics
- Refreshes transaction list after completion

**Steps:**
1. Create or find transactions with category "Other"
2. Click "AI Categorize" button
3. Wait for AI processing
4. Check results

**Pass Criteria:**
✅ Toast shows "🤖 AI Categorization Started"  
✅ AI processes only uncategorized transactions  
✅ Success toast shows count of categorized transactions  
✅ Low confidence transactions remain uncategorized  
✅ Transaction list refreshes automatically  

---

### **Test 3: Manual Categorization Priority**

**Expected Behavior:**
- Manual category changes set `category_source = 'user'`
- User categorizations never overwritten by AI
- User categorizations never overwritten by Plaid sync

**Steps:**
1. Manually change a transaction category using dropdown
2. Run AI categorization
3. Run Plaid sync (if possible)
4. Verify transaction category unchanged

**Pass Criteria:**
✅ Manual update sets `category_source = 'user'`  
✅ AI categorization skips user-categorized transactions  
✅ Plaid sync respects user categorizations  

---

### **Test 4: Error Handling**

**Expected Behavior:**
- Rate limiting → Clear message "Try again in a few minutes"
- Session expired → "Refresh the page"
- API unavailable → "Try again later"
- All errors provide actionable guidance

**Steps:**
1. Trigger various error scenarios (if possible):
   - Rate limit: Call AI multiple times rapidly
   - Session expired: Wait for token expiry
   - API error: Temporarily break API key (in dev only)
2. Observe error messages

**Pass Criteria:**
✅ Error messages are specific and actionable  
✅ No generic "Unknown error" messages  
✅ Users know what action to take  

---

### **Test 5: No Auto-Run on Page Load**

**Expected Behavior:**
- Page loads without triggering AI categorization
- No automatic API calls made
- User must explicitly click button

**Steps:**
1. Navigate to `/transactions` page
2. Observe network tab in DevTools
3. Wait 5 seconds
4. Check for any AI categorization API calls

**Pass Criteria:**
✅ No `ai-categorize-transactions` calls on page load  
✅ No automatic categorization happens  
✅ Button must be clicked to trigger categorization  

---

### **Test 6: Bulk Operations**

**Expected Behavior:**
- Bulk category updates set `category_source = 'user'`
- Multiple transactions updated at once
- Success message shows count

**Steps:**
1. Select multiple transactions using checkboxes
2. Choose category from bulk update dropdown
3. Verify all transactions updated
4. Check that `category_source = 'user'`

**Pass Criteria:**
✅ All selected transactions updated  
✅ Category source set to 'user'  
✅ Success message accurate  
✅ Selection cleared after update  

---

### **Test 7: Confidence Threshold**

**Expected Behavior:**
- Only categories with ≥70% confidence applied
- Low confidence transactions logged but not updated
- User informed about skipped transactions

**Steps:**
1. Add transactions with ambiguous descriptions
2. Run AI categorization
3. Check results and logs

**Pass Criteria:**
✅ High confidence (≥70%) transactions categorized  
✅ Low confidence (<70%) transactions skipped  
✅ Message indicates how many were skipped  
✅ Console logs show confidence scores  

---

### **Test 8: Category Source Hierarchy**

**Expected Behavior:**
- Priority respected: user > plaid > ai > auto
- Each source only updates appropriate transactions

**Steps:**
1. Create transactions with different `category_source` values:
   - `user`: Manual categorization
   - `plaid`: From Plaid API
   - `ai`: From AI categorization
   - `auto`: Default/unknown
2. Run AI categorization
3. Verify only `auto` transactions updated

**Pass Criteria:**
✅ `user` transactions never touched  
✅ `plaid` transactions never touched  
✅ `ai` transactions never re-categorized  
✅ `auto` transactions successfully categorized  

---

## 🔍 Database Verification

After testing, verify in Supabase dashboard:

```sql
-- Check category source distribution
SELECT 
  category_source, 
  COUNT(*) as count 
FROM transactions 
WHERE user_id = 'YOUR_USER_ID'
GROUP BY category_source;

-- Check AI categorizations
SELECT 
  description, 
  category, 
  category_source, 
  category_confidence,
  category_reason
FROM transactions 
WHERE user_id = 'YOUR_USER_ID'
  AND category_source = 'ai'
ORDER BY date DESC
LIMIT 10;

-- Check uncategorized transactions
SELECT 
  description, 
  category, 
  category_source
FROM transactions 
WHERE user_id = 'YOUR_USER_ID'
  AND (category = 'Other' OR category IS NULL)
  AND (category_source = 'auto' OR category_source IS NULL)
LIMIT 10;
```

---

## 📊 Expected Results Summary

| Test | Expected Result | Status |
|------|----------------|--------|
| Button States | Dynamic text, disabled when appropriate | ⏳ |
| AI Flow | Processes only uncategorized, ≥70% confidence | ⏳ |
| Manual Priority | User categorizations never overwritten | ⏳ |
| Error Handling | Clear, actionable error messages | ⏳ |
| No Auto-Run | No API calls on page load | ⏳ |
| Bulk Operations | All selected updated with `user` source | ⏳ |
| Confidence Threshold | Only high confidence applied | ⏳ |
| Source Hierarchy | Respects user > plaid > ai > auto | ⏳ |

---

## 🐛 Known Issues (if any)

None expected. If issues found during testing, document here:
- [ ] Issue 1: (description)
- [ ] Issue 2: (description)

---

## ✅ Sign-Off

**Testing completed by:** _______________  
**Date:** _______________  
**All tests passed:** [ ] Yes [ ] No  
**Notes:** _______________

---

*Ready for production deployment!* 🚀

