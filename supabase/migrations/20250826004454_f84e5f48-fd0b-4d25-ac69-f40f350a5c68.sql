-- Enhance accounts table to handle Plaid data structure
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS plaid_account_id TEXT,
ADD COLUMN IF NOT EXISTS institution_name TEXT,
ADD COLUMN IF NOT EXISTS institution_id TEXT,
ADD COLUMN IF NOT EXISTS subtype TEXT,
ADD COLUMN IF NOT EXISTS available_balance NUMERIC,
ADD COLUMN IF NOT EXISTS current_balance NUMERIC,
ADD COLUMN IF NOT EXISTS credit_limit NUMERIC,
ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS official_name TEXT,
ADD COLUMN IF NOT EXISTS mask TEXT,
ADD COLUMN IF NOT EXISTS plaid_item_id TEXT;

-- Enhance transactions table to handle Plaid data structure  
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS plaid_account_id TEXT,
ADD COLUMN IF NOT EXISTS merchant_name TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS location JSONB,
ADD COLUMN IF NOT EXISTS payment_meta JSONB,
ADD COLUMN IF NOT EXISTS pending BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS iso_currency_code TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS unofficial_currency_code TEXT,
ADD COLUMN IF NOT EXISTS datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS authorized_date DATE,
ADD COLUMN IF NOT EXISTS authorized_datetime TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance on Plaid lookups
CREATE INDEX IF NOT EXISTS idx_accounts_plaid_account_id ON public.accounts(plaid_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_plaid_item_id ON public.accounts(plaid_item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_transaction_id ON public.transactions(plaid_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_account_id ON public.transactions(plaid_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_pending ON public.transactions(pending);

-- Add unique constraints to prevent duplicate Plaid data
ALTER TABLE public.accounts 
ADD CONSTRAINT IF NOT EXISTS unique_user_plaid_account UNIQUE(user_id, plaid_account_id);

ALTER TABLE public.transactions 
ADD CONSTRAINT IF NOT EXISTS unique_user_plaid_transaction UNIQUE(user_id, plaid_transaction_id);