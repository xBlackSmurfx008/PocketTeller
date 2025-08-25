-- Complete security fixes for remaining vulnerabilities

-- 1. **CRITICAL FIX**: Restrict profiles table access to prevent encrypted Plaid token exposure
-- Remove broad access and ensure only user can see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create highly restrictive policies for profiles
CREATE POLICY "Users can view only their own profile data" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. **CRITICAL FIX**: Completely restrict audit log access - only service role should access
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.plaid_token_audit_log;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.plaid_token_audit_log;

-- Only service role can manage audit logs - users should NOT see audit data
CREATE POLICY "Service role full access" ON public.plaid_token_audit_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. **CRITICAL FIX**: Restrict share send logs to own records only
DROP POLICY IF EXISTS "Service role can insert send logs" ON public.share_send_log;
DROP POLICY IF EXISTS "Users can view their own send logs" ON public.share_send_log;

-- Users can only see their own sharing activity
CREATE POLICY "Users view own share logs only" ON public.share_send_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can log share activities" ON public.share_send_log
    FOR INSERT WITH CHECK (true);

-- 4. Fix all remaining functions with mutable search paths
CREATE OR REPLACE FUNCTION public.validate_sms_content(phone_number text, message text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.validate_email_content(content text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Check for basic HTML injection patterns
    IF content ~* '<script|javascript:|data:|vbscript:|on\w+\s*=' THEN
        RETURN false;
    END IF;
    
    -- Check for excessively long content (potential DoS)
    IF length(content) > 10000 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_token_access_rate(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  access_count integer;
BEGIN
  -- Count token access attempts in the last hour
  SELECT COUNT(*) INTO access_count
  FROM public.plaid_token_audit_log
  WHERE user_id = target_user_id
    AND access_type = 'decrypt'
    AND created_at > now() - interval '1 hour';
  
  -- Allow up to 50 token accesses per hour (should be sufficient for normal use)
  RETURN access_count < 50;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_budget_share_rate_limit(share_id uuid, ip_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    access_count integer;
    log_entry jsonb;
BEGIN
    -- Count accesses from this IP in the last hour by properly parsing the access_logs array
    SELECT COUNT(*) INTO access_count
    FROM public.budget_shares bs,
         jsonb_array_elements(bs.access_logs) AS log_entry
    WHERE bs.id = share_id
      AND log_entry->>'ip_address' = ip_address
      AND (log_entry->>'timestamp')::timestamp > now() - interval '1 hour';
    
    -- Allow up to 10 accesses per IP per hour (reduced from 20 for better security)
    RETURN access_count < 10;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_budget_share_access(share_id uuid, ip_address text DEFAULT NULL::text, user_agent text DEFAULT NULL::text)
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
    'user_agent', user_agent
  );
  
  UPDATE public.budget_shares 
  SET access_logs = COALESCE(access_logs, '[]'::jsonb) || access_log
  WHERE id = share_id;
END;
$$;

-- 5. **SECURITY ENHANCEMENT**: Remove the duplicate validate_share_access function with 2 parameters
-- Keep only the secure version with 3 parameters
DROP FUNCTION IF EXISTS public.validate_share_access(text, text);

-- 6. **OPTIONAL**: Create storage policies if they don't exist for chat-uploads bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-uploads', 'chat-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Secure storage policies for chat uploads
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

CREATE POLICY "Users can upload their own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chat-uploads' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'chat-uploads' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'chat-uploads' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );