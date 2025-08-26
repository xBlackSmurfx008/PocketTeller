import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useBills = () => {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const { toast } = useToast();

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isDemo) {
      // Use demo data
      setBills(sampleData.bills || []);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) {
        throw error;
      }

      setBills(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch bills';
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

  const createBill = useCallback(async (billData: Omit<Bill, 'id' | 'created_at' | 'updated_at'>) => {
    if (isDemo) {
      const newBill: Bill = {
        ...billData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setBills(prev => [...prev, newBill].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
      return { success: true, data: newBill };
    }

    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('bills')
        .insert({ ...billData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setBills(prev => [...prev, data].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
      toast({
        title: "Success",
        description: "Bill created successfully",
      });

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create bill';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  const updateBill = useCallback(async (id: string, updates: Partial<Bill>) => {
    if (isDemo) {
      setBills(prev => 
        prev.map(b => b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b)
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      );
      return { success: true };
    }

    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('bills')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setBills(prev => 
        prev.map(b => b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b)
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      );

      toast({
        title: "Success",
        description: "Bill updated successfully",
      });

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update bill';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  const deleteBill = useCallback(async (id: string) => {
    if (isDemo) {
      setBills(prev => prev.filter(b => b.id !== id));
      return { success: true };
    }

    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setBills(prev => prev.filter(b => b.id !== id));

      toast({
        title: "Success",
        description: "Bill deleted successfully",
      });

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete bill';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  const markAsPaid = useCallback(async (id: string, isPaid: boolean = true) => {
    return updateBill(id, { is_paid: isPaid });
  }, [updateBill]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  return {
    bills,
    loading,
    error,
    refetch: fetchBills,
    createBill,
    updateBill,
    deleteBill,
    markAsPaid
  };
};