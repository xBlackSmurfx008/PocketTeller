-- Add AI categorization metadata columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN category_confidence numeric,
ADD COLUMN category_model text,
ADD COLUMN category_reason text;