import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteMetrics {
  totalUsers: number;
  totalBudgets: number;
  totalTransactions: number;
  lastUpdated?: string;
}

export const useSiteMetrics = () => {
  const [metrics, setMetrics] = useState<SiteMetrics>({
    totalUsers: 1247,
    totalBudgets: 3891,
    totalTransactions: 28456
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial metrics
    const fetchMetrics = async () => {
      try {
        const { data, error } = await supabase
          .from('site_metrics')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching site metrics:', error);
          return;
        }

        if (data) {
          setMetrics({
            totalUsers: data.total_users || 1247,
            totalBudgets: data.total_budgets || 3891,
            totalTransactions: data.total_transactions || 28456,
            lastUpdated: data.updated_at
          });
        }
      } catch (err) {
        console.error('Error in fetchMetrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Set up real-time subscription
    const channel = supabase
      .channel('site-metrics-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_metrics',
          filter: 'id=eq.1'
        },
        (payload) => {
          console.log('Real-time metrics update:', payload);
          const newData = payload.new as any;
          setMetrics({
            totalUsers: newData.total_users || 1247,
            totalBudgets: newData.total_budgets || 3891,
            totalTransactions: newData.total_transactions || 28456,
            lastUpdated: newData.updated_at
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { metrics, loading };
};