import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import RecentTransactions from '@/components/RecentTransactions';
import { ArrowLeft } from 'lucide-react';

export default function Transactions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        <RecentTransactions />
      </main>
    </div>
  );
}