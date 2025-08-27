import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDemo, TourType } from '@/hooks/useDemo';
import { HelpCircle, Play, MessageSquare, Target, DollarSign } from 'lucide-react';

interface TourOption {
  type: TourType;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
}

const TOUR_OPTIONS: TourOption[] = [
  {
    type: 'full',
    title: 'Complete Walkthrough',
    description: 'Comprehensive tour of all Budget AI features',
    icon: <Play className="h-5 w-5" />,
    duration: '3-4 min'
  },
  {
    type: 'chat',
    title: 'AI Assistant Tour',
    description: 'Learn how to use the AI chat features',
    icon: <MessageSquare className="h-5 w-5" />,
    duration: '1-2 min'
  },
  {
    type: 'budget',
    title: 'Budget Management',
    description: 'Focus on budgeting and spending tracking',
    icon: <DollarSign className="h-5 w-5" />,
    duration: '2-3 min'
  },
  {
    type: 'goals',
    title: 'Goal Setting',
    description: 'Learn to set and track financial goals',
    icon: <Target className="h-5 w-5" />,
    duration: '1-2 min'
  }
];

export function TourLauncher() {
  const { startTour, isDemo } = useDemo();

  const handleStartTour = (tourType: TourType) => {
    startTour(tourType);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Take Tour
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Your Tour</DialogTitle>
          <DialogDescription>
            Select a guided tour to learn about Budget AI's features
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {TOUR_OPTIONS.map((option) => (
            <Card 
              key={option.type} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleStartTour(option.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="text-primary">
                    {option.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{option.title}</CardTitle>
                    <span className="text-xs text-muted-foreground">{option.duration}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        {isDemo && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 Tours work best with demo data. Sign up to create your own data and get personalized tours!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}