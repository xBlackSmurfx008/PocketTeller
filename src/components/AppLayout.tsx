import React from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import BottomNavigation from './BottomNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Routes that should show bottom navigation
const NAVIGATION_ROUTES = [
  '/home',
  '/budget', 
  '/chat',
  '/goals',
  '/transactions',
  '/account'
];

// Routes that should have bottom padding to account for navigation
const PADDED_ROUTES = [
  '/home',
  '/budget',
  '/chat', 
  '/goals',
  '/transactions',
  '/account'
];

export default function AppLayout({ children, className }: AppLayoutProps) {
  const location = useLocation();
  
  const shouldShowNavigation = NAVIGATION_ROUTES.includes(location.pathname) || 
    (location.pathname.startsWith('/chat/') && location.pathname !== '/chat');
  
  const shouldAddPadding = PADDED_ROUTES.includes(location.pathname) ||
    (location.pathname.startsWith('/chat/') && location.pathname !== '/chat');

  return (
    <div className={cn("min-h-screen bg-background no-horizontal-scroll", className)}>
      {/* Main content */}
      <div className={cn(
        "min-h-screen content-container",
        shouldAddPadding && "pb-20" // Add padding for bottom navigation
      )}>
        {children}
      </div>
      
      {/* Bottom Navigation */}
      {shouldShowNavigation && <BottomNavigation />}
    </div>
  );
}
