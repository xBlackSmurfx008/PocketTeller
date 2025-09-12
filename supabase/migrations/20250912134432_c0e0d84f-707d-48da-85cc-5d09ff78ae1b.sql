-- Update waitlist_signup to accept client_ip_param and stop relying on set_config
CREATE OR REPLACE FUNCTION public.waitlist_signup(
  email_param text,
  user_agent_param text DEFAULT NULL::text,
  source_param text DEFAULT 'home_hero'::text,
  client_ip_param text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  client_ip text;
  safe_ip inet;
  rate_limit_ok boolean;
  email_masked text;
  signup_id uuid;
BEGIN
  -- Prefer provided client_ip_param; fallback to GUC; then default
  client_ip := COALESCE(NULLIF(client_ip_param, ''), current_setting('app.client_ip', true), '0.0.0.0');

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
  
  -- Insert signup (RLS bypassed by SECURITY DEFINER)
  INSERT INTO public.waitlist_signups (email, source, user_agent)
  VALUES (email_param, source_param, user_agent_param)
  RETURNING id INTO signup_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully added to waitlist',
    'id', signup_id
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email already on waitlist'
    );
  WHEN OTHERS THEN
    -- Log the actual error for debugging
    RAISE LOG 'Waitlist signup error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to add to waitlist: ' || SQLERRM
    );
END;
$$;