-- Fix the encrypt_plaid_token function to use the correct search path
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
  key_to_use := COALESCE(encryption_key, encode(extensions.gen_random_bytes(32), 'hex'));

  -- Generate random IV (returned for observability; PGP handles its own IV internally)
  iv := extensions.gen_random_bytes(16);

  -- Encrypt the token using AES-256; convert text to bytea safely
  encrypted_token := extensions.pgp_sym_encrypt_bytea(
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