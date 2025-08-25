import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useDemo } from '@/hooks/useDemo';
import { useNavigate, useLocation } from 'react-router-dom';

interface TourStep {
  id: string;
  title: string;
  description: string;
  selector: string;
  route?: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Budget AI!',
    description: 'Let\'s take a quick tour of the main features. This demo includes sample data and you can try the AI chat with up to 5 messages.',
    selector: '[data-tour-id="dashboard"]',
    route: '/',
    position: 'bottom'
  },
  {
    id: 'financial-snapshot',
    title: 'Financial Overview',
    description: 'See your account balances and spending insights at a glance.',
    selector: '[data-tour-id="financial-snapshot"]',
    route: '/',
    position: 'bottom'
  },
  {
    id: 'recent-transactions',
    title: 'Recent Transactions',
    description: 'View and manage all your transactions here. You can search, filter by category, and update transaction details.',
    selector: '[data-tour-id="recent-transactions"]',
    route: '/transactions',
    position: 'top'
  },
  {
    id: 'goals-overview',
    title: 'Financial Goals',
    description: 'Set and track progress toward your financial goals.',
    selector: '[data-tour-id="goals-overview"]',
    route: '/',
    position: 'top'
  },
  {
    id: 'upcoming-bills',
    title: 'Upcoming Bills',
    description: 'Never miss a payment with bill tracking and reminders.',
    selector: '[data-tour-id="upcoming-bills"]',
    route: '/',
    position: 'top'
  },
  {
    id: 'ai-chat',
    title: 'AI Assistant',
    description: 'Ask questions about your finances and get personalized insights. Try asking "How much did I spend on groceries this month?"',
    selector: '[data-tour-id="ai-chat-button"]',
    route: '/',
    position: 'left'
  },
  {
    id: 'chat-interface',
    title: 'Chat with AI',
    description: 'This is where you can have conversations with your AI financial assistant. You have 5 demo messages to try!',
    selector: '[data-tour-id="chat-input"]',
    route: '/chat',
    position: 'top'
  },
  {
    id: 'goals-page',
    title: 'Goals Management',
    description: 'Create, edit, and track detailed progress on your financial goals.',
    selector: '[data-tour-id="goals-list"]',
    route: '/goals',
    position: 'top'
  }
];

export function CoachMarks() {
  const { tourActive, tourStep, nextTourStep, prevTourStep, skipTour } = useDemo();
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const currentStep = TOUR_STEPS[tourStep];
  const isLastStep = tourStep >= TOUR_STEPS.length - 1;

  useEffect(() => {
    if (!tourActive || !currentStep) return;

    // Don't navigate away from auth page - skip auth-interrupting tour steps
    if (location.pathname === '/auth') {
      return;
    }

    // Navigate to the required route if needed
    if (currentStep.route && location.pathname !== currentStep.route) {
      navigate(currentStep.route);
      return;
    }

    // Find and highlight the target element with retry mechanism
    const findElement = (retries = 3) => {
      const element = document.querySelector(currentStep.selector) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        
        // Calculate tooltip position using getBoundingClientRect
        const rect = element.getBoundingClientRect();
        let x = rect.left + rect.width / 2;
        let y = rect.top;
        
        switch (currentStep.position) {
          case 'top':
            y = rect.top - 10;
            break;
          case 'bottom':
            y = rect.bottom + 10;
            break;
          case 'left':
            x = rect.left - 10;
            y = rect.top + rect.height / 2;
            break;
          case 'right':
            x = rect.right + 10;
            y = rect.top + rect.height / 2;
            break;
        }
        
        setTooltipPosition({ x, y });
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (retries > 0) {
        // Retry if element not found
        setTimeout(() => findElement(retries - 1), 500);
      }
    };

    const timer = setTimeout(() => findElement(), 300);

    return () => clearTimeout(timer);
  }, [tourActive, tourStep, currentStep, location.pathname, navigate]);

  const handleNext = () => {
    if (isLastStep) {
      skipTour();
      // Redirect to dashboard after tour completion
      setTimeout(() => {
        navigate('/');
      }, 500);
    } else {
      nextTourStep();
    }
  };

  const handlePrevious = () => {
    if (tourStep > 0) {
      prevTourStep();
    }
  };

  if (!tourActive || !currentStep || !highlightedElement) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 pointer-events-none" />
      
      {/* Highlight */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          left: highlightedElement.getBoundingClientRect().left - 4,
          top: highlightedElement.getBoundingClientRect().top - 4,
          width: highlightedElement.getBoundingClientRect().width + 8,
          height: highlightedElement.getBoundingClientRect().height + 8,
          border: '3px solid hsl(var(--primary))',
          borderRadius: '8px',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
        }}
      />
      
      {/* Tooltip */}
      <Card
        className="fixed z-50 w-80 shadow-lg border-primary/20"
        style={{
          left: Math.min(Math.max(10, tooltipPosition.x - 160), window.innerWidth - 330),
          top: Math.min(Math.max(10, tooltipPosition.y), window.innerHeight - 200)
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{currentStep.title}</CardTitle>
            <Button variant="ghost" size="icon" onClick={skipTour}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{currentStep.description}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {tourStep + 1} of {TOUR_STEPS.length}
            </span>
            
            <div className="flex gap-2">
              {tourStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}