import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Unlink } from 'lucide-react';

interface PlaidLinkProps {
  hasPlaidToken: boolean;
  onConnectionChange: () => void;
}

export const PlaidLink = ({ hasPlaidToken, onConnectionChange }: PlaidLinkProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { toast } = useToast();

  const connectBank = async () => {
    setIsConnecting(true);
    try {
      // This would typically use Plaid Link SDK
      // For now, we'll show a message about implementation
      toast({
        title: "Plaid Link Integration",
        description: "Plaid Link SDK integration needed. Please add your public_token exchange logic here.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error connecting bank:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect your bank account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const syncData = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('plaid-sync');
      
      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: `Synced ${data.accounts} accounts and ${data.transactions} transactions.`,
      });
      onConnectionChange();
    } catch (error) {
      console.error('Error syncing data:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync your financial data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnectBank = async () => {
    setIsDisconnecting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plaid_access_token: null })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Bank Disconnected",
        description: "Your bank account has been disconnected successfully.",
      });
      onConnectionChange();
    } catch (error) {
      console.error('Error disconnecting bank:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect your bank account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!hasPlaidToken) {
    return (
      <Button 
        onClick={connectBank} 
        disabled={isConnecting}
        className="w-full"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect Bank Account'
        )}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button 
        onClick={syncData} 
        disabled={isSyncing}
        variant="outline"
        className="flex-1"
      >
        {isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          'Sync Data'
        )}
      </Button>
      <Button 
        onClick={disconnectBank} 
        disabled={isDisconnecting}
        variant="outline"
        size="icon"
      >
        {isDisconnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Unlink className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};