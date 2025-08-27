
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGoals } from '@/hooks/useGoals';
import { useTimezone } from '@/hooks/useTimezone';
import { useDateHelpers } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { Target, TrendingUp, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Goal } from '@/types/models';

export default function GoalsOverview() {
  const { goals, loading } = useGoals();
  const { timezone } = useTimezone();
  const dateHelpers = useDateHelpers(timezone);
  const navigate = useNavigate();
  
  // Show only the first 3 goals for overview
  const displayGoals = goals.slice(0, 3);

  const getGoalProgress = (goal: Goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const isGoalOnTrack = (goal: Goal) => {
    if (!goal.deadline) return true;
    
    const progress = getGoalProgress(goal);
    const totalDays = differenceInDays(new Date(goal.deadline), new Date(goal.created_at));
    const daysPassed = differenceInDays(new Date(), new Date(goal.created_at));
    const expectedProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;
    
    return progress >= expectedProgress;
  };

  const getDeadlineInfo = (goal: Goal) => {
    // Don't show deadline info if no deadline is set
    if (!goal.deadline || goal.deadline.trim() === '') return null;
    
    try {
      const daysUntil = dateHelpers.getDaysUntil(goal.deadline);
      
      if (daysUntil < 0) {
        return { text: `${Math.abs(daysUntil)} days overdue`, variant: 'destructive' as const };
      } else if (daysUntil === 0) {
        return { text: 'Due today', variant: 'secondary' as const };
      } else if (daysUntil <= 7) {
        return { text: `${daysUntil} days left`, variant: 'outline' as const };
      } else {
        return { text: format(new Date(goal.deadline), 'MMM dd'), variant: 'outline' as const };
      }
    } catch (error) {
      // If date parsing fails, don't show deadline info
      console.warn('Invalid deadline format:', goal.deadline, error);
      return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goals Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goals Overview
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/goals')}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No goals set yet</p>
            <Button onClick={() => navigate('/goals')}>
              Create Your First Goal
            </Button>
          </div>
          ) : (
            displayGoals.map((goal) => {
            const progress = getGoalProgress(goal);
            const onTrack = isGoalOnTrack(goal);
            const deadlineInfo = getDeadlineInfo(goal);
            
            return (
              <div key={goal.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{goal.goal_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {deadlineInfo && (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4" />
                        <Badge variant={deadlineInfo.variant} className="text-xs">
                          {deadlineInfo.text}
                        </Badge>
                      </div>
                    )}
                    <Badge variant={onTrack ? "default" : "destructive"}>
                      {onTrack ? "On Track" : "Behind"}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
