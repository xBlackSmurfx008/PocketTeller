import { vi } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis()
    })),
    functions: {
      invoke: vi.fn()
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    })),
    removeChannel: vi.fn()
  }
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to, ...props }: any) => {
    return React.createElement('a', { href: to, ...props }, children);
  },
  Navigate: ({ to }: any) => {
    return React.createElement('div', { 'data-testid': 'navigate', 'data-to': to });
  }
}));

// Mock environment
vi.mock('@/config/environment', () => ({
  config: {
    app: {
      environment: 'test',
      name: 'Pocket Banker Test'
    },
    features: {
      enableAnalytics: false,
      enableErrorReporting: false
    }
  },
  isProduction: false,
  isDevelopment: false,
  metaConfig: {
    title: 'Test App',
    description: 'Test description'
  }
}));