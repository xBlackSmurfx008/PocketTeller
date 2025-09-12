-- Fix critical security vulnerability in subscribers table
-- Replace overly permissive RLS policies with proper user-based restrictions

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure RLS policies for subscribers table
CREATE POLICY "Users can insert their own subscription only" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription only" 
ON public.subscribers 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add policy to allow service role updates for payment processing
CREATE POLICY "Service role can update subscriptions for payment processing" 
ON public.subscribers 
FOR UPDATE 
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');

-- Fix waitlist_signups permission issues by adding proper service role policy
CREATE POLICY "Service role can insert waitlist signups" 
ON public.waitlist_signups 
FOR INSERT 
WITH CHECK (current_setting('role', true) = 'service_role');

-- Add function to validate subscription data integrity
CREATE OR REPLACE FUNCTION public.validate_subscription_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format if provided
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate subscription tier is from allowed list
  IF NEW.subscription_tier IS NOT NULL AND NEW.subscription_tier NOT IN ('basic', 'premium', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid subscription tier';
  END IF;
  
  -- Ensure timestamps are set correctly
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for subscription data validation
CREATE TRIGGER validate_subscription_data_trigger
  BEFORE INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_subscription_data();

-- Add audit logging for subscription access
CREATE OR REPLACE FUNCTION public.log_subscription_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log subscription modifications for security monitoring
  INSERT INTO public.app_logs (
    user_id,
    level,
    message,
    context,
    ip_address
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    'INFO',
    'Subscription data accessed',
    jsonb_build_object(
      'table', 'subscribers',
      'operation', TG_OP,
      'subscription_id', CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id::text
        ELSE NEW.id::text
      END,
      'subscription_tier', CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.subscription_tier
        ELSE NEW.subscription_tier
      END
    ),
    inet_client_addr()
  );
  
  RETURN CASE TG_OP 
    WHEN 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to audit subscription access
CREATE TRIGGER subscription_access_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_subscription_access();