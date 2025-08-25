import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Unlink } from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';

interface PlaidLinkProps {
  hasPlaidToken: boolean;
  onConnectionChange: () => void;
}

export const PlaidLink = ({ hasPlaidToken, onConnectionChange }: PlaidLinkProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { toast } = useToast();

  const onSuccess = useCallback(async (public_token: string, metadata: any) => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('plaid-link-exchange', {
        body: { public_token }
      });

      if (error) throw error;

      toast({
        title: "Bank Connected",
        description: `Successfully connected ${metadata.institution.name}`,
      });
      onConnectionChange();
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
  }, [toast, onConnectionChange]);

  const onExit = useCallback((err: any, metadata: any) => {
    if (err) {
      console.error('Plaid Link error:', err);
      toast({
        title: "Connection Error",
        description: "Failed to connect bank account.",
        variant: "destructive",
      });
    }
    setIsConnecting(false);
  }, [toast]);

  const config = {
    token: linkToken,
    onSuccess,
    onExit,
  };

  const { open, ready } = usePlaidLink(config);

  const fetchLinkToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('plaid-link-token');
      
      if (error) throw error;
      
      setLinkToken(data.link_token);
      return data.link_token;
    } catch (error) {
      console.error('Error fetching link token:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize bank connection. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const connectBank = async () => {
    if (!linkToken) {
      const token = await fetchLinkToken();
      if (!token) return;
    }
    
    if (ready) {
      open();
    } else {
      toast({
        title: "Plaid Not Ready",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
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
      const { data, error } = await supabase.functions.invoke('plaid-disconnect');

      if (error) {
        console.error('Error disconnecting bank:', error);
        toast({
          title: "Disconnection Failed",
          description: "Failed to disconnect your bank account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        console.error('Plaid disconnect error:', data.error);
        toast({
          title: "Disconnection Failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

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