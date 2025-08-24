-- Create encryption functions for Plaid tokens
CREATE OR REPLACE FUNCTION public.encrypt_plaid_token(token text, encryption_key text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  iv bytea;
  encrypted_token bytea;
  key_to_use text;
BEGIN
  -- Use provided key or generate a secure one
  key_to_use := COALESCE(encryption_key, encode(gen_random_bytes(32), 'hex'));
  
  -- Generate random IV
  iv := gen_random_bytes(16);
  
  -- Encrypt the token using AES-256-CBC
  encrypted_token := pgp_sym_encrypt_bytea(token::bytea, key_to_use, 'cipher-algo=aes256');
  
  -- Return encrypted token and IV
  RETURN jsonb_build_object(
    'encrypted_token', encode(encrypted_token, 'base64'),
    'iv', encode(iv, 'base64'),
    'key_hint', substring(encode(digest(key_to_use, 'sha256'), 'hex'), 1, 8)
  );
END;
$$;

-- Create decryption function for Plaid tokens
CREATE OR REPLACE FUNCTION public.decrypt_plaid_token(encrypted_data jsonb, encryption_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted_token bytea;
BEGIN
  -- Decrypt the token
  decrypted_token := pgp_sym_decrypt_bytea(
    decode(encrypted_data->>'encrypted_token', 'base64'),
    encryption_key
  );
  
  -- Return decrypted token as text
  RETURN convert_from(decrypted_token, 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if decryption fails
    RETURN NULL;
END;
$$;

-- Migrate existing plain text tokens to encrypted format
DO $$
DECLARE
  profile_record RECORD;
  encryption_result jsonb;
  master_key text;
BEGIN
  -- Generate a master key for existing tokens (in production, this should be managed externally)
  master_key := encode(gen_random_bytes(32), 'hex');
  
  -- Migrate existing plain text tokens
  FOR profile_record IN 
    SELECT id, user_id, plaid_access_token 
    FROM public.profiles 
    WHERE plaid_access_token IS NOT NULL 
    AND encrypted_plaid_token IS NULL
  LOOP
    -- Encrypt the existing token
    SELECT public.encrypt_plaid_token(profile_record.plaid_access_token, master_key) INTO encryption_result;
    
    -- Update the profile with encrypted token
    UPDATE public.profiles 
    SET 
      encrypted_plaid_token = encryption_result->>'encrypted_token',
      token_iv = encryption_result->>'iv',
      plaid_access_token = NULL, -- Remove plain text token
      last_token_rotation = now()
    WHERE id = profile_record.id;
    
    RAISE NOTICE 'Migrated token for user %', profile_record.user_id;
  END LOOP;
END $$;

-- Add constraint to prevent storing plain text tokens going forward
ALTER TABLE public.profiles 
ADD CONSTRAINT no_plain_text_plaid_tokens 
CHECK (plaid_access_token IS NULL OR encrypted_plaid_token IS NULL);