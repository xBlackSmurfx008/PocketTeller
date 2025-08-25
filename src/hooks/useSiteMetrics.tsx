
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteMetrics {
  totalUsers: number;
  totalBudgets: number;
  totalTransactions: number;
  lastUpdated?: string;
}

export const useSiteMetrics = () => {
  const [metrics, setMetrics] = useState<SiteMetrics>({
    totalUsers: 0,
    totalBudgets: 0,
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  // Stable fetchMetrics function using useCallback
  const fetchMetrics = useCallback(async () => {
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
        const newMetrics = {
          totalUsers: data.total_users ?? 0,
          totalBudgets: data.total_budgets ?? 0,
          totalTransactions: data.total_transactions ?? 0,
          lastUpdated: data.updated_at
        };
        
        // Only update if values actually changed
        setMetrics(prev => {
          if (prev.totalUsers !== newMetrics.totalUsers || 
              prev.totalBudgets !== newMetrics.totalBudgets || 
              prev.totalTransactions !== newMetrics.totalTransactions) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Site metrics updated:', newMetrics);
            }
            return newMetrics;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error in fetchMetrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch initial metrics
    fetchMetrics();

    // Set up 1-minute polling interval
    const intervalId = setInterval(() => {
      fetchMetrics();
    }, 60000); // 60 seconds = 60,000 milliseconds

    // Set up real-time subscription for instant updates
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
          const newMetrics = {
            totalUsers: newData.total_users ?? 0,
            totalBudgets: newData.total_budgets ?? 0,
            totalTransactions: newData.total_transactions ?? 0,
            lastUpdated: newData.updated_at
          };
          
          // Throttle updates and only apply if values changed
          setMetrics(prev => {
            if (prev.totalUsers !== newMetrics.totalUsers || 
                prev.totalBudgets !== newMetrics.totalBudgets || 
                prev.totalTransactions !== newMetrics.totalTransactions) {
              if (process.env.NODE_ENV === 'development') {
                console.log('Real-time site metrics updated:', newMetrics);
              }
              return newMetrics;
            }
            return prev;
          });
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [fetchMetrics]);

  return { metrics, loading };
};
