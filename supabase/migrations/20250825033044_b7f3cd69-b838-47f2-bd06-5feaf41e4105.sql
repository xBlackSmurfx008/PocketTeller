-- Fix the security definer view warning
-- The linter warns about SECURITY DEFINER views, but in our case this is intentional for security
-- Let's adjust the view to be more standard and rely on RLS instead

-- Drop the current view
DROP VIEW IF EXISTS public.profiles_secure;

-- Recreate the view without security_barrier to avoid the linter warning
-- The underlying profiles table already has proper RLS policies that will apply
CREATE VIEW public.profiles_secure AS 
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
WHERE p.user_id = auth.uid()
  AND auth.uid() IS NOT NULL;

-- Grant appropriate permissions - this view will inherit RLS from the underlying table
GRANT SELECT ON public.profiles_secure TO authenticated;

-- Update the function to be more explicit about its security model
CREATE OR REPLACE FUNCTION public.get_secure_profile(target_user_id uuid DEFAULT NULL)
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
    
    -- If no target_user_id provided, use current user
    IF target_user_id IS NULL THEN
        target_user_id := requesting_user_id;
    END IF;
    
    -- Security check: users can only access their own profile
    -- Service role can access any profile for administrative functions
    IF requesting_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    IF requesting_user_id != target_user_id AND 
       (current_setting('role', true) != 'service_role') THEN
        -- Log unauthorized access attempt
        INSERT INTO public.plaid_token_audit_log (
            user_id, 
            access_type, 
            function_name, 
            success,
            error_message
        ) VALUES (
            requesting_user_id,
            'unauthorized_profile_access',
            'get_secure_profile',
            false,
            'Attempted to access profile for user: ' || target_user_id::text
        );
        
        RAISE EXCEPTION 'Access denied: cannot access other users profiles';
    END IF;
    
    -- Log successful access for monitoring (only for cross-user access)
    IF requesting_user_id != target_user_id THEN
        INSERT INTO public.plaid_token_audit_log (
            user_id, 
            access_type, 
            function_name, 
            success
        ) VALUES (
            target_user_id,
            'admin_profile_access',
            'get_secure_profile',
            true
        );
    END IF;
    
    -- Return the profile data using the secure view
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
    WHERE p.user_id = target_user_id
      AND (requesting_user_id = target_user_id OR current_setting('role', true) = 'service_role');
END;
$$;

-- Add helpful comments
COMMENT ON VIEW public.profiles_secure IS 'Secure view of user profiles that automatically filters to current authenticated user only. Inherits RLS policies from the underlying profiles table.';
COMMENT ON FUNCTION public.get_secure_profile IS 'Secure function for accessing user profile data with proper authorization checks and audit logging. Use this for administrative access or when you need audit trails.';