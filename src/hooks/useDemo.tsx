import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TourType = 'full' | 'chat' | 'budget' | 'goals';

export interface DemoState {
  isDemo: boolean;
  promptsUsed: number;
  maxPrompts: number;
  conversationsUsed: number;
  maxConversations: number;
  tourStep: number;
  tourActive: boolean;
  currentTour: TourType;
  isAnonymousDemo: boolean;
  sampleData: {
    transactions: any[];
    goals: any[];
    bills: any[];
    accounts: any[];
  };
}

interface DemoContextType extends DemoState {
  startDemo: () => void;
  exitDemo: () => void;
  usePrompt: () => boolean;
  useConversation: () => boolean;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => void;
  resetTour: () => void;
  startTour: (tourType: TourType) => void;
  getTourSteps: () => any[];
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const SAMPLE_DATA = {
  transactions: [
    {
      id: '1',
      account_id: 'demo-account-1',
      amount: -85.50,
      name: 'Grocery Store',
      merchant_name: 'Fresh Market',
      category: 'Food & Dining',
      date: new Date().toISOString().split('T')[0],
      account_name: 'Checking Account'
    },
    {
      id: '2',
      account_id: 'demo-account-1',
      amount: -45.00,
      name: 'Gas Station',
      merchant_name: 'Shell',
      category: 'Transportation',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      account_name: 'Checking Account'
    },
    {
      id: '3',
      account_id: 'demo-account-1',
      amount: 2500.00,
      name: 'Direct Deposit',
      merchant_name: 'Employer Inc',
      category: 'Income',
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      account_name: 'Checking Account'
    },
    {
      id: '4',
      account_id: 'demo-account-1',
      amount: -25.99,
      name: 'Netflix Subscription',
      merchant_name: 'Netflix',
      category: 'Entertainment',
      date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
      account_name: 'Checking Account'
    },
    {
      id: '5',
      account_id: 'demo-account-1',
      amount: -120.00,
      name: 'Electric Bill',
      merchant_name: 'Power Company',
      category: 'Bills & Utilities',
      date: new Date(Date.now() - 345600000).toISOString().split('T')[0],
      account_name: 'Checking Account'
    },
    {
      id: '6',
      account_id: 'demo-account-1',
      amount: -75.50,
      name: 'Restaurant',
      merchant_name: 'Local Bistro',
      category: 'Food & Dining',
      date: new Date(Date.now() - 432000000).toISOString().split('T')[0],
      account_name: 'Checking Account'
    }
  ],
  goals: [
    {
      id: '1',
      user_id: 'demo-user',
      title: 'Emergency Fund',
      target_amount: 10000,
      current_amount: 3500,
      target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'demo-user',
      title: 'Vacation to Europe',
      target_amount: 5000,
      current_amount: 1200,
      target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    }
  ],
  bills: [
    {
      id: '1',
      user_id: 'demo-user',
      name: 'Electric Bill',
      amount: 120.50,
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_recurring: true,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'demo-user',
      name: 'Internet',
      amount: 79.99,
      due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_recurring: true,
      created_at: new Date().toISOString()
    }
  ],
  accounts: [
    {
      id: 'demo-account-1',
      user_id: 'demo-user',
      name: 'Checking Account',
      balance: 2850.75,
      type: 'depository',
      subtype: 'checking'
    },
    {
      id: 'demo-account-2',
      user_id: 'demo-user',
      name: 'Savings Account',
      balance: 8500.00,
      type: 'depository',
      subtype: 'savings'
    }
  ]
};

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demoState, setDemoState] = useState<DemoState>(() => {
    const saved = sessionStorage.getItem('demo-state');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      isDemo: false,
      promptsUsed: 0,
      maxPrompts: 5,
      conversationsUsed: 0,
      maxConversations: 5,
      tourStep: 0,
      tourActive: false,
      currentTour: 'full' as TourType,
      isAnonymousDemo: false,
      sampleData: SAMPLE_DATA
    };
  });

  useEffect(() => {
    sessionStorage.setItem('demo-state', JSON.stringify(demoState));
  }, [demoState]);

  // Listen for auth-triggered demo exit
  useEffect(() => {
    const handleExitDemo = () => {
      setDemoState(prev => ({
        ...prev,
        isDemo: false,
        promptsUsed: 0,
        conversationsUsed: 0,
        tourStep: 0,
        tourActive: false,
        currentTour: 'full' as TourType,
        isAnonymousDemo: false
      }));
    };

    window.addEventListener('exit-demo-mode', handleExitDemo);
    return () => window.removeEventListener('exit-demo-mode', handleExitDemo);
  }, []);

  const startDemo = async () => {
    // Demo mode now works locally without authentication
    setDemoState(prev => ({
      ...prev,
      isDemo: true,
      promptsUsed: 0,
        conversationsUsed: 0,
        tourStep: 0,
        tourActive: true,
        currentTour: 'full' as TourType,
        isAnonymousDemo: false // No longer using anonymous auth
    }));
  };

  const exitDemo = async () => {
    // Demo mode is local-only, no authentication needed
    setDemoState(prev => ({
      ...prev,
      isDemo: false,
      promptsUsed: 0,
        conversationsUsed: 0,
        tourStep: 0,
        tourActive: false,
        currentTour: 'full' as TourType,
        isAnonymousDemo: false
    }));
    sessionStorage.removeItem('demo-state');
  };

  const usePrompt = () => {
    if (!demoState.isDemo) return true;
    if (demoState.promptsUsed >= demoState.maxPrompts) return false;
    
    setDemoState(prev => ({
      ...prev,
      promptsUsed: prev.promptsUsed + 1
    }));
    return true;
  };

  const useConversation = () => {
    if (!demoState.isDemo) return true;
    if (demoState.conversationsUsed >= demoState.maxConversations) return false;
    
    setDemoState(prev => ({
      ...prev,
      conversationsUsed: prev.conversationsUsed + 1
    }));
    return true;
  };

  const nextTourStep = () => {
    setDemoState(prev => ({
      ...prev,
      tourStep: prev.tourStep + 1
    }));
  };

  const prevTourStep = () => {
    setDemoState(prev => ({
      ...prev,
      tourStep: Math.max(0, prev.tourStep - 1)
    }));
  };

  const skipTour = () => {
    setDemoState(prev => ({
      ...prev,
      tourActive: false
    }));
  };

  const resetTour = () => {
    setDemoState(prev => ({
      ...prev,
      tourStep: 0,
      tourActive: true
    }));
  };

  const startTour = (tourType: TourType) => {
    setDemoState(prev => ({
      ...prev,
      tourStep: 0,
      tourActive: true,
      currentTour: tourType
    }));
  };

  const getTourSteps = () => {
    // Import tour configurations based on current tour type
    const TOUR_CONFIGS = {
      full: [
        {
          id: 'welcome',
          title: 'Welcome to Pocket Banker!',
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
          id: 'budget-overview',
          title: 'Budget Management',
          description: 'Create and track budgets by category. See how much you\'ve spent vs. your budget limits.',
          selector: '[data-tour-id="budget-overview"]',
          route: '/',
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
      ],
      chat: [
        {
          id: 'chat-welcome',
          title: 'AI Financial Assistant',
          description: 'Ask questions about your finances, upload documents, or get personalized advice.',
          selector: '[data-tour-id="chat-input"]',
          route: '/chat',
          position: 'top'
        },
        {
          id: 'education-panel',
          title: 'Learning Center',
          description: 'Get educational suggestions and follow-up questions based on your conversations.',
          selector: '[data-tour-id="education-panel"]',
          route: '/chat',
          position: 'left'
        }
      ],
      budget: [
        {
          id: 'budget-categories',
          title: 'Budget Categories',
          description: 'Organize your spending into categories and set limits for each.',
          selector: '[data-tour-id="budget-categories"]',
          route: '/budget',
          position: 'top'
        }
      ],
      goals: [
        {
          id: 'goals-list',
          title: 'Your Goals',
          description: 'Create and track your financial goals with target amounts and deadlines.',
          selector: '[data-tour-id="goals-list"]',
          route: '/goals',
          position: 'top'
        }
      ]
    };
    
    return TOUR_CONFIGS[demoState.currentTour] || TOUR_CONFIGS.full;
  };

  const value = {
    ...demoState,
    sampleData: SAMPLE_DATA,
    startDemo,
    exitDemo,
    usePrompt,
    useConversation,
    nextTourStep,
    prevTourStep,
    skipTour,
    resetTour,
    startTour,
    getTourSteps
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}