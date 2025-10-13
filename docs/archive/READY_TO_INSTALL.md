# Ready to Install - Plaid Fixed Version

**APK Location:** `/Users/mr.adams/pockettellerxchanges/PocketTeller/android/app/build/outputs/apk/debug/app-debug.apk`

**Also on Desktop:** `~/Desktop/PocketTeller-Updated.apk`

---

## What's Fixed

1. Plaid connection (simplified, working version)
2. hasPlaidToken check (now uses plaid_items table)
3. Dashboard rendering logic (welcome card → tabs)
4. Learning button (moved to chat window)

---

## Install Commands (Run in Terminal)

```bash
# Uninstall old
~/Library/Android/sdk/platform-tools/adb uninstall com.pocketteller.app

# Install new
~/Library/Android/sdk/platform-tools/adb install /Users/mr.adams/pockettellerxchanges/PocketTeller/android/app/build/outputs/apk/debug/app-debug.apk

# Launch
~/Library/Android/sdk/platform-tools/adb shell am start -n com.pocketteller.app/.MainActivity
```

Or use the APK on Desktop with Google Drive/email method.

---

## Expected Behavior

1. App opens → Auth page
2. Sign in → Dashboard with welcome card
3. Click "Connect Bank" → Plaid modal opens
4. Select bank → Login → Click Continue
5. Connection saves → Account tabs appear
6. Can add more banks with "Add Bank" button
7. Learning button shows in chat (not bottom toolbar)

