import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  due_date: Date | undefined;
}

interface UnifiedGoalTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSave: () => void;
}

export function UnifiedGoalTaskDialog({ open, onOpenChange, goal, onSave }: UnifiedGoalTaskDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'goal' | 'tasks'>('goal');

  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  const [tasks, setTasks] = useState<TaskForm[]>([]);

  useEffect(() => {
    if (goal) {
      setGoalName(goal.goal_name);
      setTargetAmount(String(goal.target_amount));
      setCurrentAmount(String(goal.current_amount));
      setDeadline(goal.deadline ? new Date(goal.deadline) : undefined);
    } else {
      setGoalName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setDeadline(undefined);
      setTasks([]);
    }
  }, [goal, open]);

  const addTask = () => {
    setTasks(prev => [...prev, { title: '', description: '', priority: 'medium', due_date: undefined }]);
  };

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: keyof TaskForm, value: any) => {
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!goalName || !targetAmount) {
      toast({ title: 'Missing fields', description: 'Please fill in goal name and target amount', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      let goalId = goal?.id;
      if (goal) {
        const { error } = await supabase
          .from('goals')
          .update({
            goal_name: goalName,
            target_amount: parseFloat(targetAmount),
            current_amount: parseFloat(currentAmount),
            deadline: deadline ? format(deadline, 'yyyy-MM-dd') : null,
          })
          .eq('id', goal.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            goal_name: goalName,
            target_amount: parseFloat(targetAmount),
            current_amount: parseFloat(currentAmount),
            deadline: deadline ? format(deadline, 'yyyy-MM-dd') : null,
          })
          .select()
          .single();
        if (error) throw error;
        goalId = data.id;
      }

      if (tasks.length > 0 && goalId) {
        const validTasks = tasks.filter(t => t.title.trim() !== '');
        if (validTasks.length > 0) {
          const { error: tasksError } = await supabase
            .from('goal_tasks')
            .insert(validTasks.map(t => ({
              user_id: user.id,
              goal_id: goalId!,
              title: t.title,
              description: t.description || null,
              priority: t.priority,
              due_date: t.due_date ? format(t.due_date, 'yyyy-MM-dd') : null,
            })));
          if (tasksError) throw tasksError;
        }
      }

      toast({ title: goal ? 'Goal updated' : 'Goal created', description: tasks.length > 0 ? `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} added` : 'You can add tasks anytime' });
      onSave();
      onOpenChange(false);
      setActiveTab('goal');
    } catch (error) {
      console.error('Error saving goal:', error);
      toast({ title: 'Error', description: 'Failed to save goal', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>
            {goal ? 'Update goal details and add tasks' : 'Set up your goal and optionally add tasks to break it down'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="goal">Goal Details</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="goal" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-name">Goal Name *</Label>
              <Input id="goal-name" placeholder="e.g., Emergency Fund, Vacation" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target-amount">Target Amount *</Label>
                <Input id="target-amount" type="number" placeholder="10000" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-amount">Current Amount</Label>
                <Input id="current-amount" type="number" placeholder="0" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !deadline && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {tasks.map((task, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                  <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeTask(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="space-y-2">
                    <Label>Task Title *</Label>
                    <Input placeholder="e.g., Research high-yield savings accounts" value={task.title} onChange={(e) => updateTask(index, 'title', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Add details..." value={task.description} onChange={(e) => updateTask(index, 'description', e.target.value)} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={task.priority} onValueChange={(v: any) => updateTask(index, 'priority', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !task.due_date && 'text-muted-foreground')}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {task.due_date ? format(task.due_date, 'MMM dd') : <span>Date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={task.due_date} onSelect={(date) => updateTask(index, 'due_date', date)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={addTask}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


