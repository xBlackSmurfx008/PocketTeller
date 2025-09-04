-- Add accent color column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN accent_color text DEFAULT 'violet' CHECK (accent_color IN ('violet', 'blue', 'emerald', 'amber', 'rose'));