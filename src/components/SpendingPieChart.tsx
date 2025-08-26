import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES } from '@/utils/transactionCategorizer';

interface Transaction {
  amount: number;
  category: string;
  date: string;
}

interface SpendingPieChartProps {
  transactions: Transaction[];
}

// Consistent category colors
const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': 'hsl(var(--chart-1))',
  'Transportation': 'hsl(var(--chart-2))',
  'Shopping': 'hsl(var(--chart-3))',
  'Entertainment': 'hsl(var(--chart-4))',
  'Bills & Utilities': 'hsl(var(--chart-5))',
  'Healthcare': 'hsl(var(--primary))',
  'Travel': 'hsl(var(--secondary))',
  'Education': 'hsl(var(--accent))',
  'Income': 'hsl(var(--muted))',
  'Other': 'hsl(var(--muted-foreground))'
};

export default function SpendingPieChart({ transactions }: SpendingPieChartProps) {
  // Calculate category totals for expenses only (negative amounts)
  const categoryTotals = transactions
    .filter(t => t.amount < 0) // Expenses only
    .reduce((acc, transaction) => {
      const category = transaction.category || 'Other';
      const amount = Math.abs(transaction.amount);
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

  const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

  // Convert to chart data format
  const chartData = Object.entries(categoryTotals)
    .map(([category, value]) => ({
      category,
      value: Math.round(value * 100) / 100,
      percentage: Math.round((value / totalSpent) * 100)
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No expense data to display</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            ${data.value.toFixed(2)} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ category, percentage }: any) => {
    return percentage > 5 ? `${percentage}%` : '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={30}
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CATEGORY_COLORS[entry.category] || 'hsl(var(--muted))'} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => 
                  `${value}: $${entry.payload.value.toFixed(2)}`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Total Expenses: <span className="font-medium">${totalSpent.toFixed(2)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}