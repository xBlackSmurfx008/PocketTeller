-- Create contact submissions table for persistence and tracking
CREATE TABLE public.contact_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT,
    phone TEXT,
    inquiry_type TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for contact submissions
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Only service role can insert contact submissions (from edge function)
CREATE POLICY "Service role can insert contact submissions"
ON public.contact_submissions
FOR INSERT
WITH CHECK (current_setting('role', true) = 'service_role');

-- Only admins can view contact submissions
CREATE POLICY "Admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND app_id = 'budget-ai-admin'
));

-- Create function for abuse mitigation rate limiting
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(
    email_param TEXT,
    ip_param INET
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    email_count INTEGER;
    ip_count INTEGER;
BEGIN
    -- Check email rate limit: max 3 submissions per hour
    SELECT COUNT(*) INTO email_count
    FROM public.contact_submissions
    WHERE lower(email) = lower(email_param)
    AND created_at > now() - INTERVAL '1 hour';
    
    IF email_count >= 3 THEN
        RETURN false;
    END IF;
    
    -- Check IP rate limit: max 5 submissions per hour
    IF ip_param IS NOT NULL THEN
        SELECT COUNT(*) INTO ip_count
        FROM public.contact_submissions
        WHERE ip_address = ip_param
        AND created_at > now() - INTERVAL '1 hour';
        
        IF ip_count >= 5 THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_contact_submissions_updated_at
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_contact_submissions_email ON public.contact_submissions(email);
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at);
CREATE INDEX idx_contact_submissions_ip_address ON public.contact_submissions(ip_address);
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);