import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateAccountSummary } from '@/utils/accountCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialTotals } from '@/hooks/useFinancialTotals';

/**
 * Financial Summary Bar
 * Displays key financial metrics in a compact horizontal bar
 * Used on Transactions page and other detail pages
 */
interface FinancialSummaryBarProps {
  dateRangeDays?: number;
  accountFilter?: string | null;
}

export function FinancialSummaryBar({ dateRangeDays = 30, accountFilter = null }: FinancialSummaryBarProps) {
  const { user } = useAuth();
  const { totals, refetch } = useFinancialTotals({ mode: 'days', dateRangeDays, accountFilter });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    checkingBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalDebts: 0,
    monthlyCashFlow: 0,
    savingsBalance: 0,
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSummaryData = async () => {
      try {
        // Get checking balance
        const { data: checkingAccounts } = await supabase
          .from('accounts')
          .select('available_balance, current_balance')
          .eq('user_id', user.id)
          .eq('type', 'depository')
          .eq('subtype', 'checking');

        const checkingBalance = (checkingAccounts || []).reduce((sum, acc) => {
          // For checking accounts, use available_balance if present, otherwise current_balance
          const balance = acc.available_balance !== null && acc.available_balance !== undefined 
            ? Number(acc.available_balance) 
            : Number(acc.current_balance) || 0;
          return sum + balance;
        }, 0);

        // Get debts
        const { data: allAccounts } = await supabase
          .from('accounts')
          .select('available_balance, current_balance, type, subtype')
          .eq('user_id', user.id);

        const accountSummary = calculateAccountSummary(allAccounts || []);

        // Get savings balance (savings accounts)
        const { data: savingsAccounts } = await supabase
          .from('accounts')
          .select('available_balance, current_balance, type, subtype')
          .eq('user_id', user.id)
          .eq('type', 'depository')
          .eq('subtype', 'savings');

        const savingsBalance = (savingsAccounts || []).reduce((sum, acc) => {
          const balance = acc.available_balance !== null && acc.available_balance !== undefined
            ? Number(acc.available_balance)
            : Number(acc.current_balance) || 0;
          return sum + balance;
        }, 0);

        // Get transactions within the selected date range (default last 30 days)
        const now = new Date();
        const fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() - (dateRangeDays || 0));
        const startDate = (dateRangeDays && dateRangeDays > 0)
          ? fromDate.toISOString().split('T')[0]
          : '1900-01-01';
        const endDate = now.toISOString().split('T')[0];

        let txQuery = supabase
          .from('transactions')
          .select('amount, category, plaid_account_id')
          .eq('user_id', user.id)
          .eq('pending', false)
          .gte('date', startDate)
          .lte('date', endDate);

        if (accountFilter) {
          txQuery = txQuery.eq('plaid_account_id', accountFilter);
        }

        const { data: allTransactions } = await txQuery;

        setData({
          checkingBalance,
          monthlyIncome: totals.income,
          monthlyExpenses: totals.expenses,
          totalDebts: accountSummary.totalDebts,
          monthlyCashFlow: totals.net,
          savingsBalance,
        });
      } catch (error) {
        console.error('Error fetching summary data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
    // Keep in sync if totals refetch updates
  }, [user, totals.income, totals.expenses, totals.net]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-3">
          <div className="flex justify-between items-center gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isPositiveCashFlow = data.monthlyCashFlow >= 0;

  return (
    <Card>
      <CardContent className="py-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Left column: Checking, Expenses, Cash Flow */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Checking:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(data.checkingBalance)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Expenses:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {formatCurrency(data.monthlyExpenses)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Cash Flow:</span>
              <span className={`font-bold ${isPositiveCashFlow ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isPositiveCashFlow ? '+' : ''}{formatCurrency(data.monthlyCashFlow)}
              </span>
            </div>
          </div>

          {/* Right column: Income, Debts, Savings */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Income:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(data.monthlyIncome)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Debts:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(data.totalDebts)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Savings:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(data.savingsBalance)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

