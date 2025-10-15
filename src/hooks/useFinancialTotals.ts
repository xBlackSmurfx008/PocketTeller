import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isIncomeCategory, isExpenseCategory } from '@/utils/categoryNormalizer';

interface UseFinancialTotalsParams {
  mode?: 'mtd' | 'days'; // month-to-date or last N days
  dateRangeDays?: number; // used when mode === 'days'; Defaults to 30
  accountFilter?: string | null; // plaid_account_id
}

export interface FinancialTotals {
  income: number;
  expenses: number;
  net: number;
  startDate: string;
  endDate: string;
}

export function useFinancialTotals({ mode = 'mtd', dateRangeDays = 30, accountFilter = null }: UseFinancialTotalsParams = {}) {
  const { user } = useAuth();

  const [totals, setTotals] = useState<FinancialTotals>({
    income: 0,
    expenses: 0,
    net: 0,
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: string;
    if (mode === 'mtd') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      start = startOfMonth.toISOString().split('T')[0];
    } else {
      const fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - (dateRangeDays || 0));
      start = (dateRangeDays && dateRangeDays > 0)
        ? fromDate.toISOString().split('T')[0]
        : '1900-01-01';
    }
    const end = now.toISOString().split('T')[0];
    return { startDate: start, endDate: end };
  }, [mode, dateRangeDays]);

  const fetchTotals = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('[useFinancialTotals] Fetching with params:', { 
        mode, 
        dateRangeDays, 
        startDate, 
        endDate, 
        accountFilter,
        userId: user.id 
      });

      let query = supabase
        .from('transactions')
        .select('amount, category, plaid_account_id, date, description')
        .eq('user_id', user.id)
        .eq('pending', false)
        .gte('date', startDate)
        .lte('date', endDate);

      if (accountFilter) {
        query = query.eq('plaid_account_id', accountFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[useFinancialTotals] Query error:', error);
        throw error;
      }

      console.log('[useFinancialTotals] Fetched transactions:', data?.length || 0);
      console.log('[useFinancialTotals] Sample transactions:', data?.slice(0, 3));

      let income = 0;
      let expenses = 0;
      let transferCount = 0;
      let incomeCount = 0;
      let expenseCount = 0;

      (data || []).forEach((t: any) => {
        const amountNum = Number(t.amount) || 0;
        
        if (t.category === 'Transfer') {
          transferCount++;
          return; // Skip transfers
        }
        
        // Use category-based classification instead of amount sign
        if (isIncomeCategory(t.category)) {
          income += Math.abs(amountNum);
          incomeCount++;
          console.log('[useFinancialTotals] Income transaction:', { category: t.category, amount: amountNum });
        } else if (isExpenseCategory(t.category)) {
          expenses += Math.abs(amountNum);
          expenseCount++;
        }
      });

      console.log('[useFinancialTotals] Calculated totals:', { 
        income, 
        expenses, 
        net: income - expenses,
        incomeCount,
        expenseCount,
        transferCount,
        totalTransactions: data?.length || 0
      });

      setTotals({
        income,
        expenses,
        net: income - expenses,
        startDate,
        endDate
      });
    } catch (err) {
      console.error('useFinancialTotals fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, startDate, endDate, accountFilter, mode, dateRangeDays]);

  useEffect(() => {
    fetchTotals();
  }, [fetchTotals]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('transactions-changes-totals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTotals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTotals]);

  return { totals, loading, refetch: fetchTotals };
}


