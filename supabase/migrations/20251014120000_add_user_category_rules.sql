-- Add user_category_rules table for remembering user categorizations
-- This allows automatic categorization of future transactions from same merchants

CREATE TABLE IF NOT EXISTS public.user_category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_applied_at TIMESTAMPTZ,
  application_count INTEGER DEFAULT 0,
  
  -- Ensure one rule per merchant per user
  UNIQUE(user_id, merchant_name)
);

-- Enable RLS
ALTER TABLE public.user_category_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own category rules"
  ON public.user_category_rules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category rules"
  ON public.user_category_rules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category rules"
  ON public.user_category_rules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category rules"
  ON public.user_category_rules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast merchant lookup
CREATE INDEX idx_user_category_rules_merchant 
  ON public.user_category_rules(user_id, merchant_name);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_category_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_category_rules_updated_at
  BEFORE UPDATE ON public.user_category_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_user_category_rules_updated_at();

-- Add comment
COMMENT ON TABLE public.user_category_rules IS 'Stores user-defined category rules for automatic categorization of future transactions from the same merchants';

