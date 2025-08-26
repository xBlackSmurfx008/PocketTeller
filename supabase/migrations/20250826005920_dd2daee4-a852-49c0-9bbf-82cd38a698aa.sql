-- Ensure pgcrypto extension is available in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Fix the encrypt_plaid_token function to use proper digest function
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

  -- Return encrypted token and IV with proper key hint using extensions.digest
  RETURN jsonb_build_object(
    'encrypted_token', encode(encrypted_token, 'base64'),
    'iv', encode(iv, 'base64'),
    'key_hint', substring(encode(extensions.digest(key_to_use, 'sha256'), 'hex'), 1, 8)
  );
END;
$function$;

-- Create plaid_items table for better item management
CREATE TABLE IF NOT EXISTS public.plaid_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL UNIQUE,
  institution_id TEXT,
  institution_name TEXT,
  webhook TEXT,
  available_products TEXT[],
  billed_products TEXT[],
  products TEXT[],
  consent_expiration_time TIMESTAMP WITH TIME ZONE,
  update_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on plaid_items
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for plaid_items
CREATE POLICY "Users can view their own plaid items" 
ON public.plaid_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plaid items" 
ON public.plaid_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plaid items" 
ON public.plaid_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plaid items" 
ON public.plaid_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_plaid_items_updated_at
BEFORE UPDATE ON public.plaid_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add item_id to accounts table for better linking
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS plaid_item_id_ref TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_plaid_item_id_ref ON public.accounts(plaid_item_id_ref);
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON public.plaid_items(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_items_item_id ON public.plaid_items(item_id);