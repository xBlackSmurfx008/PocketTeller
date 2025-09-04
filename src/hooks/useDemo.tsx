import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface DemoState {
  isDemo: boolean;
  promptsUsed: number;
  maxPrompts: number;
  conversationsUsed: number;
  maxConversations: number;
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
      category: ['Food and Drink', 'Groceries'],
      date: new Date().toISOString().split('T')[0],
      account_name: 'Checking Account'
    },
    {
      id: '2',
      account_id: 'demo-account-1',
      amount: -45.00,
      name: 'Gas Station',
      merchant_name: 'Shell',
      category: ['Transportation', 'Gas Stations'],
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      account_name: 'Checking Account'
    },
    {
      id: '3',
      account_id: 'demo-account-1',
      amount: 2500.00,
      name: 'Direct Deposit',
      merchant_name: 'Employer Inc',
      category: ['Deposit', 'Payroll'],
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
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

  const value = {
    ...demoState,
    sampleData: SAMPLE_DATA,
    startDemo,
    exitDemo,
    usePrompt,
    useConversation
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