import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, ChevronDown, ChevronRight, Zap, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import AddTransactionDialog from '@/components/AddTransactionDialog';
import { TransactionSyncButton } from '@/components/TransactionSyncButton';
import { 
  CATEGORIES, 
  autoCategorizeTransaction, 
  groupTransactionsByCategory, 
  getCategoryTotals,
  type Transaction,
  type GroupedTransactions 
} from '@/utils/transactionCategorizer';

export default function RecentTransactions() {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
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

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, categoryFilter]);

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

  // Auto-categorize transactions
  useEffect(() => {
    if (isDemo || !user) return;
    
    const uncategorizedCount = transactions.filter(t => 
      t.category === 'Other' || t.category === null
    ).length;
    
    if (uncategorizedCount === 0) return;
    
    const lastRun = localStorage.getItem('aiCatLastRun');
    if (lastRun) {
      const lastRunTime = new Date(lastRun);
      const now = new Date();
      const hoursSinceLastRun = (now.getTime() - lastRunTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastRun < 12) return; // Throttle to 12 hours
    }
    
    // Auto-run categorization
    const timer = setTimeout(() => {
      autoCategorizeAllTransactions(true); // Silent auto-run
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [transactions, isDemo, user]);

  // Count uncategorized transactions
  const uncategorizedCount = transactions.filter(t => 
    t.category === 'Other' || t.category === null
  ).length;

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
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

  const filterTransactions = () => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    setFilteredTransactions(filtered);
  };

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

    setIsLoading(true);
    try {
      // Try AI categorization first
      const { data, error } = await supabase.functions.invoke('ai-categorize-transactions', {
        body: { limit: 50, threshold: 0.55 }
      });

      if (error) {
        console.error('AI categorization error:', error);
        const errorMessage = error.details || error.message || "AI categorization failed";
        throw new Error(errorMessage);
      }

      // Refresh transactions to get updated data
      await fetchTransactions();
      
      // Store timestamp for throttling
      localStorage.setItem('aiCatLastRun', new Date().toISOString());
      
      if (!silent) {
        let description = data.details || `Updated ${data.updatedCount} transactions`;
        if (data.remainingUncategorized > 0) {
          description += `. ${data.remainingUncategorized} transactions still need manual categorization.`;
        }
        
        toast({
          title: "AI categorization complete",
          description,
        });
      }

      // If some transactions still need categorization, fall back to keyword-based
      if (data.updatedCount === 0) {
        const uncategorizedTransactions = transactions.filter(
          t => (t.category === 'Other' || !t.category) && t.category_source !== 'user'
        );
        
        if (uncategorizedTransactions.length > 0) {
          let categorizedCount = 0;
          for (const transaction of uncategorizedTransactions) {
            const newCategory = autoCategorizeTransaction(transaction.description, transaction.amount);
            if (newCategory !== transaction.category) {
              await updateTransactionCategory(transaction.id, newCategory);
              categorizedCount++;
            }
          }
          
          if (categorizedCount > 0) {
            toast({
              title: "Keyword categorization complete",
              description: `Categorized ${categorizedCount} additional transactions`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Categorization error:', error);
      
      // Fallback to keyword-based categorization
      const uncategorizedTransactions = transactions.filter(
        t => (t.category === 'Other' || !t.category) && t.category_source !== 'user'
      );
      
      let categorizedCount = 0;
      for (const transaction of uncategorizedTransactions) {
        const newCategory = autoCategorizeTransaction(transaction.description, transaction.amount);
        if (newCategory !== transaction.category) {
          await updateTransactionCategory(transaction.id, newCategory);
          categorizedCount++;
        }
      }
      
      if (categorizedCount > 0) {
        toast({
          title: "Fallback categorization complete",
          description: `Categorized ${categorizedCount} transactions using keywords`,
        });
      } else {
        const errorMessage = error?.message || "Unknown error";
        let description = "Unable to categorize transactions. Please try again.";
        
        if (errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid session')) {
          description = "Please refresh the page and try again. Your session may have expired.";
        } else if (errorMessage.includes('not configured')) {
          description = "AI service is temporarily unavailable. Please try keyword categorization by clicking 'Filter to Other' and updating categories manually.";
        }
        
        toast({
          title: "Categorization failed",
          description,
          variant: "destructive",
        });
      }
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>Recent Transactions</CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            {user && !isDemo && (
              <>
                <TransactionSyncButton onSyncComplete={fetchTransactions} />
                <Button
                  onClick={() => autoCategorizeAllTransactions()}
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {isLoading ? 'Categorizing with AI...' : `AI Auto-Categorize ${uncategorizedCount > 0 ? `(${uncategorizedCount})` : ''}`}
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
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by category" />
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
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grouped')}
            >
              Group by Category
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-[50vh] sm:max-h-[400px] overflow-y-auto">
          {filteredTransactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No transactions found
            </div>
          ) : viewMode === 'list' ? (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                    <span className="font-medium text-sm sm:text-base truncate">{transaction.description}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                   <div className="flex items-center gap-2">
                     <Select
                       value={transaction.category}
                       onValueChange={(value) => updateTransactionCategory(transaction.id, value)}
                     >
                       <SelectTrigger className="w-full sm:w-fit h-8 sm:h-6 text-xs">
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
                             <Badge variant="secondary" className="text-xs gap-1">
                               <Sparkles className="h-3 w-3" />
                               AI
                             </Badge>
                           </TooltipTrigger>
                           <TooltipContent>
                             <div className="text-xs space-y-1">
                               <div>AI suggested • Confidence: {Math.round(((transaction as any).category_confidence || 0) * 100)}%</div>
                               {(transaction as any).category_reason && (
                                 <div>Reason: {(transaction as any).category_reason}</div>
                               )}
                             </div>
                           </TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                     )}
                   </div>
                </div>
                <Badge variant={transaction.amount >= 0 ? "default" : "destructive"} className="shrink-0 text-xs sm:text-sm">
                  {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Badge>
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
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="font-medium">{category}</span>
                          <Badge variant="secondary" className="text-xs">
                            {categoryTransactions.length} transaction{categoryTransactions.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-sm">
                          ${categoryTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                      {categoryTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 ml-6 border border-border rounded-lg gap-3 sm:gap-4 bg-muted/20">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                              <span className="font-medium text-sm sm:text-base truncate">{transaction.description}</span>
                              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                                {format(new Date(transaction.date), 'MMM dd, yyyy')}
                              </span>
                            </div>
                             <div className="flex items-center gap-2">
                               <Select
                                 value={transaction.category}
                                 onValueChange={(value) => updateTransactionCategory(transaction.id, value)}
                               >
                                 <SelectTrigger className="w-full sm:w-fit h-8 sm:h-6 text-xs">
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
                                 <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <Badge variant="secondary" className="text-xs gap-1">
                                         <Sparkles className="h-3 w-3" />
                                         AI
                                       </Badge>
                                     </TooltipTrigger>
                                     <TooltipContent>
                                       <div className="text-xs space-y-1">
                                         <div>AI suggested • Confidence: {Math.round(((transaction as any).category_confidence || 0) * 100)}%</div>
                                         {(transaction as any).category_reason && (
                                           <div>Reason: {(transaction as any).category_reason}</div>
                                         )}
                                       </div>
                                     </TooltipContent>
                                   </Tooltip>
                                 </TooltipProvider>
                               )}
                             </div>
                          </div>
                          <Badge variant={transaction.amount >= 0 ? "default" : "destructive"} className="shrink-0 text-xs sm:text-sm">
                            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
