
-- 1) Support incremental sync cursor on the Plaid item and tracking last sync time
ALTER TABLE public.plaid_items
  ADD COLUMN IF NOT EXISTS sync_cursor text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT now();

-- 2) Ensure idempotent upserts for Plaid data
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_plaid_txn
  ON public.transactions(user_id, plaid_transaction_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_user_plaid_acct
  ON public.accounts(user_id, plaid_account_id);

-- 3) Performance index for recent loads
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions(user_id, date DESC);
