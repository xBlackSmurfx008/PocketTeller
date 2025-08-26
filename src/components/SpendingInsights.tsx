import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDemo } from '@/hooks/useDemo';

interface SpendingInsight {
  summary: string;
  topCategories: Array<{
    name: string;
    total: number;
    percent: number;
  }>;
  savingsOpportunities: Array<{
    title: string;
    description: string;
    estimatedMonthlySavings: number;
  }>;
  anomalies: Array<{
    description: string;
    date?: string;
    amount?: number;
  }>;
  notes?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function SpendingInsights() {
  const [insights, setInsights] = useState<SpendingInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isDemo } = useDemo();

  const canRefresh = () => {
    const lastRun = localStorage.getItem('aiInsightsLastRun');
    if (!lastRun) return true;
    
    const timeSinceLastRun = Date.now() - parseInt(lastRun);
    const twelveHours = 12 * 60 * 60 * 1000;
    return timeSinceLastRun > twelveHours;
  };

  const fetchInsights = async (force = false) => {
    if (!force && !canRefresh()) {
      toast({
        title: "Please wait",
        description: "Insights can only be refreshed every 12 hours to manage costs.",
      });
      return;
    }

    if (isDemo) {
      // Demo data
      setInsights({
        summary: "Based on your demo transactions, you're spending most on dining and shopping with good budget control.",
        topCategories: [
          { name: "Food & Dining", total: 450, percent: 35 },
          { name: "Shopping", total: 320, percent: 25 },
          { name: "Transportation", total: 250, percent: 20 }
        ],
        savingsOpportunities: [
          {
            title: "Reduce Dining Out",
            description: "Consider cooking at home 2-3 more times per week",
            estimatedMonthlySavings: 120
          }
        ],
        anomalies: [],
        notes: "This is demo data. Connect your real accounts for personalized insights."
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: insightsError } = await supabase.functions.invoke('ai-spending-insights', {
        body: { days: 60, topN: 6 }
      });

      if (insightsError) {
        throw new Error(insightsError.message || 'Failed to generate insights');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setInsights(data);
      localStorage.setItem('aiInsightsLastRun', Date.now().toString());
      
      toast({
        title: "Insights updated",
        description: "Your spending insights have been refreshed.",
      });
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate insights';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: "Failed to generate spending insights. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount if not recently run
  useEffect(() => {
    if (canRefresh() || isDemo) {
      fetchInsights();
    }
  }, [isDemo]);

  const getNextRefreshTime = () => {
    const lastRun = localStorage.getItem('aiInsightsLastRun');
    if (!lastRun) return null;
    
    const nextRefresh = new Date(parseInt(lastRun) + 12 * 60 * 60 * 1000);
    return nextRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isDemo && !insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Spending Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Loading demo insights...</p>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Spending Insights
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchInsights(true)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        {!canRefresh() && !isDemo && (
          <p className="text-xs text-muted-foreground">
            Next refresh available at {getNextRefreshTime()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchInsights(true)}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : insights ? (
          <>
            {/* Summary */}
            <div>
              <h4 className="font-medium mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">{insights.summary}</p>
            </div>

            {/* Top Categories */}
            {insights.topCategories.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Top Spending Categories</h4>
                <div className="space-y-2">
                  {insights.topCategories.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{category.percent}%</Badge>
                        <span className="font-medium">{formatCurrency(category.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Savings Opportunities */}
            {insights.savingsOpportunities.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Savings Opportunities
                </h4>
                <div className="space-y-3">
                  {insights.savingsOpportunities.map((opportunity, index) => (
                    <div key={index} className="border border-border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="font-medium text-sm">{opportunity.title}</h5>
                        <Badge variant="outline" className="text-xs">
                          Save {formatCurrency(opportunity.estimatedMonthlySavings)}/mo
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{opportunity.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anomalies */}
            {insights.anomalies.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Notable Patterns
                </h4>
                <div className="space-y-2">
                  {insights.anomalies.map((anomaly, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-foreground">{anomaly.description}</p>
                        {(anomaly.date || anomaly.amount) && (
                          <p className="text-xs text-muted-foreground">
                            {anomaly.date && `Date: ${anomaly.date}`}
                            {anomaly.amount && ` Amount: ${formatCurrency(anomaly.amount)}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {insights.notes && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{insights.notes}</p>
              </div>
            )}

            {/* Demo notice */}
            {isDemo && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  📊 This is demo data. Connect your accounts for real insights.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No insights available yet.
            </p>
            <Button onClick={() => fetchInsights(true)} size="sm">
              Generate Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}