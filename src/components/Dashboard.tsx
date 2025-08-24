
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLayoutPreference } from '@/hooks/useLayoutPreference';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FinancialHealthSnapshot from '@/components/FinancialHealthSnapshot';
import GoalsOverview from '@/components/GoalsOverview';
import UpcomingBills from '@/components/UpcomingBills';
import { PlaidLink } from '@/components/PlaidLink';
import { ShareBudgetDialog } from '@/components/ShareBudgetDialog';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Target, MessageSquare, Share2, Receipt } from 'lucide-react';

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const { isDesktopForced } = useLayoutPreference();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [hasPlaidToken, setHasPlaidToken] = useState(false);
  const [budgetData, setBudgetData] = useState<any>(null);

  const showMobileLayout = isMobile && !isDesktopForced;

  useEffect(() => {
    checkPlaidConnection();
    fetchBudgetData();
  }, [user]);

  const checkPlaidConnection = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('encrypted_plaid_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.encrypted_plaid_token) {
        setHasPlaidToken(true);
      }
    } catch (error) {
      console.error('Error checking Plaid connection:', error);
    }
  };

  const fetchBudgetData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('budget')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!error && data) {
        setBudgetData(data);
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className={`font-bold text-foreground ${showMobileLayout ? 'text-xl' : 'text-2xl'}`}>Budget AI</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            {showMobileLayout ? (
              <>
                <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/goals')}>
                  <Target className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')}>
                  <Receipt className="h-4 w-4" />
                </Button>
                {budgetData && (
                  <ShareBudgetDialog budgetData={budgetData}>
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </ShareBudgetDialog>
                )}
                <Button variant="ghost" size="icon" onClick={() => navigate('/account')}>
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/chat')}>
                  Budgeting Assistant
                </Button>
                <Button variant="outline" onClick={() => navigate('/goals')}>
                  <Target className="h-4 w-4 mr-2" />
                  Goals
                </Button>
                <Button variant="outline" onClick={() => navigate('/transactions')}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Transactions
                </Button>
                {budgetData && (
                  <ShareBudgetDialog budgetData={budgetData}>
                    <Button variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Budget
                    </Button>
                  </ShareBudgetDialog>
                )}
                <Button variant="ghost" size="icon" onClick={() => navigate('/account')}>
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto space-y-4 sm:space-y-6 ${showMobileLayout ? 'p-3' : 'p-4'}`}>
        {/* Bank Connection Card - Only show when not connected */}
        {!hasPlaidToken && (
          <Card>
            <CardHeader>
              <CardTitle>Bank Connection</CardTitle>
              <CardDescription>
                Connect your bank account to automatically sync transactions and get personalized insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlaidLink 
                hasPlaidToken={hasPlaidToken} 
                onConnectionChange={checkPlaidConnection} 
              />
            </CardContent>
          </Card>
        )}

        <FinancialHealthSnapshot />
        
        <div className={`grid grid-cols-1 lg:grid-cols-2 ${showMobileLayout ? 'gap-4' : 'gap-6'}`}>
          <GoalsOverview />
          <UpcomingBills />
        </div>
      </main>
    </div>
  );
}
