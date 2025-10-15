-- Quick check and fix for plaid_category column
-- Run this entire script in Supabase SQL Editor

-- Step 1: Check if column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'transactions' 
      AND column_name = 'plaid_category'
  ) THEN
    -- Column doesn't exist, add it
    RAISE NOTICE '❌ plaid_category column missing - adding now...';
    
    ALTER TABLE public.transactions 
    ADD COLUMN plaid_category TEXT;
    
    RAISE NOTICE '✅ Column added successfully!';
  ELSE
    RAISE NOTICE '✅ plaid_category column already exists - no action needed';
  END IF;
END $$;

-- Step 2: Add index (if not exists)
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_category 
  ON public.transactions(plaid_category) 
  WHERE plaid_category IS NOT NULL;

-- Step 3: Add comment
COMMENT ON COLUMN public.transactions.plaid_category IS 
  'Original Plaid category name (first element from Plaid category array). Used for reference and debugging.';

-- Step 4: Verify the fix
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
        AND column_name = 'plaid_category'
    ) THEN '✅ SUCCESS: plaid_category column exists and ready!'
    ELSE '❌ FAILED: Column still missing'
  END as result;

