-- Enable Row Level Security on profiles_secure table
ALTER TABLE public.profiles_secure ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own secure profile data
CREATE POLICY "Users can view their own secure profile" 
ON public.profiles_secure 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for users to insert their own secure profile data
CREATE POLICY "Users can insert their own secure profile" 
ON public.profiles_secure 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own secure profile data
CREATE POLICY "Users can update their own secure profile" 
ON public.profiles_secure 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own secure profile data
CREATE POLICY "Users can delete their own secure profile" 
ON public.profiles_secure 
FOR DELETE 
USING (auth.uid() = user_id);

-- Also ensure user_id column is not nullable for proper security
-- (This prevents orphaned records without user association)
ALTER TABLE public.profiles_secure 
ALTER COLUMN user_id SET NOT NULL;