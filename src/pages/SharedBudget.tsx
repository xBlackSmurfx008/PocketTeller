import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface BudgetData {
  income: number;
  expenses: number;
  time_period: string;
  categories: Record<string, number>;
  created_at: string;
  expires_at: string;
  view_count: number;
  remaining_views?: number;
}

export default function SharedBudget() {
  const { token } = useParams<{ token: string }>();
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedBudget = async () => {
      if (!token) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('share-get-budget-by-token-secure', {
          body: { 
            token,
            userAgent: navigator.userAgent 
          }
        });

        if (error) throw error;

        if (data.success) {
          setBudgetData({
            ...data.budgetData,
            created_at: new Date().toISOString(), // Will be from actual data in production
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            view_count: 1
          });
        } else {
          throw new Error(data.error || 'Failed to load budget');
        }
      } catch (err) {
        console.error('Error fetching shared budget:', err);
        setError("Budget not found or expired");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedBudget();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading budget plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!budgetData) {
    return null;
  }

  const netIncome = budgetData.income - budgetData.expenses;
  const isPositive = netIncome >= 0;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Shared Budget Plan</h1>
          <p className="text-muted-foreground">
            Someone shared their budget plan with you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Income
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${budgetData.income.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {budgetData.time_period}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${budgetData.expenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {budgetData.time_period}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Net Income
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(netIncome).toLocaleString()}
              </div>
              <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
                {isPositive ? "Surplus" : "Deficit"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {budgetData.categories && Object.keys(budgetData.categories).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Budget Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(budgetData.categories).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium capitalize">{category}</span>
                    <span className="text-sm font-mono">${amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Share Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(budgetData.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expires:</span>
              <span>{new Date(budgetData.expires_at).toLocaleDateString()}</span>
            </div>
            {budgetData.remaining_views !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining views:</span>
                <span className={budgetData.remaining_views <= 2 ? "text-orange-600" : ""}>
                  {budgetData.remaining_views}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Want to create your own budget? Visit Budget AI to get started.</p>
        </div>
      </div>
    </div>
  );
}