-- Create site_metrics table to track global counters
CREATE TABLE public.site_metrics (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_users INTEGER NOT NULL DEFAULT 0,
  total_budgets INTEGER NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial row
INSERT INTO public.site_metrics (id, total_users, total_budgets, total_transactions)
VALUES (1, 0, 0, 0);

-- Disable RLS for public read access
ALTER TABLE public.site_metrics ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can read site metrics" ON public.site_metrics FOR SELECT USING (true);

-- Enable realtime for site_metrics
ALTER TABLE public.site_metrics REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_metrics;

-- Function to update site metrics
CREATE OR REPLACE FUNCTION update_site_metrics()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for real-time updates
CREATE TRIGGER update_site_metrics_on_profile_change
  AFTER INSERT OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_site_metrics();

CREATE TRIGGER update_site_metrics_on_budget_change
  AFTER INSERT OR DELETE ON public.budget
  FOR EACH ROW EXECUTE FUNCTION update_site_metrics();

CREATE TRIGGER update_site_metrics_on_transaction_change
  AFTER INSERT OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_site_metrics();

-- Initialize counts with existing data
UPDATE public.site_metrics SET 
  total_users = (SELECT COUNT(*) FROM public.profiles),
  total_budgets = (SELECT COUNT(*) FROM public.budget),
  total_transactions = (SELECT COUNT(*) FROM public.transactions),
  updated_at = now()
WHERE id = 1;