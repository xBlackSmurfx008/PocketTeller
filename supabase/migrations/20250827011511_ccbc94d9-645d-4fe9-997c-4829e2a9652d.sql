-- First, let's recalculate the correct site metrics
UPDATE site_metrics 
SET 
  total_users = (SELECT COUNT(*) FROM profiles),
  total_budgets = (SELECT COUNT(*) FROM budget), 
  total_transactions = (SELECT COUNT(*) FROM transactions),
  updated_at = now()
WHERE id = 1;

-- Remove duplicate triggers (keeping the cleanest named ones)
DROP TRIGGER IF EXISTS update_site_metrics_on_profile_change ON profiles;
DROP TRIGGER IF EXISTS trigger_update_site_metrics_profiles ON profiles;

DROP TRIGGER IF EXISTS update_site_metrics_on_budget_change ON budget;
DROP TRIGGER IF EXISTS trigger_update_site_metrics_budget ON budget;

DROP TRIGGER IF EXISTS update_site_metrics_on_transaction_change ON transactions;
DROP TRIGGER IF EXISTS trigger_update_site_metrics_transactions ON transactions;

-- Keep the cleanest named triggers and ensure they exist
-- For profiles
DROP TRIGGER IF EXISTS update_site_metrics_on_profiles ON profiles;
CREATE TRIGGER update_site_metrics_on_profiles
  AFTER INSERT OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_site_metrics();

-- For budget  
DROP TRIGGER IF EXISTS update_site_metrics_on_budget ON budget;
CREATE TRIGGER update_site_metrics_on_budget
  AFTER INSERT OR DELETE ON budget
  FOR EACH ROW EXECUTE FUNCTION update_site_metrics();

-- For transactions
DROP TRIGGER IF EXISTS update_site_metrics_on_transactions ON transactions;
CREATE TRIGGER update_site_metrics_on_transactions
  AFTER INSERT OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_site_metrics();