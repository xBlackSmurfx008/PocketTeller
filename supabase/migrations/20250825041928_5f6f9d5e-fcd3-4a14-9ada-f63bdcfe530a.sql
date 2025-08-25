-- Fix security definer view by dropping it and recreating with proper permissions
DROP VIEW IF EXISTS public.profiles_secure;

-- Create secure function instead of view for profile access
CREATE OR REPLACE FUNCTION public.get_user_profile_secure(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
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
DECLARE
  requesting_user_id uuid;
BEGIN
  requesting_user_id := auth.uid();
  
  -- If no target provided, use current user
  IF target_user_id IS NULL THEN
    target_user_id := requesting_user_id;
  END IF;
  
  -- Only allow access to own profile
  IF requesting_user_id IS NULL OR requesting_user_id != target_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
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
END;
$$;