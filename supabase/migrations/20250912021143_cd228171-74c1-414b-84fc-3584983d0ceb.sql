-- Fix remaining security vulnerabilities
-- Address function search path issues and add enhanced password validation

-- Fix search_path for existing security definer functions that are missing it
ALTER FUNCTION public.validate_contact_submission() SET search_path = public;
ALTER FUNCTION public.log_contact_admin_access() SET search_path = public;
ALTER FUNCTION public.validate_subscription_data() SET search_path = public;
ALTER FUNCTION public.log_subscription_access() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.waitlist_signup(text, text, text) SET search_path = public;
ALTER FUNCTION public.get_shared_budget_secure(text, text, text) SET search_path = public;
ALTER FUNCTION public.validate_share_access(text, text, text) SET search_path = public;
ALTER FUNCTION public.check_contact_rate_limit(text, inet) SET search_path = public;
ALTER FUNCTION public.sanitize_email_content(text) SET search_path = public;
ALTER FUNCTION public.validate_email_content(text) SET search_path = public;
ALTER FUNCTION public.validate_sms_content(text, text) SET search_path = public;

-- Create enhanced password validation function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb AS $$
DECLARE
  result jsonb := '{"valid": true, "errors": []}'::jsonb;
  errors text[] := '{}';
BEGIN
  -- Minimum length check (12 characters)
  IF length(password) < 12 THEN
    errors := array_append(errors, 'Password must be at least 12 characters long');
  END IF;
  
  -- Uppercase letter check
  IF password !~ '[A-Z]' THEN
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Lowercase letter check
  IF password !~ '[a-z]' THEN
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Number check
  IF password !~ '[0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  -- Special character check
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  -- Common pattern checks
  IF password ~* '(password|123456|qwerty|admin|welcome|login)' THEN
    errors := array_append(errors, 'Password contains common patterns that are not allowed');
  END IF;
  
  -- Sequential character check
  IF password ~ '(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)' THEN
    errors := array_append(errors, 'Password cannot contain sequential characters');
  END IF;
  
  -- Set result
  IF array_length(errors, 1) > 0 THEN
    result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(errors),
      'strength_score', CASE 
        WHEN array_length(errors, 1) >= 4 THEN 1
        WHEN array_length(errors, 1) >= 2 THEN 2
        ELSE 3
      END
    );
  ELSE
    result := jsonb_build_object(
      'valid', true,
      'errors', '[]'::jsonb,
      'strength_score', 5
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to check for suspicious authentication activity
CREATE OR REPLACE FUNCTION public.check_suspicious_auth_activity(user_email text, client_ip inet)
RETURNS boolean AS $$
DECLARE
  failed_attempts integer;
  different_ips integer;
BEGIN
  -- Check for excessive failed login attempts in last hour
  SELECT COUNT(*) INTO failed_attempts
  FROM public.auth_audit_log
  WHERE event_type = 'sign_in_failed'
    AND metadata->>'email' = user_email
    AND created_at > now() - interval '1 hour';
  
  -- Check for logins from many different IPs in last 24 hours
  SELECT COUNT(DISTINCT ip_address) INTO different_ips
  FROM public.auth_audit_log
  WHERE event_type = 'sign_in_success'
    AND metadata->>'email' = user_email
    AND created_at > now() - interval '24 hours';
  
  -- Return true if suspicious activity detected
  RETURN (failed_attempts >= 5 OR different_ips >= 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_id_param uuid DEFAULT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'INFO'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.app_logs (
    user_id,
    level,
    message,
    context,
    ip_address
  ) VALUES (
    user_id_param,
    severity,
    'Security Event: ' || event_type,
    jsonb_build_object(
      'event_type', event_type,
      'event_data', event_data,
      'timestamp', now(),
      'source', 'security_monitor'
    ),
    inet_client_addr()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;