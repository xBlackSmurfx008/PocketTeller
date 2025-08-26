-- Add category_source column to track categorization origin
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS category_source text DEFAULT 'auto';

-- Create unique indexes for better data integrity and performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_plaid_txn
  ON public.transactions(user_id, plaid_transaction_id)
  WHERE plaid_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_user_plaid_acct
  ON public.accounts(user_id, plaid_account_id)
  WHERE plaid_account_id IS NOT NULL;

-- Performance index for recent transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_desc
  ON public.transactions(user_id, date DESC);

-- Update decrypt function to handle whitespace in encrypted tokens
CREATE OR REPLACE FUNCTION public.decrypt_plaid_token_with_audit(encrypted_data jsonb, encryption_key text, function_name text DEFAULT 'unknown'::text, ip_address text DEFAULT NULL::text, user_agent text DEFAULT NULL::text, target_user_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public, extensions'
AS $function$
DECLARE
  decrypted_token bytea;
  result_token text;
  actual_user_id uuid;
  safe_ip inet;
  clean_encrypted_token text;
BEGIN
  -- Validate encrypted_data structure
  IF encrypted_data IS NULL 
     OR NOT (encrypted_data ? 'encrypted_token')
     OR NOT (encrypted_data ? 'iv') THEN
    RAISE EXCEPTION 'Invalid encrypted data structure';
  END IF;

  -- Clean and validate base64 encoding of encrypted token
  clean_encrypted_token := trim(encrypted_data->>'encrypted_token');
  BEGIN
    PERFORM decode(clean_encrypted_token, 'base64');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid base64 encoding in encrypted token';
  END;

  -- Determine actual user id
  actual_user_id := COALESCE(target_user_id, auth.uid());
  
  IF actual_user_id IS NULL THEN
    actual_user_id := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
  END IF;

  IF actual_user_id IS NULL THEN
    RAISE EXCEPTION 'No user context available for audit logging';
  END IF;

  -- Set function name in session
  PERFORM set_config('app.current_function_name', function_name, true);

  -- Parse IP address safely
  BEGIN
    safe_ip := NULLIF(btrim(split_part(COALESCE(ip_address, ''), ',', 1)), '')::inet;
  EXCEPTION WHEN OTHERS THEN
    safe_ip := NULL;
  END;

  BEGIN
    -- Decrypt using cleaned token
    decrypted_token := pgp_sym_decrypt_bytea(
      decode(clean_encrypted_token, 'base64'),
      encryption_key
    );
    result_token := convert_from(decrypted_token, 'UTF8');

    -- Validate decrypted token
    IF result_token IS NULL OR length(trim(result_token)) < 10 THEN
      RAISE EXCEPTION 'Decrypted token appears invalid';
    END IF;

    -- Log successful decryption
    INSERT INTO public.plaid_token_audit_log (
      user_id, access_type, function_name, ip_address, user_agent, success
    ) VALUES (
      actual_user_id, 'decrypt', function_name, safe_ip, user_agent, true
    );

    RETURN trim(result_token);

  EXCEPTION
    WHEN OTHERS THEN
      -- Log failed decryption
      INSERT INTO public.plaid_token_audit_log (
        user_id, access_type, function_name, ip_address, user_agent, success, error_message
      ) VALUES (
        actual_user_id, 'decrypt', function_name, safe_ip, user_agent, false, SQLERRM
      );
      RETURN NULL;
  END;
END;
$function$;