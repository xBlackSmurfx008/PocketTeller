-- Add security controls to budget_shares table
ALTER TABLE public.budget_shares 
ADD COLUMN max_views INTEGER DEFAULT 10,
ADD COLUMN access_logs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN requires_auth BOOLEAN DEFAULT false,
ADD COLUMN allowed_emails TEXT[] DEFAULT NULL;

-- Create function to log access attempts
CREATE OR REPLACE FUNCTION public.log_budget_share_access(
  share_id UUID,
  ip_address TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  access_log JSONB;
BEGIN
  access_log := jsonb_build_object(
    'timestamp', now(),
    'ip_address', ip_address,
    'user_agent', user_agent
  );
  
  UPDATE public.budget_shares 
  SET access_logs = COALESCE(access_logs, '[]'::jsonb) || access_log
  WHERE id = share_id;
END;
$$;

-- Update the RLS policy to be more restrictive
DROP POLICY IF EXISTS "Anyone can view non-expired budget shares by token" ON public.budget_shares;

CREATE POLICY "View shared budgets with restrictions" 
ON public.budget_shares 
FOR SELECT 
USING (
  expires_at > now() 
  AND (view_count < COALESCE(max_views, 10))
  AND (
    NOT requires_auth 
    OR auth.uid() IS NOT NULL
  )
);