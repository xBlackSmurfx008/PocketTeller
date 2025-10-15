import RecentTransactions from '@/components/RecentTransactions';
import SpendingPieChart from '@/components/SpendingPieChart';
import SpendingInsights from '@/components/SpendingInsights';
import { AccountViewTabs } from '@/components/AccountViewTabs';
import { FinancialSummaryBar } from '@/components/FinancialSummaryBar';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { Reveal } from '@/components/Reveal';
import { Transaction } from '@/types/models';

export default function Transactions() {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [hasPlaidToken, setHasPlaidToken] = useState(false);
  const [dateFilter, setDateFilter] = useState<number>(30); // Days to show, default 30

  // Check Plaid connection function
  const checkPlaidConnection = useCallback(async () => {
    if (!user) return;
    
    try {
      // Standardize connection check to actual linked accounts
      const { data, error } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasPlaidToken(true);
      } else {
        setHasPlaidToken(false);
      }
    } catch (error) {
      console.error('Error checking account connection:', error);
      setHasPlaidToken(false);
    }
  }, [user]);

  // Check Plaid connection on mount
  useEffect(() => {
    checkPlaidConnection();
  }, [checkPlaidConnection]);

  // (Removed) AI Financial Overview

  // Centralized fetch to allow reuse by realtime subscription
  const fetchTransactions = useCallback(async () => {
    if (isDemo) {
      setTransactions(sampleData.transactions as Transaction[]);
      return;
    }

    if (!user) return;

    // Compute start date based on selected dateFilter (0 = all time)
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('pending', false);

    if (dateFilter && dateFilter > 0) {
      const now = new Date();
      const monthsToShow = Math.ceil(dateFilter / 30);
      const startDate = new Date(now.getFullYear(), now.getMonth() - monthsToShow, 1);
      const startIso = startDate.toISOString().slice(0, 10);
      query = query.gte('date', startIso);
    }

    if (selectedAccount) {
      // Match by either plaid_account_id or internal account_id
      query = query.or(`plaid_account_id.eq.${selectedAccount},account_id.eq.${selectedAccount}`);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
  }, [user, isDemo, sampleData, selectedAccount, dateFilter]);

  // Fetch transactions for chart data and subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    fetchTransactions();

    const channel = supabase
      .channel('transactions-changes-page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refresh data when transactions change (INSERT/UPDATE/DELETE)
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTransactions]);

  // Filter transactions by date period
  const filterTransactionsByDate = useCallback((txns: Transaction[]) => {
    if (dateFilter === 0) return txns; // 'All' option
    
    const now = new Date();
    const monthsToShow = Math.ceil(dateFilter / 30); // Convert days to months
    
    // Go back to the first day of X months ago
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsToShow, 1);
    
    return txns.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= startDate;
    });
  }, [dateFilter]);

  return (
    <div className="min-h-screen bg-background content-visible">
      <main className="max-w-7xl mx-auto pt-perfect px-3 pb-3 sm:pt-perfect sm:px-4 sm:pb-4 space-y-4 sm:space-y-6 content-visible content-container">
        {/* Financial Summary Bar - Shows key metrics from dashboard */}
        {!isDemo && hasPlaidToken && (
          <FinancialSummaryBar dateRangeDays={dateFilter} accountFilter={selectedAccount} />
        )}

        {/* Account View Tabs */}
        <AccountViewTabs
          onAccountChange={setSelectedAccount}
          hasPlaidToken={hasPlaidToken}
          onConnectionChange={checkPlaidConnection}
        >
          {(accountId) => {
            // Filter transactions by account if specified
            let accountTransactions = accountId 
              ? transactions.filter(t => t.plaid_account_id === accountId || t.account_id === accountId)
              : transactions;
            
            // Apply date filter to transactions
            accountTransactions = filterTransactionsByDate(accountTransactions);

            return (
              <>
                {/* Analytics Section */}
                <Reveal>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="card-hover-lift">
                      <SpendingPieChart transactions={accountTransactions} dateFilter={dateFilter} />
                    </div>
                    <div className="card-hover-lift">
                      <SpendingInsights accountFilter={accountId} dateFilter={dateFilter} transactions={accountTransactions} />
                    </div>
                    {/* AI Financial Overview removed */}
                  </div>
                </Reveal>

                {/* Transactions List */}
                <Reveal delay={100}>
                  <RecentTransactions 
                    accountFilter={accountId} 
                    dateFilter={dateFilter}
                    onDateFilterChange={setDateFilter}
                  />
                </Reveal>
              </>
            );
          }}
        </AccountViewTabs>

      </main>
    </div>
  );
}