
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useSignOutAction } from '@/hooks/useSignOutAction';
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

export default function Dashboard() {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const { handleSignOut } = useSignOutAction();
  const navigate = useNavigate();
  const [hasPlaidToken, setHasPlaidToken] = useState(false);
  const [budgetData, setBudgetData] = useState<any>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

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
    <div className="bg-background" data-tour-id="dashboard">
      <main className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pt-perfect px-4 pb-4 content-container">
        {/* Bank Connection Card - Only show when not connected and not in demo */}
        {!hasPlaidToken && !isDemo && (
          <Card>
            <CardHeader>
              <CardTitle>Bank Connection</CardTitle>
              <CardDescription>
                Connect your bank account to automatically sync transactions and get personalized insights.
                <br />
                <span className="text-xs text-muted-foreground mt-2 block">
                  For testing, use: <strong>Username:</strong> user_good, <strong>Password:</strong> pass_good, <strong>Phone:</strong> 415-555-0011
                </span>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
