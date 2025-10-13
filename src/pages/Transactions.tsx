import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import RecentTransactions from '@/components/RecentTransactions';
import SpendingPieChart from '@/components/SpendingPieChart';
import SpendingInsights from '@/components/SpendingInsights';
import { AccountViewTabs } from '@/components/AccountViewTabs';
import { PlaidLink } from '@/components/PlaidLink';
import { FinancialSummaryBar } from '@/components/FinancialSummaryBar';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { Reveal } from '@/components/Reveal';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  merchant_name?: string;
  plaid_account_id?: string;
  account_id?: string;
}

export default function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [hasPlaidToken, setHasPlaidToken] = useState(false);

  // Check Plaid connection
  useEffect(() => {
    const checkPlaidConnection = async () => {
      if (!user) return;
      
      try {
        // Check plaid_items table (multi-account compatible)
        const { data, error } = await supabase
          .from('plaid_items')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setHasPlaidToken(true);
        } else {
          setHasPlaidToken(false);
        }
      } catch (error) {
        console.error('Error checking Plaid connection:', error);
        setHasPlaidToken(false);
      }
    };

    checkPlaidConnection();
  }, [user]);

  // Fetch transactions for chart data
  useEffect(() => {
    if (isDemo) {
      setTransactions(sampleData.transactions as Transaction[]);
      return;
    }

    if (!user) return;

    const fetchTransactions = async () => {
      // Fetch ALL transactions for complete financial picture
      const { data } = await supabase
        .from('transactions')
        .select('id, amount, category, date, description, merchant_name, plaid_account_id, account_id')
        .eq('user_id', user.id)
        .eq('pending', false)
        .order('date', { ascending: false });

      if (data) {
        setTransactions(data);
      }
    };

    fetchTransactions();
  }, [user, isDemo, sampleData]);

  const checkPlaidConnection = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('plaid_items')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setHasPlaidToken(true);
      } else {
        setHasPlaidToken(false);
      }
    } catch (error) {
      console.error('Error checking Plaid connection:', error);
      setHasPlaidToken(false);
    }
  };

  return (
    <div className="min-h-screen bg-background content-visible">
      <main className="max-w-7xl mx-auto pt-perfect px-3 pb-3 sm:pt-perfect sm:px-4 sm:pb-4 space-y-4 sm:space-y-6 content-visible content-container">
        {/* Financial Summary Bar - Shows key metrics from dashboard */}
        {!isDemo && hasPlaidToken && (
          <FinancialSummaryBar />
        )}

        {/* Account View Tabs */}
        <AccountViewTabs
          onAccountChange={setSelectedAccount}
          hasPlaidToken={hasPlaidToken}
          onConnectionChange={checkPlaidConnection}
        >
          {(accountId) => {
            // Filter transactions by account if specified
            const accountTransactions = accountId 
              ? transactions.filter(t => t.plaid_account_id === accountId || t.account_id === accountId)
              : transactions;

            return (
              <>
                {/* Analytics Section */}
                <Reveal>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="card-hover-lift">
                      <SpendingPieChart transactions={accountTransactions} />
                    </div>
                    <div className="card-hover-lift">
                      <SpendingInsights accountFilter={accountId} />
                    </div>
                  </div>
                </Reveal>

                {/* Transactions List */}
                <Reveal delay={100}>
                  <RecentTransactions accountFilter={accountId} />
                </Reveal>
              </>
            );
          }}
        </AccountViewTabs>

      </main>
    </div>
  );
}