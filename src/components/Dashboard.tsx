
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FinancialHealthSnapshot from '@/components/FinancialHealthSnapshot';
import RecentTransactions from '@/components/RecentTransactions';
import UpcomingBills from '@/components/UpcomingBills';
import { PlaidLink } from '@/components/PlaidLink';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Target } from 'lucide-react';

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [hasPlaidToken, setHasPlaidToken] = useState(false);

  useEffect(() => {
    checkPlaidConnection();
  }, [user]);

  const checkPlaidConnection = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plaid_access_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.plaid_access_token) {
        setHasPlaidToken(true);
      }
    } catch (error) {
      console.error('Error checking Plaid connection:', error);
    }
  };

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
              Budgeting Assistant
            </Button>
            <Button variant="outline" onClick={() => navigate('/goals')}>
              <Target className="h-4 w-4 mr-2" />
              Goals
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/account')}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Bank Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Connection</CardTitle>
            <CardDescription>
              {hasPlaidToken 
                ? "Your bank account is connected. You can sync your latest transactions or disconnect if needed."
                : "Connect your bank account to automatically sync transactions and get personalized insights."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlaidLink 
              hasPlaidToken={hasPlaidToken} 
              onConnectionChange={checkPlaidConnection} 
            />
          </CardContent>
        </Card>

        <FinancialHealthSnapshot />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTransactions />
          <UpcomingBills />
        </div>
      </main>
    </div>
  );
}
