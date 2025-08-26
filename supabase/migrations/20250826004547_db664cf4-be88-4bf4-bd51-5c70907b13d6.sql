-- Add unique constraints to prevent duplicate Plaid data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_plaid_account'
    ) THEN
        ALTER TABLE public.accounts 
        ADD CONSTRAINT unique_user_plaid_account UNIQUE(user_id, plaid_account_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_plaid_transaction'
    ) THEN
        ALTER TABLE public.transactions 
        ADD CONSTRAINT unique_user_plaid_transaction UNIQUE(user_id, plaid_transaction_id);
    END IF;
END $$;