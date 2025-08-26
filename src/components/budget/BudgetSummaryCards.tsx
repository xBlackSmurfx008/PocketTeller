import { Card, CardContent } from '@/components/ui/card';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import { BudgetData } from '@/hooks/useBudgetData';

interface BudgetSummaryCardsProps {
  budgetData: BudgetData;
  actualTransactions: Record<string, number>;
}

export const BudgetSummaryCards = ({ budgetData, actualTransactions }: BudgetSummaryCardsProps) => {
  const { summary } = useBudgetCalculations(budgetData, actualTransactions);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-2xl font-bold text-foreground">${summary.plannedIncome.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="text-2xl font-bold text-foreground">
              ${summary.actualExpenses.toFixed(2)} / ${summary.plannedExpenses.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Net</p>
            <p className={`text-2xl font-bold ${summary.actualNet >= 0 ? 'text-primary' : 'text-destructive'}`}>
              ${summary.actualNet.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};