-- Create table for share send audit logging
CREATE TABLE public.share_send_log (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    share_id uuid,
    channel text NOT NULL, -- 'email' or 'sms'
    recipient text NOT NULL, -- email address or phone number
    ip_address inet,
    user_agent text,
    success boolean NOT NULL DEFAULT false,
    error_message text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.share_send_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own send logs
CREATE POLICY "Users can view their own share send logs" 
ON public.share_send_log 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can insert logs
CREATE POLICY "Service role can insert share send logs" 
ON public.share_send_log 
FOR INSERT 
WITH CHECK (true);

-- Create rate limiting function for share sending
CREATE OR REPLACE FUNCTION public.check_share_send_rate(target_user_id uuid, channel_type text, request_ip text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    send_count integer;
BEGIN
    -- Count sends in the last hour by user and channel
    SELECT COUNT(*) INTO send_count
    FROM public.share_send_log
    WHERE user_id = target_user_id
      AND channel = channel_type
      AND created_at > now() - interval '1 hour';
    
    -- Also count by IP if provided (additional protection)
    IF request_ip IS NOT NULL THEN
        SELECT COUNT(*) INTO send_count
        FROM public.share_send_log
        WHERE (user_id = target_user_id OR ip_address = request_ip::inet)
          AND channel = channel_type
          AND created_at > now() - interval '1 hour';
    END IF;
    
    -- Allow up to 10 sends per hour per user/channel (or IP)
    RETURN send_count < 10;
END;
$function$;

-- Update validate_share_access to include auth requirements
CREATE OR REPLACE FUNCTION public.validate_share_access(share_token text, request_ip text DEFAULT NULL, user_email text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    share_record RECORD;
    access_count integer;
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
    IF share_record.requires_auth = true THEN
        -- Check if user email is provided and authorized
        IF user_email IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
        END IF;
        
        -- Check if user is the owner or in allowed emails list
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.user_id = share_record.user_id 
            AND EXISTS (
                SELECT 1 FROM auth.users au 
                WHERE au.id = p.user_id AND au.email = user_email
            )
        ) AND (
            share_record.allowed_emails IS NULL OR 
            NOT (user_email = ANY(share_record.allowed_emails))
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Access denied');
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
        'share_id', share_record.id,
        'requires_auth', share_record.requires_auth,
        'user_id', share_record.user_id
    );
END;
$function$;

-- Create trigger to increment token access count
CREATE TRIGGER increment_token_access_trigger
AFTER INSERT ON public.plaid_token_audit_log
FOR EACH ROW
EXECUTE FUNCTION public.increment_token_access_on_audit();