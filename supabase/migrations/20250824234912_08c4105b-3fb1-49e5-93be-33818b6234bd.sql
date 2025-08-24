-- Fix security vulnerability in profiles_secure view
-- The issue is that this view exposes sensitive data without proper access controls

-- Step 1: Drop the existing insecure view
DROP VIEW IF EXISTS public.profiles_secure;

-- Step 2: Create a secure view that respects RLS from the underlying profiles table
-- This view will only show data for the authenticated user
CREATE VIEW public.profiles_secure
WITH (security_invoker = true)
AS
SELECT 
  p.user_id,
  p.app_id,
  p.created_at,
  p.updated_at,
  p.has_connected_voice_ui,
  p.last_token_rotation,
  p.token_access_count,
  p.last_suspicious_access_at,
  p.security_alerts_enabled,
  (p.encrypted_plaid_token IS NOT NULL) AS has_plaid_connection,
  p.timezone
FROM public.profiles p
WHERE p.user_id = auth.uid();  -- Only show current user's data

-- Step 3: Create a secure function for system access when needed
-- This allows edge functions to access user security profiles securely
CREATE OR REPLACE FUNCTION public.get_user_security_profile_secure(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  app_id text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  has_connected_voice_ui boolean,
  last_token_rotation timestamp with time zone,
  token_access_count integer,
  last_suspicious_access_at timestamp with time zone,
  security_alerts_enabled boolean,
  has_plaid_connection boolean,
  timezone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access to own data or authorized system access
  IF auth.uid() = target_user_id OR auth.jwt() ->> 'role' = 'service_role' THEN
    RETURN QUERY 
    SELECT 
      p.user_id,
      p.app_id,
      p.created_at,
      p.updated_at,
      p.has_connected_voice_ui,
      p.last_token_rotation,
      p.token_access_count,
      p.last_suspicious_access_at,
      p.security_alerts_enabled,
      (p.encrypted_plaid_token IS NOT NULL) AS has_plaid_connection,
      p.timezone
    FROM public.profiles p
    WHERE p.user_id = target_user_id;
  ELSE
    -- Log unauthorized access attempt
    INSERT INTO public.plaid_token_audit_log (
      user_id, 
      access_type, 
      function_name, 
      success,
      error_message
    ) VALUES (
      auth.uid(),
      'unauthorized_access',
      'get_user_security_profile_secure',
      false,
      'Attempted to access security profile for user: ' || target_user_id::text
    );
    
    -- Return empty result for unauthorized access
    RETURN;
  END IF;
END;
$$;

-- Step 4: Add comment to document the security fix
COMMENT ON VIEW public.profiles_secure IS 
'Secure view of user profile security data. Uses security_invoker=true and WHERE clause to ensure users can only see their own data. Replaces insecure view that exposed all user security information.';

COMMENT ON FUNCTION public.get_user_security_profile_secure(uuid) IS 
'Secure function to access user security profiles. Only allows access to own data or authorized system access. Logs unauthorized access attempts.';

-- Step 5: Grant appropriate permissions to authenticated users
GRANT SELECT ON public.profiles_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_security_profile_secure(uuid) TO authenticated;