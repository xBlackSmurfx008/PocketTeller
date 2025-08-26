-- Ensure crypto functions are available
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Strengthen data integrity for Plaid sync/upserts
-- 1) One profile per user
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique
ON public.profiles (user_id);

-- 2) Prevent duplicate accounts per user from Plaid
CREATE UNIQUE INDEX IF NOT EXISTS accounts_user_account_unique
ON public.accounts (user_id, account_id);

-- 3) Prevent duplicate transactions per user from Plaid (transaction_id can be null)
CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_transaction_unique
ON public.transactions (user_id, transaction_id)
WHERE transaction_id IS NOT NULL;