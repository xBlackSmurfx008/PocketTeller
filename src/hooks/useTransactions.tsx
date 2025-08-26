import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account_id?: string;
  category_source?: string;
  pending?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useTransactions = () => {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isDemo) {
      // Use demo data
      setTransactions(sampleData.transactions || []);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      setTransactions(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch transactions';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, sampleData, toast]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    if (isDemo) {
      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );
      return { success: true };
    }

    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update transaction';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (isDemo) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      return { success: true };
    }

    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete transaction';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    updateTransaction,
    deleteTransaction
  };
};