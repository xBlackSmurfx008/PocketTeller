import { memo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, PiggyBank } from 'lucide-react';
import { useFinancialTotals } from '@/hooks/useFinancialTotals';
import { calculateAccountSummary } from '@/utils/accountCategories';

/**
 * Props for FinancialHealthSnapshot component
 */
interface FinancialHealthSnapshotProps {
  accountFilter?: string | null;
  dateRangeDays?: number; // default last 30 days for consistency
}


/**
 * Displays a snapshot of the user's financial health
 * Shows assets, monthly income, monthly expenses, and total debts
 */
function FinancialHealthSnapshot({ accountFilter, dateRangeDays = 30 }: FinancialHealthSnapshotProps): JSX.Element {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const { totals, loading: totalsLoading } = useFinancialTotals({ mode: 'days', dateRangeDays, accountFilter });
  const [totalDebts, setTotalDebts] = useState(0);
  const [checkingBalance, setCheckingBalance] = useState(0);
  const [savingsInvestments, setSavingsInvestments] = useState(0);
  const [loadingDebts, setLoadingDebts] = useState(true);

  const fetchAccountData = useCallback(async () => {
    if (!user) {
      setLoadingDebts(false);
      return;
    }

    try {
      // Fetch all accounts to calculate debts and balances
      const { data: allAccounts, error: accountsError } = await supabase
        .from('accounts')
        .select('available_balance, current_balance, type, subtype')
        .eq('user_id', user.id);

      if (accountsError) {
        console.error('Accounts fetch error:', accountsError);
        setLoadingDebts(false);
        return;
      }

      // Calculate debts from all accounts
      const accountSummary = calculateAccountSummary(allAccounts || []);
      setTotalDebts(accountSummary.totalDebts);

      // Calculate checking balance - prioritize available_balance for checking accounts
      const checkingAccounts = (allAccounts || []).filter(account => 
        account.type === 'depository' && account.subtype === 'checking'
      );
      const checkingTotal = checkingAccounts.reduce((sum, account) => {
        // For checking accounts, use available_balance if present, otherwise current_balance
        const balance = account.available_balance !== null && account.available_balance !== undefined 
          ? Number(account.available_balance) 
          : Number(account.current_balance) || 0;
        return sum + balance;
      }, 0);
      setCheckingBalance(checkingTotal);

      // Calculate savings only
      const savingsInvestTotal = (allAccounts || []).reduce((sum, account) => {
        if (account.subtype === 'savings') {
          return sum + (Number(account.available_balance) || Number(account.current_balance) || 0);
        }
        return sum;
      }, 0);
      setSavingsInvestments(savingsInvestTotal);

    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setLoadingDebts(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !isDemo) {
      fetchAccountData();
      
      // Add real-time subscription for account balance updates
      const accountsChannel = supabase
        .channel('accounts-changes-snapshot')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'accounts',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Account balances updated, refreshing data');
            fetchAccountData(); // Refetch when accounts change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(accountsChannel);
      };
    } else {
      setLoadingDebts(false);
    }
  }, [user, isDemo, fetchAccountData]);

  if (isDemo && !user) {
    // Demo data
    return (
      <Card className="card-hover-lift elevation-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Your Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="p-5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">Checking Balance</h3>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">$1,250</p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">Available to spend</p>
            </div>
            <div className="p-5 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Income</h3>
              </div>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">$2,500</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-2">Last 30 days</p>
            </div>
            <div className="p-5 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-sm font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">Expenses</h3>
              </div>
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">$1,850</p>
              <p className="text-xs text-orange-600 dark:text-orange-500 mt-2">Last 30 days</p>
            </div>
            <div className="p-5 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">Savings</h3>
              </div>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">$5,250</p>
              <p className="text-xs text-purple-600 dark:text-purple-500 mt-2">Total saved</p>
            </div>
            <div className="p-5 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Debts</h3>
              </div>
              <p className="text-3xl font-bold text-red-700 dark:text-red-400">$3,200</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-2">Loans & Credit</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Cash Flow (Last 30 Days)</span>
              <Badge variant="default" className="text-base">
                +$650
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Savings</span>
              <Badge variant="secondary" className="text-base">
                $7,250
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalsLoading || loadingDebts) {
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

  const isPositiveCashFlow = totals.net >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Your Financial Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* THE FIVE MAIN METRICS - Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* 1. CHECKING BALANCE - Available to spend */}
          <div className="p-5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">Checking Balance</h3>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              ${checkingBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">Available to spend</p>
          </div>

          {/* 2. INCOME - Use totals.income directly like Transactions page */}
          <div className="p-5 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Income</h3>
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">
              ${totals.income.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-2">Last 30 days</p>
          </div>

          {/* 3. EXPENSES - Use totals.expenses directly like Transactions page */}
          <div className="p-5 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-sm font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">Expenses</h3>
            </div>
            <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
              ${totals.expenses.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-500 mt-2">Last 30 days</p>
          </div>

          {/* 4. SAVINGS (Total of Savings accounts) */}
          <div className="p-5 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">Savings</h3>
            </div>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
              ${savingsInvestments.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-500 mt-2">Total saved</p>
          </div>

          {/* 5. DEBTS (Loans, Credit Cards, etc.) */}
          <div className="p-5 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Debts</h3>
            </div>
            <p className="text-3xl font-bold text-red-700 dark:text-red-400">
              ${totalDebts.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-2">Loans & Credit</p>
          </div>
        </div>

        {/* SECONDARY METRICS - Cash Flow and Savings/Investments */}
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 pt-4 border-t">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Cash Flow (Last 30 Days)</span>
            <Badge variant={isPositiveCashFlow ? 'default' : 'destructive'} className="text-base">
              {isPositiveCashFlow ? '+' : ''}${totals.net.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Memoized export for performance optimization
 */
export default memo(FinancialHealthSnapshot);