-- Fix storage bucket security policies
-- Create more restrictive policies for chat-uploads bucket

-- First, let's ensure we have proper policies for the chat-uploads bucket
CREATE POLICY "Users can view their own chat uploads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own chat files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own chat files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chat files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add SMS validation function
CREATE OR REPLACE FUNCTION public.validate_sms_content(phone_number text, message text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Validate phone number format (basic E.164 format check)
    IF phone_number !~ '^\+[1-9]\d{1,14}$' THEN
        RETURN false;
    END IF;
    
    -- Check for HTML injection patterns in message
    IF message ~* '<script|javascript:|data:|vbscript:|on\w+\s*=' THEN
        RETURN false;
    END IF;
    
    -- Check for excessively long message (SMS limit)
    IF length(message) > 1600 THEN
        RETURN false;
    END IF;
    
    -- Check for spam patterns
    IF message ~* '(click here|free money|urgent|limited time|act now).*http' THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$function$;

-- Improve the budget share access function to use POST method security
CREATE OR REPLACE FUNCTION public.validate_share_access(share_token text, request_ip text DEFAULT NULL::text)
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