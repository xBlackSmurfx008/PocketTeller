import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const SUGGESTED_CATEGORIES = [
  'Housing', 'Transportation', 'Food & Dining', 'Utilities', 'Healthcare', 
  'Entertainment', 'Shopping', 'Personal Care', 'Education', 'Savings', 
  'Investments', 'Insurance', 'Debt Payments', 'Travel', 'Other'
];

interface CategoryBudget {
  id: string;
  name: string;
  planned: number;
  actual: number;
}

interface BudgetData {
  income: number;
  categories: CategoryBudget[];
}

export default function Budget() {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [budgetData, setBudgetData] = useState<BudgetData>({ income: 0, categories: [] });
  const [actualTransactions, setActualTransactions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [hasExistingBudget, setHasExistingBudget] = useState(false);

  const fetchBudgetData = useCallback(async () => {
    if (isDemo) {
      // Use demo data - create starter budget for demo
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
      // Calculate demo actuals from sample transactions
      const demoActuals: Record<string, number> = {};
      sampleData.transactions?.forEach((transaction: any) => {
        const category = transaction.category || 'Other';
        demoActuals[category] = (demoActuals[category] || 0) + Math.abs(Number(transaction.amount));
      });
      setActualTransactions(demoActuals);
      setHasExistingBudget(true);
      setLoading(false);
      return;
    }

    if (!user) return;

    try {
      // Fetch budget
      const { data: budget } = await supabase
        .from('budget')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

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
      } else {
        setShowSetup(true);
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
      transactions?.forEach(transaction => {
        const category = transaction.category;
        actuals[category] = (actuals[category] || 0) + Math.abs(Number(transaction.amount));
      });
      setActualTransactions(actuals);

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
  }, [user, isDemo, sampleData, selectedMonth, toast]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  const handleQuickStart = () => {
    const starterCategories: CategoryBudget[] = [
      { id: '1', name: 'Housing', planned: 1500, actual: 0 },
      { id: '2', name: 'Food & Dining', planned: 600, actual: 0 },
      { id: '3', name: 'Transportation', planned: 400, actual: 0 },
      { id: '4', name: 'Utilities', planned: 200, actual: 0 },
      { id: '5', name: 'Entertainment', planned: 300, actual: 0 },
      { id: '6', name: 'Savings', planned: 500, actual: 0 },
      { id: '7', name: 'Other', planned: 500, actual: 0 }
    ];
    
    setBudgetData({
      income: 5000,
      categories: starterCategories
    });
    setShowSetup(false);
  };

  const handleStartFromScratch = () => {
    setBudgetData({
      income: 0,
      categories: [{ id: '1', name: '', planned: 0, actual: 0 }]
    });
    setShowSetup(false);
  };

  const addCategory = () => {
    setBudgetData(prev => ({
      ...prev,
      categories: [...prev.categories, {
        id: Date.now().toString(),
        name: '',
        planned: 0,
        actual: 0
      }]
    }));
  };

  const removeCategory = (id: string) => {
    setBudgetData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== id)
    }));
  };

  const updateCategory = (id: string, field: 'name' | 'planned', value: string | number) => {
    setBudgetData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const saveBudget = async () => {
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Budget changes are saved locally in demo mode",
      });
      return;
    }

    if (!user) return;

    setSaving(true);
    try {
      const categoriesObj = budgetData.categories.reduce((acc, cat) => {
        if (cat.name.trim()) {
          acc[cat.name] = cat.planned;
        }
        return acc;
      }, {} as Record<string, number>);

      const totalExpenses = Object.values(categoriesObj).reduce((sum, val) => sum + val, 0);

      const budgetPayload = {
        user_id: user.id,
        income: budgetData.income,
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

    } catch (error) {
      console.error('Error saving budget:', error);
      toast({
        title: "Error",
        description: "Failed to save budget",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 50) return 'hsl(var(--primary))';
    if (percentage <= 80) return 'hsl(35 91% 65%)'; // Warning yellow
    return 'hsl(var(--destructive))';
  };

  const calculateSummary = () => {
    const plannedExpenses = budgetData.categories.reduce((sum, cat) => sum + cat.planned, 0);
    const actualExpenses = Object.values(actualTransactions).reduce((sum, val) => sum + val, 0);
    
    return {
      plannedIncome: budgetData.income,
      plannedExpenses,
      actualExpenses,
      plannedNet: budgetData.income - plannedExpenses,
      actualNet: budgetData.income - actualExpenses
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Create Your Budget</CardTitle>
            <CardDescription>Choose how you'd like to start</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleQuickStart} className="w-full">
              Quick Start Template
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Start with a pre-filled budget template
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Button onClick={handleStartFromScratch} variant="outline" className="w-full">
              Start from Scratch
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Build your budget from the ground up
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Budget</h1>
            <p className="text-muted-foreground">Manage your monthly budget</p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {/* Month Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="month">Budget Month:</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - 6 + i);
                    const value = format(date, 'yyyy-MM');
                    return (
                      <SelectItem key={value} value={value}>
                        {format(date, 'MMMM yyyy')}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-2xl font-bold text-foreground">${summary.plannedIncome.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-foreground">
                  ${summary.actualExpenses.toFixed(2)} / ${summary.plannedExpenses.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Net</p>
                <p className={`text-2xl font-bold ${summary.actualNet >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  ${summary.actualNet.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Income Input */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="income">Expected Income</Label>
              <Input
                id="income"
                type="number"
                value={budgetData.income}
                onChange={(e) => setBudgetData(prev => ({ ...prev, income: Number(e.target.value) }))}
                placeholder="Enter your monthly income"
              />
            </div>
          </CardContent>
        </Card>

        {/* Budget Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Categories</CardTitle>
            <CardDescription>Plan your spending by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetData.categories.map((category) => {
              const actual = actualTransactions[category.name] || 0;
              const percentage = category.planned > 0 ? (actual / category.planned) * 100 : 0;
              const remaining = category.planned - actual;

              return (
                <div key={category.id} className="space-y-3 p-4 border border-border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={category.name}
                        onValueChange={(value) => updateCategory(category.id, 'name', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUGGESTED_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Planned</Label>
                      <Input
                        type="number"
                        value={category.planned}
                        onChange={(e) => updateCategory(category.id, 'planned', Number(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Actual</Label>
                      <Input
                        type="number"
                        value={actual.toFixed(2)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    
                    <div className="flex items-end gap-2">
                      <Badge variant={remaining >= 0 ? "default" : "destructive"}>
                        {remaining >= 0 ? `$${remaining.toFixed(2)} left` : `$${Math.abs(remaining).toFixed(2)} over`}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCategory(category.id)}
                        disabled={budgetData.categories.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {category.planned > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className="h-2"
                        style={{
                          background: `linear-gradient(to right, ${getProgressColor(percentage)} 0%, ${getProgressColor(percentage)} ${Math.min(percentage, 100)}%, hsl(var(--secondary)) ${Math.min(percentage, 100)}%)`
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            <Button onClick={addCategory} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveBudget} disabled={saving} className="min-w-32">
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Budget
              </>
            )}
          </Button>
        </div>

        {isDemo && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                📝 You're in demo mode. Changes are saved locally and won't persist.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}