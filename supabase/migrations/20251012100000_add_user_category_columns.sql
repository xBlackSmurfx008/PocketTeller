-- Add user_category and category_source columns to transactions table
-- This allows users to manually categorize transactions and tracks the source of categorization

-- Add user_category column for user-defined categories
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS user_category TEXT;

-- Add category_source column to track categorization priority
-- Priority: user > plaid > ai > auto
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS category_source TEXT DEFAULT 'auto';

-- Create index for faster category queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_category) WHERE user_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_category_source ON public.transactions(category_source);

-- Create index for merchant_name to support category syncing
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_name ON public.transactions(merchant_name) WHERE merchant_name IS NOT NULL;

-- Add comment explaining the categorization priority
COMMENT ON COLUMN public.transactions.category_source IS 'Source of transaction categorization. Priority: user > plaid > ai > auto';
COMMENT ON COLUMN public.transactions.user_category IS 'User-defined category that overrides all other categorizations';

