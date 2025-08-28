-- Fix the search path security issue in the audit logging function
CREATE OR REPLACE FUNCTION log_waitlist_access()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log admin access to waitlist data
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.plaid_token_audit_log (
      user_id, 
      access_type, 
      function_name, 
      success
    ) VALUES (
      auth.uid(),
      'waitlist_access',
      'admin_waitlist_view',
      true
    );
  END IF;
  
  RETURN NULL; -- For AFTER triggers
END;
$$;