-- Fix security vulnerability: Add RLS policies to profiles_secure table
-- This table contains sensitive security information and must be protected

-- First, enable Row Level Security on the profiles_secure table
ALTER TABLE public.profiles_secure ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own security profile data
CREATE POLICY "Users can view their own security profile" 
ON public.profiles_secure 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for users to insert their own security profile data
CREATE POLICY "Users can insert their own security profile" 
ON public.profiles_secure 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own security profile data
CREATE POLICY "Users can update their own security profile" 
ON public.profiles_secure 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for service role access (for system operations)
-- This allows backend functions to manage security profiles when needed
CREATE POLICY "Service role can manage security profiles" 
ON public.profiles_secure 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Add audit logging for security profile access
-- Create a trigger function to log access to sensitive security data
CREATE OR REPLACE FUNCTION public.audit_security_profile_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log access to security profile data for monitoring
    IF TG_OP = 'SELECT' THEN
        -- Only log if it's not a service role operation
        IF current_setting('role', true) != 'service_role' THEN
            INSERT INTO public.plaid_token_audit_log (
                user_id, 
                access_type, 
                function_name, 
                success
            ) VALUES (
                COALESCE(NEW.user_id, OLD.user_id),
                'security_profile_access',
                TG_OP,
                true
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.plaid_token_audit_log (
            user_id, 
            access_type, 
            function_name, 
            success
        ) VALUES (
            NEW.user_id,
            'security_profile_update',
            TG_OP,
            true
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.plaid_token_audit_log (
            user_id, 
            access_type, 
            function_name, 
            success
        ) VALUES (
            NEW.user_id,
            'security_profile_create',
            TG_OP,
            true
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;