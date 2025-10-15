import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, Plus, RefreshCw } from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';
import { logInfo, logError, logDebug } from '@/utils/logger';
import type { 
  PlaidLinkOnSuccessMetadata, 
  PlaidLinkOnExitMetadata, 
  PlaidLinkError 
} from '@/types/plaid';

interface PlaidLinkProps {
  hasPlaidToken: boolean;
  onConnectionChange: () => void;
  compact?: boolean;
}

export const PlaidLink = ({ hasPlaidToken, onConnectionChange, compact = false }: PlaidLinkProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { toast } = useToast();

  const onSuccess = useCallback(async (public_token: string, metadata: PlaidLinkOnSuccessMetadata): Promise<void> => {
    setIsConnecting(true);
    
    logInfo('Plaid onSuccess called', {
      institution: metadata.institution.name,
      accountCount: metadata.accounts.length,
      hasToken: !!public_token
    });
    
    // Show saving toast immediately
    toast({
      title: "Saving connection...",
      description: "Encrypting and storing your bank connection securely.",
    });

    try {
      logDebug('Calling plaid-link-exchange-v2');
      
      const { data, error } = await supabase.functions.invoke('plaid-link-exchange-v2', {
        body: { 
          public_token,
          institution_name: metadata.institution.name,
          institution_id: metadata.institution.institution_id
        }
      });

      logDebug('Exchange response received', { hasData: !!data, hasError: !!error });

      if (error) {
        throw new Error(error.message || 'Failed to exchange token');
      }

      if (data?.error) {
        throw new Error(data.error || 'Failed to exchange token');
      }
      
      logInfo('Bank connected successfully', { 
        institution: metadata.institution.name 
      });
      
      toast({
        title: "Bank Connected",
        description: `Successfully connected ${metadata.institution.name}`,
      });
      
      // Trigger refresh
      onConnectionChange();
    } catch (error) {
      logError(error, 'PlaidLink.onSuccess');
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to connect your bank account";
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast, onConnectionChange]);

  const onExit = useCallback((err: PlaidLinkError | null, metadata: PlaidLinkOnExitMetadata): void => {
    if (err) {
      logError(err, 'PlaidLink.onExit', err.error_message);
      toast({
        title: "Connection Error",
        description: err.display_message || "Failed to connect bank account.",
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

  const fetchLinkToken = async (): Promise<string | null> => {
    setIsConnecting(true);
    
    try {
      logDebug('Fetching Plaid link token (v2)');
      const { data, error } = await supabase.functions.invoke('plaid-link-token-v2');
      
      if (error) {
        const errorMessage = error.message || "Failed to initialize bank connection";
        logError(error, 'PlaidLink.fetchLinkToken');
        toast({
          title: "Connection Error",
          description: errorMessage.includes("Missing required Plaid configuration") 
            ? "Plaid is not properly configured. Please contact support."
            : errorMessage,
          variant: "destructive",
        });
        setIsConnecting(false);
        return null;
      }
      
      if (!data?.link_token) {
        logError('Invalid Plaid link token response', { data });
        toast({
          title: "Connection Error", 
          description: "Invalid response from Plaid service",
          variant: "destructive",
        });
        setIsConnecting(false);
        return null;
      }
      
      logInfo('Plaid link token fetched successfully');
      setLinkToken(data.link_token);
      return data.link_token;
    } catch (error) {
      logError(error, 'PlaidLink.fetchLinkToken');
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Connection Error",
        description: errorMessage.includes("Missing required Plaid configuration")
          ? "Plaid is not properly configured. Please contact support."
          : "Failed to initialize bank connection. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
      return null;
    }
  };

  const connectBank = async () => {
    // Prevent double invocation
    if (isConnecting) return;
    
    logDebug('Connect Bank button clicked');
    
    if (!linkToken) {
      const token = await fetchLinkToken();
      if (!token) {
        logError('Failed to get link token', 'PlaidLink.connectBank');
        return;
      }
      logDebug('Link token obtained, waiting for Plaid to be ready');
    }
    
    if (ready) {
      logDebug('Plaid ready, opening modal');
      open();
    } else {
      logDebug('Plaid not ready yet, will auto-open when ready');
      toast({
        title: "Initializing Connection",
        description: "Preparing your bank connection...",
      });
      // Don't reset isConnecting here - let useEffect handle the auto-open
    }
  };

  // Auto-open Plaid when link token is ready
  useEffect(() => {
    if (linkToken && ready && isConnecting) {
      open();
    }
  }, [linkToken, ready, isConnecting, open]);

  const syncData = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('plaid-sync-v2');
      
      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: `Synced ${data.accounts} accounts and ${data.transactions} transactions.`,
      });
      onConnectionChange();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync your financial data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Note: Individual bank disconnection is handled in ConnectedAccountsList component
  // This component is for connecting new banks and syncing all connected banks

  if (!hasPlaidToken) {
    if (compact) {
      return (
        <Button 
          onClick={connectBank} 
          disabled={isConnecting}
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span className="font-medium">Add Bank</span>
            </>
          )}
        </Button>
      );
    }
    
    return (
      <Button 
        onClick={connectBank} 
        disabled={isConnecting}
        className="w-full h-11 text-base font-medium"
        size="lg"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Connecting...
          </>
        ) : (
          <>
            <Building2 className="h-5 w-5 mr-2" />
            Connect Bank
          </>
        )}
      </Button>
    );
  }

  return (
    <>
      <Button 
        onClick={syncData} 
        disabled={isSyncing}
        variant="outline"
        size="sm"
        className="gap-2 shrink-0"
      >
        {isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Sync
          </>
        )}
      </Button>
      <Button 
        onClick={connectBank} 
        disabled={isConnecting}
        variant="outline"
        size="sm"
        className="gap-2 shrink-0"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Add Bank
          </>
        )}
      </Button>
    </>
  );
};