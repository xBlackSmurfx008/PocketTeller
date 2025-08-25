
-- Accounts
ALTER POLICY "Users can view their own accounts"
  ON public.accounts
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can insert their own accounts"
  ON public.accounts
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Users can update their own accounts"
  ON public.accounts
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can delete their own accounts"
  ON public.accounts
  USING (user_id = (select auth.uid()));

-- Transactions
ALTER POLICY "Users can view their own transactions"
  ON public.transactions
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can insert their own transactions"
  ON public.transactions
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Users can update their own transactions"
  ON public.transactions
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can delete their own transactions"
  ON public.transactions
  USING (user_id = (select auth.uid()));

-- Bills
ALTER POLICY "Users can view their own bills"
  ON public.bills
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can insert their own bills"
  ON public.bills
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Users can update their own bills"
  ON public.bills
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can delete their own bills"
  ON public.bills
  USING (user_id = (select auth.uid()));

-- Budget
ALTER POLICY "Users can view their own budget"
  ON public.budget
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can insert their own budget"
  ON public.budget
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Users can update their own budget"
  ON public.budget
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can delete their own budget"
  ON public.budget
  USING (user_id = (select auth.uid()));

-- Conversations
ALTER POLICY "Users can view their own conversations"
  ON public.conversations
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can insert their own conversations"
  ON public.conversations
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Users can delete their own conversations"
  ON public.conversations
  USING (user_id = (select auth.uid()));

-- Goals
ALTER POLICY "Users can view their own goals"
  ON public.goals
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can insert their own goals"
  ON public.goals
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Users can update their own goals"
  ON public.goals
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can delete their own goals"
  ON public.goals
  USING (user_id = (select auth.uid()));

-- Goal Tasks
ALTER POLICY "Users can view their own goal tasks"
  ON public.goal_tasks
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can create their own goal tasks"
  ON public.goal_tasks
  WITH CHECK (
    (user_id = (select auth.uid()))
    AND EXISTS (
      SELECT 1
      FROM public.goals
      WHERE goals.id = goal_tasks.goal_id
        AND goals.user_id = (select auth.uid())
    )
  );

ALTER POLICY "Users can update their own goal tasks"
  ON public.goal_tasks
  USING (
    (user_id = (select auth.uid()))
    AND EXISTS (
      SELECT 1
      FROM public.goals
      WHERE goals.id = goal_tasks.goal_id
        AND goals.user_id = (select auth.uid())
    )
  );

ALTER POLICY "Users can delete their own goal tasks"
  ON public.goal_tasks
  USING (user_id = (select auth.uid()));

-- Budget Shares
ALTER POLICY "Users can view their own budget shares"
  ON public.budget_shares
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can create their own budget shares"
  ON public.budget_shares
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Users can update their own budget shares"
  ON public.budget_shares
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Users can delete their own budget shares"
  ON public.budget_shares
  USING (user_id = (select auth.uid()));

-- Conversation Threads
ALTER POLICY "Users can view their own threads"
  ON public.conversation_threads
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can create their own threads"
  ON public.conversation_threads
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Users can update their own threads"
  ON public.conversation_threads
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can delete their own threads"
  ON public.conversation_threads
  USING (user_id = (select auth.uid()));

-- AI Guides
ALTER POLICY "Authenticated users can read guides"
  ON public.ai_guides
  USING ((select auth.uid()) IS NOT NULL);

-- User Memories
ALTER POLICY "Users can read their own memories"
  ON public.user_memories
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can insert their own memories"
  ON public.user_memories
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Users can update their own memories"
  ON public.user_memories
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can delete their own memories"
  ON public.user_memories
  USING (user_id = (select auth.uid()));

-- Profiles
ALTER POLICY "Users can view only their own profile data"
  ON public.profiles
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users can insert only their own profile"
  ON public.profiles
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Users can update only their own profile"
  ON public.profiles
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Share Send Log
ALTER POLICY "Users view own share logs only"
  ON public.share_send_log
  USING (user_id = (select auth.uid()));

-- Plaid Token Audit Log
ALTER POLICY "Users can view own audit logs"
  ON public.plaid_token_audit_log
  USING (user_id = (select auth.uid()));
