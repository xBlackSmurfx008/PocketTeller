import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useToast } from '@/hooks/useToast';
import { Search, Plus, ChevronDown, ChevronRight, Zap, Sparkles, Clock } from 'lucide-react';
// Removed tooltip imports after simplifying source indicators
import { format } from 'date-fns';
import AddTransactionDialog from '@/components/AddTransactionDialog';
import { TransactionSyncButton } from '@/components/TransactionSyncButton';
import { Reveal } from '@/components/Reveal';
import { 
  CATEGORIES, 
  autoCategorizeTransaction, 
  groupTransactionsByCategory, 
  getCategoryTotals
} from '@/utils/transactionCategorizer';
import { isIncomeCategory } from '@/utils/categoryNormalizer';
import { useTransactions } from '@/hooks/useTransactions';
import { Transaction, GroupedTransactions } from '@/types/models';

interface RecentTransactionsProps {
  accountFilter?: string | null;
  dateFilter?: number;
  onDateFilterChange?: (days: number) => void;
}

export default function RecentTransactions({ accountFilter, dateFilter = 30, onDateFilterChange }: RecentTransactionsProps = {}) {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const { toast } = useToast();
  const { transactions, loading, refetch } = useTransactions();
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Fetch on mount and on account filter change
  useEffect(() => {
    refetch({ includePending: false, accountId: accountFilter || undefined });
  }, [accountFilter, refetch]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refetch({ includePending: false, accountId: accountFilter || undefined });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, accountFilter, refetch]);

  // Count uncategorized transactions (Plaid will handle categorization)
  const uncategorizedCount = transactions.filter(t => 
    (t.category === 'Other' || t.category === null) &&
    (!t.category_source || t.category_source === 'auto')
  ).length;

  const filterTransactions = useCallback(() => {
    console.log('Filtering transactions. Raw count:', transactions.length);
    let filtered = transactions;

    // Account filter - filter by specific account if provided
    if (accountFilter) {
      filtered = filtered.filter(t => t.plaid_account_id === accountFilter || t.account_id === accountFilter);
    }

    // Date filter - true day-based filtering (last X days from today)
    if (dateFilter > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dateFilter);
      
      filtered = filtered.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= cutoffDate;
      });
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t => {
        // Defensive search - handle null/undefined values
        const description = (t.description || '').toLowerCase();
        const merchant = (t.merchant_name || '').toLowerCase();
        const category = (t.category || '').toLowerCase();
        const amount = String(t.amount || 0);
        
        return description.includes(searchLower) ||
               merchant.includes(searchLower) ||
               category.includes(searchLower) ||
               amount.includes(searchLower);
      });
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    console.log('After filtering:', filtered.length, 'transactions. Account:', accountFilter, 'Search:', searchTerm, 'Category:', categoryFilter, 'Date:', dateFilter, 'days');
    setFilteredTransactions(filtered);
  }, [transactions, accountFilter, searchTerm, categoryFilter, dateFilter]);

  useEffect(() => {
    filterTransactions();
  }, [filterTransactions]);

  useEffect(() => {
    if (viewMode === 'grouped') {
      const grouped = groupTransactionsByCategory(filteredTransactions);
      setGroupedTransactions(grouped);
      // Auto-open categories that have transactions
      const newOpenCategories: Record<string, boolean> = {};
      Object.keys(grouped).forEach(category => {
        newOpenCategories[category] = true;
      });
      setOpenCategories(newOpenCategories);
    }
  }, [viewMode, filteredTransactions]);

  // REMOVED: Auto-categorize on page load
  // This was causing excessive API calls and user confusion.
  // Users should trigger categorization manually via the button.

  const updateTransactionCategory = async (transactionId: string, newCategory: string) => {
    try {
      // Find the transaction being categorized
      const currentTransaction = transactions.find(t => t.id === transactionId);
      if (!currentTransaction) return;

      // Find matching merchant name
      const merchantName = currentTransaction.merchant_name || currentTransaction.description;
      
      // Update the selected transaction
      const { error } = await supabase
        .from('transactions')
        .update({ 
          category: newCategory,
          category_source: 'user'
        })
        .eq('id', transactionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Smart propagation: Find and categorize other transactions from same merchant
      let propagatedCount = 0;
      if (merchantName) {
        const { data: similarTransactions, error: fetchError } = await supabase
          .from('transactions')
          .select('id, merchant_name, description')
          .eq('user_id', user?.id)
          .neq('id', transactionId)  // Don't update the one we just updated
          .or(`merchant_name.eq.${merchantName},description.eq.${merchantName}`);

        if (!fetchError && similarTransactions && similarTransactions.length > 0) {
          const similarIds = similarTransactions.map(t => t.id);
          
          const { error: propagateError } = await supabase
            .from('transactions')
            .update({
              category: newCategory,
              category_source: 'user'
            })
            .in('id', similarIds)
            .eq('user_id', user?.id);

          if (!propagateError) {
            propagatedCount = similarIds.length;
          }
        }
        
        // Save category rule for future transactions from this merchant
        await supabase
          .from('user_category_rules')
          .upsert({
            user_id: user?.id,
            merchant_name: merchantName,
            category: newCategory,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,merchant_name'
          });
      }

      // Refresh from server to ensure consistency
      refetch({ includePending: false, accountId: accountFilter || undefined });

      const totalUpdated = 1 + propagatedCount;
      toast({
        title: "Success",
        description: propagatedCount > 0 
          ? `Updated ${totalUpdated} transactions to "${newCategory}" (${propagatedCount} similar merchants)`
          : "Transaction category updated",
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    }
  };


  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-tour-id="recent-transactions">
      <CardHeader>
        <div className="flex flex-col gap-3">
          <CardTitle>Recent Transactions</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {user && !isDemo && (
              <TransactionSyncButton onSyncComplete={() => refetch({ includePending: false, accountId: accountFilter || undefined })} />
            )}
            <Button 
              onClick={() => isDemo ? toast({ title: "Demo Mode", description: "Adding transactions disabled in demo" }) : setShowAddDialog(true)} 
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Add Transaction</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Removed categorization dashboard for simpler UI focus */}

        {/* Compact Filters Bar */}
        <div className="flex flex-col gap-3 pb-3 border-b">
          {/* Search and Category Filter Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filters and View Mode Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {[
                { label: '30D', days: 30 },
                { label: '60D', days: 60 },
                { label: '90D', days: 90 },
                { label: '6M', days: 180 },
                { label: '1Y', days: 365 },
                { label: 'All', days: 0 },
              ].map(({ label, days }) => (
                <Button
                  key={days}
                  onClick={() => onDateFilterChange?.(days)}
                  size="sm"
                  variant={dateFilter === days ? 'default' : 'ghost'}
                  className="h-8 px-3"
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                List
              </Button>
              <Button
                variant={viewMode === 'grouped' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grouped')}
                className="h-8 px-3"
              >
                Grouped
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
              {filteredTransactions.length !== transactions.length && ` (of ${transactions.length})`}
            </span>
            {uncategorizedCount > 0 && (
              <Badge variant="outline" className="text-xs text-orange-600 dark:text-orange-400 border-orange-400">
                {uncategorizedCount} need manual review
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2 max-h-[40vh] sm:max-h-[350px] overflow-y-auto">
          {!filteredTransactions || filteredTransactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Card className="w-full max-w-sm border-dashed">
                <CardContent className="pt-6 text-center">
                  <div className="text-muted-foreground mb-3">
                    {transactions.length === 0 ? (
                      <>
                        <p className="font-medium">No Transactions Yet</p>
                        <p className="text-sm mt-2">Connect your bank or add transactions manually</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">No Matching Transactions</p>
                        <p className="text-sm mt-2">Try adjusting your filters</p>
                      </>
                    )}
                  </div>
                  {transactions.length === 0 && (
                    <Button onClick={() => setShowAddDialog(true)} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transaction
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : viewMode === 'list' ? (
            (filteredTransactions || []).map((transaction) => {
              const isIncome = isIncomeCategory(transaction.category);
              return (
                <div
                  key={transaction.id}
                  className={`flex items-center gap-4 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors ${transaction.pending ? 'opacity-70 border-dashed' : ''}`}
                >
                  {/* Amount - primary emphasis */}
                  <div className="text-right min-w-[110px]">
                    <div className={`text-xl font-bold tabular-nums ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                      {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                      {transaction.pending && <Clock className="h-3 w-3" />}
                      <span>{format(new Date(transaction.date), 'MMM dd')}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base truncate">
                      {transaction.merchant_name || transaction.description}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Select
                        value={transaction.category}
                        onValueChange={(value) => updateTransactionCategory(transaction.id, value)}
                      >
                        <SelectTrigger className="w-[140px] h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border shadow-lg z-50">
                          {CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Source icon-only */}
                      {(transaction as any).category_source && (
                        <span className="text-xs opacity-60">
                          {(transaction as any).category_source === 'user' && '👤'}
                          {(transaction as any).category_source === 'plaid' && '🏦'}
                          {(transaction as any).category_source === 'ai' && '✨'}
                          {(transaction as any).category_source === 'auto' && '🤖'}
                        </span>
                      )}
                      {transaction.pending && (
                        <Badge variant="secondary" className="text-[10px] h-5">
                          <Clock className="h-3 w-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            Object.entries(groupedTransactions)
              .sort(([a], [b]) => {
                const totalsA = getCategoryTotals(groupedTransactions)[a] || 0;
                const totalsB = getCategoryTotals(groupedTransactions)[b] || 0;
                return totalsB - totalsA; // Sort by total amount descending
              })
              .map(([category, categoryTransactions]) => {
                const categoryTotal = getCategoryTotals(groupedTransactions)[category] || 0;
                const isOpen = openCategories[category];
                
                return (
                  <Collapsible key={category} open={isOpen} onOpenChange={() => toggleCategory(category)}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 border-2 border-border rounded-lg cursor-pointer hover:border-primary/50 transition-all bg-muted/30">
                        <div className="flex items-center gap-3">
                          {isOpen ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4" />}
                          <div>
                            <span className="font-semibold">{category}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {(categoryTransactions?.length || 0)} {(categoryTransactions?.length || 0) === 1 ? 'transaction' : 'transactions'}
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant={isIncomeCategory(category) ? 'default' : 'outline'} 
                          className={`text-sm font-bold ${isIncomeCategory(category) ? 'bg-green-600 text-white' : ''}`}
                        >
                          ${categoryTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-1">
                      {(categoryTransactions || []).map((transaction) => {
                        const isIncome = isIncomeCategory(transaction.category);
                        return (
                          <div
                            key={transaction.id}
                            className={`flex items-center gap-4 p-2.5 ml-8 border border-border rounded-lg hover:border-primary/30 transition-colors bg-background ${transaction.pending ? 'opacity-70 border-dashed' : ''}`}
                          >
                            {/* Amount */}
                            <div className="text-right min-w-[90px]">
                              <div className={`text-sm font-bold tabular-nums ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                                {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                                {transaction.pending && <Clock className="h-3 w-3" />}
                                <span>{format(new Date(transaction.date), 'MMM dd')}</span>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{transaction.merchant_name || transaction.description}</div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Select
                                  value={transaction.category}
                                  onValueChange={(value) => updateTransactionCategory(transaction.id, value)}
                                >
                                  <SelectTrigger className="w-[130px] h-6 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                                    {CATEGORIES.map(cat => (
                                      <SelectItem key={cat} value={cat}>
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {(transaction as any).category_source && (
                                  <span className="text-xs opacity-60">
                                    {(transaction as any).category_source === 'user' && '👤'}
                                    {(transaction as any).category_source === 'plaid' && '🏦'}
                                    {(transaction as any).category_source === 'ai' && '✨'}
                                    {(transaction as any).category_source === 'auto' && '🤖'}
                                  </span>
                                )}
                                {transaction.pending && (
                                  <Badge variant="secondary" className="text-[10px] h-5">
                                    <Clock className="h-3 w-3 mr-1" /> Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
          )}
        </div>
      </CardContent>

      <AddTransactionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onTransactionAdded={() => refetch({ includePending: false, accountId: accountFilter || undefined })}
      />
    </Card>
  );
}
