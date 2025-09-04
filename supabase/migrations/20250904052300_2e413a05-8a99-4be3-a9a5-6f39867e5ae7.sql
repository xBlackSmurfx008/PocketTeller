-- Add missing unique constraints and indexes for Plaid data integrity (skip existing ones)

-- Check and add unique constraint for transactions if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_plaid_transaction') THEN
        ALTER TABLE public.transactions
        ADD CONSTRAINT unique_user_plaid_transaction
        UNIQUE (user_id, plaid_transaction_id);
    END IF;
END $$;

-- Check and add unique constraint for plaid_items if not exists  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_item_id') THEN
        ALTER TABLE public.plaid_items
        ADD CONSTRAINT unique_user_item_id
        UNIQUE (user_id, item_id);
    END IF;
END $$;

-- Add performance indexes (using IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_accounts_user_plaid_id 
ON public.accounts (user_id, plaid_account_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_plaid_id 
ON public.transactions (user_id, plaid_transaction_id);

CREATE INDEX IF NOT EXISTS idx_transactions_account_date 
ON public.transactions (plaid_account_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_plaid_items_user_item 
ON public.plaid_items (user_id, item_id);

CREATE INDEX IF NOT EXISTS idx_plaid_items_sync_cursor 
ON public.plaid_items (sync_cursor) 
WHERE sync_cursor IS NOT NULL;