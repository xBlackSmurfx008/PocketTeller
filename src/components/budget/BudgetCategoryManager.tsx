import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CategoryBudget, BudgetData } from '@/hooks/useBudgetData';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';

const SUGGESTED_CATEGORIES = [
  'Housing', 'Transportation', 'Food & Dining', 'Utilities', 'Healthcare', 
  'Entertainment', 'Shopping', 'Personal Care', 'Education', 'Savings', 
  'Investments', 'Insurance', 'Debt Payments', 'Travel', 'Other'
];

interface BudgetCategoryManagerProps {
  budgetData: BudgetData;
  actualTransactions: Record<string, number>;
  onUpdateBudget: (data: BudgetData) => void;
}

export const BudgetCategoryManager = ({ 
  budgetData, 
  actualTransactions, 
  onUpdateBudget 
}: BudgetCategoryManagerProps) => {
  const { getCategoryProgress } = useBudgetCalculations(budgetData, actualTransactions);

  const addCategory = () => {
    onUpdateBudget({
      ...budgetData,
      categories: [...budgetData.categories, {
        id: Date.now().toString(),
        name: '',
        planned: 0,
        actual: 0
      }]
    });
  };

  const removeCategory = (id: string) => {
    onUpdateBudget({
      ...budgetData,
      categories: budgetData.categories.filter(cat => cat.id !== id)
    });
  };

  const updateCategory = (id: string, field: 'name' | 'planned', value: string | number) => {
    onUpdateBudget({
      ...budgetData,
      categories: budgetData.categories.map(cat =>
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Budget Categories</h3>
          <p className="text-sm text-muted-foreground">Plan your spending by category</p>
        </div>
        <Button onClick={addCategory} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {budgetData.categories.map((category) => {
        const progress = getCategoryProgress(category.name, category.planned);

        return (
          <div key={category.id} className="space-y-3 p-4 border border-border rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={category.name}
                  onValueChange={(value) => updateCategory(category.id, 'name', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUGGESTED_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Planned</Label>
                <Input
                  type="number"
                  value={category.planned}
                  onChange={(e) => updateCategory(category.id, 'planned', Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Actual</Label>
                <Input
                  type="number"
                  value={progress.actual.toFixed(2)}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="flex items-end gap-2">
                <Badge variant={progress.remaining >= 0 ? "default" : "destructive"}>
                  {progress.remaining >= 0 
                    ? `$${progress.remaining.toFixed(2)} left` 
                    : `$${Math.abs(progress.remaining).toFixed(2)} over`
                  }
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCategory(category.id)}
                  disabled={budgetData.categories.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {category.planned > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress.percentage.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={Math.min(progress.percentage, 100)} 
                  className="h-2"
                  style={{
                    background: `linear-gradient(to right, ${progress.progressColor} 0%, ${progress.progressColor} ${Math.min(progress.percentage, 100)}%, hsl(var(--secondary)) ${Math.min(progress.percentage, 100)}%)`
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};