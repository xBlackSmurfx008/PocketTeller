import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  MessageSquare, 
  Target, 
  Receipt, 
  Settings,
  BarChart3
} from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

const tabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/home'
  },
  {
    id: 'budget',
    label: 'Budget',
    icon: BarChart3,
    path: '/budget'
  },
  {
    id: 'chat',
    label: 'AI Chat',
    icon: MessageSquare,
    path: '/chat'
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: Target,
    path: '/goals'
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: Receipt,
    path: '/transactions'
  }
];

interface BottomNavigationProps {
  className?: string;
}

export default function BottomNavigation({ className }: BottomNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabPress = (path: string) => {
    navigate(path);
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "border-t border-border/40",
      "safe-area-pb", // iOS safe area padding
      className
    )}>
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path || 
            (tab.path === '/home' && location.pathname === '/');
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1",
                "py-2 px-1 rounded-lg transition-all duration-200",
                "active:scale-95 active:bg-accent/50",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon 
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive && "scale-110"
                  )} 
                />
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </div>
                )}
              </div>
              <span className={cn(
                "text-xs mt-1 transition-all duration-200",
                isActive ? "font-medium" : "font-normal",
                "truncate max-w-full"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
        
        {/* Settings button - separate styling */}
        <button
          onClick={() => navigate('/account')}
          className={cn(
            "flex flex-col items-center justify-center min-w-0 flex-1",
            "py-2 px-1 rounded-lg transition-all duration-200",
            "active:scale-95 active:bg-accent/50",
            location.pathname === '/account'
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Settings"
        >
          <Settings 
            className={cn(
              "h-5 w-5 transition-all duration-200",
              location.pathname === '/account' && "scale-110"
            )} 
          />
          <span className={cn(
            "text-xs mt-1 transition-all duration-200",
            location.pathname === '/account' ? "font-medium" : "font-normal",
            "truncate max-w-full"
          )}>
            Settings
          </span>
        </button>
      </div>
    </div>
  );
}
