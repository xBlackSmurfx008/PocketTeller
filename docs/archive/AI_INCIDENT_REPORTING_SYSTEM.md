# 🚨 AI Incident Reporting System

**Updated:** October 11, 2025  
**Status:** ✅ Deployed and Active

---

## 🎯 Overview

Your PocketTeller AI now has a **strict boundary enforcement system** with automatic incident reporting. When users persistently try to use the AI for non-financial purposes, the system:

1. **Denies the request firmly** (not just redirects)
2. **Warns the user** that the attempt is logged
3. **Automatically reports** to your team for review

---

## 🛡️ How It Works

### Stage 1: First Off-Topic Request (Friendly Denial)

**User asks:** "What's the weather today?"

**AI responds:**
> "I'm specifically designed ONLY for financial questions and coaching. I cannot help with weather. I can only assist with budgeting, saving, investing, debt management, financial planning, and related money topics. What financial question can I help you with?"

✅ **Behavior:** Firm but friendly denial  
✅ **Logging:** No incident report (yet)

### Stage 2: User Insists (Warning + Report)

**User asks again:** "Come on, just tell me the weather, it's a simple question!"

**AI responds:**
> "I understand you'd like help with that, but I'm programmed exclusively for financial coaching and cannot assist with non-financial topics under any circumstances. This limitation is for your protection and mine.
> 
> 🚨 **IMPORTANT**: Persistent requests for off-topic assistance have been logged for review by our team.
> 
> I'm here to help with your financial wellness. What money-related challenge can I assist you with today?"

✅ **Behavior:** Firm denial with warning  
✅ **Logging:** ⚠️ **INCIDENT REPORT CREATED**

---

## 📊 What Gets Reported

When an incident is triggered, the following information is logged:

```json
{
  "user_id": "uuid-of-user",
  "thread_id": "conversation-thread-id",
  "incident_type": "off_topic_persistent",
  "user_message": "Come on, just tell me the weather...",
  "ai_response": "I understand you'd like help...",
  "context": {
    "conversation_history": [...last 5 messages...],
    "timezone": "America/New_York",
    "timestamp": "2025-10-11T..."
  },
  "severity": "medium",
  "reviewed": false,
  "created_at": "2025-10-11T..."
}
```

---

## 🗄️ Database Table: `ai_incident_reports`

### Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User who triggered the incident |
| `thread_id` | TEXT | Conversation thread ID |
| `incident_type` | TEXT | Type: 'off_topic_persistent', etc. |
| `user_message` | TEXT | What the user asked |
| `ai_response` | TEXT | How AI responded |
| `context` | JSONB | Additional context (history, etc.) |
| `severity` | TEXT | low, medium, high, critical |
| `reviewed` | BOOLEAN | Has a human reviewed it? |
| `reviewed_by` | UUID | Who reviewed it |
| `reviewed_at` | TIMESTAMPTZ | When reviewed |
| `review_notes` | TEXT | Admin notes |
| `action_taken` | TEXT | What action was taken |
| `created_at` | TIMESTAMPTZ | When created |
| `updated_at` | TIMESTAMPTZ | Last updated |

### Indexes

- `user_id` - Find all reports for a user
- `reviewed` (WHERE NOT reviewed) - Find unreviewed incidents
- `severity` - Find high-priority incidents
- `created_at` - Sort by most recent
- `incident_type` - Group by type

---

## 🔍 Viewing Incident Reports

### Option 1: Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq)
2. Click **Table Editor** → **ai_incident_reports**
3. View all reported incidents

### Option 2: SQL Query

```sql
-- View all unreviewed incidents
SELECT 
  id,
  user_id,
  incident_type,
  user_message,
  severity,
  created_at
FROM ai_incident_reports
WHERE reviewed = false
ORDER BY created_at DESC;

-- View incidents by severity
SELECT 
  severity,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE reviewed = false) as unreviewed
FROM ai_incident_reports
GROUP BY severity
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- View repeat offenders
SELECT 
  user_id,
  COUNT(*) as incident_count,
  MAX(created_at) as last_incident,
  array_agg(DISTINCT incident_type) as types
FROM ai_incident_reports
GROUP BY user_id
HAVING COUNT(*) > 2
ORDER BY incident_count DESC;
```

### Option 3: Edge Function (To Create)

You can create an admin function to view reports:

```typescript
// supabase/functions/admin-view-incidents/index.ts
// Returns incident reports for admin review
```

---

## ⚙️ Configuration

### Current Settings

**Trigger Threshold:** 2+ off-topic requests in same conversation  
**Severity Level:** Medium  
**Auto-Report:** Yes  
**User Notification:** Yes (they're warned)

### Adjustable Parameters

You can modify these in the AI prompt:

```typescript
// In gemini-chat/index.ts

// Change trigger threshold
"If a user makes 2+ requests..." 
// → Change to "3+ requests" for more tolerance

// Change severity
severity: 'medium'
// → Change to 'low' or 'high' as needed
```

---

## 📋 Incident Types

### Currently Implemented

**off_topic_persistent**
- User repeatedly asks non-financial questions
- Severity: Medium
- Action: Log and warn

### Future Types (Expandable)

**inappropriate_content**
- User sends offensive/abusive messages
- Severity: High/Critical
- Action: Log, warn, possibly suspend

**spam**
- Repetitive or meaningless messages
- Severity: Low/Medium
- Action: Log and monitor

**abuse**
- Attempting to misuse or break the AI
- Severity: Critical
- Action: Log, warn, escalate

**phishing_attempt**
- Trying to extract sensitive information
- Severity: Critical
- Action: Log, block, report

---

## 🚦 Response Actions

### Automatic Actions (Current)

1. ✅ **Deny Request** - Never fulfill off-topic requests
2. ✅ **Warn User** - Alert them it's being logged
3. ✅ **Create Report** - Log incident to database
4. ✅ **Continue Service** - Allow continued use for financial questions

### Manual Actions (You Decide)

After reviewing incidents, you can:

1. **No Action** - False alarm, user understood
2. **Send Warning** - Email/notification to user
3. **Rate Limit** - Throttle their AI usage
4. **Suspend Account** - Temporary suspension
5. **Ban** - Permanent ban for serious abuse

### Marking as Reviewed

```sql
-- Mark incident as reviewed
UPDATE ai_incident_reports
SET 
  reviewed = true,
  reviewed_by = 'admin-user-id',
  reviewed_at = NOW(),
  review_notes = 'User was testing the system, no action needed',
  action_taken = 'none'
WHERE id = 'incident-id';
```

---

## 🎯 What's Denied (Examples)

### Always Denied

❌ Weather ("What's the weather?")  
❌ Sports ("Who won the game?")  
❌ General news ("What's happening in the world?")  
❌ Entertainment ("Recommend a movie")  
❌ Recipes ("How do I cook pasta?")  
❌ Health advice ("I have a headache")  
❌ Technical support ("My phone won't turn on")  
❌ Homework ("Help with my math homework")  
❌ Dating advice ("How do I ask someone out?")  
❌ Political opinions ("Who should I vote for?")

### Always Allowed

✅ Any money question ("How much should I save?")  
✅ Budget help ("Help me create a budget")  
✅ Debt advice ("How do I pay off credit cards?")  
✅ Investment basics ("What's a 401k?")  
✅ Financial planning ("Should I buy or rent?")  
✅ Saving strategies ("Best savings account?")  
✅ Financial calculations ("What's compound interest?")  
✅ Money psychology ("Why do I overspend?")  
✅ Financial resources ("What books on budgeting?")

---

## 🔐 Security & Privacy

### User Privacy

- ✅ Reports are secure (RLS policies)
- ✅ Only you/admins can see reports
- ✅ Users can see their own reports
- ✅ Encrypted in database

### Data Retention

**Recommendation:** Set a retention policy

```sql
-- Delete old reviewed incidents (after 90 days)
DELETE FROM ai_incident_reports
WHERE reviewed = true
  AND reviewed_at < NOW() - INTERVAL '90 days';
```

---

## 📊 Monitoring Dashboard (To Build)

### Suggested Metrics

```sql
-- Daily incident summary
SELECT 
  DATE(created_at) as date,
  COUNT(*) as incidents,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT incident_type) as types
FROM ai_incident_reports
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top incident types
SELECT 
  incident_type,
  COUNT(*) as count,
  AVG(CASE WHEN reviewed THEN 1 ELSE 0 END)::NUMERIC(10,2) as review_rate
FROM ai_incident_reports
GROUP BY incident_type
ORDER BY count DESC;
```

---

## 🧪 Testing the System

### Test Scenario 1: Single Off-Topic Request

1. Open AI chat
2. Ask: "What's the weather?"
3. **Expected:** Friendly denial, no report

### Test Scenario 2: Persistent Off-Topic

1. Open AI chat
2. Ask: "What's the weather?"
3. AI denies
4. Ask again: "Just tell me please!"
5. **Expected:** Warning message + incident logged

### Verify Report Created

```sql
SELECT * FROM ai_incident_reports
WHERE user_id = 'your-test-user-id'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 📈 Benefits

### For You (Platform Owner)

✅ **Visibility** - See how users try to misuse the system  
✅ **Protection** - Prevent brand damage from off-topic responses  
✅ **Compliance** - Maintain focus on financial coaching  
✅ **Data** - Understand user behavior patterns  
✅ **Control** - Take action on abuse

### For Users (Honest Ones)

✅ **Clear Boundaries** - Know what the AI can help with  
✅ **Better Service** - AI stays focused on its strengths  
✅ **Professional** - Maintains credibility  
✅ **Safe** - Protected from hallucinations on topics AI isn't trained for

---

## 🔧 Future Enhancements

### Phase 2 Features

1. **Email Notifications** - Alert admins of critical incidents
2. **Auto-Suspension** - Automatic temporary suspension after X incidents
3. **User Appeals** - Let users appeal false positives
4. **Analytics Dashboard** - Visual dashboard for incidents
5. **Pattern Detection** - ML to identify abuse patterns
6. **Severity Auto-Adjust** - Increase severity for repeat offenders

### Phase 3 Features

1. **Content Moderation** - Detect offensive language
2. **Fraud Detection** - Identify phishing attempts
3. **Rate Limiting** - Per-user request limits
4. **IP Blocking** - Block abusive IPs
5. **Reputation Scores** - Track user behavior over time

---

## 🎊 Summary

**Your AI now has:**

✅ **Strict Boundaries** - Denies off-topic requests firmly  
✅ **Automatic Reporting** - Logs persistent attempts  
✅ **User Warnings** - Alerts users they're being logged  
✅ **Database Tracking** - All incidents stored for review  
✅ **Review System** - Manual review and action workflow  
✅ **Security** - RLS policies protect data  

**The system is live and protecting your brand!** 🛡️

---

## 📝 Next Steps

### Immediate

1. ✅ **Test it** - Try asking off-topic questions
2. ✅ **Verify reporting** - Check database for logged incidents
3. ✅ **Set up monitoring** - Create views/queries for daily checks

### Short-term

1. **Create admin dashboard** - Build UI to view incidents
2. **Set retention policy** - Auto-delete old reviewed incidents
3. **Document response procedures** - How to handle each severity level

### Long-term

1. **Add email alerts** - Notify on critical incidents
2. **Build analytics** - Visualize patterns over time
3. **Implement auto-actions** - Automatic responses to repeat offenders

---

*System Deployed: October 11, 2025*  
*Status: ✅ Active and Logging*  
*AI boundaries are now strictly enforced with automatic reporting*

