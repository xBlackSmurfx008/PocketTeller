-- Fix security vulnerability: Remove unnecessary profiles_secure view
-- The profiles_secure view is redundant and creates confusion about security
-- All security profile access should go through the secure function get_user_security_profile_secure()

-- Drop the profiles_secure view since it's not needed
-- The profiles table already has proper RLS policies
-- And the get_user_security_profile_secure function provides secure access
DROP VIEW IF EXISTS public.profiles_secure;

-- Ensure the profiles table has proper RLS enabled (should already be enabled)
-- This is just a safety check
DO $$
BEGIN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create a comment to document the security approach
COMMENT ON FUNCTION public.get_user_security_profile_secure(uuid) IS 
'Secure function to access user security profile data. This function includes proper authorization checks and audit logging. Use this instead of direct table access for security profile information.';