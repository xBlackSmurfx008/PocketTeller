-- Create waitlist signups table
CREATE TABLE public.waitlist_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  source text DEFAULT 'home_hero',
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add case-insensitive unique constraint on email
CREATE UNIQUE INDEX waitlist_signups_email_lower_idx ON public.waitlist_signups ((lower(email)));

-- Enable Row Level Security
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (no auth required for home page)
CREATE POLICY "Allow public inserts" ON public.waitlist_signups 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);