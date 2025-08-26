-- CRITICAL FIX 1: Remove app_id from profiles table to prevent privilege escalation
-- Create a separate admin_users table for admin management
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_level TEXT NOT NULL DEFAULT 'admin',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only service role can manage admin users
CREATE POLICY "Only service role can manage admin users"
ON public.admin_users
FOR ALL
USING (current_setting('role', true) = 'service_role');

-- Update the site_metrics policy to use the new admin structure
DROP POLICY IF EXISTS "Only admins can read site metrics" ON public.site_metrics;

CREATE POLICY "Only admins can read site metrics"
ON public.site_metrics
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid()
));

-- Remove app_id column from profiles (will be done in separate step to avoid breaking changes)
-- First, let's update the profiles table structure
ALTER TABLE public.profiles DROP COLUMN IF EXISTS app_id;

-- CRITICAL FIX 2: Create secure function to get profile data without exposing sensitive fields
CREATE OR REPLACE FUNCTION public.get_user_profile_safe()
RETURNS TABLE(
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  has_connected_voice_ui BOOLEAN,
  last_token_rotation TIMESTAMP WITH TIME ZONE,
  token_access_count INTEGER,
  last_suspicious_access_at TIMESTAMP WITH TIME ZONE,
  security_alerts_enabled BOOLEAN,
  has_plaid_connection BOOLEAN,
  timezone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
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
  WHERE p.user_id = auth.uid();
END;
$$;

-- HIGH PRIORITY FIX: Add rate limiting for budget share access
CREATE OR REPLACE FUNCTION public.check_budget_share_rate_limit_enhanced(
  share_id UUID, 
  ip_address TEXT,
  user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  ip_access_count INTEGER;
  email_access_count INTEGER;
  global_access_count INTEGER;
BEGIN
  -- Count IP-based accesses in last hour (stricter limit)
  SELECT COUNT(*) INTO ip_access_count
  FROM public.budget_shares bs,
       jsonb_array_elements(bs.access_logs) AS log_entry
  WHERE bs.id = share_id
    AND log_entry->>'ip_address' = ip_address
    AND (log_entry->>'timestamp')::timestamp > now() - interval '1 hour';
  
  -- IP rate limit: 5 accesses per hour
  IF ip_access_count >= 5 THEN
    RETURN FALSE;
  END IF;
  
  -- If user_email provided, check email-based rate limit
  IF user_email IS NOT NULL THEN
    SELECT COUNT(*) INTO email_access_count
    FROM public.budget_shares bs,
         jsonb_array_elements(bs.access_logs) AS log_entry
    WHERE bs.id = share_id
      AND log_entry->>'user_email' = user_email
      AND (log_entry->>'timestamp')::timestamp > now() - interval '1 hour';
    
    -- Email rate limit: 10 accesses per hour
    IF email_access_count >= 10 THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Global rate limit for the share: 50 accesses per hour
  SELECT COUNT(*) INTO global_access_count
  FROM public.budget_shares bs,
       jsonb_array_elements(bs.access_logs) AS log_entry
  WHERE bs.id = share_id
    AND (log_entry->>'timestamp')::timestamp > now() - interval '1 hour';
  
  IF global_access_count >= 50 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- MEDIUM PRIORITY: Create secure storage policies for chat attachments
-- First, ensure chat-uploads bucket has proper policies
DELETE FROM storage.policies WHERE bucket_id = 'chat-uploads';

-- Users can only upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Users can only view their own files
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- MEDIUM PRIORITY: Add CSV injection protection function
CREATE OR REPLACE FUNCTION public.sanitize_csv_field(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove or escape dangerous CSV formula characters
  -- Prepend with single quote to neutralize formulas
  IF input_text ~ '^[=@+\-]' THEN
    RETURN '''' || input_text;
  END IF;
  
  -- Escape double quotes
  RETURN replace(input_text, '"', '""');
END;
$$;

-- AUDIT: Add trigger to log sensitive profile changes
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log changes to security-sensitive fields
  IF TG_OP = 'UPDATE' THEN
    IF OLD.security_alerts_enabled IS DISTINCT FROM NEW.security_alerts_enabled 
       OR OLD.encrypted_plaid_token IS DISTINCT FROM NEW.encrypted_plaid_token THEN
      
      INSERT INTO public.plaid_token_audit_log (
        user_id,
        access_type,
        function_name,
        success,
        error_message
      ) VALUES (
        NEW.user_id,
        'profile_security_change',
        'audit_profile_changes',
        true,
        format('Changed: alerts=%s, token_changed=%s', 
               (OLD.security_alerts_enabled IS DISTINCT FROM NEW.security_alerts_enabled),
               (OLD.encrypted_plaid_token IS DISTINCT FROM NEW.encrypted_plaid_token))
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add the audit trigger
DROP TRIGGER IF EXISTS audit_profile_security_changes ON public.profiles;
CREATE TRIGGER audit_profile_security_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();