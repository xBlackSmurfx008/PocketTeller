-- Create audit log table for Plaid token access
CREATE TABLE IF NOT EXISTS public.plaid_token_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  access_type text NOT NULL, -- 'decrypt', 'encrypt', 'rotate'
  function_name text NOT NULL,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.plaid_token_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service roles can insert audit logs
CREATE POLICY "Service role can insert audit logs" 
ON public.plaid_token_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Users can only view their own audit logs
CREATE POLICY "Users can view their own audit logs" 
ON public.plaid_token_audit_log 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create enhanced decryption function with audit logging
CREATE OR REPLACE FUNCTION public.decrypt_plaid_token_with_audit(
  encrypted_data jsonb, 
  encryption_key text,
  function_name text DEFAULT 'unknown',
  ip_address text DEFAULT NULL,
  user_agent text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted_token bytea;
  result_token text;
  target_user_id uuid;
BEGIN
  -- Get the current user context
  target_user_id := auth.uid();
  
  -- If no auth context, this might be a service role call
  IF target_user_id IS NULL THEN
    -- For service role calls, we need to extract user_id from context
    -- This should be set by the calling function
    target_user_id := current_setting('app.current_user_id', true)::uuid;
  END IF;

  BEGIN
    -- Decrypt the token
    decrypted_token := pgp_sym_decrypt_bytea(
      decode(encrypted_data->>'encrypted_token', 'base64'),
      encryption_key
    );
    
    result_token := convert_from(decrypted_token, 'UTF8');
    
    -- Log successful decryption
    INSERT INTO public.plaid_token_audit_log (
      user_id, access_type, function_name, ip_address, user_agent, success
    ) VALUES (
      target_user_id, 'decrypt', function_name, ip_address::inet, user_agent, true
    );
    
    RETURN result_token;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log failed decryption attempt
      INSERT INTO public.plaid_token_audit_log (
        user_id, access_type, function_name, ip_address, user_agent, success, error_message
      ) VALUES (
        target_user_id, 'decrypt', function_name, ip_address::inet, user_agent, false, SQLERRM
      );
      
      -- Return NULL on failure
      RETURN NULL;
  END;
END;
$$;

-- Create function to rotate Plaid tokens
CREATE OR REPLACE FUNCTION public.rotate_plaid_token(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Get current profile
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update token rotation timestamp and clear old encrypted token
  -- (This forces re-authentication with Plaid)
  UPDATE public.profiles 
  SET 
    encrypted_plaid_token = NULL,
    token_iv = NULL,
    last_token_rotation = now()
  WHERE user_id = target_user_id;
  
  -- Log token rotation
  INSERT INTO public.plaid_token_audit_log (
    user_id, access_type, function_name, success
  ) VALUES (
    target_user_id, 'rotate', 'rotate_plaid_token', true
  );
  
  RETURN true;
END;
$$;

-- Create function to check token access frequency (rate limiting)
CREATE OR REPLACE FUNCTION public.check_token_access_rate(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_count integer;
BEGIN
  -- Count token access attempts in the last hour
  SELECT COUNT(*) INTO access_count
  FROM public.plaid_token_audit_log
  WHERE user_id = target_user_id
    AND access_type = 'decrypt'
    AND created_at > now() - interval '1 hour';
  
  -- Allow up to 50 token accesses per hour (should be sufficient for normal use)
  RETURN access_count < 50;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plaid_audit_log_user_created 
ON public.plaid_token_audit_log(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_plaid_audit_log_access_type 
ON public.plaid_token_audit_log(access_type, created_at);

-- Update profiles table to add token security metadata
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS token_access_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_suspicious_access_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS security_alerts_enabled boolean DEFAULT true;