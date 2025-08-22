import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import FinancialHealthSnapshot from '@/components/FinancialHealthSnapshot';
import RecentTransactions from '@/components/RecentTransactions';
import UpcomingBills from '@/components/UpcomingBills';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Budget AI</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/chat')}>
              AI Assistant
            </Button>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        <FinancialHealthSnapshot />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTransactions />
          <UpcomingBills />
        </div>
      </main>
    </div>
  );
}