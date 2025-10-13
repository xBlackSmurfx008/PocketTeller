import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ConnectedBank {
  itemId: string;
  institutionName: string;
  institutionId: string;
  connectedAt: string;
  accounts: BankAccount[];
  totalBalance: number;
}

export interface BankAccount {
  id: string;
  plaidAccountId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balanceAvailable: number | null;
  balanceCurrent: number | null;
  currencyCode: string;
}

export interface AccountLimitInfo {
  connectedCount: number;
  maxConnections: number;
  canConnect: boolean;
  remainingSlots: number;
}

export function useConnectedAccounts() {
  const { user } = useAuth();
  const [connectedBanks, setConnectedBanks] = useState<ConnectedBank[]>([]);
  const [limitInfo, setLimitInfo] = useState<AccountLimitInfo>({
    connectedCount: 0,
    maxConnections: 3,
    canConnect: true,
    remainingSlots: 3,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectedAccounts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching connected accounts for user:', user.id);

      // Temporarily bypass - functions not deployed yet
      // Fetch directly from database instead
      const { data: items, error: itemsError } = await supabase
        .from('plaid_items')
        .select('id, item_id, institution_name, institution_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      console.log('📋 Plaid items fetched:', { items, itemsError });

      if (itemsError) {
        throw itemsError;
      }

      // Fetch accounts for each item
      const banksWithAccounts = await Promise.all(
        (items || []).map(async (item) => {
          console.log(`🔍 Fetching accounts for item: ${item.item_id}`);
          const { data: accounts, error: accountsError } = await supabase
            .from('accounts')
            .select('id, plaid_account_id, name, official_name, type, subtype, mask, available_balance, current_balance, currency_code')
            .eq('user_id', user.id)
            .eq('plaid_item_id', item.item_id);

          console.log(`📋 Accounts for item ${item.item_id}:`, { accounts, accountsError });

          if (accountsError) {
            console.error(`Error fetching accounts for item ${item.item_id}:`, accountsError);
            return {
              itemId: item.item_id,
              institutionName: item.institution_name || 'Unknown Bank',
              institutionId: item.institution_id || '',
              connectedAt: item.created_at,
              accounts: [],
              totalBalance: 0,
            };
          }

          const totalBalance = (accounts || []).reduce((sum, acc) => {
            const balance = Number(acc.available_balance) || Number(acc.current_balance) || 0;
            return sum + balance;
          }, 0);

          return {
            itemId: item.item_id,
            institutionName: item.institution_name || 'Unknown Bank',
            institutionId: item.institution_id || '',
            connectedAt: item.created_at,
            accounts: (accounts || []).map(acc => ({
              id: acc.id,
              plaidAccountId: acc.plaid_account_id,
              name: acc.name,
              officialName: acc.official_name,
              type: acc.type,
              subtype: acc.subtype,
              mask: acc.mask,
              balanceAvailable: acc.available_balance,
              balanceCurrent: acc.current_balance,
              currencyCode: acc.currency_code,
            })),
            totalBalance,
          };
        })
      );

      // Filter out banks with no accounts - only show real connections
      const activeBanks = banksWithAccounts.filter(bank => bank.accounts.length > 0);
      
      // Clean up orphaned plaid_items (items with no accounts)
      const orphanedItemIds = banksWithAccounts
        .filter(bank => bank.accounts.length === 0)
        .map(bank => bank.itemId);

      if (orphanedItemIds.length > 0) {
        console.log('🧹 Cleaning up orphaned plaid_items:', orphanedItemIds);
        // Delete orphaned items from database
        await supabase
          .from('plaid_items')
          .delete()
          .in('item_id', orphanedItemIds);
      }

      setConnectedBanks(activeBanks);  // Only show banks with actual accounts
      setLimitInfo({
        connectedCount: activeBanks.length,  // Count only banks with accounts
        maxConnections: 3,
        canConnect: activeBanks.length < 3,
        remainingSlots: Math.max(0, 3 - activeBanks.length),
      });
    } catch (err: any) {
      console.error('❌ Error fetching connected accounts:', err);
      setError(err.message || 'Failed to fetch connected accounts');
      // Set empty state on error to prevent crashes
      setConnectedBanks([]);
      setLimitInfo({
        connectedCount: 0,
        maxConnections: 3,
        canConnect: true,
        remainingSlots: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectedAccounts();
  }, [user]);

  return {
    connectedBanks,
    limitInfo,
    loading,
    error,
    refetch: fetchConnectedAccounts,
  };
}

