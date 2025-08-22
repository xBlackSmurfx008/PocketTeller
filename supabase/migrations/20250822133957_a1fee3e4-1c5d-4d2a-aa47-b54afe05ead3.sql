-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate cryptographically secure random token
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;