-- Continue with other security fixes while storage policies will be handled separately

-- Update the share get budget function to use enhanced rate limiting
CREATE OR REPLACE FUNCTION public.get_shared_budget_secure(share_token text, user_email text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    share_record RECORD;
    budget_data_result jsonb;
    client_ip text;
    rate_limit_ok boolean;
BEGIN
    -- Get client IP from request (will be passed from edge function)
    client_ip := current_setting('app.client_ip', true);
    IF client_ip IS NULL OR client_ip = '' THEN
        client_ip := '0.0.0.0';
    END IF;
    
    -- Validate the share exists
    SELECT * INTO share_record
    FROM public.budget_shares
    WHERE token = share_token
      AND expires_at > now()
      AND view_count < COALESCE(max_views, 10);
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Invalid or expired share');
    END IF;
    
    -- Check enhanced rate limiting
    SELECT public.check_budget_share_rate_limit_enhanced(
        share_record.id, 
        client_ip, 
        user_email
    ) INTO rate_limit_ok;
    
    IF NOT rate_limit_ok THEN
        RETURN jsonb_build_object('error', 'Rate limit exceeded');
    END IF;
    
    -- Additional security checks
    IF share_record.requires_auth AND user_email IS NULL THEN
        RETURN jsonb_build_object('error', 'Authentication required');
    END IF;
    
    IF share_record.allowed_emails IS NOT NULL AND array_length(share_record.allowed_emails, 1) > 0 THEN
        IF user_email IS NULL OR NOT (lower(user_email) = ANY(
            SELECT lower(unnest(share_record.allowed_emails))
        )) THEN
            RETURN jsonb_build_object('error', 'Email not authorized');
        END IF;
    END IF;
    
    -- Return only essential budget data, remove sensitive details
    budget_data_result := jsonb_build_object(
        'income', share_record.budget_data->'income',
        'expenses', share_record.budget_data->'expenses',
        'categories', share_record.budget_data->'categories',
        'time_period', share_record.budget_data->'time_period',
        'created_at', share_record.created_at,
        'expires_at', share_record.expires_at,
        'view_count', share_record.view_count,
        'max_views', share_record.max_views
    );
    
    RETURN budget_data_result;
END;
$$;

-- Update log function to include user email for rate limiting
CREATE OR REPLACE FUNCTION public.log_budget_share_access(
    share_id uuid, 
    ip_address text DEFAULT NULL::text, 
    user_agent text DEFAULT NULL::text,
    user_email text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  access_log JSONB;
BEGIN
  access_log := jsonb_build_object(
    'timestamp', now(),
    'ip_address', ip_address,
    'user_agent', user_agent,
    'user_email', user_email
  );
  
  UPDATE public.budget_shares 
  SET access_logs = COALESCE(access_logs, '[]'::jsonb) || access_log
  WHERE id = share_id;
END;
$$;

-- Fix the admin user trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;