import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Upload, Trash2 } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

interface TransactionBulkActionsProps {
  transactions: Transaction[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onTransactionsUpdate: () => void;
}

// Import categories from the centralized utility
import { CATEGORIES } from '@/utils/transactionCategorizer';

export const TransactionBulkActions = ({
  transactions,
  selectedIds,
  onSelectionChange,
  onTransactionsUpdate
}: TransactionBulkActionsProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(transactions.map(t => t.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleBulkCategoryUpdate = async (category: string) => {
    if (selectedIds.length === 0) return;

    setIsUpdating(true);
    try {
      // Get current user for security
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('transactions')
        .update({ category })
        .in('id', selectedIds)
        .eq('user_id', user.id); // Ensure user can only update their own transactions

      if (error) throw error;

      toast({
        title: "Categories Updated",
        description: `Updated ${selectedIds.length} transactions`,
      });
      
      onSelectionChange([]);
      onTransactionsUpdate();
    } catch (error) {
      console.error('Error updating categories:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update transaction categories",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setIsUpdating(true);
    try {
      // Get current user for security
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', selectedIds)
        .eq('user_id', user.id); // Ensure user can only delete their own transactions

      if (error) throw error;

      toast({
        title: "Transactions Deleted",
        description: `Deleted ${selectedIds.length} transactions`,
      });
      
      onSelectionChange([]);
      onTransactionsUpdate();
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete transactions",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const exportToCSV = () => {
    const selectedTransactions = transactions.filter(t => selectedIds.includes(t.id));
    
    // Sanitize CSV data to prevent formula injection
    const csvContent = [
      ['Date', 'Description', 'Amount', 'Category'],
      ...selectedTransactions.map(t => [
        t.date,
        t.description,
        t.amount.toString(),
        t.category
      ])
    ].map(row => 
      row.map(cell => {
        const stringValue = String(cell);
        // Escape dangerous characters that could be interpreted as formulas
        if (/^[=@+\-]/.test(stringValue)) {
          return `'${stringValue}`;
        }
        // Escape double quotes by doubling them and wrap in quotes
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').slice(1); // Skip header
        const newTransactions = lines
          .filter(line => line.trim())
          .map(line => {
            const [date, description, amount, category] = line.split(',');
            return {
              date,
              description: description?.replace(/"/g, '') || '',
              amount: parseFloat(amount) || 0,
              category: category?.replace(/"/g, '') || 'Other'
            };
          });

        // Get current user ID
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('User not authenticated');

        // Add user_id to all transactions
        const transactionsWithUserId = newTransactions.map(tx => ({
          ...tx,
          user_id: user.user.id
        }));

        const { error } = await supabase
          .from('transactions')
          .insert(transactionsWithUserId);

        if (error) throw error;

        toast({
          title: "Import Successful",
          description: `Imported ${newTransactions.length} transactions`,
        });
        
        onTransactionsUpdate();
      } catch (error) {
        console.error('Error importing CSV:', error);
        toast({
          title: "Import Failed",
          description: "Failed to import transactions",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center p-3 sm:p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={selectedIds.length === transactions.length && transactions.length > 0}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm text-muted-foreground">
          {selectedIds.length} selected
        </span>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Select onValueChange={handleBulkCategoryUpdate} disabled={isUpdating}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Set category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-1"
          >
            <Download className="h-3 w-3" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isUpdating}
            className="gap-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      )}

      <div className="ml-auto">
        <label htmlFor="csv-import">
          <Button variant="outline" size="sm" asChild className="gap-1 cursor-pointer">
            <span>
              <Upload className="h-3 w-3" />
              Import CSV
            </span>
          </Button>
        </label>
        <input
          id="csv-import"
          type="file"
          accept=".csv"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>
    </div>
  );
};