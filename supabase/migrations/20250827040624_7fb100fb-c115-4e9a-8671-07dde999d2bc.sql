-- Create waitlist email logging table for anti-abuse
CREATE TABLE public.waitlist_email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_masked TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT
);

-- Create indexes for performance
CREATE INDEX idx_waitlist_email_log_created_at ON public.waitlist_email_log (created_at);
CREATE INDEX idx_waitlist_email_log_ip_address ON public.waitlist_email_log (ip_address);
CREATE INDEX idx_waitlist_email_log_email_masked ON public.waitlist_email_log (email_masked);

-- Enable RLS on the logging table
ALTER TABLE public.waitlist_email_log ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert when current function is send-waitlist-confirmation
CREATE POLICY "Allow service role to log waitlist emails"
ON public.waitlist_email_log
FOR INSERT
TO service_role
WITH CHECK (current_setting('app.current_function_name', true) = 'send-waitlist-confirmation');

-- No SELECT policy - nobody should read this via API

-- Create rate limiting function for waitlist emails
CREATE OR REPLACE FUNCTION public.check_waitlist_email_rate(email_param text, ip_param inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  email_recent_count integer;
  email_daily_count integer;
  ip_daily_count integer;
  email_masked text;
BEGIN
  -- Mask the email for comparison
  email_masked := regexp_replace(email_param, '(.{2}).+@', '\1***@');
  
  -- Check per-email limits: 2 per hour
  SELECT COUNT(*) INTO email_recent_count
  FROM public.waitlist_email_log
  WHERE email_masked = email_masked
    AND created_at > now() - interval '1 hour';
  
  IF email_recent_count >= 2 THEN
    RETURN false;
  END IF;
  
  -- Check per-email daily limit: 5 per day
  SELECT COUNT(*) INTO email_daily_count
  FROM public.waitlist_email_log
  WHERE email_masked = email_masked
    AND created_at > now() - interval '24 hours';
  
  IF email_daily_count >= 5 THEN
    RETURN false;
  END IF;
  
  -- Check per-IP daily limit: 10 per day
  IF ip_param IS NOT NULL THEN
    SELECT COUNT(*) INTO ip_daily_count
    FROM public.waitlist_email_log
    WHERE ip_address = ip_param
      AND created_at > now() - interval '24 hours';
    
    IF ip_daily_count >= 10 THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Create helper function to check recent waitlist signup
CREATE OR REPLACE FUNCTION public.has_recent_waitlist_signup(email_param text, days_param integer DEFAULT 30)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  signup_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM public.waitlist_signups 
    WHERE lower(email) = lower(email_param)
      AND created_at > now() - (days_param || ' days')::interval
  ) INTO signup_exists;
  
  RETURN signup_exists;
END;
$$;

-- Update get_shared_budget_secure function to accept client_ip parameter
CREATE OR REPLACE FUNCTION public.get_shared_budget_secure(share_token text, user_email text DEFAULT NULL::text, client_ip text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    share_record RECORD;
    budget_data_result jsonb;
    ip_to_use text;
    rate_limit_ok boolean;
BEGIN
    -- Use provided client_ip or fall back to context setting
    ip_to_use := COALESCE(client_ip, current_setting('app.client_ip', true));
    IF ip_to_use IS NULL OR ip_to_use = '' THEN
        ip_to_use := '0.0.0.0';
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
    
    -- Check rate limiting using the existing function
    SELECT public.check_budget_share_rate_limit(
        share_record.id, 
        ip_to_use
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