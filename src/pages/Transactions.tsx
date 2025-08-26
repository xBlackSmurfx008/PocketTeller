import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import RecentTransactions from '@/components/RecentTransactions';
import SpendingPieChart from '@/components/SpendingPieChart';
import SpendingInsights from '@/components/SpendingInsights';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';

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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Transactions</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <SpendingPieChart transactions={transactions} />
          <SpendingInsights />
        </div>

        {/* Transactions List */}
        <RecentTransactions />
      </main>
    </div>
  );
}