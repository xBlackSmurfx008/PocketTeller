import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Plus, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts';
import { Badge } from './ui/badge';
import { isDebtAccount } from '@/utils/accountCategories';
import { PlaidLink } from '@/components/PlaidLink';

interface AccountViewTabsProps {
  onAccountChange: (accountId: string | null) => void;
  children: (accountId: string | null) => React.ReactNode;
  onAddBankClick?: () => void;
  hasPlaidToken?: boolean;
  onConnectionChange?: () => void;
}

export function AccountViewTabs({ onAccountChange, children, onAddBankClick, hasPlaidToken, onConnectionChange }: AccountViewTabsProps) {
  const { connectedBanks, limitInfo, loading } = useConnectedAccounts();
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    // Notify parent of account change
    if (activeTab === 'all') {
      onAccountChange(null);
    } else {
      onAccountChange(activeTab);
    }
  }, [activeTab, onAccountChange]);

  const formatBalance = (balance: number | null) => {
    if (balance === null || balance === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-sm text-muted-foreground">Loading accounts...</div>
      </div>
    );
  }

  // If no banks connected, still show compact header with ALL + Add Bank
  if (connectedBanks.length === 0) {
    console.log('🔍 AccountViewTabs: No banks connected, showing compact header', {
      hasPlaidToken,
      onConnectionChange: !!onConnectionChange,
      limitInfo
    });
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setActiveTab('all')}
            variant={activeTab === 'all' ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            <span className="font-medium">ALL</span>
            <Badge variant={activeTab === 'all' ? 'secondary' : 'outline'} className="ml-1">
              {formatBalance(0)}
            </Badge>
          </Button>

          {/* Always show Add Bank button when no banks connected */}
          {hasPlaidToken !== undefined && onConnectionChange ? (
            <div className="shrink-0">
              <PlaidLink 
                hasPlaidToken={hasPlaidToken}
                onConnectionChange={onConnectionChange}
                compact={true}
              />
            </div>
          ) : (
            <Button
              onClick={onAddBankClick}
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              title="Add Bank"
            >
              <Plus className="h-4 w-4" />
              <span className="font-medium">Add Bank</span>
            </Button>
          )}
        </div>

        {/* Info message when no banks connected */}
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Connect a bank to see your financial snapshot
            </p>
          </CardContent>
        </Card>

        {/* Render children with null accountId */}
        {children(null)}
      </div>
    );
  }

  // Flatten all accounts from all banks
  const allAccounts = connectedBanks.flatMap(bank => 
    bank.accounts.map((account) => ({
      ...account,
      bankName: bank.institutionName,
      displayName: `${account.name.substring(0, 20)}${account.mask ? ' ••' + account.mask : ''}`,
    }))
  );

  // Calculate total balance across all accounts
  const totalBalance = connectedBanks.reduce((sum, bank) => sum + bank.totalBalance, 0);

  return (
    <div className="space-y-4">
      {/* Simplified Button Group: ALL + Individual Accounts + Plus Icon */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {/* ALL Button */}
        <Button
          onClick={() => setActiveTab('all')}
          variant={activeTab === 'all' ? 'default' : 'outline'}
          size="sm"
          className="gap-2 shrink-0"
        >
          <Building2 className="h-4 w-4" />
          <span className="font-medium">ALL</span>
          <Badge variant={activeTab === 'all' ? 'secondary' : 'outline'} className="ml-1">
            {formatBalance(totalBalance)}
          </Badge>
        </Button>

        {/* Individual Account Buttons */}
        {allAccounts.map((account, idx) => (
          <Button
            key={account.plaidAccountId || account.id}
            onClick={() => setActiveTab(account.plaidAccountId || account.id)}
            variant={activeTab === (account.plaidAccountId || account.id) ? 'default' : 'outline'}
            size="sm"
            className="gap-2 shrink-0"
          >
            <CreditCard className="h-4 w-4" />
            <span className="truncate max-w-[100px] hidden sm:inline">{account.displayName}</span>
            <span className="sm:hidden">Acct {idx + 1}</span>
            <Badge 
              variant={activeTab === (account.plaidAccountId || account.id) ? 'secondary' : 'outline'} 
              className="ml-1"
            >
              {formatBalance(account.balanceAvailable || account.balanceCurrent)}
            </Badge>
          </Button>
        ))}

        {/* Add Bank Button - Always show next to ALL button */}
        {hasPlaidToken !== undefined && onConnectionChange ? (
          <PlaidLink 
            hasPlaidToken={hasPlaidToken}
            onConnectionChange={onConnectionChange}
          />
        ) : (
          <Button
            onClick={onAddBankClick}
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            disabled={!limitInfo.canConnect}
            title={limitInfo.canConnect ? `Add Bank (${limitInfo.remainingSlots}/${limitInfo.maxConnections} available)` : 'Maximum 3 banks connected'}
          >
            <Plus className="h-4 w-4" />
            <span className="font-medium">Add Bank</span>
            {limitInfo.canConnect && (
              <Badge variant="secondary" className="ml-1">
                {limitInfo.remainingSlots}/{limitInfo.maxConnections}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Tab Content Area */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="hidden">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {allAccounts.map((account) => (
              <TabsTrigger key={account.plaidAccountId || account.id} value={account.plaidAccountId || account.id}>
                {account.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content - Shows filtered data based on selection */}
        <TabsContent value="all" className="mt-0">
          {children(null)}
        </TabsContent>

        {/* Individual Account Tabs */}
        {allAccounts.map((account) => {
          const isDebt = isDebtAccount(account.type, account.subtype);
          const balance = account.balanceAvailable || account.balanceCurrent || 0;
          
          return (
            <TabsContent key={account.plaidAccountId || account.id} value={account.plaidAccountId || account.id} className="mt-0">
              <div className="mb-4 p-4 bg-muted/30 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className={`h-5 w-5 ${isDebt ? 'text-red-500' : 'text-green-500'}`} />
                    <div>
                      <h3 className="font-semibold text-lg">{account.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {account.bankName} • {account.type}
                        {account.mask && ` • ••${account.mask}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isDebt ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {formatBalance(Math.abs(balance))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isDebt ? 'Debt' : account.subtype || 'Asset'}
                    </p>
                  </div>
                </div>
              </div>
              {children(account.plaidAccountId || account.id)}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

