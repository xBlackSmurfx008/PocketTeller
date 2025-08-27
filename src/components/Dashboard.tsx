
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useSignOutAction } from '@/hooks/useSignOutAction';
import { useLayoutPreference } from '@/hooks/useLayoutPreference';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FinancialHealthSnapshot from '@/components/FinancialHealthSnapshot';
import BudgetOverview from '@/components/BudgetOverview';
import GoalsOverview from '@/components/GoalsOverview';
import UpcomingBills from '@/components/UpcomingBills';
import { PlaidLink } from '@/components/PlaidLink';
import { ShareBudgetDialog } from '@/components/ShareBudgetDialog';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Target, MessageSquare, Share2, Receipt } from 'lucide-react';
import { TourLauncher } from '@/components/TourLauncher';

export default function Dashboard() {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const { handleSignOut } = useSignOutAction();
  const { isDesktopForced } = useLayoutPreference();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [hasPlaidToken, setHasPlaidToken] = useState(false);
  const [budgetData, setBudgetData] = useState<any>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const showMobileLayout = isMobile && !isDesktopForced;

  // Debounced fetch function to prevent excessive API calls
  const debouncedFetchBudgetData = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchBudgetData();
    }, 300);
  }, []);

  useEffect(() => {
    if (!isDemo) {
      checkPlaidConnection();
      fetchBudgetData();
      
      if (user) {
        // Set up real-time subscription for budget changes
        const budgetChannel = supabase
          .channel('dashboard-budget-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'budget',
              filter: `user_id=eq.${user.id}`
            },
            () => {
              console.log('Budget updated, refreshing dashboard data');
              debouncedFetchBudgetData();
            }
          )
          .subscribe();

        return () => {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          supabase.removeChannel(budgetChannel);
        };
      }
    }
  }, [user, isDemo]);

  const checkPlaidConnection = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('encrypted_plaid_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.encrypted_plaid_token) {
        setHasPlaidToken(true);
      }
    } catch (error) {
      console.error('Error checking Plaid connection:', error);
    }
  };

  const fetchBudgetData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('budget')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!error && data) {
        setBudgetData(data);
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
    }
  };


  return (
    <div className="min-h-screen bg-background" data-tour-id="dashboard">
      <header className="border-b border-border p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className={`font-bold text-foreground ${showMobileLayout ? 'text-xl' : 'text-2xl'}`}>
            Budget AI {isDemo && <span className="text-sm font-normal text-muted-foreground">(Demo)</span>}
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            {showMobileLayout ? (
              <>
                <TourLauncher />
                <Button variant="ghost" size="icon" onClick={() => navigate('/chat')} aria-label="AI Chat">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/goals')} aria-label="Goals">
                  <Target className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')} aria-label="Transactions">
                  <Receipt className="h-4 w-4" />
                </Button>
                {budgetData && (
                  <ShareBudgetDialog budgetData={budgetData}>
                    <Button variant="ghost" size="icon" aria-label="Share budget">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </ShareBudgetDialog>
                )}
                <Button variant="ghost" size="icon" onClick={() => navigate('/account')} aria-label="Account settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <TourLauncher />
                <Button variant="outline" onClick={() => navigate('/chat')} data-tour-id="ai-chat-button">
                  Budgeting Assistant
                </Button>
                <Button variant="outline" onClick={() => navigate('/goals')}>
                  <Target className="h-4 w-4 mr-2" />
                  Goals
                </Button>
                <Button variant="outline" onClick={() => navigate('/transactions')}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Transactions
                </Button>
                {budgetData && (
                  <ShareBudgetDialog budgetData={budgetData}>
                    <Button variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Budget
                    </Button>
                  </ShareBudgetDialog>
                )}
                <Button variant="ghost" size="icon" onClick={() => navigate('/account')} aria-label="Account settings">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  {isDemo ? 'Exit Demo' : 'Sign Out'}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto space-y-4 sm:space-y-6 ${showMobileLayout ? 'p-3' : 'p-4'}`}>
        {/* Bank Connection Card - Only show when not connected and not in demo */}
        {!hasPlaidToken && !isDemo && (
          <Card>
            <CardHeader>
              <CardTitle>Bank Connection</CardTitle>
              <CardDescription>
                Connect your bank account to automatically sync transactions and get personalized insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlaidLink 
                hasPlaidToken={hasPlaidToken} 
                onConnectionChange={checkPlaidConnection} 
              />
            </CardContent>
          </Card>
        )}

        <div data-tour-id="financial-snapshot">
          <FinancialHealthSnapshot />
        </div>

        <div data-tour-id="budget-overview">
          <BudgetOverview />
        </div>
        
        <div className={`grid grid-cols-1 lg:grid-cols-2 ${showMobileLayout ? 'gap-4' : 'gap-6'}`}>
          <div data-tour-id="goals-overview">
            <GoalsOverview />
          </div>
          <div data-tour-id="upcoming-bills">
            <UpcomingBills />
          </div>
        </div>
      </main>
    </div>
  );
}
