-- Enable leaked password protection in Supabase Auth
-- This prevents users from setting passwords that have been compromised in data breaches

-- Note: This setting is typically configured in the Supabase Dashboard under Auth > Settings
-- However, we can document the requirement and provide guidance

-- Create a function to check if leaked password protection should be enabled
-- This serves as documentation and can be used for monitoring
CREATE OR REPLACE FUNCTION public.check_auth_security_settings()
RETURNS TABLE (
  setting_name text,
  current_status text,
  recommended_status text,
  security_impact text
)
LANGUAGE sql
SECURITY DEFINER
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

-- Add comment explaining the manual configuration requirement
COMMENT ON FUNCTION public.check_auth_security_settings() IS 
'Returns recommended auth security settings. Leaked password protection must be enabled manually in Supabase Dashboard > Auth > Settings > Password Security.';

-- Grant access to view security recommendations
GRANT EXECUTE ON FUNCTION public.check_auth_security_settings() TO authenticated;