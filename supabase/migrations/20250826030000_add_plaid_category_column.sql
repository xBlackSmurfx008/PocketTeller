-- Add missing plaid_category column to transactions table
-- This column stores the original Plaid category for reference
-- (separate from our mapped 'category' field)

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS plaid_category TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_category 
  ON public.transactions(plaid_category) 
  WHERE plaid_category IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.transactions.plaid_category IS 
  'Original Plaid category name (first element from Plaid category array). Used for reference and debugging.';

