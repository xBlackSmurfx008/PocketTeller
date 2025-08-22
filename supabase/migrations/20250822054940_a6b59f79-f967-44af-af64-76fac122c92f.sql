-- Create goal_tasks table for tracking tasks per goal
CREATE TABLE public.goal_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.goal_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goal_tasks
CREATE POLICY "Users can view their own goal tasks" 
ON public.goal_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goal tasks" 
ON public.goal_tasks 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update their own goal tasks" 
ON public.goal_tasks 
FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete their own goal tasks" 
ON public.goal_tasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_goal_tasks_user_id ON public.goal_tasks(user_id);
CREATE INDEX idx_goal_tasks_goal_id ON public.goal_tasks(goal_id);
CREATE INDEX idx_goal_tasks_due_date ON public.goal_tasks(due_date);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_goal_tasks_updated_at
BEFORE UPDATE ON public.goal_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically set completed_at when status changes to 'done'
CREATE OR REPLACE FUNCTION public.handle_goal_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Set completed_at when status changes to 'done'
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = now();
  -- Clear completed_at when status changes from 'done' to something else
  ELSIF NEW.status != 'done' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goal_task_completion
BEFORE UPDATE ON public.goal_tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_goal_task_completion();