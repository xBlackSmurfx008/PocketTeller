-- Fix: use fully-qualified pgcrypto function from extensions schema
-- Update BOTH overloads to call extensions.pgp_sym_decrypt_bytea

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
  IF encrypted_data IS NULL 
     OR NOT (encrypted_data ? 'encrypted_token')
     OR NOT (encrypted_data ? 'iv') THEN
    RAISE EXCEPTION 'Invalid encrypted data structure';
  END IF;

  raw_token := encrypted_data->>'encrypted_token';
  clean_encrypted_token := regexp_replace(btrim(raw_token), '\\s', '', 'g');

  BEGIN
    PERFORM decode(clean_encrypted_token, 'base64');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid base64 encoding in encrypted token';
  END;

  target_user_id := auth.uid();
  IF target_user_id IS NULL THEN
    target_user_id := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
  END IF;

  PERFORM set_config('app.current_function_name', function_name, true);

  BEGIN
    safe_ip := NULLIF(btrim(split_part(COALESCE(ip_address, ''), ',', 1)), '')::inet;
  EXCEPTION WHEN OTHERS THEN
    safe_ip := NULL;
  END;

  BEGIN
    -- Use fully-qualified function from extensions schema
    decrypted_token := extensions.pgp_sym_decrypt_bytea(
      decode(clean_encrypted_token, 'base64'),
      encryption_key
    );
    result_token := btrim(convert_from(decrypted_token, 'UTF8'));

    IF result_token IS NULL OR length(result_token) < 10 THEN
      RAISE EXCEPTION 'Decrypted token appears invalid';
    END IF;

    INSERT INTO public.plaid_token_audit_log (
      user_id, access_type, function_name, ip_address, user_agent, success
    ) VALUES (
      target_user_id, 'decrypt', function_name, safe_ip, user_agent, true
    );

    RETURN result_token;

  EXCEPTION
    WHEN OTHERS THEN
      INSERT INTO public.plaid_token_audit_log (
        user_id, access_type, function_name, ip_address, user_agent, success, error_message
      ) VALUES (
        target_user_id, 'decrypt', function_name, safe_ip, user_agent, false, SQLERRM
      );
      RETURN NULL;
  END;
END;
$$;

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
  IF encrypted_data IS NULL 
     OR NOT (encrypted_data ? 'encrypted_token')
     OR NOT (encrypted_data ? 'iv') THEN
    RAISE EXCEPTION 'Invalid encrypted data structure';
  END IF;

  raw_token := encrypted_data->>'encrypted_token';
  clean_encrypted_token := regexp_replace(btrim(raw_token), '\\s', '', 'g');

  BEGIN
    PERFORM decode(clean_encrypted_token, 'base64');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid base64 encoding in encrypted token';
  END;

  actual_user_id := COALESCE(target_user_id, auth.uid());
  IF actual_user_id IS NULL THEN
    actual_user_id := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
  END IF;
  IF actual_user_id IS NULL THEN
    RAISE EXCEPTION 'No user context available for audit logging';
  END IF;

  PERFORM set_config('app.current_function_name', function_name, true);

  BEGIN
    safe_ip := NULLIF(btrim(split_part(COALESCE(ip_address, ''), ',', 1)), '')::inet;
  EXCEPTION WHEN OTHERS THEN
    safe_ip := NULL;
  END;

  BEGIN
    -- Use fully-qualified function from extensions schema
    decrypted_token := extensions.pgp_sym_decrypt_bytea(
      decode(clean_encrypted_token, 'base64'),
      encryption_key
    );
    result_token := btrim(convert_from(decrypted_token, 'UTF8'));

    IF result_token IS NULL OR length(result_token) < 10 THEN
      RAISE EXCEPTION 'Decrypted token appears invalid';
    END IF;

    INSERT INTO public.plaid_token_audit_log (
      user_id, access_type, function_name, ip_address, user_agent, success
    ) VALUES (
      actual_user_id, 'decrypt', function_name, safe_ip, user_agent, true
    );

    RETURN result_token;

  EXCEPTION
    WHEN OTHERS THEN
      INSERT INTO public.plaid_token_audit_log (
        user_id, access_type, function_name, ip_address, user_agent, success, error_message
      ) VALUES (
        actual_user_id, 'decrypt', function_name, safe_ip, user_agent, false, SQLERRM
      );
      RETURN NULL;
  END;
END;
$$;