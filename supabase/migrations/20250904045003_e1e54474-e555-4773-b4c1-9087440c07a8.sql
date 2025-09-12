-- Enable real-time for key tables that need it
ALTER TABLE public.site_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.in_app_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.goals REPLICA IDENTITY FULL;
ALTER TABLE public.bills REPLICA IDENTITY FULL;
ALTER TABLE public.budget REPLICA IDENTITY FULL;
ALTER TABLE public.accounts REPLICA IDENTITY FULL;

-- Add tables to realtime publication for real-time updates
-- Note: This may already be done, but it's safe to run again
BEGIN;
-- Only add if not already in publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'site_metrics'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_metrics;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'in_app_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.in_app_notifications;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'goals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'bills'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'budget'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.budget;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
  END IF;
END $$;
COMMIT;