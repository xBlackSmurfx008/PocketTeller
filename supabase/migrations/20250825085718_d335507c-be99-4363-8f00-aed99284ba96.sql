-- Fix 1: Remove the problematic budget_shares SELECT policy that allows unauthorized access
DROP POLICY IF EXISTS "View shared budgets with valid token only" ON public.budget_shares;

-- Fix 2: Set search_path for SECURITY DEFINER functions to prevent search path injection attacks
ALTER FUNCTION public.update_site_metrics() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public', 'auth';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.handle_goal_task_completion() SET search_path = 'public';
ALTER FUNCTION public.generate_secure_token() SET search_path = 'public';
ALTER FUNCTION public.log_budget_share_access(uuid, text, text) SET search_path = 'public';
ALTER FUNCTION public.get_secure_profile(uuid) SET search_path = 'public', 'auth';
ALTER FUNCTION public.get_user_profile_secure(uuid) SET search_path = 'public', 'auth';
ALTER FUNCTION public.get_user_security_profile_secure(uuid) SET search_path = 'public', 'auth';
ALTER FUNCTION public.validate_share_access(text, text) SET search_path = 'public';
ALTER FUNCTION public.validate_email_content(text) SET search_path = 'public';
ALTER FUNCTION public.validate_sms_content(text, text) SET search_path = 'public';
ALTER FUNCTION public.check_budget_share_rate_limit(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.clear_user_audit_logs() SET search_path = 'public', 'auth';
ALTER FUNCTION public.check_auth_security_settings() SET search_path = 'public';
ALTER FUNCTION public.rotate_plaid_token(uuid) SET search_path = 'public', 'auth';
ALTER FUNCTION public.check_token_access_rate(uuid) SET search_path = 'public';
ALTER FUNCTION public.decrypt_plaid_token_with_audit(jsonb, text, text, text, text) SET search_path = 'public', 'auth';
ALTER FUNCTION public.decrypt_plaid_token(jsonb, text) SET search_path = 'public';
ALTER FUNCTION public.encrypt_plaid_token(text, text) SET search_path = 'public';
ALTER FUNCTION public.increment_token_access_on_audit() SET search_path = 'public';

-- Fix 3: Improve validate_share_access function to enforce authentication and email restrictions
CREATE OR REPLACE FUNCTION public.validate_share_access(share_token text, request_ip text DEFAULT NULL::text, user_email text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    share_record RECORD;
    access_count integer;
    is_email_allowed boolean;
BEGIN
    -- Find the share record
    SELECT * INTO share_record
    FROM public.budget_shares
    WHERE token = share_token
      AND expires_at > now()
      AND view_count < COALESCE(max_views, 10);
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired share');
    END IF;
    
    -- Check if authentication is required
    IF share_record.requires_auth AND auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
    END IF;
    
    -- Check email restrictions if specified
    IF share_record.allowed_emails IS NOT NULL AND array_length(share_record.allowed_emails, 1) > 0 THEN
        IF user_email IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Email verification required');
        END IF;
        
        is_email_allowed := user_email = ANY(share_record.allowed_emails);
        IF NOT is_email_allowed THEN
            RETURN jsonb_build_object('success', false, 'error', 'Email not authorized');
        END IF;
    END IF;
    
    -- Check rate limiting if IP provided
    IF request_ip IS NOT NULL THEN
        SELECT COUNT(*) INTO access_count
        FROM jsonb_array_elements(share_record.access_logs) AS log_entry
        WHERE log_entry->>'ip_address' = request_ip
          AND (log_entry->>'timestamp')::timestamp > now() - interval '1 hour';
        
        IF access_count >= 10 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Rate limit exceeded');
        END IF;
    END IF;
    
    -- Return the budget data securely
    RETURN jsonb_build_object(
        'success', true,
        'budget_data', share_record.budget_data,
        'share_id', share_record.id
    );
END;
$function$;

-- Fix 4: Restrict site_metrics access to authenticated users only (remove public access)
DROP POLICY IF EXISTS "Anyone can read site metrics" ON public.site_metrics;
CREATE POLICY "Authenticated users can read site metrics" ON public.site_metrics
  FOR SELECT 
  TO authenticated
  USING (auth.uid() IS NOT NULL);