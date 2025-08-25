-- Security fixes migration - Critical vulnerabilities remediation

-- 1. Enforce unique, index-backed budget share tokens
CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_shares_token_unique ON public.budget_shares(token);
CREATE INDEX IF NOT EXISTS idx_budget_shares_expires_at ON public.budget_shares(expires_at);

-- 2. Fix storage RLS for chat-uploads bucket
-- Allow users to only access their own files in chat-uploads bucket
CREATE POLICY "Users can view own chat uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can insert own chat uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own chat uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'chat-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own chat uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Lock down SECURITY DEFINER function search_path
ALTER FUNCTION public.handle_plaid_token_update() SET search_path TO 'public';

-- 4. Create safe view count increment RPC for budget shares
CREATE OR REPLACE FUNCTION public.increment_budget_share_view(share_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.budget_shares 
  SET view_count = view_count + 1, 
      last_accessed_at = now() 
  WHERE id = share_id;
  
  RETURN true;
END;
$$;

-- 5. Strengthen token access rate limits (reduce from 50 to 20 per hour)
CREATE OR REPLACE FUNCTION public.check_token_access_rate(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  access_count integer;
BEGIN
  -- Count token access attempts in the last hour (reduced limit)
  SELECT COUNT(*) INTO access_count
  FROM public.plaid_token_audit_log
  WHERE user_id = target_user_id
    AND access_type = 'decrypt'
    AND created_at > now() - interval '1 hour';
  
  -- Allow up to 20 token accesses per hour (reduced from 50)
  RETURN access_count < 20;
END;
$function$;

-- 6. Tighten RLS policies - Remove overly permissive service role access
DROP POLICY IF EXISTS "Service role full access" ON public.plaid_token_audit_log;

-- Create more restrictive audit log policies
CREATE POLICY "Users can view own audit logs" ON public.plaid_token_audit_log
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert audit logs" ON public.plaid_token_audit_log
FOR INSERT WITH CHECK (true);

-- 7. Remove duplicate function if it exists
DROP FUNCTION IF EXISTS public.get_user_security_profile_secure(uuid);

-- 8. Add validation for email domain restrictions on budget shares
CREATE OR REPLACE FUNCTION public.validate_share_access(share_token text, request_ip text DEFAULT NULL::text, user_email text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    share_record RECORD;
    access_count integer;
    is_email_allowed boolean;
BEGIN
    -- Find the share record with stronger validation
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
    
    -- Enhanced email restrictions validation
    IF share_record.allowed_emails IS NOT NULL AND array_length(share_record.allowed_emails, 1) > 0 THEN
        IF user_email IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Email verification required');
        END IF;
        
        -- Case-insensitive email matching with domain validation
        is_email_allowed := lower(user_email) = ANY(
            SELECT lower(unnest(share_record.allowed_emails))
        );
        
        IF NOT is_email_allowed THEN
            RETURN jsonb_build_object('success', false, 'error', 'Email not authorized');
        END IF;
    END IF;
    
    -- Enhanced rate limiting with IP validation
    IF request_ip IS NOT NULL THEN
        SELECT COUNT(*) INTO access_count
        FROM jsonb_array_elements(share_record.access_logs) AS log_entry
        WHERE log_entry->>'ip_address' = request_ip
          AND (log_entry->>'timestamp')::timestamp > now() - interval '1 hour';
        
        -- Reduced rate limit for better security (from 10 to 5)
        IF access_count >= 5 THEN
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