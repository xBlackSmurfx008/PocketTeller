import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useDemo } from '@/hooks/useDemo';
import { useBudgetData } from '@/hooks/useBudgetData';
import { BudgetCategoryManager } from '@/components/budget/BudgetCategoryManager';
import { BudgetSummaryCards } from '@/components/budget/BudgetSummaryCards';
import { Reveal } from '@/components/Reveal';

export default function Budget() {
  const { isDemo } = useDemo();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [saving, setSaving] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const {
    budgetData,
    setBudgetData,
    actualTransactions,
    monthlyTotals,
    yearlyTotals,
    loading,
    hasExistingBudget,
    saveBudget
  } = useBudgetData(selectedMonth);

  // Check if we need to show setup screen
  useEffect(() => {
    if (!hasExistingBudget && !loading && !isDemo) {
      setShowSetup(true);
    }
  }, [hasExistingBudget, loading, isDemo]);

  const handleQuickStart = () => {
    setBudgetData({
      income: 5000,
      categories: [
        { id: '1', name: 'Housing', planned: 1500, actual: 0 },
        { id: '2', name: 'Food & Dining', planned: 600, actual: 0 },
        { id: '3', name: 'Transportation', planned: 400, actual: 0 },
        { id: '4', name: 'Utilities', planned: 200, actual: 0 },
        { id: '5', name: 'Entertainment', planned: 300, actual: 0 },
        { id: '6', name: 'Savings', planned: 500, actual: 0 },
        { id: '7', name: 'Other', planned: 500, actual: 0 }
      ]
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

  const handleSaveBudget = async () => {
    setSaving(true);
    await saveBudget(budgetData);
    setSaving(false);
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
      <div className="min-h-screen bg-background flex items-center justify-center pt-perfect px-4 pb-4 content-container">
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

  return (
    <div className="min-h-screen bg-background content-visible">
      <div className="container mx-auto pt-perfect px-6 pb-6 space-y-6 content-container">
        <Reveal>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground text-gradient">Budget</h1>
              <p className="text-muted-foreground">Manage your monthly budget</p>
            </div>
          </div>
        </Reveal>

        {/* Month Selector */}
        <Reveal delay={50}>
          <Card className="card-hover-lift">
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
        </Reveal>

        {/* Summary Cards */}
        <Reveal delay={100}>
          <div className="card-hover-lift">
            <BudgetSummaryCards 
              budgetData={budgetData} 
              actualTransactions={actualTransactions} 
            />
          </div>
        </Reveal>

        {/* Totals Visuals */}
        <Reveal delay={150}>
          <Card className="card-hover-lift">
            <CardHeader>
              <CardTitle>Totals Overview</CardTitle>
              <CardDescription>View your income and expenses breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="monthly" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
                
                <TabsContent value="monthly" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm font-medium">Income</span>
                      <span className="text-sm font-semibold text-primary">${monthlyTotals.income.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm font-medium">Expenses</span>
                      <span className="text-sm font-semibold">${monthlyTotals.expenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm font-medium">Net</span>
                      <span className={`text-sm font-semibold ${monthlyTotals.net >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        ${monthlyTotals.net.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(selectedMonth), 'MMMM yyyy')} totals
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="yearly" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm font-medium">Income</span>
                      <span className="text-sm font-semibold text-primary">${yearlyTotals.income.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm font-medium">Expenses</span>
                      <span className="text-sm font-semibold">${yearlyTotals.expenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm font-medium">Net</span>
                      <span className={`text-sm font-semibold ${yearlyTotals.net >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        ${yearlyTotals.net.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(selectedMonth).getFullYear()} totals
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </Reveal>

        {/* Income Input */}
        <Reveal delay={200}>
          <Card className="card-hover-lift">
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
        </Reveal>

        {/* Budget Categories */}
        <Reveal delay={250}>
          <Card className="card-hover-lift">
            <CardHeader>
              <CardTitle>Budget Categories</CardTitle>
              <CardDescription>Plan your spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetCategoryManager
                budgetData={budgetData}
                actualTransactions={actualTransactions}
                onUpdateBudget={setBudgetData}
              />
            </CardContent>
          </Card>
        </Reveal>

        {/* Save Button */}
        <Reveal delay={300}>
          <div className="flex justify-end">
            <Button onClick={handleSaveBudget} disabled={saving} className="min-w-32 btn-magnetic ripple-effect">
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
        </Reveal>

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