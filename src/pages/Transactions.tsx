import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import RecentTransactions from '@/components/RecentTransactions';
import SpendingPieChart from '@/components/SpendingPieChart';
import SpendingInsights from '@/components/SpendingInsights';
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
}

export default function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Fetch transactions for chart data
  useEffect(() => {
    if (isDemo) {
      setTransactions(sampleData.transactions as Transaction[]);
      return;
    }

    if (!user) return;

    const fetchTransactions = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('id, amount, category, date, description, merchant_name')
        .eq('user_id', user.id)
        .eq('pending', false)
        .order('date', { ascending: false })
        .limit(500);

      if (data) {
        setTransactions(data);
      }
    };

    fetchTransactions();
  }, [user, isDemo, sampleData]);

  return (
    <div className="min-h-screen bg-background content-visible">
      <main className="max-w-7xl mx-auto pt-perfect px-3 pb-3 sm:pt-perfect sm:px-4 sm:pb-4 space-y-4 sm:space-y-6 content-visible content-container">
        {/* Analytics Section */}
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="card-hover-lift">
              <SpendingPieChart transactions={transactions} />
            </div>
            <div className="card-hover-lift">
              <SpendingInsights />
            </div>
          </div>
        </Reveal>

        {/* Transactions List */}
        <Reveal delay={100}>
          <RecentTransactions />
        </Reveal>
      </main>
    </div>
  );
}