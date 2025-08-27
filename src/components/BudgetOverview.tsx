import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES } from '@/utils/transactionCategorizer';
import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface BudgetData {
  income: number;
  categories: Record<string, number>;
}

interface CategorySummary {
  category: string;
  planned: number;
  actual: number;
  remaining: number;
  percentage: number;
}

export default function BudgetOverview() {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [actualIncome, setActualIncome] = useState(0);
  const [actualExpenses, setActualExpenses] = useState(0);
  const [categoryActuals, setCategoryActuals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBudgetData = useCallback(async () => {
    if (isDemo) {
      // Demo mode - use sample data
      setBudgetData({
        income: 5000,
        categories: {
          'Food & Dining': 600,
          'Transportation': 300,
          'Shopping': 400,
          'Entertainment': 200,
          'Bills & Utilities': 800,
          'Healthcare': 150,
          'Savings': 800,
          'Investments': 500
        }
      });
      
      // Calculate actuals from sample transactions
      const currentMonth = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const monthlyTransactions = sampleData.transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= monthStart && txDate <= monthEnd && !tx.pending;
      });

      let income = 0;
      let expenses = 0;
      const categoryTotals: Record<string, number> = {};

      monthlyTransactions.forEach(tx => {
        if (tx.category === 'Income' && tx.amount > 0) {
          income += tx.amount;
        } else if (tx.category !== 'Income') {
          expenses += Math.abs(tx.amount);
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Math.abs(tx.amount);
        }
      });

      setActualIncome(income);
      setActualExpenses(expenses);
      setCategoryActuals(categoryTotals);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch budget data
      const { data: budget } = await supabase
        .from('budget')
        .select('income, categories')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (budget) {
        setBudgetData({
          income: budget.income || 0,
          categories: (budget.categories as Record<string, number>) || {}
        });
      }

      // Fetch current month's transactions
      const currentMonth = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, category')
        .eq('user_id', user.id)
        .eq('pending', false)
        .gte('date', monthStart.toISOString())
        .lte('date', monthEnd.toISOString());

      if (transactions) {
        let income = 0;
        let expenses = 0;
        const categoryTotals: Record<string, number> = {};

        transactions.forEach(tx => {
          if (tx.category === 'Income' && tx.amount > 0) {
            income += tx.amount;
          } else if (tx.category !== 'Income') {
            expenses += Math.abs(tx.amount);
            categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Math.abs(tx.amount);
          }
        });

        setActualIncome(income);
        setActualExpenses(expenses);
        setCategoryActuals(categoryTotals);
      }
    } catch (error) {
      console.error('Error fetching budget overview data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, sampleData]);

  async function handleCreateBudget() {
    navigate('/budget');
  }

  useEffect(() => {
    fetchBudgetData();

    if (!isDemo && user) {
      // Subscribe to real-time updates
      const budgetChannel = supabase
        .channel('budget-overview-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'budget',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchBudgetData()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchBudgetData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(budgetChannel);
      };
    }
  }, [fetchBudgetData, user, isDemo]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading budget data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!budgetData || (!budgetData.income && Object.keys(budgetData.categories).length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Track your planned vs actual spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No budget set up yet</p>
            <Button 
              onClick={handleCreateBudget}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Budget'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const plannedExpenses = Object.values(budgetData.categories).reduce((sum, amount) => sum + amount, 0);
  const actualNet = actualIncome - actualExpenses;
  const plannedNet = budgetData.income - plannedExpenses;

  // Get top overspent categories
  const categorySummaries: CategorySummary[] = Object.entries(budgetData.categories)
    .map(([category, planned]) => {
      const actual = categoryActuals[category] || 0;
      const remaining = planned - actual;
      const percentage = planned > 0 ? (actual / planned) * 100 : 0;
      
      return {
        category,
        planned,
        actual,
        remaining,
        percentage
      };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  const getProgressColor = (percentage: number) => {
    if (percentage <= 80) return "bg-green-500";
    if (percentage <= 100) return "bg-amber-500";
    return "bg-red-500";
  };

  const getRemainingBadgeVariant = (remaining: number) => {
    if (remaining < 0) return "destructive";
    if (remaining < 100) return "secondary";
    return "default";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Current month planned vs actual</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/budget')}>
          View Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              ${actualIncome.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Income (${budgetData.income.toLocaleString()} planned)
            </div>
            {actualIncome !== budgetData.income && (
              <Badge variant={actualIncome > budgetData.income ? "default" : "secondary"} className="mt-1">
                {actualIncome > budgetData.income ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                ${Math.abs(actualIncome - budgetData.income).toLocaleString()}
              </Badge>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              ${actualExpenses.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Expenses (${plannedExpenses.toLocaleString()} planned)
            </div>
            {actualExpenses !== plannedExpenses && (
              <Badge variant={actualExpenses > plannedExpenses ? "destructive" : "default"} className="mt-1">
                {actualExpenses > plannedExpenses ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                ${Math.abs(actualExpenses - plannedExpenses).toLocaleString()}
              </Badge>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              ${actualNet.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Net (${plannedNet.toLocaleString()} planned)
            </div>
            {actualNet !== plannedNet && (
              <Badge variant={actualNet > plannedNet ? "default" : "secondary"} className="mt-1">
                {actualNet > plannedNet ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                ${Math.abs(actualNet - plannedNet).toLocaleString()}
              </Badge>
            )}
          </div>
        </div>

        {/* Category Progress */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Category Spending</h4>
          {!categorySummaries || categorySummaries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No category budgets set</p>
          ) : (
            (categorySummaries || []).map((summary) => (
              <div key={summary?.category || 'unknown'} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{summary?.category || 'Unknown'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      ${(summary?.actual || 0).toLocaleString()} / ${(summary?.planned || 0).toLocaleString()}
                    </span>
                    <Badge variant={getRemainingBadgeVariant(summary?.remaining || 0)} className="text-xs">
                      {(summary?.remaining || 0) >= 0 ? '+' : ''}${(summary?.remaining || 0).toLocaleString()}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={Math.min(summary?.percentage || 0, 100)} 
                  className="h-2"
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}