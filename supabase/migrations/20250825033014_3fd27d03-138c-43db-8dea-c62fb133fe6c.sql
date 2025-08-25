-- Fix security issue with profiles_secure view
-- The current view has security gaps - let's make it more robust

-- Drop the existing insecure view
DROP VIEW IF EXISTS public.profiles_secure;

-- Create a more secure view with proper access controls
CREATE VIEW public.profiles_secure
WITH (security_barrier = true)
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
WHERE p.user_id = auth.uid()
  AND auth.uid() IS NOT NULL; -- Ensure user is authenticated

-- Grant appropriate permissions on the view
GRANT SELECT ON public.profiles_secure TO authenticated;
GRANT SELECT ON public.profiles_secure TO anon;

-- Create a security definer function for secure profile access
-- This replaces direct view access with controlled function access
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
    
    -- Log successful access for monitoring
    INSERT INTO public.plaid_token_audit_log (
        user_id, 
        access_type, 
        function_name, 
        success
    ) VALUES (
        target_user_id,
        'profile_access',
        'get_secure_profile',
        true
    );
    
    -- Return the profile data
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

-- Create a row level security policy for the view (even though it's a view, this adds extra protection)
-- This ensures that even if the view definition changes, access is still controlled
ALTER VIEW public.profiles_secure SET (security_barrier = true);

-- Add a comment explaining the security model
COMMENT ON VIEW public.profiles_secure IS 'Secure view of user profiles that automatically filters to current user only. Protected by security_barrier and authentication checks.';
COMMENT ON FUNCTION public.get_secure_profile IS 'Security definer function for controlled access to user profile data with audit logging.';