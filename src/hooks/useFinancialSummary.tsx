import { useMemo } from 'react';
import { Transaction } from '@/hooks/useTransactions';
import { Goal } from '@/hooks/useGoals';
import { Bill } from '@/hooks/useBills';
import { BudgetData } from '@/hooks/useBudgetData';
import { isIncomeCategory, isExpenseCategory } from '@/utils/categoryNormalizer';

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  upcomingBills: number;
  goalProgress: number;
  cashFlow: {
    income: number;
    expenses: number;
    net: number;
  };
}

/**
 * Hook for calculating financial summary across all user data
 */
export const useFinancialSummary = (
  transactions: Transaction[],
  goals: Goal[],
  bills: Bill[],
  budgetData?: BudgetData
) => {
  const summary = useMemo((): FinancialSummary => {
    // Calculate income and expenses from transactions
    const totalIncome = transactions
      .filter(t => isIncomeCategory(t.category))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => isExpenseCategory(t.category))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate upcoming bills (unpaid bills)
    const upcomingBills = bills
      .filter(b => !b.is_paid)
      .reduce((sum, b) => sum + b.amount, 0);

    // Calculate goal progress (average completion percentage)
    const goalProgress = goals.length > 0
      ? goals.reduce((sum, g) => {
          const progress = Math.min((g.current_amount / g.target_amount) * 100, 100);
          return sum + progress;
        }, 0) / goals.length
      : 0;

    // Current month cash flow
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthlyTransactions = transactions.filter(t => 
      t.date.startsWith(currentMonth)
    );

    const monthlyIncome = monthlyTransactions
      .filter(t => isIncomeCategory(t.category))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => isExpenseCategory(t.category))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      upcomingBills,
      goalProgress,
      cashFlow: {
        income: monthlyIncome,
        expenses: monthlyExpenses,
        net: monthlyIncome - monthlyExpenses
      }
    };
  }, [transactions, goals, bills]);

  // Budget vs actual comparison (if budget data is available)
  const budgetComparison = useMemo(() => {
    if (!budgetData) return null;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTransactions = transactions.filter(t => 
      t.date.startsWith(currentMonth)
    );

    const actualExpenses = budgetData.categories.reduce((acc, category) => {
      const categoryExpenses = monthlyTransactions
        .filter(t => t.category === category.name && isExpenseCategory(t.category))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      acc[category.name] = categoryExpenses;
      return acc;
    }, {} as Record<string, number>);

    const totalPlanned = budgetData.categories.reduce((sum, cat) => sum + cat.planned, 0);
    const totalActual = Object.values(actualExpenses).reduce((sum, val) => sum + val, 0);

    return {
      plannedIncome: budgetData.income,
      plannedExpenses: totalPlanned,
      actualExpenses: totalActual,
      categories: actualExpenses,
      variance: totalPlanned - totalActual,
      variancePercentage: totalPlanned > 0 ? ((totalActual - totalPlanned) / totalPlanned) * 100 : 0
    };
  }, [budgetData, transactions]);

  return {
    summary,
    budgetComparison
  };
};