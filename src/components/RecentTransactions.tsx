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
import { Search, Plus, ChevronDown, ChevronRight, Zap, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { Transaction, GroupedTransactions } from '@/types/models';

interface RecentTransactionsProps {
  accountFilter?: string | null;
}

export default function RecentTransactions({ accountFilter }: RecentTransactionsProps = {}) {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<number>(30); // Days to show, default 30
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isDemo && !user) {
      // Only show demo data if in demo mode AND no authenticated user
      const demoTransactions = sampleData.transactions.map(t => ({
        id: t.id,
        date: t.date,
        description: t.name,
        amount: t.amount,
        category: t.category[0] || 'Other',
        account_id: t.account_id
      }));
      setTransactions(demoTransactions);
      setLoading(false);
    } else if (user) {
      fetchTransactions();
      
      // Set up real-time subscription for transactions
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
          (payload) => {
            console.log('Real-time transaction update:', payload);
            
            if (payload.eventType === 'INSERT') {
              setTransactions(prev => [payload.new as Transaction, ...prev.slice(0, 49)]);
            } else if (payload.eventType === 'UPDATE') {
              setTransactions(prev => 
                prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t)
              );
            } else if (payload.eventType === 'DELETE') {
              setTransactions(prev => 
                prev.filter(t => t.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user, isDemo, sampleData]);

  // Count uncategorized transactions
  const uncategorizedCount = transactions.filter(t => 
    t.category === 'Other' || t.category === null
  ).length;

  const fetchTransactions = async () => {
    try {
      console.log('Fetching transactions for user:', user?.id);
      // Fetch ALL transactions - Plaid limits how much data is synced, we show everything
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      console.log('Transactions fetch result:', { data: data?.length || 0, error });
      if (error) throw error;
      
      setTransactions(data || []);
      console.log('Transactions state updated with', data?.length || 0, 'items');
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = useCallback(() => {
    console.log('Filtering transactions. Raw count:', transactions.length);
    let filtered = transactions;

    // Account filter - filter by specific account if provided
    if (accountFilter) {
      filtered = filtered.filter(t => t.plaid_account_id === accountFilter || t.account_id === accountFilter);
    }

    // Date filter - always use month-to-month basis (full calendar months)
    if (dateFilter > 0) {
      const now = new Date();
      const monthsToShow = Math.ceil(dateFilter / 30); // Convert days to months
      
      // Go back to the first day of X months ago
      const startDate = new Date(now.getFullYear(), now.getMonth() - monthsToShow, 1);
      
      filtered = filtered.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startDate;
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
      const { error } = await supabase
        .from('transactions')
        .update({ 
          category: newCategory,
          category_source: 'user'
        })
        .eq('id', transactionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId ? { ...t, category: newCategory } : t
        )
      );

      toast({
        title: "Success",
        description: "Transaction category updated",
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

  const autoCategorizeAllTransactions = async (silent = false) => {
    if (isDemo) {
      // Fallback to keyword-based categorization in demo mode
      const uncategorizedTransactions = transactions.filter(
        t => t.category === 'Other' || !t.category
      );
      
      let categorizedCount = 0;
      const updatedTransactions = transactions.map(transaction => {
        if (transaction.category === 'Other' || !transaction.category) {
          const newCategory = autoCategorizeTransaction(transaction.description, transaction.amount);
          categorizedCount++;
          return { ...transaction, category: newCategory, category_source: 'auto' };
        }
        return transaction;
      });
      
      setTransactions(updatedTransactions);
      
      toast({
        title: "Auto-categorization complete",
        description: `Categorized ${categorizedCount} transactions`,
      });
      return;
    }

    // Prevent concurrent runs
    if (isLoading) {
      toast({
        title: "Categorization in progress",
        description: "Please wait for the current categorization to complete.",
      });
      return;
    }

    setIsLoading(true);
    
    // Show immediate feedback
    if (!silent) {
      toast({
        title: "🤖 AI Categorization Started",
        description: "Analyzing your transactions with AI...",
      });
    }
    
    try {
      // Try AI categorization with higher limit and better threshold
      const { data, error } = await supabase.functions.invoke('ai-categorize-transactions', {
        body: { limit: 100, threshold: 0.70 } // Increased threshold from 0.55 to 0.70 for better accuracy
      });

      if (error) {
        console.error('AI categorization error:', error);
        
        // Better error handling based on error type
        if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
          throw new Error('AI service is temporarily busy. Please try again in a few minutes.');
        } else if (error.message?.includes('Unauthorized') || error.message?.includes('Invalid session')) {
          throw new Error('Your session has expired. Please refresh the page and try again.');
        } else if (error.message?.includes('not configured') || error.message?.includes('API key')) {
          throw new Error('AI service is temporarily unavailable. Please try again later.');
        } else {
          throw new Error(error.details || error.message || 'AI categorization failed');
        }
      }

      // CRITICAL: Refresh transactions to get updated categories from database
      await fetchTransactions();
      
      // Store timestamp for throttling future manual runs
      localStorage.setItem('aiCatLastRun', new Date().toISOString());
      
      if (data) {
        const updatedCount = data.updatedCount || 0;
        const totalProcessed = data.totalProcessed || 0;
        const remaining = data.remainingUncategorized || 0;
        
        if (updatedCount > 0) {
          toast({
            title: "✅ AI Categorization Complete",
            description: `Successfully categorized ${updatedCount} of ${totalProcessed} transactions.${remaining > 0 ? ` ${remaining} transactions still need manual review.` : ''}`,
            duration: 5000,
          });
        } else if (totalProcessed === 0) {
          toast({
            title: "✨ All Transactions Categorized",
            description: "All your transactions already have categories assigned!",
            duration: 3000,
          });
        } else {
          toast({
            title: "Review Needed",
            description: `${remaining} transactions need manual categorization. Use the dropdowns below to categorize them.`,
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Categorization error:', error);
      
      const errorMessage = error?.message || "Unknown error";
      const uncategorizedCount = transactions.filter(
        t => (t.category === 'Other' || !t.category) && 
        (!t.category_source || t.category_source === 'auto')
      ).length;
      
      toast({
        title: "Categorization Issue",
        description: errorMessage + (uncategorizedCount > 0 ? ` You can manually categorize ${uncategorizedCount} transactions using the dropdowns below.` : ''),
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
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
              <>
                <TransactionSyncButton onSyncComplete={fetchTransactions} />
                <Button
                  onClick={() => autoCategorizeAllTransactions()}
                  size="sm"
                  variant="outline"
                  disabled={isLoading || uncategorizedCount === 0}
                  className="gap-2 flex-1 sm:flex-none"
                  title={uncategorizedCount === 0 ? "All transactions are categorized" : `Categorize ${uncategorizedCount} uncategorized transactions with AI`}
                >
                  <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">
                    {isLoading ? 'AI Categorizing...' : uncategorizedCount > 0 ? `AI Categorize (${uncategorizedCount})` : 'All Categorized ✓'}
                  </span>
                  <span className="sm:hidden">
                    {isLoading ? 'AI...' : `${uncategorizedCount}`}
                  </span>
                </Button>
              </>
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
                  onClick={() => setDateFilter(days)}
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
                {uncategorizedCount} need categorization
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
            (filteredTransactions || []).map((transaction) => (
              <div key={transaction.id} className="flex items-start sm:items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="font-medium truncate">{transaction.description}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {(transaction as any).category_source === 'ai' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="text-xs gap-1 cursor-help">
                              <Sparkles className="h-3 w-3" />
                              AI {Math.round(((transaction as any).category_confidence || 0) * 100)}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-1">
                              <div>AI suggested category</div>
                              {(transaction as any).category_reason && (
                                <div className="text-muted-foreground">{(transaction as any).category_reason}</div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {transaction.merchant_name && transaction.merchant_name !== transaction.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {transaction.merchant_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge 
                    variant={transaction.category === 'Income' ? 'default' : 'outline'} 
                    className={`text-sm font-bold ${transaction.category === 'Income' ? 'bg-green-600 text-white' : 'text-foreground'}`}
                  >
                    ${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Badge>
                </div>
              </div>
            ))
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
                          variant={category === 'Income' ? 'default' : 'outline'} 
                          className={`text-sm font-bold ${category === 'Income' ? 'bg-green-600 text-white' : ''}`}
                        >
                          ${categoryTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-1">
                      {(categoryTransactions || []).map((transaction) => (
                        <div key={transaction.id} className="flex items-start sm:items-center justify-between p-2.5 ml-8 border border-border rounded-lg hover:border-primary/30 transition-colors gap-3 bg-background">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                              <span className="font-medium text-sm truncate">{transaction.description}</span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {format(new Date(transaction.date), 'MMM dd')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
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
                              {(transaction as any).category_source === 'ai' && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  AI
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-xs font-semibold">
                            ${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Badge>
                        </div>
                      ))}
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
        onTransactionAdded={fetchTransactions}
      />
    </Card>
  );
}
