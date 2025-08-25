-- Fix remaining security issues

-- 1. Fix function search paths by setting them explicitly
CREATE OR REPLACE FUNCTION public.check_share_send_rate(
    target_user_id UUID,
    channel_type TEXT,
    request_ip INET DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_recent_count INTEGER;
    ip_recent_count INTEGER;
    user_daily_count INTEGER;
BEGIN
    -- Check user rate limit: 5 per 15 minutes per channel
    SELECT COUNT(*) INTO user_recent_count
    FROM public.share_send_log
    WHERE user_id = target_user_id 
        AND channel = channel_type
        AND created_at > now() - INTERVAL '15 minutes';
    
    IF user_recent_count >= 5 THEN
        RETURN false;
    END IF;
    
    -- Check user daily limit: 20 per day overall
    SELECT COUNT(*) INTO user_daily_count
    FROM public.share_send_log
    WHERE user_id = target_user_id 
        AND created_at > now() - INTERVAL '24 hours';
    
    IF user_daily_count >= 20 THEN
        RETURN false;
    END IF;
    
    -- Check IP rate limit if provided: 10 per hour
    IF request_ip IS NOT NULL THEN
        SELECT COUNT(*) INTO ip_recent_count
        FROM public.share_send_log
        WHERE ip_address = request_ip
            AND created_at > now() - INTERVAL '1 hour';
        
        IF ip_recent_count >= 10 THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$;

-- 2. Restrict audit log access to own records only
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.plaid_token_audit_log;
CREATE POLICY "Users can view their own audit logs" ON public.plaid_token_audit_log
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 3. Restrict share_send_log access to own records only 
DROP POLICY IF EXISTS "Users can view their own send logs" ON public.share_send_log;
CREATE POLICY "Users can view their own send logs" ON public.share_send_log
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 4. Add additional protection for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 5. Set search_path for all existing security definer functions
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