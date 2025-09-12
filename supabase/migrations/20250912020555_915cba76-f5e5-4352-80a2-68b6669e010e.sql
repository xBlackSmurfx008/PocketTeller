-- Fix security vulnerability in contact_submissions table
-- Add explicit denial policies for enhanced security of customer contact data

-- Add explicit policy to deny public SELECT access to contact submissions
CREATE POLICY "Deny public access to contact submissions" 
ON public.contact_submissions 
FOR SELECT 
TO public
USING (false);

-- Add explicit policy to deny public INSERT access (only service role should insert)
CREATE POLICY "Deny public insert to contact submissions" 
ON public.contact_submissions 
FOR INSERT 
TO public
WITH CHECK (false);

-- Add explicit policy to deny public DELETE access to protect data integrity
CREATE POLICY "Deny public delete to contact submissions" 
ON public.contact_submissions 
FOR DELETE 
TO public
USING (false);

-- Create a function to audit contact submission access attempts
CREATE OR REPLACE FUNCTION public.log_contact_submission_access_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any attempt to access contact submissions
  INSERT INTO public.app_logs (
    user_id,
    level,
    message,
    context,
    ip_address
  ) VALUES (
    auth.uid(),
    'WARN',
    'Contact submissions access attempt',
    jsonb_build_object(
      'table', 'contact_submissions',
      'operation', TG_OP,
      'user_role', CASE 
        WHEN auth.uid() IS NULL THEN 'anonymous'
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN 'admin'
        ELSE 'authenticated_user'
      END
    ),
    inet_client_addr()
  );
  
  RETURN NULL; -- For AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to log access attempts for monitoring
CREATE TRIGGER contact_submissions_access_audit
  AFTER SELECT ON public.contact_submissions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.log_contact_submission_access_attempt();

-- Add additional validation for contact form data integrity
CREATE OR REPLACE FUNCTION public.validate_contact_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format
  IF NEW.email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Sanitize and validate name length
  IF length(trim(NEW.name)) < 2 OR length(trim(NEW.name)) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;
  
  -- Validate message length
  IF length(trim(NEW.message)) < 10 OR length(trim(NEW.message)) > 5000 THEN
    RAISE EXCEPTION 'Message must be between 10 and 5000 characters';
  END IF;
  
  -- Validate inquiry type is from allowed list
  IF NEW.inquiry_type NOT IN ('general', 'support', 'partnership', 'billing', 'technical', 'other') THEN
    RAISE EXCEPTION 'Invalid inquiry type';
  END IF;
  
  -- Ensure timestamps are set correctly
  NEW.created_at = COALESCE(NEW.created_at, now());
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for data validation
CREATE TRIGGER validate_contact_submission_trigger
  BEFORE INSERT OR UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contact_submission();