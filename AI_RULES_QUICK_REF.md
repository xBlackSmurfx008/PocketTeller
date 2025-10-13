# 🚨 AI RULES - QUICK REFERENCE

## Print This and Put It On Your Wall

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  "CHANGE BUTTON COLOR" = CHANGE 1 LINE OF CODE     │
│                                                     │
│  NOT:                                               │
│  - Refactor the component                          │
│  - Update other buttons                            │
│  - Optimize the logic                              │
│  - Add new features                                │
│  - Fix other "issues"                              │
│                                                     │
│  IF AI TOUCHES MORE THAN 1 FILE FOR A UI FIX:     │
│           🚨 SOMETHING IS WRONG 🚨                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Red Flags - AI is Overstepping:

| What You See | What It Means |
|--------------|---------------|
| "I'll refactor this while I'm here..." | ❌ STOP - Not asked |
| "Let me also update these components..." | ❌ STOP - Scope creep |
| "I'll modernize this code..." | ❌ STOP - Not needed |
| "I noticed we can optimize..." | ❌ STOP - Not asked |
| Changing 3+ files for "UI fix" | ❌ STOP - Too much |
| Adding new imports | ❌ STOP - Why? |
| Renaming variables | ❌ STOP - Not asked |

## What Good AI Behavior Looks Like:

✅ "I'll change line 47 in Auth.tsx from X to Y"
✅ "This is in the Login component, changing the className"
✅ "Updated 2 lines in AccountCard.tsx"
✅ "That requires touching 4 files - should I proceed?"

## Simple Test:

**Before AI makes ANY change, ask yourself:**

1. Did I explicitly ask for this change? **YES/NO**
2. Is this ONE file or component? **YES/NO**
3. Is this 1-10 lines of code? **YES/NO**

**If any answer is NO → AI should ASK FIRST**

## What To Say When AI Over-Engineers:

> "STOP. I asked for X, not Y. Undo everything and do ONLY what I asked."

## What To Say For Simple Fixes:

> "Make login button blue - ONLY change the button, nothing else"
> "Fix header padding - touch ONLY Header.tsx"
> "Update this text - ONE line change only"

---

**Remember: Your time is valuable. Simple fixes should be simple.**

**Working code > "Better" broken code**

