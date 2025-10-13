# Android Bugs & Issues Tracker
## PocketTeller Android App Testing

**Created:** October 13, 2025  
**Purpose:** Track all bugs found during Android testing

---

## 🐛 Bug Template

```markdown
## Bug #X: [Brief Description]

**Severity:** P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)
**Status:** Open / In Progress / Fixed / Won't Fix
**Platform:** Android [Version], [Device Model]
**Discovered:** [Date]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots/Logs:**
[Attach if available]

**Fix:**
[Description of fix, if implemented]

**Tested:** ❌ / ✅
```

---

## 📊 Bug Summary

**Total Bugs:** 0  
**Critical (P0):** 0  
**High (P1):** 0  
**Medium (P2):** 0  
**Low (P3):** 0  
**Fixed:** 0  
**Open:** 0

---

## 🔴 Critical Bugs (P0)

None yet - Start testing!

---

## 🟡 High Priority Bugs (P1)

None yet

---

## 🟢 Medium Priority Bugs (P2)

None yet

---

## ⚪ Low Priority Bugs (P3)

None yet

---

## ✅ Fixed Bugs

None yet

---

## 📝 Testing Notes

### Session 1: Permissions Added
- Added camera permission to AndroidManifest.xml
- Added storage/media permissions
- **Next:** Build and test

---

## 🎯 Bug Filing Guidelines

### Priority Levels

**P0 (Critical)** - Blocks core functionality:
- App crashes on launch
- Cannot login/signup
- Cannot connect bank
- Cannot view transactions
- Camera doesn't work (for AI upload)

**P1 (High)** - Degrades experience:
- Feature doesn't work correctly
- UI rendering issues
- Navigation problems
- Slow performance

**P2 (Medium)** - Minor issues:
- Visual glitches
- Minor UI inconsistencies
- Non-critical feature bugs

**P3 (Low)** - Nice to have:
- Cosmetic issues
- Enhancement requests
- Edge cases

---

## 📞 Need Help?

If you find a bug:
1. Document it using the template above
2. Add to appropriate priority section
3. Update bug summary counts
4. Screenshot or record video if possible
5. Check Chrome DevTools console for errors (chrome://inspect)
6. Check Android Logcat: `adb logcat | grep PocketTeller`

---

**Last Updated:** October 13, 2025  
**Status:** Ready for bug reports  
**Current Phase:** Initial testing after permission fix

