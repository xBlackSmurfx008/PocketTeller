-- Security fixes migration: Implement proper role system and harden security

-- 1. Create proper role system to eliminate privilege escalation
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update is_admin_user function to use proper role system
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Migrate existing admins from profiles.app_id to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles 
WHERE app_id = 'budget-ai-admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- Harden profiles table to prevent privilege escalation
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;
CREATE POLICY "Users can update only their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid() AND (app_id IS NULL OR app_id != 'budget-ai-admin'));

-- Update RLS policies to use proper role system
DROP POLICY IF EXISTS "Admins can view all app logs" ON public.app_logs;
CREATE POLICY "Admins can view all app logs" 
ON public.app_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can view contact submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Consolidate site_metrics policies
DROP POLICY IF EXISTS "Admin users can read all site metrics" ON public.site_metrics;
DROP POLICY IF EXISTS "Only admins can read site metrics" ON public.site_metrics;
CREATE POLICY "Admins can read site metrics" 
ON public.site_metrics 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for user_roles table
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- 2. Create secure waitlist signup RPC
CREATE OR REPLACE FUNCTION public.waitlist_signup(
  email_param text,
  user_agent_param text DEFAULT NULL,
  source_param text DEFAULT 'home_hero'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  client_ip text;
  safe_ip inet;
  rate_limit_ok boolean;
  email_masked text;
BEGIN
  -- Get client IP from edge function context
  client_ip := current_setting('app.client_ip', true);
  IF client_ip IS NULL OR client_ip = '' THEN
    client_ip := '0.0.0.0';
  END IF;
  
  BEGIN
    safe_ip := client_ip::inet;
  EXCEPTION WHEN OTHERS THEN
    safe_ip := '0.0.0.0'::inet;
  END;
  
  -- Mask email for logging
  email_masked := regexp_replace(email_param, '(.{2}).+@', '\1***@');
  
  -- Validate email format
  IF NOT validate_waitlist_email(email_param) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid email format'
    );
  END IF;
  
  -- Check rate limits
  SELECT check_waitlist_rate_limit_enhanced(email_param, safe_ip) INTO rate_limit_ok;
  
  IF NOT rate_limit_ok THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rate limit exceeded'
    );
  END IF;
  
  -- Insert signup
  INSERT INTO public.waitlist_signups (email, source, user_agent)
  VALUES (email_param, source_param, user_agent_param);
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully added to waitlist'
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email already on waitlist'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to add to waitlist'
    );
END;
$$;

-- Remove dangerous public INSERT policy on waitlist_signups
DROP POLICY IF EXISTS "Allow validated public waitlist signups" ON public.waitlist_signups;

-- Update admin policies for waitlist
DROP POLICY IF EXISTS "Admin users can read waitlist signups" ON public.waitlist_signups;
CREATE POLICY "Admins can read waitlist signups" 
ON public.waitlist_signups 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can delete waitlist signups" ON public.waitlist_signups;
CREATE POLICY "Admins can delete waitlist signups" 
ON public.waitlist_signups 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Add explicit deny policies for sensitive tables
CREATE POLICY "Deny public access to waitlist email log" 
ON public.waitlist_email_log 
FOR ALL 
USING (false);

CREATE POLICY "Deny public updates to contact submissions" 
ON public.contact_submissions 
FOR UPDATE 
USING (false);

-- Email content validation function
CREATE OR REPLACE FUNCTION public.sanitize_email_content(content text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF content IS NULL THEN
    RETURN '';
  END IF;
  
  -- Basic HTML escaping
  content := replace(content, '&', '&amp;');
  content := replace(content, '<', '&lt;');
  content := replace(content, '>', '&gt;');
  content := replace(content, '"', '&quot;');
  content := replace(content, '''', '&#x27;');
  
  -- Convert newlines to HTML breaks
  content := replace(content, E'\n', '<br>');
  
  RETURN content;
END;
$$;