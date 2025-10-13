import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateAccountSummary } from '@/utils/accountCategories';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Financial Summary Bar
 * Displays key financial metrics in a compact horizontal bar
 * Used on Transactions page and other detail pages
 */
export function FinancialSummaryBar() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    checkingBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalDebts: 0,
    monthlyCashFlow: 0,
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

        const checkingBalance = (checkingAccounts || []).reduce((sum, acc) => 
          sum + (Number(acc.available_balance) || Number(acc.current_balance) || 0), 0);

        // Get debts
        const { data: allAccounts } = await supabase
          .from('accounts')
          .select('available_balance, current_balance, type, subtype')
          .eq('user_id', user.id);

        const accountSummary = calculateAccountSummary(allAccounts || []);

        // Get monthly transactions
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startDate = startOfMonth.toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];

        const { data: incomeTransactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('pending', false)
          .gte('date', startDate)
          .lte('date', endDate)
          .gt('amount', 0);

        const { data: expenseTransactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('pending', false)
          .gte('date', startDate)
          .lte('date', endDate)
          .lt('amount', 0);

        const monthlyIncome = (incomeTransactions || []).reduce((sum, t) => 
          sum + Math.abs(Number(t.amount) || 0), 0);
        const monthlyExpenses = (expenseTransactions || []).reduce((sum, t) => 
          sum + Math.abs(Number(t.amount) || 0), 0);

        setData({
          checkingBalance,
          monthlyIncome,
          monthlyExpenses,
          totalDebts: accountSummary.totalDebts,
          monthlyCashFlow: monthlyIncome - monthlyExpenses,
        });
      } catch (error) {
        console.error('Error fetching summary data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [user]);

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
        <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Checking:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {formatCurrency(data.checkingBalance)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Income:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(data.monthlyIncome)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Expenses:</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">
              {formatCurrency(data.monthlyExpenses)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Debts:</span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(data.totalDebts)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Cash Flow:</span>
            <span className={`font-bold ${isPositiveCashFlow ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositiveCashFlow ? '+' : ''}{formatCurrency(data.monthlyCashFlow)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

