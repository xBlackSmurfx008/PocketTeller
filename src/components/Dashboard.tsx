import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FinancialHealthSnapshot from '@/components/FinancialHealthSnapshot';
import BudgetOverview from '@/components/BudgetOverview';
import GoalsOverview from '@/components/GoalsOverview';
import UpcomingBills from '@/components/UpcomingBills';
import { PlaidLink } from '@/components/PlaidLink';
import { AccountViewTabs } from '@/components/AccountViewTabs';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Lock, Plus } from 'lucide-react';

function Dashboard(): JSX.Element {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const [hasPlaidToken, setHasPlaidToken] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const checkPlaidConnection = useCallback(async (): Promise<void> => {
    if (!user) {
      setHasPlaidToken(false);
      return;
    }
    
    try {
      // Check for actual accounts, not just plaid_items
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!error && accounts && accounts.length > 0) {
        setHasPlaidToken(true);
      } else {
        setHasPlaidToken(false);
      }
    } catch (error) {
      console.error('Error checking Plaid connection:', error);
      setHasPlaidToken(false);
    }
  }, [user, isDemo]);

  const fetchBudgetData = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('budget')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching budget data:', error);
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
    }
  }, [user]);

  const debouncedFetchBudgetData = useCallback((): void => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchBudgetData();
    }, 300);
  }, [fetchBudgetData]);

  useEffect(() => {
    if (!isDemo) {
      checkPlaidConnection();
      fetchBudgetData();
      
      if (user) {
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
  }, [user, isDemo, checkPlaidConnection, fetchBudgetData, debouncedFetchBudgetData]);


  return (
    <div className="bg-background" data-tour-id="dashboard">
      <main className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pt-perfect px-4 pb-4 content-container">

        {/* Account View Tabs - Always show for authenticated users (non-demo)
            This ensures the "ALL" header and inline Add Bank button appear even with 0 banks */}
        {!isDemo && (
          <AccountViewTabs
            onAccountChange={setSelectedAccount}
            hasPlaidToken={hasPlaidToken}
            onConnectionChange={checkPlaidConnection}
          >
            {(accountId) => (
              <>
                <div data-tour-id="financial-snapshot">
                  <FinancialHealthSnapshot accountFilter={accountId} />
                </div>

                <div data-tour-id="budget-overview">
                  <BudgetOverview accountFilter={accountId} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div data-tour-id="goals-overview">
                    <GoalsOverview />
                  </div>
                  <div data-tour-id="upcoming-bills">
                    <UpcomingBills />
                  </div>
                </div>
              </>
            )}
          </AccountViewTabs>
        )}

        {/* Demo mode - show tabs with sample data */}
        {isDemo && (
          <>
            <div data-tour-id="financial-snapshot">
              <FinancialHealthSnapshot />
            </div>

            <div data-tour-id="budget-overview">
              <BudgetOverview />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div data-tour-id="goals-overview">
                <GoalsOverview />
              </div>
              <div data-tour-id="upcoming-bills">
                <UpcomingBills />
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}

export default memo(Dashboard);
