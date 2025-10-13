# Bank Features - Quick Reference Guide

## 🎯 Where to Find Everything

### Connect Your First Bank
```
Location: Dashboard (/home)
When: No banks connected yet
What: Large welcome card with "Connect Bank" button
```

### Add Another Bank
```
Location: Dashboard (/home) OR Transactions (/transactions)
Button: Plus (+) icon in the account tabs row
Limit: Up to 3 banks total
```

### Sync All Banks
```
Location: Any "Add Bank" dialog
Button: "Sync" button (appears after first bank connected)
Action: Syncs transactions from all connected banks
```

### Disconnect a Bank
```
Location: Account/Settings page (/account)
Component: Connected Banks card
Button: Trash icon on specific bank
Note: Confirmation dialog appears before deletion
```

### View Account Details
```
Location: Account/Settings page (/account)
Component: Connected Banks card
Shows: All accounts, balances, connection time
```

### Filter by Account
```
Location: Dashboard (/home) OR Transactions (/transactions)
Buttons: ALL | Acct 1 | Acct 2 | etc.
Action: Click to filter dashboard/transactions by specific account
```

---

## 🔧 Components & Their Jobs

| Component | Job | Location |
|-----------|-----|----------|
| **PlaidLink** | Connect & Sync banks | Dashboard + Transactions dialogs |
| **ConnectedAccountsList** | View & Disconnect banks | Account/Settings page |
| **AccountViewTabs** | Filter by account + Add Bank button | Dashboard + Transactions |

---

## 🚦 Button Functions

| Button | What It Does | Where It Is |
|--------|--------------|-------------|
| Connect Bank | Opens Plaid to connect first bank | Dashboard welcome card |
| Add Bank | Opens Plaid to connect additional bank | Add Bank dialogs |
| Sync | Syncs transactions from all banks | Add Bank dialogs |
| Plus (+) | Opens Add Bank dialog | Account tabs (if slots available) |
| Trash | Disconnects specific bank | Account/Settings page |
| Refresh | Refreshes bank list | Account/Settings page |

---

## ✅ All Systems Verified

- ✅ Connect functionality working
- ✅ Sync functionality working
- ✅ Disconnect functionality working (per bank)
- ✅ Multi-bank support (up to 3)
- ✅ Account filtering working
- ✅ All buttons properly wired
- ✅ No breaking changes
- ✅ Build successful

---

## 📝 Key Design Principles

1. **PlaidLink = Connect & Sync** (global actions)
2. **ConnectedAccountsList = View & Disconnect** (per-bank actions)
3. **AccountViewTabs = Filter & Add** (navigation + quick add)

---

**Everything is wired correctly and ready to use!**

