-- Add unique constraints for clean upserts
ALTER TABLE accounts ADD CONSTRAINT unique_user_account_id UNIQUE (user_id, account_id);
ALTER TABLE transactions ADD CONSTRAINT unique_user_transaction_id UNIQUE (user_id, transaction_id);