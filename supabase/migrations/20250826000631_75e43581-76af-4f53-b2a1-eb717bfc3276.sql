
-- Ensure the pgcrypto extension is available in the 'extensions' schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate the encrypt function to use a safe text->bytea conversion
CREATE OR REPLACE FUNCTION public.encrypt_plaid_token(token text, encryption_key text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, extensions'
AS $function$
DECLARE
  iv bytea;
  encrypted_token bytea;
  key_to_use text;
BEGIN
  -- Use provided key or generate a secure one
  key_to_use := COALESCE(encryption_key, encode(gen_random_bytes(32), 'hex'));

  -- Generate random IV (returned for observability; PGP handles its own IV internally)
  iv := gen_random_bytes(16);

  -- Encrypt the token using AES-256; convert text to bytea safely
  encrypted_token := pgp_sym_encrypt_bytea(
    convert_to(token, 'UTF8'),
    key_to_use,
    'cipher-algo=aes256'
  );

  -- Return encrypted token and IV
  RETURN jsonb_build_object(
    'encrypted_token', encode(encrypted_token, 'base64'),
    'iv', encode(iv, 'base64'),
    'key_hint', substring(encode(digest(key_to_use, 'sha256'), 'hex'), 1, 8)
  );
END;
$function$;

-- Allow typical execution contexts (edge functions use service_role)
GRANT EXECUTE ON FUNCTION public.encrypt_plaid_token(text, text) TO authenticated, service_role;
