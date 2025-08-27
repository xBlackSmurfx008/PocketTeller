
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TransactionSyncButtonProps {
  onSyncComplete?: () => void;
}

export const TransactionSyncButton = ({ onSyncComplete }: TransactionSyncButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('plaid-sync');

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Sync Complete",
        description: `Updated ${data.accounts || 0} accounts and ${data.transactions || 0} transactions`,
      });

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
      aria-label="Refresh transactions from bank"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Syncing...' : 'Refresh'}
    </Button>
  );
};
