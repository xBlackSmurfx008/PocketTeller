-- Add individual performance indexes (avoiding CONCURRENTLY in transaction)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);

CREATE INDEX IF NOT EXISTS idx_goals_user_deadline ON public.goals(user_id, deadline);

CREATE INDEX IF NOT EXISTS idx_bills_user_due_date ON public.bills(user_id, due_date);

CREATE INDEX IF NOT EXISTS idx_budget_shares_token ON public.budget_shares(token);

CREATE INDEX IF NOT EXISTS idx_budget_shares_expires ON public.budget_shares(expires_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.in_app_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_waitlist_email_log_created ON public.waitlist_email_log(created_at);

CREATE INDEX IF NOT EXISTS idx_plaid_audit_user_created ON public.plaid_token_audit_log(user_id, created_at DESC);