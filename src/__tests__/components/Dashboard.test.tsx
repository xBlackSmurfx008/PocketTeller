import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';

// Mock hooks
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useDemo');
vi.mock('@/hooks/useSignOutAction', () => ({
  useSignOutAction: () => ({ handleSignOut: vi.fn() })
}));
vi.mock('@/hooks/useLayoutPreference', () => ({
  useLayoutPreference: () => ({ isDesktopForced: false })
}));
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false
}));

// Mock child components
vi.mock('@/components/FinancialHealthSnapshot', () => ({
  default: () => <div data-testid="financial-health-snapshot">Financial Health</div>
}));
vi.mock('@/components/BudgetOverview', () => ({
  default: () => <div data-testid="budget-overview">Budget Overview</div>
}));
vi.mock('@/components/GoalsOverview', () => ({
  default: () => <div data-testid="goals-overview">Goals Overview</div>
}));
vi.mock('@/components/UpcomingBills', () => ({
  default: () => <div data-testid="upcoming-bills">Upcoming Bills</div>
}));
vi.mock('@/components/PlaidLink', () => ({
  PlaidLink: () => <div data-testid="plaid-link">Connect Bank</div>
}));
vi.mock('@/components/TourLauncher', () => ({
  TourLauncher: () => <div data-testid="tour-launcher">Tour</div>
}));
vi.mock('@/components/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell">Notifications</div>
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockUseDemo = useDemo as ReturnType<typeof vi.fn>;

describe('Dashboard', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      isLoading: false
    });
    
    mockUseDemo.mockReturnValue({
      isDemo: false
    });
  });

  it('renders dashboard with all main components', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Pocket Banker')).toBeInTheDocument();
    expect(screen.getByTestId('financial-health-snapshot')).toBeInTheDocument();
    expect(screen.getByTestId('budget-overview')).toBeInTheDocument();
    expect(screen.getByTestId('goals-overview')).toBeInTheDocument();
    expect(screen.getByTestId('upcoming-bills')).toBeInTheDocument();
  });

  it('shows demo mode indicator when in demo', () => {
    mockUseDemo.mockReturnValue({ isDemo: true });
    
    render(<Dashboard />);
    
    expect(screen.getByText('(Demo)')).toBeInTheDocument();
  });

  it('shows bank connection card when not connected', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Bank Connection')).toBeInTheDocument();
    expect(screen.getByTestId('plaid-link')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Budgeting Assistant')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });
});