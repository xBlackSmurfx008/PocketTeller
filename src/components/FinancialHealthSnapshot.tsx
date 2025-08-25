import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface FinancialData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export default function FinancialHealthSnapshot() {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const [data, setData] = useState<FinancialData>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced fetch function to prevent excessive API calls
  const debouncedFetchFinancialData = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchFinancialData();
    }, 300);
  }, []);

  useEffect(() => {
    if (isDemo && !user) {
      // Only show demo data if in demo mode AND no authenticated user
      const totalBalance = sampleData.accounts.reduce((sum, account) => sum + account.balance, 0);
      setData({
        totalBalance,
        monthlyIncome: 2500,
        monthlyExpenses: 1850,
      });
      setLoading(false);
    } else if (user) {
      fetchFinancialData();
      
      // Set up real-time subscriptions for accounts and budget changes
      const accountsChannel = supabase
        .channel('accounts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'accounts',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Accounts updated, refreshing financial data');
            debouncedFetchFinancialData();
          }
        )
        .subscribe();

      const budgetChannel = supabase
        .channel('budget-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'budget',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Budget updated, refreshing financial data');
            debouncedFetchFinancialData();
          }
        )
        .subscribe();

      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        supabase.removeChannel(accountsChannel);
        supabase.removeChannel(budgetChannel);
      };
    } else {
      setLoading(false);
    }
  }, [user, isDemo, sampleData]);

  const fetchFinancialData = async () => {
    try {
      // Fetch total balance from accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user?.id);

      if (accountsError) throw accountsError;

      const totalBalance = accounts?.reduce((sum, account) => sum + Number(account.balance), 0) || 0;

      // Fetch budget data for monthly income/expenses
      const { data: budget, error: budgetError } = await supabase
        .from('budget')
        .select('income, expenses')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (budgetError && budgetError.code !== 'PGRST116') {
        console.error('Budget fetch error:', budgetError);
      }

      setData({
        totalBalance,
        monthlyIncome: budget?.income ? Number(budget.income) : 0,
        monthlyExpenses: budget?.expenses ? Number(budget.expenses) : 0,
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const netIncome = data.monthlyIncome - data.monthlyExpenses;
  const isPositive = netIncome >= 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Health Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Balance</h3>
            <p className="text-3xl font-bold text-primary">
              ${data.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="text-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Monthly Income</h3>
            <p className="text-2xl font-semibold text-green-600 flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4" />
              ${data.monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="text-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Monthly Expenses</h3>
            <p className="text-2xl font-semibold text-red-600 flex items-center justify-center gap-1">
              <TrendingDown className="h-4 w-4" />
              ${data.monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Net Monthly Cash Flow</span>
            <div className="flex items-center gap-2">
              <Badge variant={isPositive ? 'default' : 'destructive'}>
                {isPositive ? '+' : ''}${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}