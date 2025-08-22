-- Create conversation_threads table
CREATE TABLE public.conversation_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;

-- Create policies for conversation_threads
CREATE POLICY "Users can view their own threads" 
ON public.conversation_threads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own threads" 
ON public.conversation_threads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads" 
ON public.conversation_threads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads" 
ON public.conversation_threads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add thread_id to conversations table
ALTER TABLE public.conversations ADD COLUMN thread_id UUID;

-- Create index for performance
CREATE INDEX idx_conversation_threads_user_id ON public.conversation_threads(user_id);
CREATE INDEX idx_conversations_thread_id ON public.conversations(thread_id);

-- Create trigger for updated_at
CREATE TRIGGER update_conversation_threads_updated_at
BEFORE UPDATE ON public.conversation_threads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill: Create "Imported chat" thread for users with existing messages
INSERT INTO public.conversation_threads (user_id, title)
SELECT DISTINCT user_id, 'Imported chat'
FROM public.conversations
WHERE user_id IS NOT NULL;

-- Update existing conversations to reference the imported thread
UPDATE public.conversations 
SET thread_id = (
  SELECT ct.id 
  FROM public.conversation_threads ct 
  WHERE ct.user_id = conversations.user_id 
  AND ct.title = 'Imported chat'
  LIMIT 1
)
WHERE thread_id IS NULL AND user_id IS NOT NULL;