import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { autoCategorizeTransaction } from '@/utils/transactionCategorizer';
import { normalizeCategoryName } from '@/utils/categoryNormalizer';

import { CategoryBudget, BudgetData, TotalsData } from '@/types/models';

export type { CategoryBudget, BudgetData, TotalsData };

export const useBudgetData = (selectedMonth: string) => {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const { toast } = useToast();

  const [budgetData, setBudgetData] = useState<BudgetData>({ income: 0, categories: [] });
  const [actualTransactions, setActualTransactions] = useState<Record<string, number>>({});
  const [monthlyTotals, setMonthlyTotals] = useState<TotalsData>({ income: 0, expenses: 0, net: 0 });
  const [yearlyTotals, setYearlyTotals] = useState<TotalsData>({ income: 0, expenses: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [hasExistingBudget, setHasExistingBudget] = useState(false);

  // Use centralized category normalization
  const normalizeCategory = useCallback((category: string) => {
    return normalizeCategoryName(category);
  }, []);

  const fetchBudgetData = useCallback(async () => {
    setLoading(true);
    
    if (isDemo) {
      // Demo data logic
      setBudgetData({
        income: 5000,
        categories: [
          { id: '1', name: 'Housing', planned: 1500, actual: 0 },
          { id: '2', name: 'Food & Dining', planned: 600, actual: 0 },
          { id: '3', name: 'Transportation', planned: 400, actual: 0 },
          { id: '4', name: 'Utilities', planned: 200, actual: 0 },
          { id: '5', name: 'Entertainment', planned: 300, actual: 0 },
          { id: '6', name: 'Savings', planned: 500, actual: 0 }
        ]
      });

      // Calculate demo actuals
      const demoActuals: Record<string, number> = {};
      let monthlyIncome = 0, monthlyExpenses = 0;
      let yearlyIncome = 0, yearlyExpenses = 0;
      
      sampleData.transactions?.forEach((transaction: any) => {
        const rawCategory = transaction.category || autoCategorizeTransaction(transaction.description || '', transaction.amount);
        const category = normalizeCategory(rawCategory);
        const amount = Math.abs(Number(transaction.amount));
        const transactionDate = new Date(transaction.date);
        const transactionMonth = format(transactionDate, 'yyyy-MM');
        const transactionYear = transactionDate.getFullYear();
        const currentYear = new Date(selectedMonth).getFullYear();
        
        // Only include expense categories in actuals (exclude Income)
        if (category !== 'Income' && transactionMonth === selectedMonth) {
          demoActuals[category] = (demoActuals[category] || 0) + amount;
        }
        
        // Calculate monthly totals for selected month
        if (transactionMonth === selectedMonth) {
          if (category === 'Income') {
            monthlyIncome += amount;
          } else {
            monthlyExpenses += amount;
          }
        }
        
        // Calculate yearly totals for selected year
        if (transactionYear === currentYear) {
          if (category === 'Income') {
            yearlyIncome += amount;
          } else {
            yearlyExpenses += amount;
          }
        }
      });
      
      setActualTransactions(demoActuals);
      setMonthlyTotals({ income: monthlyIncome, expenses: monthlyExpenses, net: monthlyIncome - monthlyExpenses });
      setYearlyTotals({ income: yearlyIncome, expenses: yearlyExpenses, net: yearlyIncome - yearlyExpenses });
      setHasExistingBudget(true);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch budget
      const { data: budget } = await supabase
        .from('budget')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (budget) {
        setHasExistingBudget(true);
        setBudgetData({
          income: Number(budget.income),
          categories: Object.entries(budget.categories || {}).map(([name, planned]) => ({
            id: Math.random().toString(),
            name,
            planned: planned as number,
            actual: 0
          }))
        });
      }

      // Fetch actual spending for current month
      const monthStart = startOfMonth(new Date(selectedMonth));
      const monthEnd = endOfMonth(new Date(selectedMonth));

      const { data: transactions } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('pending', false)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      const actuals: Record<string, number> = {};
      let monthlyIncome = 0, monthlyExpenses = 0;
      
      transactions?.forEach(transaction => {
        const category = transaction.category;
        const amount = Math.abs(Number(transaction.amount));
        
        // Only include expense categories in actuals (exclude Income)
        if (category !== 'Income') {
          actuals[category] = (actuals[category] || 0) + amount;
        }
        
        if (category === 'Income') {
          monthlyIncome += amount;
        } else {
          monthlyExpenses += amount;
        }
      });
      
      setActualTransactions(actuals);
      setMonthlyTotals({ income: monthlyIncome, expenses: monthlyExpenses, net: monthlyIncome - monthlyExpenses });
      
      // Fetch yearly totals
      const currentYear = new Date(selectedMonth).getFullYear();
      const yearStart = startOfYear(new Date(currentYear, 0, 1));
      const yearEnd = endOfYear(new Date(currentYear, 11, 31));
      
      const { data: yearlyTransactions } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('pending', false)
        .gte('date', format(yearStart, 'yyyy-MM-dd'))
        .lte('date', format(yearEnd, 'yyyy-MM-dd'));
      
      let yearlyIncome = 0, yearlyExpenses = 0;
      yearlyTransactions?.forEach(transaction => {
        const amount = Math.abs(Number(transaction.amount));
        if (transaction.category === 'Income') {
          yearlyIncome += amount;
        } else {
          yearlyExpenses += amount;
        }
      });
      
      setYearlyTotals({ income: yearlyIncome, expenses: yearlyExpenses, net: yearlyIncome - yearlyExpenses });

    } catch (error) {
      console.error('Error fetching budget data:', error);
      toast({
        title: "Error",
        description: "Failed to load budget data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, sampleData, selectedMonth, toast, normalizeCategory]);

  const saveBudget = useCallback(async (budgetToSave: BudgetData) => {
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Budget changes are saved locally in demo mode",
      });
      return { success: true };
    }

    if (!user) return { success: false };

    try {
      const categoriesObj = budgetToSave.categories.reduce((acc, cat) => {
        if (cat.name.trim()) {
          acc[cat.name] = cat.planned;
        }
        return acc;
      }, {} as Record<string, number>);

      const totalExpenses = Object.values(categoriesObj).reduce((sum, val) => sum + val, 0);

      const budgetPayload = {
        user_id: user.id,
        income: budgetToSave.income,
        expenses: totalExpenses,
        categories: categoriesObj,
        status: 'active'
      };

      if (hasExistingBudget) {
        await supabase
          .from('budget')
          .update(budgetPayload)
          .eq('user_id', user.id)
          .eq('status', 'active');
      } else {
        await supabase
          .from('budget')
          .insert(budgetPayload);
        setHasExistingBudget(true);
      }

      toast({
        title: "Success",
        description: "Budget saved successfully",
      });

      return { success: true };
    } catch (error) {
      console.error('Error saving budget:', error);
      toast({
        title: "Error",
        description: "Failed to save budget",
        variant: "destructive",
      });
      return { success: false };
    }
  }, [user, isDemo, hasExistingBudget, toast]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  return {
    budgetData,
    setBudgetData,
    actualTransactions,
    monthlyTotals,
    yearlyTotals,
    loading,
    hasExistingBudget,
    saveBudget,
    refetch: fetchBudgetData
  };
};