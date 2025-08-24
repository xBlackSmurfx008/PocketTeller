-- Fix remaining security linter warnings

-- Fix WARN 1: Function Search Path Mutable
-- Update the function to have a secure search_path
CREATE OR REPLACE FUNCTION public.check_auth_security_settings()
RETURNS TABLE (
  setting_name text,
  current_status text,
  recommended_status text,
  security_impact text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public  -- Fix for search path mutable warning
AS $$
  SELECT 
    'Leaked Password Protection'::text as setting_name,
    'DISABLED (requires manual configuration)'::text as current_status,
    'ENABLED'::text as recommended_status,
    'HIGH - Prevents users from setting compromised passwords'::text as security_impact
  UNION ALL
  SELECT 
    'Minimum Password Length'::text as setting_name,
    'Default (6 characters)'::text as current_status,
    '12+ characters'::text as recommended_status,
    'MEDIUM - Increases password strength'::text as security_impact
  UNION ALL
  SELECT 
    'Password Complexity'::text as setting_name,
    'Basic requirements'::text as current_status,
    'Require mixed case, numbers, symbols'::text as recommended_status,
    'MEDIUM - Improves password quality'::text as security_impact;
$$;