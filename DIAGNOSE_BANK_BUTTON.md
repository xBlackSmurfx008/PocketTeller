# Diagnose: Missing "Add Bank" Button

**Issue:** Bank connection card not showing on dashboard  
**Expected:** Should see "Connect Your Bank" card when no bank is connected  
**Status:** 🔍 INVESTIGATING

---

## 🔴 STEP 1: Check Console Logs (Most Important!)

I've added detailed logging to the Dashboard component. Follow these steps:

### For Web App:
1. Open your browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to **Console** tab
4. Navigate to `/home` (dashboard)
5. Look for these logs:

```
🔍 Dashboard: Checking Plaid connection...
📊 Dashboard: Plaid items query result: { data: ..., count: ... }
✅ or ❌ Dashboard: Setting hasPlaidToken = ...
🎨 Dashboard: Render conditions: { hasPlaidToken: ..., isDemo: ..., shouldShowBankCard: ... }
```

**CRITICAL:** Take a screenshot and share the console output. This will tell us exactly what's wrong.

### For Mobile App (iOS):
1. Connect device/simulator
2. Safari → Develop → [Your Device] → PocketTeller
3. Check Console tab for the same logs

### For Mobile App (Android):
1. Chrome → `chrome://inspect`
2. Find PocketTeller
3. Click "inspect"
4. Check Console

---

## 🟡 STEP 2: Check Your Account State

### 2A. Are You in Demo Mode?

**Check sessionStorage:**
```javascript
// In browser console, run:
JSON.parse(sessionStorage.getItem('demo-state'))
```

**Expected Result:**
```json
{
  "isDemo": false,  // ✅ Should be FALSE
  "promptsUsed": 0,
  "maxPrompts": 5,
  ...
}
```

**If `isDemo: true`**, that's the problem! The bank card is hidden in demo mode.

**Fix:**
```javascript
// In console:
sessionStorage.removeItem('demo-state');
// Then reload page
location.reload();
```

### 2B. Do You Have Old Bank Connections?

Run this in your browser console while logged in:

```javascript
// Check Supabase for plaid_items
const { createClient } = window.supabase || {};
if (createClient) {
  const supabase = createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_ANON_KEY'
  );
  
  const { data, error } = await supabase
    .from('plaid_items')
    .select('*');
  
  console.log('Your plaid_items:', data);
}
```

**Or check in Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Table Editor → `plaid_items`
4. Filter by your user_id
5. **If rows exist**, that's why the card isn't showing!

**Fix: Delete old connections:**
```sql
-- In Supabase SQL Editor
DELETE FROM plaid_items WHERE user_id = 'your-user-id';
DELETE FROM accounts WHERE user_id = 'your-user-id';
DELETE FROM transactions WHERE user_id = 'your-user-id';
```

---

## 🟢 STEP 3: Check Build Status

### Web App
```bash
# Rebuild the app
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
npm run build
npm run dev
```

### Mobile App (iOS)
```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller

# Clean and rebuild
rm -rf ios/App/App/public/*
npm run build
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx cap sync ios

# Open in Xcode
cd ios/App && open App.xcworkspace
# Then Cmd+R to run
```

### Mobile App (Android)
```bash
cd /Users/mr.adams/pockettellerxchanges/PocketTeller

# Clean and rebuild
npm run build
npx cap sync android
cd android && ./gradlew clean assembleDebug
```

---

## 🔵 STEP 4: Verify Component Rendering

Add this to your browser console to check if the component is in the DOM:

```javascript
// Check if Dashboard is rendering
document.querySelector('[data-tour-id="dashboard"]');
// Should return: <div class="bg-background" ...>

// Check for the bank card
document.querySelector('.border-primary\\/20');
// Should return the Card element if visible, null otherwise
```

---

## 📋 DIAGNOSTIC CHECKLIST

Run through this checklist and note results:

- [ ] **Console shows logs?**
  - [ ] ✅ Yes → What does it say?
  - [ ] ❌ No → Dashboard may not be loading

- [ ] **isDemo value?**
  - [ ] `false` ✅ (correct)
  - [ ] `true` ❌ (problem - exit demo mode)
  - [ ] `undefined` ⚠️ (check DemoProvider)

- [ ] **hasPlaidToken value?**
  - [ ] `false` ✅ (should show card)
  - [ ] `true` ❌ (problem - old data exists)

- [ ] **Database plaid_items count?**
  - [ ] 0 rows ✅ (should show card)
  - [ ] 1+ rows ❌ (problem - delete old data)

- [ ] **shouldShowBankCard in logs?**
  - [ ] `true` ✅ (card should render)
  - [ ] `false` ❌ (something blocking it)

- [ ] **Can you see Dashboard at all?**
  - [ ] ✅ Yes, but empty
  - [ ] ✅ Yes, shows other content
  - [ ] ❌ No, blank screen
  - [ ] ❌ No, error message

---

## 🛠️ QUICK FIXES

### Fix #1: Force Exit Demo Mode
```javascript
// Run in browser console
sessionStorage.removeItem('demo-state');
localStorage.clear();
location.reload();
```

### Fix #2: Clear All Bank Data
```sql
-- Run in Supabase SQL Editor
-- Replace 'YOUR_USER_ID' with your actual user ID

DELETE FROM transactions WHERE user_id = 'YOUR_USER_ID';
DELETE FROM accounts WHERE user_id = 'YOUR_USER_ID';
DELETE FROM plaid_items WHERE user_id = 'YOUR_USER_ID';
```

### Fix #3: Reset Component State
```javascript
// Run in browser console while on dashboard
// This forces a re-check
window.location.href = '/home';
```

### Fix #4: Clear Browser Cache
```bash
# Chrome/Edge
Cmd+Shift+Delete → Clear cache

# Safari
Cmd+Option+E → Empty Caches

# Then hard refresh
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

---

## 🎯 EXPECTED BEHAVIOR

When working correctly, you should see:

### Console Logs:
```
🔍 Dashboard: Checking Plaid connection... { hasUser: true, userId: "...", isDemo: false }
📊 Dashboard: Plaid items query result: { data: [], count: 0, hasError: false }
❌ Dashboard: Setting hasPlaidToken = false (no banks found)
🎨 Dashboard: Render conditions: { 
  hasPlaidToken: false, 
  isDemo: false, 
  shouldShowBankCard: true,    ← ✅ This should be TRUE
  shouldShowAccountTabs: false,
  shouldShowDemoMode: false 
}
```

### Visual UI:
```
┌─────────────────────────────────────┐
│                                     │
│        🏢 [Building Icon]           │
│                                     │
│      Connect Your Bank              │
│                                     │
│  Choose from 12,000+ financial      │
│  institutions. New banks added      │
│  weekly.                            │
│                                     │
│  🔒 Bank-level encryption •         │
│     Your data stays yours           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     Connect Bank            │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 📞 REPORTING RESULTS

Please share:

1. **Console logs** (screenshot or copy-paste)
2. **Checklist results** (which items passed/failed)
3. **What you see** (screenshot of dashboard)
4. **Platform** (Web/iOS/Android)
5. **Any error messages**

With this info, I can identify the exact issue and fix it.

---

## 🔍 COMMON ISSUES & SOLUTIONS

| Symptom | Cause | Fix |
|---------|-------|-----|
| `shouldShowBankCard: false` | hasPlaidToken is true | Delete old plaid_items |
| `shouldShowBankCard: false` | isDemo is true | Exit demo mode |
| No console logs at all | Dashboard not rendering | Check routing/auth |
| `hasPlaidToken: true` but no banks visible | Stale data in database | Clear plaid_items table |
| Dashboard is completely empty | CSS issue or wrong route | Check network tab |
| Console shows errors | Supabase connection issue | Check API keys |

---

**Next Steps:** Run through Steps 1-4 above and report your findings!

