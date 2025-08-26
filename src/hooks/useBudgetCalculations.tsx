import { useMemo } from 'react';
import { BudgetData } from './useBudgetData';

interface BudgetSummary {
  plannedIncome: number;
  plannedExpenses: number;
  actualExpenses: number;
  plannedNet: number;
  actualNet: number;
}

export const useBudgetCalculations = (
  budgetData: BudgetData,
  actualTransactions: Record<string, number>
) => {
  const calculateSummary = useMemo((): BudgetSummary => {
    const plannedExpenses = budgetData.categories.reduce((sum, cat) => sum + cat.planned, 0);
    // Only sum expense categories, excluding Income
    const actualExpenses = Object.entries(actualTransactions)
      .filter(([category]) => category !== 'Income')
      .reduce((sum, [_, amount]) => sum + amount, 0);
    
    return {
      plannedIncome: budgetData.income,
      plannedExpenses,
      actualExpenses,
      plannedNet: budgetData.income - plannedExpenses,
      actualNet: budgetData.income - actualExpenses
    };
  }, [budgetData, actualTransactions]);

  const getProgressColor = (percentage: number) => {
    if (percentage <= 50) return 'hsl(var(--primary))';
    if (percentage <= 80) return 'hsl(35 91% 65%)'; // Warning yellow
    return 'hsl(var(--destructive))';
  };

  const getCategoryProgress = (categoryName: string, planned: number) => {
    const actual = actualTransactions[categoryName] || 0;
    const percentage = planned > 0 ? (actual / planned) * 100 : 0;
    const remaining = planned - actual;
    
    return {
      actual,
      percentage,
      remaining,
      progressColor: getProgressColor(percentage)
    };
  };

  return {
    summary: calculateSummary,
    getProgressColor,
    getCategoryProgress
  };
};