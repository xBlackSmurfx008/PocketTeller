-- Enable real-time updates for key tables
ALTER TABLE public.accounts REPLICA IDENTITY FULL;
ALTER TABLE public.budget REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication (skip if already added)
DO $$
BEGIN
  -- Try to add each table, ignore if already exists
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.budget;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Table already in publication
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Table already in publication
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Table already in publication
  END;
END $$;

-- Create triggers to maintain site_metrics accuracy
CREATE OR REPLACE FUNCTION public.update_site_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.site_metrics SET total_users = total_users + 1, updated_at = now() WHERE id = 1;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.site_metrics SET total_users = total_users - 1, updated_at = now() WHERE id = 1;
    END IF;
  ELSIF TG_TABLE_NAME = 'budget' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.site_metrics SET total_budgets = total_budgets + 1, updated_at = now() WHERE id = 1;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.site_metrics SET total_budgets = total_budgets - 1, updated_at = now() WHERE id = 1;
    END IF;
  ELSIF TG_TABLE_NAME = 'transactions' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.site_metrics SET total_transactions = total_transactions + 1, updated_at = now() WHERE id = 1;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.site_metrics SET total_transactions = total_transactions - 1, updated_at = now() WHERE id = 1;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create triggers for each table
DROP TRIGGER IF EXISTS trigger_update_site_metrics_profiles ON public.profiles;
CREATE TRIGGER trigger_update_site_metrics_profiles
  AFTER INSERT OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_site_metrics();

DROP TRIGGER IF EXISTS trigger_update_site_metrics_budget ON public.budget;
CREATE TRIGGER trigger_update_site_metrics_budget
  AFTER INSERT OR DELETE ON public.budget
  FOR EACH ROW EXECUTE FUNCTION public.update_site_metrics();

DROP TRIGGER IF EXISTS trigger_update_site_metrics_transactions ON public.transactions;
CREATE TRIGGER trigger_update_site_metrics_transactions
  AFTER INSERT OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_site_metrics();

-- Initialize site_metrics with current counts
INSERT INTO public.site_metrics (id, total_users, total_budgets, total_transactions)
VALUES (1, 
  (SELECT COUNT(*) FROM public.profiles),
  (SELECT COUNT(*) FROM public.budget),
  (SELECT COUNT(*) FROM public.transactions)
) ON CONFLICT (id) DO UPDATE SET
  total_users = (SELECT COUNT(*) FROM public.profiles),
  total_budgets = (SELECT COUNT(*) FROM public.budget),
  total_transactions = (SELECT COUNT(*) FROM public.transactions),
  updated_at = now();