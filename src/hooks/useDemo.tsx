import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Transaction, Goal, Bill, Account } from '@/types/models';

export type TourType = 'full' | 'chat' | 'budget' | 'goals';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  selector: string;
  route?: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Demo sample transaction
 */
interface DemoTransaction extends Omit<Transaction, 'user_id' | 'created_at' | 'updated_at'> {
  account_name: string;
  name: string;
}

/**
 * Demo sample goal
 */
interface DemoGoal extends Goal {
  // Additional demo-specific fields if needed
}

/**
 * Demo sample bill
 */
interface DemoBill extends Bill {
  // Additional demo-specific fields if needed
}

/**
 * Demo sample account
 */
interface DemoAccount extends Omit<Account, 'user_id' | 'created_at' | 'updated_at'> {
  balance: number;
}

export interface DemoState {
  isDemo: boolean;
  promptsUsed: number;
  maxPrompts: number;
  conversationsUsed: number;
  maxConversations: number;
  sampleData: {
    transactions: DemoTransaction[];
    goals: DemoGoal[];
    bills: DemoBill[];
    accounts: DemoAccount[];
  };
}

interface DemoContextType extends DemoState {
  startDemo: () => void;
  exitDemo: () => void;
  usePrompt: () => boolean;
  useConversation: () => boolean;
  // Tour API
  tourActive: boolean;
  tourStep: number;
  currentTour: TourType | null;
  startTour: (tour: TourType) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => void;
  getTourSteps: () => TourStep[];
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const SAMPLE_DATA: DemoState['sampleData'] = {
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
      description: 'Build up emergency savings for unexpected expenses',
      target_amount: 10000,
      current_amount: 3500,
      target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'savings',
      priority: 'high',
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'demo-user',
      title: 'Vacation to Europe',
      description: 'Save for a 2-week European vacation',
      target_amount: 5000,
      current_amount: 1200,
      target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'travel',
      priority: 'medium',
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  bills: [
    {
      id: '1',
      user_id: 'demo-user',
      name: 'Electric Bill',
      amount: 120.50,
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'utilities',
      description: 'Monthly electricity bill',
      is_recurring: true,
      reminder_days: 3,
      is_paid: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'demo-user',
      name: 'Internet',
      amount: 79.99,
      due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'utilities',
      description: 'Monthly internet service',
      is_recurring: true,
      reminder_days: 3,
      is_paid: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
      try {
        return JSON.parse(saved);
      } catch {
        // Clear invalid data
        sessionStorage.removeItem('demo-state');
      }
    }
    return {
      isDemo: false,
      promptsUsed: 0,
      maxPrompts: 5,
      conversationsUsed: 0,
      maxConversations: 3,
      sampleData: SAMPLE_DATA
    };
  });

  // Tour state
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [currentTour, setCurrentTour] = useState<TourType | null>(null);

  useEffect(() => {
    sessionStorage.setItem('demo-state', JSON.stringify(demoState));
  }, [demoState]);

  const startDemo = () => {
    setDemoState(prev => ({
      ...prev,
      isDemo: true,
      promptsUsed: 0,
      conversationsUsed: 0
    }));
  };

  const exitDemo = () => {
    setDemoState(prev => ({
      ...prev,
      isDemo: false,
      promptsUsed: 0,
      conversationsUsed: 0
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

  // Tour functions
  const getTourSteps = (): TourStep[] => {
    const common = (route: string, selector: string, title: string, description: string, position: TourStep['position']): TourStep => ({
      id: `${route}-${selector}`,
      title,
      description,
      selector,
      route,
      position
    });

    switch (currentTour) {
      case 'chat':
        return [
          common('/chat', 'textarea', 'Chat with your AI', 'Type a question and press Enter to send.', 'bottom'),
          common('/chat', '[data-file-upload]', 'Upload files', 'Attach files to add context to your questions.', 'top'),
        ];
      case 'budget':
        return [
          common('/budget', '.content-container', 'Budget Overview', 'Review spending vs. plan by category.', 'top'),
          common('/budget', '[data-budget-chart]', 'Budget Chart', 'Visual breakdown of your spending categories.', 'bottom'),
        ];
      case 'goals':
        return [
          common('/goals', '.content-container', 'Goals', 'Track your savings goals and progress.', 'top'),
          common('/goals', '[data-add-goal]', 'Add Goal', 'Create new financial goals to work towards.', 'bottom'),
        ];
      case 'full':
        return [
          common('/home', '.content-container', 'Welcome', 'Quick tour of the main areas.', 'bottom'),
          common('/budget', '.content-container', 'Budget', 'Manage your budget and spending.', 'top'),
          common('/goals', '.content-container', 'Goals', 'Set and track financial goals.', 'top'),
          common('/chat', 'textarea', 'AI Assistant', 'Ask questions and get insights.', 'bottom'),
          common('/account', '.content-container', 'Account', 'Manage your settings and connections.', 'top'),
        ];
      default:
        return [];
    }
  };

  const startTour = (tour: TourType) => {
    setCurrentTour(tour);
    setTourStep(0);
    setTourActive(true);
  };

  const nextTourStep = () => {
    const steps = getTourSteps();
    if (tourStep < steps.length - 1) {
      setTourStep(s => s + 1);
    } else {
      skipTour();
    }
  };

  const prevTourStep = () => setTourStep(s => Math.max(0, s - 1));
  
  const skipTour = () => {
    setTourActive(false);
    setTourStep(0);
    setCurrentTour(null);
  };

  const value = {
    ...demoState,
    sampleData: SAMPLE_DATA,
    startDemo,
    exitDemo,
    usePrompt,
    useConversation,
    // Tour API
    tourActive,
    tourStep,
    currentTour,
    startTour,
    nextTourStep,
    prevTourStep,
    skipTour,
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