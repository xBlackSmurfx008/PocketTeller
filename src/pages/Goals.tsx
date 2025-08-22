import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, CheckCircle, Clock, AlertCircle, Settings, ArrowLeft } from 'lucide-react';
import { AddGoalDialog } from '@/components/AddGoalDialog';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, isPast } from 'date-fns';

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

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<GoalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchTasks();
    }
  }, [user]);

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
      toast({
        title: "Error",
        description: "Failed to fetch goals",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
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
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus as 'todo' | 'in_progress' | 'done' } : task
      ));

      toast({
        title: "Task updated",
        description: `Task marked as ${newStatus === 'done' ? 'completed' : 'pending'}`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const getGoalProgress = (goal: Goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getTaskProgress = (goalId: string) => {
    const goalTasks = tasks.filter(task => task.goal_id === goalId);
    if (goalTasks.length === 0) return 0;
    const completedTasks = goalTasks.filter(task => task.status === 'done').length;
    return (completedTasks / goalTasks.length) * 100;
  };

  const isGoalOnTrack = (goal: Goal) => {
    if (!goal.deadline) return true;
    const daysUntilDeadline = differenceInDays(new Date(goal.deadline), new Date());
    const daysTotal = differenceInDays(new Date(goal.deadline), new Date(goal.created_at));
    const expectedProgress = ((daysTotal - daysUntilDeadline) / daysTotal) * 100;
    const actualProgress = getGoalProgress(goal);
    return actualProgress >= expectedProgress * 0.9; // 10% tolerance
  };

  const getFilteredTasks = (goalId: string) => {
    const goalTasks = tasks.filter(task => task.goal_id === goalId);
    switch (taskFilter) {
      case 'active':
        return goalTasks.filter(task => task.status !== 'done');
      case 'completed':
        return goalTasks.filter(task => task.status === 'done');
      default:
        return goalTasks;
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Financial Goals</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsAddGoalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/account')}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {goals.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Goals Yet</CardTitle>
              <CardDescription>
                Create your first financial goal to start tracking your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsAddGoalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const financialProgress = getGoalProgress(goal);
              const taskProgress = getTaskProgress(goal.id);
              const onTrack = isGoalOnTrack(goal);
              const daysUntilDeadline = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
              const isOverdue = goal.deadline && isPast(new Date(goal.deadline));

              return (
                <Card key={goal.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.goal_name}</CardTitle>
                      <div className="flex gap-2">
                        {onTrack ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            On Track
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            {isOverdue ? 'Overdue' : 'Behind'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      ${goal.current_amount.toLocaleString()} of ${goal.target_amount.toLocaleString()}
                      {goal.deadline && (
                        <span className="block text-sm mt-1">
                          {isOverdue ? 
                            `Overdue by ${Math.abs(daysUntilDeadline!)} days` : 
                            `${daysUntilDeadline} days remaining`
                          }
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Financial Progress</span>
                        <span>{financialProgress.toFixed(1)}%</span>
                      </div>
                      <Progress value={financialProgress} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Tasks Progress</span>
                        <span>{taskProgress.toFixed(1)}%</span>
                      </div>
                      <Progress value={taskProgress} className="h-2" />
                    </div>

                    {selectedGoal === goal.id && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold">Tasks</h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsAddTaskOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Task
                            </Button>
                          </div>
                        </div>

                        <Tabs value={taskFilter} onValueChange={(value) => setTaskFilter(value as 'all' | 'active' | 'completed')}>
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                          </TabsList>

                          <TabsContent value={taskFilter} className="mt-4">
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {getFilteredTasks(goal.id).map((task) => (
                                <div key={task.id} className="flex items-center space-x-3 p-2 rounded-lg border border-border bg-card/50">
                                  <Checkbox
                                    checked={task.status === 'done'}
                                    onCheckedChange={() => handleTaskToggle(task.id, task.status)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(task.status)}
                                      <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                        {task.title}
                                      </span>
                                      <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                                        {task.priority}
                                      </Badge>
                                    </div>
                                    {task.description && (
                                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                                    )}
                                    {task.due_date && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {getFilteredTasks(goal.id).length === 0 && (
                                <p className="text-center text-muted-foreground text-sm py-4">
                                  No {taskFilter === 'all' ? '' : taskFilter} tasks
                                </p>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <AddGoalDialog 
        open={isAddGoalOpen} 
        onOpenChange={setIsAddGoalOpen}
        onGoalAdded={fetchGoals}
      />
      
      <AddTaskDialog 
        open={isAddTaskOpen} 
        onOpenChange={setIsAddTaskOpen}
        goalId={selectedGoal}
        goals={goals}
        onTaskAdded={fetchTasks}
      />
    </div>
  );
}