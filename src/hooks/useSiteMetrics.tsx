
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
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetching site metrics...');
      }
      
      // Query the public site_metrics table - this should now work with public access
      const { data, error } = await supabase
        .from('site_metrics')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching site metrics:', error);
        // Set fallback values on error to prevent landing page from breaking
        setMetrics({
          totalUsers: 1000,
          totalBudgets: 500,
          totalTransactions: 10000
        });
        return;
      }

      if (data) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Site metrics data received:', data);
        }
        const newMetrics = {
          totalUsers: data.total_users ?? 0,
          totalBudgets: data.total_budgets ?? 0,
          totalTransactions: data.total_transactions ?? 0,
          lastUpdated: data.updated_at
        };
        
        // Always update metrics on initial load or when values actually change
        setMetrics(prev => {
          const hasChanged = prev.totalUsers !== newMetrics.totalUsers || 
                            prev.totalBudgets !== newMetrics.totalBudgets || 
                            prev.totalTransactions !== newMetrics.totalTransactions;
          
          if (hasChanged || loading) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Updating site metrics:', newMetrics);
            }
            return newMetrics;
          }
          return prev;
        });
      } else {
        console.log('No site metrics data found, using fallback values');
        setMetrics({
          totalUsers: 1000,
          totalBudgets: 500,
          totalTransactions: 10000
        });
      }
    } catch (err) {
      console.error('Error in fetchMetrics:', err);
      // Provide fallback values to ensure landing page works
      setMetrics({
        totalUsers: 1000,
        totalBudgets: 500,
        totalTransactions: 10000
      });
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    // Fetch initial metrics
    fetchMetrics();

    // Set up 5-minute polling interval for public pages (less frequent than authenticated pages)
    const intervalId = setInterval(() => {
      fetchMetrics();
    }, 300000); // 5 minutes = 300,000 milliseconds

    // Set up real-time subscription for instant updates
    const channel = supabase
      .channel('public-site-metrics-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_metrics',
          filter: 'id=eq.1'
        },
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Real-time public metrics update received:', payload);
          }
          const newData = payload.new as any;
          const newMetrics = {
            totalUsers: newData.total_users ?? 0,
            totalBudgets: newData.total_budgets ?? 0,
            totalTransactions: newData.total_transactions ?? 0,
            lastUpdated: newData.updated_at
          };
          
          // Update metrics from real-time changes
          setMetrics(prev => {
            const hasChanged = prev.totalUsers !== newMetrics.totalUsers || 
                              prev.totalBudgets !== newMetrics.totalBudgets || 
                              prev.totalTransactions !== newMetrics.totalTransactions;
            
            if (hasChanged) {
              if (process.env.NODE_ENV === 'development') {
                console.log('Real-time public site metrics updated:', newMetrics);
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
