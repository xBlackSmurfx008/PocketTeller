import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Target, CheckCircle, Clock, AlertCircle, LayoutGrid, List, Calendar as CalendarIconLucide, Edit, Trash2 } from 'lucide-react';
import { UnifiedGoalTaskDialog } from '@/components/UnifiedGoalTaskDialog';
import { useToast } from '@/hooks/useToast';
import { format, differenceInDays, isPast, isToday, isTomorrow } from 'date-fns';

interface Goal {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

interface GoalTask {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function GoalsAndTasks() {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const { toast } = useToast();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<GoalTask[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'board'>('list');
  const [selectedGoalId, setSelectedGoalId] = useState<string | 'all'>('all');

  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'overdue' | 'today' | 'week'>('all');

  const [isUnifiedDialogOpen, setIsUnifiedDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (isDemo && !user) {
      setGoals(sampleData.goals as Goal[]);
      setTasks([]);
      setLoading(false);
    } else if (user) {
      fetchGoals();
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [user, isDemo, sampleData]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({ title: 'Error', description: 'Failed to fetch goals', variant: 'destructive' });
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []) as GoalTask[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({ title: 'Error', description: 'Failed to fetch tasks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      const { error } = await supabase
        .from('goal_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      if (error) throw error;
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus as 'todo' | 'in_progress' | 'done' } : t)));
      toast({ title: 'Task updated', description: `Task marked as ${newStatus === 'done' ? 'completed' : 'pending'}` });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const getGoalProgress = (goal: Goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getGoalName = (goalId: string) => {
    return goals.find(g => g.id === goalId)?.goal_name || 'Unknown Goal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDueDateBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isToday(date)) return <Badge variant="default" className="text-xs">Today</Badge>;
    if (isTomorrow(date)) return <Badge variant="secondary" className="text-xs">Tomorrow</Badge>;
    if (isPast(date)) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    return null;
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    if (selectedGoalId !== 'all') filtered = filtered.filter(t => t.goal_id === selectedGoalId);
    if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') filtered = filtered.filter(t => t.priority === priorityFilter);
    if (dateFilter !== 'all') {
      filtered = filtered.filter(task => {
        if (!task.due_date) return false;
        const due = new Date(task.due_date);
        switch (dateFilter) {
          case 'overdue': return isPast(due) && task.status !== 'done';
          case 'today': return isToday(due);
          case 'week': return differenceInDays(due, new Date()) >= 0 && differenceInDays(due, new Date()) <= 7;
          default: return true;
        }
      });
    }
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading goals and tasks...</div>
      </div>
    );
  }

  if (!loading && goals.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-perfect px-4 pb-4 content-container">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Set Your Financial Goals</CardTitle>
            <CardDescription>Create goals and break them into actionable tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setIsUnifiedDialogOpen(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
        <UnifiedGoalTaskDialog
          open={isUnifiedDialogOpen}
          onOpenChange={setIsUnifiedDialogOpen}
          onSave={() => { fetchGoals(); fetchTasks(); }}
        />
      </div>
    );
  }

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-background content-visible">
      <main className="max-w-7xl mx-auto pt-perfect px-3 pb-3 sm:pt-perfect sm:px-4 sm:pb-4 space-y-4 sm:space-y-6 content-container">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Goals & Tasks</h1>
          <div className="flex gap-2">
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'board' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('board')}>
              <CalendarIconLucide className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Goals</CardTitle>
                <CardDescription>{goals.length} active {goals.length === 1 ? 'goal' : 'goals'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={selectedGoalId === 'all' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedGoalId('all')}
                >
                  All Goals ({tasks.length})
                </Button>
                {goals.map(goal => {
                  const goalTasks = tasks.filter(t => t.goal_id === goal.id);
                  const progress = getGoalProgress(goal);
                  return (
                    <div key={goal.id} className="space-y-2">
                      <Button
                        variant={selectedGoalId === goal.id ? 'default' : 'outline'}
                        className="w-full justify-start text-left"
                        onClick={() => setSelectedGoalId(goal.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{goal.goal_name}</div>
                          <div className="text-xs opacity-70">{goalTasks.length} tasks</div>
                        </div>
                      </Button>
                      {selectedGoalId === goal.id && (
                        <div className="px-3 space-y-1">
                          <div className="text-xs text-muted-foreground">Progress: {progress.toFixed(0)}%</div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setEditingGoal(null); setIsUnifiedDialogOpen(true); }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Due Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setDateFilter('all'); }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedGoalId === 'all' ? 'All Tasks' : getGoalName(selectedGoalId)}</CardTitle>
                    <CardDescription>{filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      if (selectedGoalId !== 'all') {
                        const goal = goals.find(g => g.id === selectedGoalId);
                        setEditingGoal(goal || null);
                      }
                      setIsUnifiedDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm mb-4">No tasks match your filters</p>
                    <Button variant="outline" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setDateFilter('all'); }}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map(task => (
                      <div key={task.id} className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                        <Checkbox checked={task.status === 'done'} onCheckedChange={() => handleTaskToggle(task.id, task.status)} className="mt-1" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start gap-2 flex-wrap">
                            {getStatusIcon(task.status)}
                            <span className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                            <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">{task.priority}</Badge>
                            {getDueDateBadge(task.due_date)}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {getGoalName(task.goal_id)}
                            </span>
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.due_date), 'MMM dd, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              const goal = goals.find(g => g.id === task.goal_id);
                              setEditingGoal(goal || null);
                              setIsUnifiedDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('goal_tasks')
                                  .delete()
                                  .eq('id', task.id);
                                if (error) throw error;
                                toast({ title: 'Task deleted', description: 'Task has been removed' });
                                fetchTasks();
                              } catch (error) {
                                toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <UnifiedGoalTaskDialog
        open={isUnifiedDialogOpen}
        onOpenChange={setIsUnifiedDialogOpen}
        goal={editingGoal}
        onSave={() => { fetchGoals(); fetchTasks(); }}
      />
    </div>
  );
}


