import { useState } from 'react';
import { Building2, Trash2, Loader2, RefreshCw, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { isDebtAccount } from '@/utils/accountCategories';

export function ConnectedAccountsList() {
  const { connectedBanks, limitInfo, loading, refetch } = useConnectedAccounts();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const { toast } = useToast();

  const formatBalance = (balance: number | null) => {
    if (balance === null || balance === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(balance);
  };

  const handleDisconnect = async (itemId: string, institutionName: string) => {
    setDisconnecting(itemId);
    try {
      const { error } = await supabase.functions.invoke('plaid-disconnect-v2', {
        body: { item_id: itemId }
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Bank Disconnected',
        description: `Successfully disconnected ${institutionName}`,
      });

      // Refresh the list
      refetch();
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Disconnection Failed',
        description: error.message || 'Failed to disconnect bank account',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Banks</CardTitle>
          <CardDescription>Loading your connected accounts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Connected Banks
            </CardTitle>
            <CardDescription>
              You have {limitInfo.connectedCount} of {limitInfo.maxConnections} banks connected
              {limitInfo.remainingSlots > 0 && ` • ${limitInfo.remainingSlots} slot${limitInfo.remainingSlots > 1 ? 's' : ''} remaining`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectedBanks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No banks connected yet</p>
            <p className="text-sm">Connect a bank to get started with automatic transaction syncing</p>
          </div>
        ) : (
          connectedBanks.map((bank) => (
            <Card key={bank.itemId} className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{bank.institutionName}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Connected {formatDistanceToNow(new Date(bank.connectedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={disconnecting === bank.itemId}
                      >
                        {disconnecting === bank.itemId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect {bank.institutionName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all {bank.accounts.length} account(s) and stop syncing transactions from {bank.institutionName}.
                          Your existing transaction history will be preserved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDisconnect(bank.itemId, bank.institutionName)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Accounts List - Separated by Assets and Debts */}
                <div className="space-y-4">
                  {/* Asset Accounts */}
                  {bank.accounts.filter(acc => !isDebtAccount(acc.type, acc.subtype)).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">Asset Accounts</p>
                      <div className="space-y-2">
                        {bank.accounts.filter(acc => !isDebtAccount(acc.type, acc.subtype)).map((account) => (
                          <div
                            key={account.id}
                            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{account.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {account.type} {account.subtype && `• ${account.subtype}`}
                                {account.mask && ` • ••${account.mask}`}
                              </div>
                            </div>
                            <Badge variant="secondary" className="ml-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400">
                              {formatBalance(account.balanceAvailable || account.balanceCurrent)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Debt Accounts */}
                  {bank.accounts.filter(acc => isDebtAccount(acc.type, acc.subtype)).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">Debt Accounts</p>
                      <div className="space-y-2">
                        {bank.accounts.filter(acc => isDebtAccount(acc.type, acc.subtype)).map((account) => (
                          <div
                            key={account.id}
                            className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900"
                          >
                            <div className="flex-1 flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
                              <div>
                                <div className="font-medium">{account.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {account.type} {account.subtype && `• ${account.subtype}`}
                                  {account.mask && ` • ••${account.mask}`}
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary" className="ml-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400">
                              {formatBalance(Math.abs(account.balanceAvailable || account.balanceCurrent || 0))}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary: Total Assets and Debts */}
                <div className="mt-3 pt-3 border-t space-y-2">
                  {bank.accounts.filter(acc => !isDebtAccount(acc.type, acc.subtype)).length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Total Assets</span>
                      <span className="font-bold text-green-700 dark:text-green-400">
                        {formatBalance(bank.accounts
                          .filter(acc => !isDebtAccount(acc.type, acc.subtype))
                          .reduce((sum, acc) => sum + (acc.balanceAvailable || acc.balanceCurrent || 0), 0)
                        )}
                      </span>
                    </div>
                  )}
                  {bank.accounts.filter(acc => isDebtAccount(acc.type, acc.subtype)).length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">Total Debts</span>
                      <span className="font-bold text-red-700 dark:text-red-400">
                        {formatBalance(bank.accounts
                          .filter(acc => isDebtAccount(acc.type, acc.subtype))
                          .reduce((sum, acc) => sum + Math.abs(acc.balanceAvailable || acc.balanceCurrent || 0), 0)
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}

