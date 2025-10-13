# Backend Integration Inventory
## Complete Frontend-to-Backend Connections & API Bridges

**Created:** October 13, 2025  
**Purpose:** Document ALL backend connections needed for feature parity  
**Critical:** Android and Web MUST implement all these connections

---

## 📊 Overview

### Backend Services Required
- ✅ **Supabase PostgreSQL** - 20+ tables with RLS
- ✅ **Supabase Auth** - Authentication & session management
- ✅ **Supabase Edge Functions** - 32 serverless endpoints
- ✅ **Supabase Storage** - File uploads (documents, receipts)
- ✅ **Supabase Realtime** - Live data subscriptions
- ✅ **Plaid API** - Bank account connections
- ✅ **Stripe API** - Subscription billing
- ✅ **Google Gemini AI** - Financial coaching
- ✅ **Email/SMS APIs** - Notifications and sharing

---

## 🗄️ DATABASE TABLES (20+ Tables)

### Core Tables (Direct Frontend Queries)

#### 1. **profiles** Table
**Purpose:** User profile and encrypted Plaid tokens

**Frontend Queries:**
```typescript
// From: src/hooks/useAuth.tsx, Dashboard components
await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

**Columns:**
- `id` (uuid, primary key)
- `email` (text)
- `full_name` (text)
- `avatar_url` (text)
- `encrypted_plaid_token` (bytea) - AES-256-GCM encrypted
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Android/Web Requirements:**
- [ ] Query user profile on login
- [ ] Update profile (name, avatar)
- [ ] Handle encrypted Plaid tokens securely
- [ ] RLS policy: Users can only access their own profile

---

#### 2. **accounts** Table
**Purpose:** Connected bank accounts with balances

**Frontend Queries:**
```typescript
// From: src/hooks/useConnectedAccounts.tsx, Dashboard
await supabase
  .from('accounts')
  .select('id, plaid_account_id, name, official_name, type, subtype, mask, available_balance, current_balance, currency_code')
  .eq('user_id', user.id)
  .eq('plaid_item_id', itemId);
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `plaid_account_id` (text)
- `plaid_item_id` (text)
- `name` (text)
- `official_name` (text)
- `type` (text) - depository, credit, loan, investment
- `subtype` (text) - checking, savings, credit card
- `mask` (text) - Last 4 digits
- `available_balance` (numeric)
- `current_balance` (numeric)
- `currency_code` (text)
- `credit_limit` (numeric, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Android/Web Requirements:**
- [ ] Fetch all user accounts
- [ ] Display current and available balances
- [ ] Handle multiple account types
- [ ] Update balances after Plaid sync
- [ ] RLS policy: Users can only see their accounts

---

#### 3. **transactions** Table
**Purpose:** All financial transactions (from Plaid + manual)

**Frontend Queries:**
```typescript
// From: src/hooks/useTransactions.tsx, Transactions page
await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', user.id)
  .order('date', { ascending: false });

// Filter by date range
await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', user.id)
  .gte('date', startDate)
  .lte('date', endDate);

// Filter by category
await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', user.id)
  .eq('category', categoryName);
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `plaid_transaction_id` (text, optional)
- `plaid_account_id` (text, optional)
- `account_id` (uuid, foreign key)
- `amount` (numeric)
- `date` (date)
- `name` (text) - Merchant/description
- `merchant_name` (text, optional)
- `category` (text[]) - Array of categories
- `category_source` (text) - 'user', 'plaid', 'ai', 'auto'
- `user_category` (text, optional) - User override
- `pending` (boolean)
- `iso_currency_code` (text)
- `transaction_type` (text) - 'income', 'expense'
- `payment_channel` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Android/Web Requirements:**
- [ ] Fetch all transactions with filters
- [ ] Create manual transactions
- [ ] Update transactions (category override)
- [ ] Delete transactions
- [ ] Bulk categorization
- [ ] Infinite scroll/pagination
- [ ] Real-time updates (optional)
- [ ] RLS policy: Users can only manage their transactions

---

#### 4. **budget** Table
**Purpose:** Monthly budget planning

**Frontend Queries:**
```typescript
// From: src/hooks/useBudgetData.tsx, Budget page
await supabase
  .from('budget')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .maybeSingle();
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `month` (text) - YYYY-MM format
- `income` (numeric)
- `categories` (jsonb) - {category: plannedAmount}
- `status` (text) - 'active', 'archived'
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Android/Web Requirements:**
- [ ] Fetch active budget
- [ ] Create budget
- [ ] Update budget categories
- [ ] Archive old budgets
- [ ] Calculate budget vs actual
- [ ] RLS policy: Users can only manage their budgets

---

#### 5. **goals** Table
**Purpose:** Financial goals tracking

**Frontend Queries:**
```typescript
// From: src/hooks/useGoals.tsx, Goals page
await supabase
  .from('goals')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `title` (text)
- `description` (text, optional)
- `target_amount` (numeric)
- `current_amount` (numeric)
- `target_date` (date, optional)
- `category` (text)
- `status` (text) - 'active', 'completed', 'cancelled'
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Android/Web Requirements:**
- [ ] Fetch all goals
- [ ] Create goal
- [ ] Update goal progress
- [ ] Mark goal complete
- [ ] Delete goal
- [ ] Calculate progress percentage
- [ ] RLS policy: Users can only manage their goals

---

#### 6. **goal_tasks** Table
**Purpose:** Tasks for achieving goals

**Frontend Queries:**
```typescript
// From: src/hooks/useGoals.tsx (within goals)
await supabase
  .from('goal_tasks')
  .select('*')
  .eq('goal_id', goalId)
  .order('created_at', { ascending: true });
```

**Columns:**
- `id` (uuid, primary key)
- `goal_id` (uuid, foreign key)
- `user_id` (uuid, foreign key)
- `description` (text)
- `completed` (boolean)
- `due_date` (date, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Android/Web Requirements:**
- [ ] Fetch tasks for goal
- [ ] Create task
- [ ] Toggle task completion
- [ ] Delete task
- [ ] RLS policy: Users can only manage their tasks

---

#### 7. **bills** Table
**Purpose:** Recurring bills and payment tracking

**Frontend Queries:**
```typescript
// From: src/hooks/useBills.tsx, Bills widgets
await supabase
  .from('bills')
  .select('*')
  .eq('user_id', user.id)
  .order('due_date', { ascending: true });
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `name` (text)
- `amount` (numeric)
- `due_date` (date)
- `recurring` (boolean)
- `frequency` (text) - 'monthly', 'weekly', 'yearly'
- `category` (text)
- `paid` (boolean)
- `auto_pay` (boolean)
- `notes` (text, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Android/Web Requirements:**
- [ ] Fetch all bills
- [ ] Create bill
- [ ] Update bill
- [ ] Mark bill as paid
- [ ] Delete bill
- [ ] Filter upcoming bills
- [ ] RLS policy: Users can only manage their bills

---

#### 8. **conversations** Table
**Purpose:** AI chat message history

**Frontend Queries:**
```typescript
// From: src/hooks/useConversation.tsx, AI Coach
await supabase
  .from('conversations')
  .select('*')
  .eq('user_id', user.id)
  .eq('thread_id', threadId)
  .order('created_at', { ascending: true });
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `thread_id` (uuid, foreign key)
- `role` (text) - 'user', 'assistant'
- `content` (text)
- `model` (text)
- `tokens_used` (integer, optional)
- `created_at` (timestamp)

**Android/Web Requirements:**
- [ ] Fetch conversation history
- [ ] Store new messages (after AI response)
- [ ] Group by thread_id
- [ ] Support pagination for long conversations
- [ ] RLS policy: Users can only see their conversations

---

#### 9. **conversation_threads** Table
**Purpose:** Conversation thread metadata

**Frontend Queries:**
```typescript
// From: src/hooks/useConversation.tsx, Conversation list
await supabase
  .from('conversation_threads')
  .select('*')
  .eq('user_id', user.id)
  .order('updated_at', { ascending: false });
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `title` (text)
- `preview` (text, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Android/Web Requirements:**
- [ ] Fetch all conversation threads
- [ ] Create new thread
- [ ] Update thread title
- [ ] Delete thread (cascade deletes conversations)
- [ ] RLS policy: Users can only manage their threads

---

#### 10. **plaid_items** Table
**Purpose:** Plaid bank connection metadata

**Frontend Queries:**
```typescript
// From: src/hooks/useConnectedAccounts.tsx, Banking settings
await supabase
  .from('plaid_items')
  .select('id, item_id, institution_name, institution_id, created_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: true });
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `item_id` (text) - Plaid item ID
- `institution_id` (text)
- `institution_name` (text)
- `access_token_encrypted` (bytea) - Encrypted
- `cursor` (text, optional) - For transaction sync
- `status` (text) - 'active', 'error', 'disconnected'
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Android/Web Requirements:**
- [ ] Fetch connected banks
- [ ] Track sync status
- [ ] Handle connection errors
- [ ] Disconnect bank (via Edge Function)
- [ ] RLS policy: Users can only see their connections

---

#### 11. **subscriptions** Table
**Purpose:** Stripe subscription status

**Frontend Queries:**
```typescript
// From: src/hooks/useSubscription.tsx (via Edge Function)
// Note: Queried through stripe-check-subscription function
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `stripe_customer_id` (text)
- `stripe_subscription_id` (text)
- `status` (text) - 'active', 'canceled', 'past_due', etc.
- `plan_type` (text) - 'monthly', 'yearly'
- `current_period_start` (timestamp)
- `current_period_end` (timestamp)
- `cancel_at_period_end` (boolean)
- `trial_end` (timestamp, optional)
- `free_months_remaining` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Android/Web Requirements:**
- [ ] Check subscription status (via Edge Function)
- [ ] Display plan details
- [ ] Show trial remaining
- [ ] Handle subscription states
- [ ] RLS policy: Users can only see their subscription

---

#### 12. **user_suggestions** Table
**Purpose:** Product suggestions for referral rewards

**Frontend Queries:**
```typescript
// From: src/hooks/useSubscription.tsx (via Edge Function)
// Created through stripe-apply-referral-credit function
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `title` (text)
- `description` (text)
- `category` (text, optional)
- `status` (text) - 'pending', 'approved', 'implemented'
- `credited` (boolean)
- `created_at` (timestamp)

**Android/Web Requirements:**
- [ ] Submit suggestions (via Edge Function)
- [ ] Track credited suggestions
- [ ] RLS policy: Users can only see their suggestions

---

#### 13. **budget_shares** Table
**Purpose:** Shared budget tokens

**Frontend Queries:**
```typescript
// From: src/pages/SharedBudget.tsx, ShareBudgetDialog
await supabase
  .from('budget_shares')
  .select('*')
  .eq('token', shareToken)
  .single();
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `token` (uuid) - Unique share link token
- `budget_data` (jsonb) - Snapshot of budget
- `expires_at` (timestamp, optional)
- `created_at` (timestamp)

**Android/Web Requirements:**
- [ ] Create share token (via Edge Function)
- [ ] Fetch shared budget by token (public access)
- [ ] RLS policy: Token-based access for public

---

### Additional Tables (Used by Backend)

#### 14. **plaid_token_audit_log**
- Security logging for Plaid token access
- No direct frontend queries

#### 15. **share_send_log**
- Audit trail for budget sharing
- No direct frontend queries

#### 16. **site_metrics**
- Application usage statistics
- **Frontend Query:**
  ```typescript
  await supabase
    .from('site_metrics')
    .select('total_users, total_budgets, total_transactions')
    .eq('id', 1)
    .maybeSingle();
  ```

#### 17. **ai_incident_reports**
- Log off-topic AI requests
- Created by gemini-chat Edge Function

#### 18. **notifications** (if implemented)
- In-app notification storage
- **Frontend Query:**
  ```typescript
  await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  ```

---

## 🔌 SUPABASE EDGE FUNCTIONS (32 Endpoints)

### Authentication Functions

#### 1. **send-magic-link**
**Purpose:** Send magic link for passwordless login

**Called From:**
- `src/pages/Auth.tsx`

**Request:**
```typescript
await supabase.functions.invoke('send-magic-link', {
  body: { email: 'user@example.com' }
});
```

**Response:**
```typescript
{ success: true, message: 'Magic link sent' }
```

**Android/Web Requirements:**
- [ ] Implement in login flow
- [ ] Handle success/error states
- [ ] Show "Check your email" message

---

### Plaid Integration Functions

#### 2. **plaid-link-token** / **plaid-link-token-v2**
**Purpose:** Generate Plaid Link token for bank connection

**Called From:**
- `src/components/PlaidLink.tsx`

**Request:**
```typescript
const { data } = await supabase.functions.invoke('plaid-link-token-v2');
```

**Response:**
```typescript
{ 
  link_token: 'link-sandbox-abc123...',
  expiration: '2025-10-13T12:00:00Z'
}
```

**Android/Web Requirements:**
- [ ] Generate link token before showing Plaid Link
- [ ] Pass to Plaid SDK
- [ ] Handle token expiration

---

#### 3. **plaid-link-exchange** / **plaid-link-exchange-v2**
**Purpose:** Exchange Plaid public token for access token

**Called From:**
- `src/components/PlaidLink.tsx` (onSuccess callback)

**Request:**
```typescript
await supabase.functions.invoke('plaid-link-exchange-v2', {
  body: { 
    public_token: 'public-sandbox-xyz...',
    institution_id: 'ins_123',
    institution_name: 'Chase Bank'
  }
});
```

**Response:**
```typescript
{ 
  success: true,
  item_id: 'item-abc123',
  accounts_count: 3
}
```

**Android/Web Requirements:**
- [ ] Call after successful Plaid Link
- [ ] Store item_id for reference
- [ ] Trigger account sync
- [ ] Show success message

---

#### 4. **plaid-sync** / **plaid-sync-v2**
**Purpose:** Sync transactions from Plaid

**Called From:**
- `src/components/TransactionSyncButton.tsx`
- Automatic after bank connection

**Request:**
```typescript
await supabase.functions.invoke('plaid-sync-v2', {
  body: { item_id: 'item-abc123' }
});
```

**Response:**
```typescript
{ 
  success: true,
  new_transactions: 45,
  updated_transactions: 3
}
```

**Android/Web Requirements:**
- [ ] Manual sync button
- [ ] Auto-sync after connection
- [ ] Show sync progress
- [ ] Update UI after sync

---

#### 5. **plaid-disconnect** / **plaid-disconnect-v2**
**Purpose:** Disconnect bank account

**Called From:**
- `src/pages/BankingSettings.tsx`
- `src/components/ConnectedAccountsList.tsx`

**Request:**
```typescript
await supabase.functions.invoke('plaid-disconnect-v2', {
  body: { item_id: 'item-abc123' }
});
```

**Response:**
```typescript
{ success: true, message: 'Bank disconnected' }
```

**Android/Web Requirements:**
- [ ] Disconnect button in settings
- [ ] Confirmation dialog
- [ ] Update UI after disconnect

---

#### 6. **plaid-check-limit**
**Purpose:** Check if user can connect more banks (free tier limit: 3)

**Called From:**
- `src/components/PlaidLink.tsx` (before showing Plaid Link)

**Request:**
```typescript
await supabase.functions.invoke('plaid-check-limit');
```

**Response:**
```typescript
{ 
  can_connect: true,
  current_count: 2,
  max_connections: 3,
  remaining_slots: 1
}
```

**Android/Web Requirements:**
- [ ] Check before bank connection
- [ ] Show limit reached message
- [ ] Offer upgrade to Pro

---

#### 7. **plaid-list-accounts**
**Purpose:** List all connected accounts for user

**Called From:**
- Dashboard, Account selector

**Request:**
```typescript
await supabase.functions.invoke('plaid-list-accounts');
```

**Response:**
```typescript
{ 
  accounts: [
    {
      id: 'uuid',
      name: 'Chase Checking',
      balance: 5234.56,
      type: 'depository',
      mask: '1234'
    }
  ]
}
```

**Android/Web Requirements:**
- [ ] Fetch on dashboard load
- [ ] Display in account selector
- [ ] Show balances

---

#### 8. **plaid-webhook**
**Purpose:** Handle Plaid webhooks (server-side only)

**Called From:** Plaid servers (webhook URL)

**Android/Web:** No direct call needed

---

### AI Functions

#### 9. **gemini-chat**
**Purpose:** Financial coaching with AI

**Called From:**
- `src/hooks/useConversation.tsx`
- `src/pages/ConversationalAI.tsx`

**Request:**
```typescript
await supabase.functions.invoke('gemini-chat', {
  body: {
    message: 'How can I save more money?',
    threadId: 'uuid',
    coachMode: true,
    attachments: [
      { name: 'receipt.pdf', type: 'application/pdf', url: 'https://...' }
    ]
  }
});
```

**Response:**
```typescript
{
  response: 'AI response text...',
  educationSuggestions: [
    {
      title: 'Budgeting Basics',
      description: '...',
      category: 'budgeting',
      url: 'https://...'
    }
  ]
}
```

**Android/Web Requirements:**
- [ ] Send user messages to AI
- [ ] Handle file attachments
- [ ] Display AI responses
- [ ] Show education suggestions
- [ ] Handle streaming responses (if implemented)
- [ ] Detect off-topic (AI handles this server-side)

---

#### 10. **ai-categorize-transactions**
**Purpose:** Bulk categorize transactions with AI

**Called From:**
- `src/pages/Transactions.tsx` (bulk action)
- `src/hooks/useTransactions.tsx`

**Request:**
```typescript
await supabase.functions.invoke('ai-categorize-transactions', {
  body: {
    transaction_ids: ['uuid1', 'uuid2', 'uuid3']
  }
});
```

**Response:**
```typescript
{
  success: true,
  categorized_count: 3,
  categories: {
    'uuid1': 'Groceries',
    'uuid2': 'Transportation',
    'uuid3': 'Entertainment'
  }
}
```

**Android/Web Requirements:**
- [ ] Bulk categorize button
- [ ] Select transactions to categorize
- [ ] Show progress indicator
- [ ] Update transactions after categorization

---

#### 11. **ai-spending-insights**
**Purpose:** Generate spending insights and recommendations

**Called From:**
- `src/components/SpendingInsights.tsx`
- Dashboard widgets

**Request:**
```typescript
await supabase.functions.invoke('ai-spending-insights', {
  body: {
    month: '2025-10',
    includeComparisons: true
  }
});
```

**Response:**
```typescript
{
  insights: [
    {
      type: 'high_spending',
      category: 'Dining Out',
      amount: 450.00,
      recommendation: 'Consider meal prepping...'
    }
  ],
  summary: 'Your spending this month...'
}
```

**Android/Web Requirements:**
- [ ] Fetch insights for dashboard
- [ ] Display in widgets
- [ ] Show recommendations
- [ ] Allow monthly comparisons

---

### Stripe Functions

#### 12. **stripe-check-subscription**
**Purpose:** Check user's subscription status

**Called From:**
- `src/hooks/useSubscription.tsx`

**Request:**
```typescript
await supabase.functions.invoke('stripe-check-subscription');
```

**Response:**
```typescript
{
  hasSubscription: true,
  isActive: true,
  isPro: true,
  status: 'active',
  planType: 'yearly',
  trialDaysRemaining: 0,
  currentPeriodEnd: '2026-01-01T00:00:00Z',
  cancelAtPeriodEnd: false,
  freeMonthsRemaining: 2,
  referralCredits: 150.00
}
```

**Android/Web Requirements:**
- [ ] Check on app load
- [ ] Display in subscription page
- [ ] Show Pro badge if active
- [ ] Handle trial states

---

#### 13. **stripe-create-checkout**
**Purpose:** Create Stripe checkout session

**Called From:**
- `src/hooks/useSubscription.tsx`
- `src/pages/Subscription.tsx`

**Request:**
```typescript
await supabase.functions.invoke('stripe-create-checkout', {
  body: {
    planType: 'yearly', // or 'monthly'
    promoCode: 'SA2025' // optional
  }
});
```

**Response:**
```typescript
{
  sessionId: 'cs_test_abc123...',
  url: 'https://checkout.stripe.com/...'
}
```

**Android/Web Requirements:**
- [ ] Create checkout on plan select
- [ ] Open Stripe checkout in WebView/browser
- [ ] Handle return after payment
- [ ] Refresh subscription status

---

#### 14. **stripe-create-portal**
**Purpose:** Create Stripe customer portal session

**Called From:**
- `src/hooks/useSubscription.tsx`
- Subscription settings

**Request:**
```typescript
await supabase.functions.invoke('stripe-create-portal');
```

**Response:**
```typescript
{
  url: 'https://billing.stripe.com/...'
}
```

**Android/Web Requirements:**
- [ ] "Manage Subscription" button
- [ ] Open portal in WebView/browser
- [ ] Allow payment method updates
- [ ] Allow plan changes

---

#### 15. **stripe-apply-referral-credit**
**Purpose:** Submit product suggestions for free month

**Called From:**
- `src/hooks/useSubscription.tsx`
- Referral program

**Request:**
```typescript
await supabase.functions.invoke('stripe-apply-referral-credit', {
  body: {
    suggestions: [
      { title: 'Feature idea', description: 'Description...', category: 'features' }
    ]
  }
});
```

**Response:**
```typescript
{
  success: true,
  message: 'You earned 1 free month!',
  free_months_remaining: 3
}
```

**Android/Web Requirements:**
- [ ] Suggestion submission form
- [ ] Show earned free months
- [ ] Update subscription status

---

#### 16. **stripe-webhook**
**Purpose:** Handle Stripe webhooks (server-side only)

**Called From:** Stripe servers (webhook URL)

**Android/Web:** No direct call needed

---

### Email/SMS Functions

#### 17. **send-budget-email**
**Purpose:** Email budget report

**Called From:**
- `src/components/ShareBudgetDialog.tsx`

**Request:**
```typescript
await supabase.functions.invoke('send-budget-email', {
  body: {
    email: 'friend@example.com',
    month: '2025-10',
    message: 'Check out my budget!'
  }
});
```

**Response:**
```typescript
{ success: true, message: 'Email sent' }
```

**Android/Web Requirements:**
- [ ] Share budget form (email input)
- [ ] Send button
- [ ] Show success/error

---

#### 18. **send-budget-sms**
**Purpose:** SMS budget report

**Called From:**
- `src/components/ShareBudgetDialog.tsx`

**Request:**
```typescript
await supabase.functions.invoke('send-budget-sms', {
  body: {
    phone: '+1234567890',
    month: '2025-10',
    message: 'Check out my budget!'
  }
});
```

**Response:**
```typescript
{ success: true, message: 'SMS sent' }
```

**Android/Web Requirements:**
- [ ] Share budget form (phone input)
- [ ] Send button
- [ ] Phone number validation
- [ ] Show success/error

---

#### 19. **share-get-budget-by-token-secure**
**Purpose:** Get shared budget by token (public endpoint)

**Called From:**
- `src/pages/SharedBudget.tsx`

**Request:**
```typescript
await supabase.functions.invoke('share-get-budget-by-token-secure', {
  body: { token: 'uuid-token-here' }
});
```

**Response:**
```typescript
{
  budget_data: {
    month: '2025-10',
    income: 5000,
    categories: { ... },
    actuals: { ... }
  },
  created_at: '2025-10-13T...'
}
```

**Android/Web Requirements:**
- [ ] Parse token from URL
- [ ] Fetch shared budget
- [ ] Display read-only budget
- [ ] No auth required

---

### Notification Functions

#### 20. **send-notification**
**Purpose:** Send notification to user

**Called From:**
- Backend triggers (bills due, budget alerts)

**Android/Web Requirements:**
- [ ] Receive push notifications (if implemented)
- [ ] In-app notification display

---

#### 21. **send-test-notification**
**Purpose:** Test notification delivery

**Called From:**
- Settings page (test notifications)

**Android/Web Requirements:**
- [ ] Test button in settings
- [ ] Verify notification received

---

#### 22. **notification-scheduler**
**Purpose:** Schedule recurring notifications (cron job)

**Android/Web:** No direct call needed

---

### Utility Functions

#### 23. **submit-contact-form**
**Purpose:** Submit contact form from public pages

**Called From:**
- `src/components/ContactDialog.tsx`
- Public pages

**Request:**
```typescript
await supabase.functions.invoke('submit-contact-form', {
  body: {
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Question',
    message: 'Message text...'
  }
});
```

**Response:**
```typescript
{ success: true, message: 'Message sent' }
```

**Android/Web Requirements:**
- [ ] Contact form
- [ ] Validation
- [ ] Send button
- [ ] Success confirmation

---

#### 24. **secure-waitlist-signup**
**Purpose:** Join waitlist (public endpoint)

**Called From:**
- `src/pages/Index.tsx` (landing page)
- `src/components/mobile/MobileLanding.tsx`

**Request:**
```typescript
await supabase.functions.invoke('secure-waitlist-signup', {
  body: {
    email: 'user@example.com',
    source: 'homepage'
  }
});
```

**Response:**
```typescript
{ success: true, message: 'Added to waitlist' }
```

**Android/Web Requirements:**
- [ ] Waitlist form on landing
- [ ] Email validation
- [ ] Sign up button
- [ ] Success message

---

#### 25. **send-waitlist-confirmation**
**Purpose:** Send confirmation email to waitlist signup

**Android/Web:** Called by secure-waitlist-signup, no direct call

---

#### 26. **refresh-file-url**
**Purpose:** Generate fresh signed URL for uploaded file

**Called From:**
- File upload components (when URL expires)

**Request:**
```typescript
await supabase.functions.invoke('refresh-file-url', {
  body: {
    file_path: 'user-uploads/uuid/document.pdf'
  }
});
```

**Response:**
```typescript
{
  url: 'https://storage.supabase.co/...',
  expires_at: '2025-10-13T...'
}
```

**Android/Web Requirements:**
- [ ] Handle expired file URLs
- [ ] Refresh when needed
- [ ] Update attachment URLs

---

#### 27. **log-collector**
**Purpose:** Collect client-side logs for debugging

**Called From:**
- Error boundary
- Debug mode

**Request:**
```typescript
await supabase.functions.invoke('log-collector', {
  body: {
    level: 'error',
    message: 'Error occurred',
    context: { ... }
  }
});
```

**Android/Web Requirements:**
- [ ] Send errors to backend
- [ ] Include device info
- [ ] Optional (for debugging)

---

## 🔐 SUPABASE AUTHENTICATION

### Auth Methods Used

#### 1. **Email/Password Signup**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    emailRedirectTo: 'https://app.pocketbanker.app/confirm'
  }
});
```

**Android/Web Requirements:**
- [ ] Implement signup form
- [ ] Email confirmation flow
- [ ] Redirect to confirmation page

---

#### 2. **Email/Password Login**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

**Android/Web Requirements:**
- [ ] Implement login form
- [ ] Handle auth errors
- [ ] Store session

---

#### 3. **Magic Link (Passwordless)**
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://app.pocketbanker.app/auth'
  }
});
```

**Android/Web Requirements:**
- [ ] Magic link button
- [ ] "Check your email" message
- [ ] Handle deep link return

---

#### 4. **Password Reset**
```typescript
// Request reset
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  { redirectTo: 'https://app.pocketbanker.app/reset-password' }
);

// Update password
const { error } = await supabase.auth.updateUser({
  password: 'new_password'
});
```

**Android/Web Requirements:**
- [ ] Forgot password link
- [ ] Reset password page
- [ ] Password strength validation

---

#### 5. **Session Management**
```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // User signed in
  } else if (event === 'SIGNED_OUT') {
    // User signed out
  }
});

// Sign out
await supabase.auth.signOut();
```

**Android/Web Requirements:**
- [ ] Persist sessions (localStorage/secure storage)
- [ ] Auto-refresh tokens
- [ ] Handle session expiry
- [ ] Listen for auth changes

---

## 📁 SUPABASE STORAGE

### File Upload Integration

#### 1. **Document Upload (AI Coach)**
**Purpose:** Upload PDFs, images for AI analysis

**Called From:**
- `src/hooks/useFileUpload.tsx`
- `src/pages/ConversationalAI.tsx`

**Code:**
```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('user-uploads')
  .upload(`${user.id}/${fileName}`, file, {
    cacheControl: '3600',
    upsert: false
  });

// Get public URL
const { data: urlData } = supabase.storage
  .from('user-uploads')
  .getPublicUrl(data.path);
```

**Android/Web Requirements:**
- [ ] File picker integration
- [ ] Camera integration (Android: permission required!)
- [ ] Upload progress indicator
- [ ] Generate signed URLs
- [ ] Pass URLs to gemini-chat function
- [ ] Handle upload errors

**Storage Buckets:**
- `user-uploads` - Documents, receipts (private)

**Permissions:**
- Users can upload to their own folder
- Users can read their own files
- Files auto-delete after 30 days (optional)

---

## 🔄 REAL-TIME SUBSCRIPTIONS

### Live Data Updates

#### 1. **Transaction Updates**
**Purpose:** Live sync when new transactions arrive

**Code:**
```typescript
const subscription = supabase
  .channel('transactions-changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'transactions',
      filter: `user_id=eq.${user.id}`
    }, 
    (payload) => {
      // Handle new/updated transaction
      console.log('Transaction change:', payload);
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

**Android/Web Requirements:**
- [ ] Subscribe on dashboard load
- [ ] Update UI when transactions change
- [ ] Handle new transactions from Plaid sync
- [ ] Unsubscribe on unmount

---

#### 2. **Account Balance Updates**
**Purpose:** Live balance updates after sync

**Code:**
```typescript
supabase
  .channel('accounts-changes')
  .on('postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'accounts',
      filter: `user_id=eq.${user.id}`
    },
    (payload) => {
      // Update balance in UI
      console.log('Balance updated:', payload.new);
    }
  )
  .subscribe();
```

**Android/Web Requirements:**
- [ ] Subscribe on dashboard
- [ ] Update balance displays
- [ ] Animate changes (optional)

---

#### 3. **Notification Updates**
**Purpose:** Real-time in-app notifications

**Code:**
```typescript
supabase
  .channel('notifications')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    },
    (payload) => {
      // Show notification
      toast({ title: payload.new.title });
    }
  )
  .subscribe();
```

**Android/Web Requirements:**
- [ ] Subscribe when app is active
- [ ] Show toast/banner for new notifications
- [ ] Update notification bell badge

---

## 🌐 THIRD-PARTY INTEGRATIONS

### 1. Plaid Integration

**SDK Required:**
- Web: `react-plaid-link` npm package
- Android: Plaid Android SDK
- iOS: Plaid iOS SDK (already working)

**Flow:**
1. Generate link token (`plaid-link-token-v2`)
2. Initialize Plaid Link with token
3. User selects bank and logs in
4. Get public token from Plaid
5. Exchange token (`plaid-link-exchange-v2`)
6. Sync transactions (`plaid-sync-v2`)

**Android Requirements:**
- [ ] Add Plaid Android SDK dependency
- [ ] Request camera permission (for document verification)
- [ ] Open Plaid Link in WebView or native SDK
- [ ] Handle onSuccess callback
- [ ] Call exchange and sync functions

**Web Requirements:**
- [ ] Already implemented with react-plaid-link
- [ ] Verify works across browsers

---

### 2. Stripe Integration

**SDK Required:**
- Web: `@stripe/stripe-js`, `@stripe/react-stripe-js`
- Android: Stripe Android SDK (for native checkout)
- iOS: Already working with Stripe Checkout

**Flow:**
1. Create checkout session (`stripe-create-checkout`)
2. Redirect to Stripe Checkout
3. User enters payment info
4. Stripe redirects back to app
5. Check subscription status (`stripe-check-subscription`)

**Android Requirements:**
- [ ] Open Stripe Checkout in WebView
- [ ] Handle return URL deep link
- [ ] Refresh subscription status after payment
- [ ] Customer portal access

**Web Requirements:**
- [ ] Already implemented with Stripe Checkout
- [ ] Verify redirects work

---

### 3. Google Gemini AI Integration

**SDK:** Server-side only (called via Edge Function)

**Flow:**
1. User sends message
2. Frontend calls `gemini-chat` function
3. Backend calls Gemini API with context
4. Response streamed back (or returned whole)

**Android/Web Requirements:**
- [ ] Already handled by Edge Function
- [ ] Just call the function
- [ ] Display responses
- [ ] Handle file attachments

---

## ✅ ANDROID TESTING CHECKLIST

### Database Queries (Direct)
- [ ] Fetch user profile
- [ ] Fetch accounts with balances
- [ ] Fetch transactions (all filters)
- [ ] Create manual transaction
- [ ] Update transaction category
- [ ] Delete transaction
- [ ] Fetch budget
- [ ] Create/update budget
- [ ] Fetch goals
- [ ] Create/update goal
- [ ] Fetch goal tasks
- [ ] Fetch bills
- [ ] Create/update bill
- [ ] Fetch conversations
- [ ] Fetch conversation threads
- [ ] Fetch connected banks
- [ ] Fetch site metrics

### Edge Function Calls
- [ ] plaid-link-token-v2 (generate token)
- [ ] plaid-link-exchange-v2 (connect bank)
- [ ] plaid-sync-v2 (sync transactions)
- [ ] plaid-disconnect-v2 (disconnect bank)
- [ ] plaid-check-limit (verify can connect)
- [ ] gemini-chat (AI coaching)
- [ ] ai-categorize-transactions (bulk)
- [ ] ai-spending-insights (insights)
- [ ] stripe-check-subscription (status)
- [ ] stripe-create-checkout (payment)
- [ ] stripe-create-portal (manage)
- [ ] stripe-apply-referral-credit (suggestions)
- [ ] send-budget-email (share)
- [ ] send-budget-sms (share)
- [ ] share-get-budget-by-token-secure (view shared)
- [ ] submit-contact-form (contact)
- [ ] secure-waitlist-signup (waitlist)
- [ ] refresh-file-url (file access)

### Authentication
- [ ] Email/password signup
- [ ] Email confirmation flow
- [ ] Email/password login
- [ ] Magic link login
- [ ] Password reset
- [ ] Session persistence
- [ ] Auto token refresh
- [ ] Sign out

### File Upload
- [ ] Camera permission request ⚠️ CRITICAL
- [ ] Take photo
- [ ] Select file from device ⚠️ CRITICAL
- [ ] Upload to Supabase Storage
- [ ] Get file URL
- [ ] Pass to AI

### Real-time (Optional)
- [ ] Subscribe to transaction changes
- [ ] Subscribe to account updates
- [ ] Subscribe to notifications
- [ ] Unsubscribe on unmount

### Third-Party SDKs
- [ ] Plaid Android SDK initialized
- [ ] Plaid Link opens in WebView/native
- [ ] Stripe Checkout in WebView
- [ ] Handle OAuth redirects

---

## 🌐 WEB TESTING CHECKLIST

### Database Queries
- [ ] All queries working (same as iOS)
- [ ] Verify RLS policies enforced

### Edge Function Calls
- [ ] All 32 functions accessible
- [ ] CORS configured properly
- [ ] Authentication headers sent

### Authentication
- [ ] Already working (verify)
- [ ] Cross-browser compatibility

### File Upload
- [ ] File input works
- [ ] Drag & drop (desktop)
- [ ] Camera on mobile web
- [ ] Upload progress

### Real-time
- [ ] WebSocket connections work
- [ ] No memory leaks

### Third-Party
- [ ] Plaid Link (already working)
- [ ] Stripe Checkout (already working)
- [ ] Cross-browser tested

---

## 🎯 CRITICAL IMPLEMENTATION NOTES

### For Android:

**1. Permissions Required in AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

**2. Plaid SDK:**
- Add to `build.gradle`: `implementation 'com.plaid.link:sdk-core:4.x.x'`
- Initialize before use
- Handle WebView if using Link mode

**3. File Upload:**
- Request runtime permissions
- Open camera with intent
- Open file picker with intent
- Upload to Supabase Storage

**4. Network Security:**
- Ensure HTTPS only
- Add network security config if needed

---

### For Web:

**1. Already Working:**
- Most backend connections already implemented
- Verify all Edge Function calls
- Test across browsers

**2. Add/Enhance:**
- Service worker for offline
- Background sync for queued operations
- Web push notifications (optional)

**3. Performance:**
- Lazy load Edge Function calls
- Cache responses where appropriate
- Debounce expensive operations

---

## 📊 Summary Statistics

### Total Backend Connections to Implement:
- **20+ Database tables** with direct queries
- **32 Edge Functions** to call
- **5 Auth methods** to implement
- **1 Storage bucket** for file uploads
- **3 Real-time channels** (optional but recommended)
- **3 Third-party SDKs** (Plaid, Stripe, Gemini)

### Android Status:
- **Core database queries:** Need testing ✅ (likely working)
- **Edge Functions:** Need testing ✅ (HTTP calls should work)
- **File upload:** ⚠️ CRITICAL - Camera permission required
- **Plaid SDK:** ⚠️ Needs Android SDK integration
- **Stripe:** ✅ WebView should work
- **Real-time:** 🟡 Optional but recommended

### Web Status:
- **Core database queries:** ✅ Already working
- **Edge Functions:** ✅ Already working
- **File upload:** ✅ Working (verify camera on mobile)
- **Plaid SDK:** ✅ Already working
- **Stripe:** ✅ Already working
- **Real-time:** 🟡 Need to verify

---

**Last Updated:** October 13, 2025  
**Status:** Complete backend integration inventory  
**Use:** Ensure ALL backend connections work on Android and Web!

