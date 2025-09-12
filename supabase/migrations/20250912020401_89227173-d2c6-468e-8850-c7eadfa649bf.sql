-- Fix critical security vulnerability in orders table RLS policies

-- Drop existing insecure policies
DROP POLICY IF EXISTS "insert_order" ON public.orders;
DROP POLICY IF EXISTS "update_order" ON public.orders;

-- Create secure INSERT policy - users can only create orders for themselves
CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create secure UPDATE policy with different rules for users vs service role
CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow service role to update orders for payment processing
CREATE POLICY "Service role can update orders for payment processing" 
ON public.orders 
FOR UPDATE 
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');

-- Create function to validate order updates by regular users
CREATE OR REPLACE FUNCTION public.validate_user_order_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a service role update, allow all changes
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, restrict which fields can be modified
  -- Users should not be able to change payment-critical fields
  IF OLD.stripe_session_id IS DISTINCT FROM NEW.stripe_session_id THEN
    RAISE EXCEPTION 'Users cannot modify stripe_session_id';
  END IF;
  
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    RAISE EXCEPTION 'Users cannot modify order amount';
  END IF;
  
  IF OLD.currency IS DISTINCT FROM NEW.currency THEN
    RAISE EXCEPTION 'Users cannot modify order currency';
  END IF;
  
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status NOT IN ('cancelled') THEN
    RAISE EXCEPTION 'Users can only cancel their orders';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce validation
CREATE TRIGGER validate_order_updates
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_order_update();