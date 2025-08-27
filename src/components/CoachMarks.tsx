import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, SkipForward } from 'lucide-react';
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

// Tour steps are now dynamically loaded from useDemo hook

export function CoachMarks() {
  const { tourActive, tourStep, nextTourStep, prevTourStep, skipTour, getTourSteps } = useDemo();
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hasElementNotFound, setHasElementNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const tourSteps = getTourSteps();
  const currentStep = tourSteps[tourStep];
  const isLastStep = tourStep >= tourSteps.length - 1;

  // Enhanced element finding with robust retry and fallback
  const findElement = useCallback((retries = 5) => {
    if (!currentStep) return;
    
    const element = document.querySelector(currentStep.selector) as HTMLElement;
    if (element) {
      setHighlightedElement(element);
      setHasElementNotFound(false);
      setRetryCount(0);
      
      // Enhanced positioning with viewport awareness
      requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let x = rect.left + rect.width / 2;
        let y = rect.top;
        
        // Smart positioning based on element location and viewport
        const elementCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        
        // Determine best position based on available space
        const spaceTop = rect.top;
        const spaceBottom = viewportHeight - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = viewportWidth - rect.right;
        
        let bestPosition = currentStep.position;
        
        // Auto-adjust position if not enough space
        if (currentStep.position === 'top' && spaceTop < 200) {
          bestPosition = spaceBottom > 200 ? 'bottom' : 'right';
        } else if (currentStep.position === 'bottom' && spaceBottom < 200) {
          bestPosition = spaceTop > 200 ? 'top' : 'left';
        } else if (currentStep.position === 'left' && spaceLeft < 350) {
          bestPosition = spaceRight > 350 ? 'right' : 'bottom';
        } else if (currentStep.position === 'right' && spaceRight < 350) {
          bestPosition = spaceLeft > 350 ? 'left' : 'top';
        }
        
        switch (bestPosition) {
          case 'top':
            y = rect.top - 20;
            break;
          case 'bottom':
            y = rect.bottom + 20;
            break;
          case 'left':
            x = rect.left - 20;
            y = elementCenter.y;
            break;
          case 'right':
            x = rect.right + 20;
            y = elementCenter.y;
            break;
        }
        
        // Ensure tooltip stays within viewport
        x = Math.max(20, Math.min(x, viewportWidth - 340));
        y = Math.max(20, Math.min(y, viewportHeight - 220));
        
        setTooltipPosition({ x, y });
      });
      
      // Enhanced scroll behavior
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
      
      // Add focus management for accessibility
      element.setAttribute('aria-describedby', 'tour-tooltip');
      
    } else if (retries > 0) {
      setRetryCount(prev => prev + 1);
      // Progressive retry delays for better UX
      const delay = Math.min(500 * (6 - retries), 2000);
      setTimeout(() => findElement(retries - 1), delay);
    } else {
      // Element not found after all retries
      setHasElementNotFound(true);
      console.warn(`Tour element not found: ${currentStep.selector}`);
      
      // Auto-skip after showing warning
      setTimeout(() => {
        if (tourActive && currentStep) {
          if (tourStep >= tourSteps.length - 1) {
            skipTour();
          } else {
            nextTourStep();
          }
        }
      }, 3000);
    }
  }, [currentStep, tourActive, tourStep, tourSteps.length, skipTour, nextTourStep]);

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

    const timer = setTimeout(() => findElement(), 300);

    return () => {
      clearTimeout(timer);
      // Clean up aria attributes
      const element = document.querySelector(currentStep?.selector);
      if (element) {
        element.removeAttribute('aria-describedby');
      }
    };
  }, [tourActive, tourStep, currentStep, location.pathname, navigate, findElement]);

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

  const handleSkipCurrent = () => {
    if (!isLastStep) {
      nextTourStep();
    } else {
      skipTour();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!tourActive) return;
      
      switch (event.key) {
        case 'Escape':
          skipTour();
          break;
        case 'ArrowRight':
        case ' ':
          event.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevious();
          break;
        case 's':
          event.preventDefault();
          handleSkipCurrent();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tourActive, handleNext, handlePrevious, handleSkipCurrent, skipTour]);

  if (!tourActive || !currentStep) {
    return null;
  }

  // Show fallback UI if element not found
  if (hasElementNotFound) {
    return (
      <Card
        className="fixed z-50 w-80 shadow-lg border-orange-200 bg-orange-50 dark:bg-orange-950"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        id="tour-tooltip"
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-description"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle id="tour-title" className="text-lg">{currentStep.title}</CardTitle>
            <Button variant="ghost" size="icon" onClick={skipTour} aria-label="Skip tour">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p id="tour-description" className="text-sm text-orange-700 dark:text-orange-300">
            Element not found for this step. This might happen if you're on a different page or the content is still loading.
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Retried {retryCount} times. Auto-skipping in a moment...
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {tourStep + 1} of {tourSteps.length}
            </span>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSkipCurrent}>
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
              <Button size="sm" onClick={handleNext}>
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!highlightedElement) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 pointer-events-none" />
      
      {/* Highlight */}
      {highlightedElement && (
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
      )}
      
      {/* Tooltip */}
      <Card
        className="fixed z-50 w-80 shadow-lg border-primary/20"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y
        }}
        id="tour-tooltip"
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-description"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle id="tour-title" className="text-lg">{currentStep.title}</CardTitle>
            <Button variant="ghost" size="icon" onClick={skipTour} aria-label="Skip tour">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p id="tour-description" className="text-sm text-muted-foreground">{currentStep.description}</p>
          
          {/* Keyboard shortcuts hint */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <p>⌨️ Use arrow keys, spacebar, or 'S' to skip</p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {tourStep + 1} of {tourSteps.length}
            </span>
            
            <div className="flex gap-2">
              {tourStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              {!isLastStep && (
                <Button variant="outline" size="sm" onClick={handleSkipCurrent}>
                  <SkipForward className="h-4 w-4 mr-1" />
                  Skip
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