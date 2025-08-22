-- Create budget_shares table for secure sharing
CREATE TABLE public.budget_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  budget_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  view_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.budget_shares ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own budget shares" 
ON public.budget_shares 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own budget shares" 
ON public.budget_shares 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view non-expired budget shares by token" 
ON public.budget_shares 
FOR SELECT 
USING (expires_at > now());

-- Create index for token lookup
CREATE INDEX idx_budget_shares_token ON public.budget_shares(token);

-- Create index for expiration cleanup
CREATE INDEX idx_budget_shares_expires_at ON public.budget_shares(expires_at);