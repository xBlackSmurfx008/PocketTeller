-- Security hardening: Add audit tables and improve logging infrastructure
-- Note: Auth configuration requires manual setup in Supabase dashboard

-- Add auth audit table for tracking authentication events
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on auth audit log
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own auth logs
CREATE POLICY "Users can view own auth logs" 
ON public.auth_audit_log 
FOR SELECT 
USING (user_id = auth.uid());

-- Service role can insert auth logs
CREATE POLICY "Service role can insert auth logs" 
ON public.auth_audit_log 
FOR INSERT 
WITH CHECK (current_setting('role', true) = 'service_role');

-- Create app_logs table for structured application logging
CREATE TABLE IF NOT EXISTS public.app_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  session_id TEXT,
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app logs
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs (for debugging)
CREATE POLICY "Users can view own app logs" 
ON public.app_logs 
FOR SELECT 
USING (user_id = auth.uid());

-- Service role can insert logs
CREATE POLICY "Service role can insert app logs" 
ON public.app_logs 
FOR INSERT 
WITH CHECK (current_setting('role', true) = 'service_role');

-- Admins can view all logs
CREATE POLICY "Admins can view all app logs" 
ON public.app_logs 
FOR SELECT 
USING (is_admin_user());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON public.app_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON public.app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON public.app_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON public.auth_audit_log(created_at);