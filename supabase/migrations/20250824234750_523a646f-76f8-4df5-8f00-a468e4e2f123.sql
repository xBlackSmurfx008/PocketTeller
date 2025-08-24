-- Fix critical security vulnerability in profiles_secure table

-- Step 1: Enable Row Level Security on profiles_secure table
ALTER TABLE public.profiles_secure ENABLE ROW LEVEL SECURITY;

-- Step 2: Make user_id non-nullable and add proper constraints
-- First, clean up any existing data with null user_id
DELETE FROM public.profiles_secure WHERE user_id IS NULL;

-- Make user_id NOT NULL and add foreign key constraint for data integrity
ALTER TABLE public.profiles_secure 
  ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint to ensure referential integrity
-- (Note: We reference profiles table, not auth.users directly as per best practices)
ALTER TABLE public.profiles_secure 
  ADD CONSTRAINT fk_profiles_secure_user_id 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Step 3: Create secure RLS policies

-- Policy 1: Users can only view their own security profile data
CREATE POLICY "Users can view their own security profile" 
ON public.profiles_secure 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can only insert their own security profile data
CREATE POLICY "Users can insert their own security profile" 
ON public.profiles_secure 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can only update their own security profile data
CREATE POLICY "Users can update their own security profile" 
ON public.profiles_secure 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can only delete their own security profile data
CREATE POLICY "Users can delete their own security profile" 
ON public.profiles_secure 
FOR DELETE 
USING (auth.uid() = user_id);

-- Step 4: Create a secure function for service role access if needed
-- This allows system operations while maintaining security
CREATE OR REPLACE FUNCTION public.get_user_security_profile(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  has_plaid_connection boolean,
  security_alerts_enabled boolean,
  last_suspicious_access_at timestamp with time zone,
  token_access_count integer,
  last_token_rotation timestamp with time zone,
  has_connected_voice_ui boolean,
  updated_at timestamp with time zone,
  timezone text,
  app_id text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access to own data or system access
  IF auth.uid() = target_user_id OR auth.jwt() ->> 'role' = 'service_role' THEN
    RETURN QUERY 
    SELECT ps.user_id, ps.has_plaid_connection, ps.security_alerts_enabled,
           ps.last_suspicious_access_at, ps.token_access_count, ps.last_token_rotation,
           ps.has_connected_voice_ui, ps.updated_at, ps.timezone, ps.app_id, ps.created_at
    FROM public.profiles_secure ps
    WHERE ps.user_id = target_user_id;
  ELSE
    -- Return empty result for unauthorized access
    RETURN;
  END IF;
END;
$$;

-- Step 5: Add audit logging for security profile access
CREATE OR REPLACE FUNCTION public.log_security_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to security profiles for audit purposes
  INSERT INTO public.plaid_token_audit_log (
    user_id, 
    access_type, 
    function_name, 
    success,
    ip_address
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    'profiles_secure_access',
    true,
    inet_client_addr()
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging
CREATE TRIGGER audit_security_profile_access
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles_secure
  FOR EACH ROW EXECUTE FUNCTION public.log_security_profile_access();

-- Step 6: Add index for performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_secure_user_id 
ON public.profiles_secure(user_id);

-- Step 7: Add updated_at trigger for automatic timestamp management
CREATE TRIGGER update_profiles_secure_updated_at
  BEFORE UPDATE ON public.profiles_secure
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();