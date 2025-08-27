import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const RouteProgress = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleRouteChange = () => {
      setIsLoading(true);
      setProgress(0);
      
      // Quick progress to 80%
      const timer1 = setTimeout(() => setProgress(80), 50);
      
      // Complete to 100%
      const timer2 = setTimeout(() => setProgress(100), 200);
      
      // Hide the bar
      const timer3 = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 400);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    };

    handleRouteChange();
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <div 
      className="fixed top-0 left-0 z-50 h-1 bg-primary/80 transition-all duration-300 ease-out"
      style={{ 
        width: `${progress}%`,
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    />
  );
};