-- Drop the existing potentially insecure view
DROP VIEW IF EXISTS public.profiles_secure;

-- Recreate the view with proper security (SECURITY INVOKER, not DEFINER)
-- This ensures RLS policies from the underlying profiles table are respected
CREATE VIEW public.profiles_secure 
WITH (security_invoker = true)
AS 
SELECT 
    user_id,
    app_id,
    created_at,
    updated_at,
    has_connected_voice_ui,
    last_token_rotation,
    token_access_count,
    last_suspicious_access_at,
    security_alerts_enabled,
    (encrypted_plaid_token IS NOT NULL) AS has_plaid_connection
FROM public.profiles;