import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, AlertTriangle, Lightbulb, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDemo } from '@/hooks/useDemo';
import { useNavigate } from 'react-router-dom';

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
    transactionId?: string;
  }>;
  notes?: string;
}

// Helper function to safely normalize insights data
const normalizeInsights = (rawInsights: any): SpendingInsight => {
  return {
    summary: rawInsights?.summary || 'No summary available',
    topCategories: Array.isArray(rawInsights?.topCategories) 
      ? rawInsights.topCategories.filter(cat => cat && typeof cat.name === 'string')
      : [],
    savingsOpportunities: Array.isArray(rawInsights?.savingsOpportunities)
      ? rawInsights.savingsOpportunities.filter(opp => opp && typeof opp.title === 'string')
      : [],
    anomalies: Array.isArray(rawInsights?.anomalies)
      ? rawInsights.anomalies.filter(anomaly => anomaly && typeof anomaly.description === 'string')
      : [],
    notes: rawInsights?.notes || undefined
  };
};

export default function SpendingInsights() {
  const [insights, setInsights] = useState<SpendingInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isDemo } = useDemo();
  const navigate = useNavigate();

  const THROTTLE_KEY = 'aiInsightsLastRun';
  const THROTTLE_HOURS = 1;

  const canRunInsights = () => {
    if (isDemo) return false;
    
    const lastRun = localStorage.getItem(THROTTLE_KEY);
    if (!lastRun) return true;
    
    const lastRunTime = new Date(lastRun);
    const now = new Date();
    const hoursSinceLastRun = (now.getTime() - lastRunTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastRun >= THROTTLE_HOURS;
  };

  const fetchInsights = async () => {
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "AI insights are not available in demo mode.",
        variant: "default"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-spending-insights', {
        body: { days: 60, topN: 6 }
      });

      if (error) {
        console.error('Insights error:', error);
        toast({
          title: "Insights Error",
          description: error.details || "Failed to generate spending insights. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const normalizedInsights = normalizeInsights(data);
      setInsights(normalizedInsights);
      localStorage.setItem(THROTTLE_KEY, new Date().toISOString());
      
      toast({
        title: "Insights Updated",
        description: "Your spending analysis has been refreshed.",
        variant: "default"
      });
    } catch (error) {
      console.error('Insights fetch error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to insights service. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load on mount if throttle allows
  useEffect(() => {
    if (canRunInsights()) {
      fetchInsights();
    }
  }, []);

  const handleRefresh = () => {
    if (!canRunInsights()) {
      const lastRun = localStorage.getItem(THROTTLE_KEY);
      const nextRun = new Date(new Date(lastRun!).getTime() + THROTTLE_HOURS * 60 * 60 * 1000);
      
      toast({
        title: "Please Wait",
        description: `Insights can be refreshed after ${nextRun.toLocaleTimeString()}.`,
        variant: "default"
      });
      return;
    }
    
    fetchInsights();
  };

  if (isDemo) {
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
            <p className="text-muted-foreground">
              AI insights are available with a real account. 
              <br />Sign up to get personalized spending analysis!
            </p>
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
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
            aria-label="Refresh spending insights"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : insights ? (
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <p className="text-sm leading-relaxed">{insights.summary}</p>
            </div>

            {/* Top Categories */}
            {insights.topCategories && insights.topCategories.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Top Spending Categories
                </h4>
                <div className="space-y-2">
                  {insights.topCategories.map((category, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{category?.name || 'Unknown'}</span>
                      <span className="font-medium">
                        ${(category?.total || 0).toFixed(2)} ({category?.percent || 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Savings Opportunities */}
            {insights.savingsOpportunities && insights.savingsOpportunities.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Savings Opportunities
                </h4>
                <div className="space-y-3">
                  {insights.savingsOpportunities.map((opportunity, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium text-sm mb-1">{opportunity?.title || 'Savings Opportunity'}</div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {opportunity?.description || 'No description available'}
                      </p>
                      {(opportunity?.estimatedMonthlySavings || 0) > 0 && (
                        <div className="text-xs font-medium text-green-600">
                          Potential monthly savings: ${(opportunity?.estimatedMonthlySavings || 0).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Notes */}
            {insights.notes && (
              <div className="text-xs text-muted-foreground italic">
                {insights.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No insights available yet.
            </p>
            <Button onClick={fetchInsights} disabled={isLoading}>
              Generate Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}