-- Fix decryption failures by normalizing base64 (remove whitespace/newlines)
-- Update BOTH overloads of decrypt_plaid_token_with_audit to sanitize input

-- Overload 1: (encrypted_data jsonb, encryption_key text, function_name text, ip_address text, user_agent text)
CREATE OR REPLACE FUNCTION public.decrypt_plaid_token_with_audit(
  encrypted_data jsonb,
  encryption_key text,
  function_name text DEFAULT 'unknown',
  ip_address text DEFAULT NULL::text,
  user_agent text DEFAULT NULL::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, extensions'
AS $$
DECLARE
  decrypted_token bytea;
  result_token text;
  target_user_id uuid;
  safe_ip inet;
  raw_token text;
  clean_encrypted_token text;
BEGIN
  -- Validate encrypted_data structure
  IF encrypted_data IS NULL 
     OR NOT (encrypted_data ? 'encrypted_token')
     OR NOT (encrypted_data ? 'iv') THEN
    RAISE EXCEPTION 'Invalid encrypted data structure';
  END IF;

  -- Extract and sanitize base64 string: trim + remove ALL whitespace/newlines
  raw_token := encrypted_data->>'encrypted_token';
  clean_encrypted_token := regexp_replace(btrim(raw_token), '\\s', '', 'g');

  -- Validate base64 after cleaning
  BEGIN
    PERFORM decode(clean_encrypted_token, 'base64');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid base64 encoding in encrypted token';
  END;

  -- Determine target user id (auth or service role context)
  target_user_id := auth.uid();
  IF target_user_id IS NULL THEN
    target_user_id := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
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
      decode(clean_encrypted_token, 'base64'),
      encryption_key
    );
    result_token := btrim(convert_from(decrypted_token, 'UTF8'));

    -- Basic token sanity check
    IF result_token IS NULL OR length(result_token) < 10 THEN
      RAISE EXCEPTION 'Decrypted token appears invalid';
    END IF;

    -- Log successful decryption
    INSERT INTO public.plaid_token_audit_log (
      user_id, access_type, function_name, ip_address, user_agent, success
    ) VALUES (
      target_user_id, 'decrypt', function_name, safe_ip, user_agent, true
    );

    RETURN result_token;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log failed decryption attempt, but don't leak details in return
      INSERT INTO public.plaid_token_audit_log (
        user_id, access_type, function_name, ip_address, user_agent, success, error_message
      ) VALUES (
        target_user_id, 'decrypt', function_name, safe_ip, user_agent, false, SQLERRM
      );
      RETURN NULL;
  END;
END;
$$;

-- Overload 2: (encrypted_data jsonb, encryption_key text, function_name text, ip_address text, user_agent text, target_user_id uuid)
CREATE OR REPLACE FUNCTION public.decrypt_plaid_token_with_audit(
  encrypted_data jsonb,
  encryption_key text,
  function_name text DEFAULT 'unknown'::text,
  ip_address text DEFAULT NULL::text,
  user_agent text DEFAULT NULL::text,
  target_user_id uuid DEFAULT NULL::uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, extensions'
AS $$
DECLARE
  decrypted_token bytea;
  result_token text;
  actual_user_id uuid;
  safe_ip inet;
  raw_token text;
  clean_encrypted_token text;
BEGIN
  -- Validate encrypted_data structure
  IF encrypted_data IS NULL 
     OR NOT (encrypted_data ? 'encrypted_token')
     OR NOT (encrypted_data ? 'iv') THEN
    RAISE EXCEPTION 'Invalid encrypted data structure';
  END IF;

  -- Extract and sanitize base64: trim + remove ALL whitespace/newlines
  raw_token := encrypted_data->>'encrypted_token';
  clean_encrypted_token := regexp_replace(btrim(raw_token), '\\s', '', 'g');

  -- Validate base64 after cleaning
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
    result_token := btrim(convert_from(decrypted_token, 'UTF8'));

    -- Validate decrypted token
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
      -- Log failed decryption
      INSERT INTO public.plaid_token_audit_log (
        user_id, access_type, function_name, ip_address, user_agent, success, error_message
      ) VALUES (
        actual_user_id, 'decrypt', function_name, safe_ip, user_agent, false, SQLERRM
      );
      RETURN NULL;
  END;
END;
$$;