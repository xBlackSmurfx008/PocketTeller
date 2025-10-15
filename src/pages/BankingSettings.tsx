import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Plus, 
  ChevronRight, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts';
import { PlaidLink } from '@/components/PlaidLink';
import { ConnectedAccountsList } from '@/components/ConnectedAccountsList';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';

export default function BankingSettings() {
  const { user } = useAuth();
  const { connectedBanks, limitInfo, loading, refetch } = useConnectedAccounts();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hasPlaidToken, setHasPlaidToken] = useState(false);

  useEffect(() => {
    checkPlaidConnection();
  }, [user]);

  const checkPlaidConnection = async () => {
    if (!user) {
      setHasPlaidToken(false);
      return;
    }
    
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

  const handleConnectionChange = () => {
    checkPlaidConnection();
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto pt-perfect px-4 pb-4 space-y-6 content-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Bank Connections
            </h1>
            <p className="text-muted-foreground">Manage your connected bank accounts</p>
          </div>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              You can connect up to {limitInfo.maxConnections} bank accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-primary">{limitInfo.connectedCount}</div>
                <div className="text-sm text-muted-foreground">Connected</div>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-muted-foreground">{limitInfo.remainingSlots}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-muted-foreground">{limitInfo.maxConnections}</div>
                <div className="text-sm text-muted-foreground">Maximum</div>
              </div>
            </div>

            {/* Add Bank Button */}
            {limitInfo.canConnect && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Add New Bank</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect a new bank account to sync transactions and balances
                    </p>
                  </div>
                  <PlaidLink 
                    hasPlaidToken={hasPlaidToken} 
                    onConnectionChange={handleConnectionChange}
                    compact={false}
                  />
                </div>
              </div>
            )}

            {!limitInfo.canConnect && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Maximum connections reached
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      You have reached the maximum of {limitInfo.maxConnections} bank connections. 
                      Disconnect a bank to add a new one.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connected Banks List */}
        <ConnectedAccountsList />

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>About Bank Connections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Secure & Encrypted</p>
                  <p className="text-sm text-muted-foreground">
                    All bank connections use bank-level security through Plaid. Your credentials are never stored.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Automatic Sync</p>
                  <p className="text-sm text-muted-foreground">
                    Transactions and balances are automatically synced daily to keep your data up to date.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Multiple Accounts</p>
                  <p className="text-sm text-muted-foreground">
                    Each bank connection can include multiple accounts (checking, savings, credit cards, etc.).
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                For testing purposes, you can use these credentials: 
                <strong> Username:</strong> user_good, <strong>Password:</strong> pass_good, <strong>Phone:</strong> 415-555-0011
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
