-- Update decrypt_plaid_token_with_audit to handle optional target_user_id parameter
-- This allows service_role calls to specify which user's token is being decrypted
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
BEGIN
  -- Validate encrypted_data structure
  IF encrypted_data IS NULL 
     OR NOT (encrypted_data ? 'encrypted_token')
     OR NOT (encrypted_data ? 'iv') THEN
    RAISE EXCEPTION 'Invalid encrypted data structure';
  END IF;

  -- Validate base64 encoding of encrypted token
  BEGIN
    PERFORM decode(encrypted_data->>'encrypted_token', 'base64');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid base64 encoding in encrypted token';
  END;

  -- Determine actual user id (use target_user_id if provided, otherwise auth.uid())
  actual_user_id := COALESCE(target_user_id, auth.uid());
  
  -- If still null, try from config (for service role calls)
  IF actual_user_id IS NULL THEN
    actual_user_id := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
  END IF;

  -- Must have a user ID for audit logging
  IF actual_user_id IS NULL THEN
    RAISE EXCEPTION 'No user context available for audit logging';
  END IF;

  -- Set function name in session for RLS validation/observability
  PERFORM set_config('app.current_function_name', function_name, true);

  -- Parse x-forwarded-for (may contain a list). Use first entry; cast to inet if valid.
  BEGIN
    safe_ip := NULLIF(btrim(split_part(COALESCE(ip_address, ''), ',', 1)), '')::inet;
  EXCEPTION WHEN OTHERS THEN
    safe_ip := NULL; -- do not block on bad IP format
  END;

  BEGIN
    -- Decrypt using pgcrypto
    decrypted_token := pgp_sym_decrypt_bytea(
      decode(encrypted_data->>'encrypted_token', 'base64'),
      encryption_key
    );
    result_token := convert_from(decrypted_token, 'UTF8');

    -- Basic token sanity check
    IF result_token IS NULL OR length(result_token) < 10 THEN
      RAISE EXCEPTION 'Decrypted token appears invalid';
    END IF;

    -- Log successful decryption
    INSERT INTO public.plaid_token_audit_log (
      user_id, access_type, function_name, ip_address, user_agent, success
    ) VALUES (
      actual_user_id, 'decrypt', function_name, safe_ip, user_agent, true
    );

    RETURN result_token;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log failed decryption attempt, but don't leak details in return
      INSERT INTO public.plaid_token_audit_log (
        user_id, access_type, function_name, ip_address, user_agent, success, error_message
      ) VALUES (
        actual_user_id, 'decrypt', function_name, safe_ip, user_agent, false, SQLERRM
      );
      RETURN NULL;
  END;
END;
$function$;