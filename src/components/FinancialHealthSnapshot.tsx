import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { calculateAccountSummary } from '@/utils/accountCategories';

/**
 * Props for FinancialHealthSnapshot component
 */
interface FinancialHealthSnapshotProps {
  accountFilter?: string | null;
}

/**
 * Enhanced financial data structure
 */
interface EnhancedFinancialData {
  checkingBalance: number; // Available balance in checking accounts only
  monthlyIncome: number; // Positive transactions this month
  monthlyExpenses: number; // Negative transactions this month
  monthlyCashFlow: number; // Income - Expenses
  savingsInvestments: number; // Savings + Investment accounts
  totalDebts: number; // Credit cards, loans, mortgages
}

/**
 * Displays a snapshot of the user's financial health
 * Shows assets, monthly income, monthly expenses, and total debts
 */
function FinancialHealthSnapshot({ accountFilter }: FinancialHealthSnapshotProps): JSX.Element {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const [data, setData] = useState<EnhancedFinancialData>({
    checkingBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyCashFlow: 0,
    savingsInvestments: 0,
    totalDebts: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFinancialData = useCallback(async () => {
    try {
      // 1. Fetch CHECKING accounts only for spendable balance
      const { data: checkingAccounts, error: checkingError } = await supabase
        .from('accounts')
        .select('available_balance, current_balance')
        .eq('user_id', user?.id)
        .eq('type', 'depository')
        .eq('subtype', 'checking');

      if (checkingError) {
        console.error('Checking accounts fetch error:', checkingError);
      }

      const checkingBalance = (checkingAccounts || []).reduce((sum, account) => {
        return sum + (Number(account.available_balance) || Number(account.current_balance) || 0);
      }, 0);

      // 2. Fetch SAVINGS + INVESTMENTS accounts
      const { data: savingsInvestAccounts, error: savingsError} = await supabase
        .from('accounts')
        .select('available_balance, current_balance, type, subtype')
        .eq('user_id', user?.id);

      if (savingsError) {
        console.error('Savings/investments fetch error:', savingsError);
      }

      const savingsInvestments = (savingsInvestAccounts || []).reduce((sum, account) => {
        // Include savings and investment accounts
        if (account.subtype === 'savings' || account.type === 'investment') {
          return sum + (Number(account.available_balance) || Number(account.current_balance) || 0);
        }
        return sum;
      }, 0);

      // 3. Calculate DEBTS from all accounts
      const accountSummary = calculateAccountSummary(savingsInvestAccounts || []);

      // 4. Fetch ACTUAL TRANSACTIONS for income/expenses (current month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];

      // Get ALL transactions for the month (Plaid stores all amounts as positive)
      const { data: allTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount, category')
        .eq('user_id', user?.id)
        .eq('pending', false)
        .gte('date', startDate)
        .lte('date', endDate);

      if (transactionsError) {
        console.error('Transactions fetch error:', transactionsError);
      }

      // Separate income and expenses by category
      // All amounts are stored positive, so we use category to distinguish
      let monthlyIncome = 0;
      let monthlyExpenses = 0;

      (allTransactions || []).forEach(t => {
        const amount = Math.abs(Number(t.amount) || 0);
        if (t.category === 'Income') {
          monthlyIncome += amount;
        } else {
          // All non-Income categories are expenses
          monthlyExpenses += amount;
        }
      });

      // Calculate cash flow
      const monthlyCashFlow = monthlyIncome - monthlyExpenses;

      setData({
        checkingBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlyCashFlow,
        savingsInvestments,
        totalDebts: accountSummary.totalDebts,
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Debounced fetch function to prevent excessive API calls
  const debouncedFetchFinancialData = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchFinancialData();
    }, 300);
  }, [fetchFinancialData]);

  useEffect(() => {
    if (isDemo && !user) {
      // Only show demo data if in demo mode AND no authenticated user
      const income = 2500;
      const expenses = 1850;
      setData({
        checkingBalance: 1250,
        monthlyIncome: income,
        monthlyExpenses: expenses,
        monthlyCashFlow: income - expenses,
        savingsInvestments: 7250,
        totalDebts: 3200,
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

      const transactionsChannel = supabase
        .channel('transactions-changes-snapshot')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Transactions updated, refreshing financial data');
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
        supabase.removeChannel(transactionsChannel);
      };
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isDemo, sampleData]);

  // Safe calculations with fallbacks
  const isPositiveCashFlow = (data?.monthlyCashFlow || 0) >= 0;

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
          Your Financial Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* THE FOUR MAIN METRICS - Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 1. CHECKING BALANCE - Available to spend */}
          <div className="p-5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">Checking Balance</h3>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              ${(data?.checkingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">Available to spend</p>
          </div>

          {/* 2. INCOME */}
          <div className="p-5 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Income</h3>
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">
              ${(data?.monthlyIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-2">This month</p>
          </div>

          {/* 3. EXPENSES */}
          <div className="p-5 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-sm font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">Expenses</h3>
            </div>
            <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
              ${(data?.monthlyExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-500 mt-2">This month</p>
          </div>

          {/* 4. DEBTS (Loans, Credit Cards, etc.) */}
          <div className="p-5 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Debts</h3>
            </div>
            <p className="text-3xl font-bold text-red-700 dark:text-red-400">
              ${(data?.totalDebts || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-2">Loans & Credit</p>
          </div>
        </div>

        {/* SECONDARY METRICS - Cash Flow and Savings/Investments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Monthly Cash Flow</span>
            <Badge variant={isPositiveCashFlow ? 'default' : 'destructive'} className="text-base">
              {isPositiveCashFlow ? '+' : ''}${(data?.monthlyCashFlow || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Savings & Investments</span>
            <Badge variant="secondary" className="text-base">
              ${(data?.savingsInvestments || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
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