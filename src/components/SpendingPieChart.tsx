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

// Vibrant category colors for better visual appeal
const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#FF6B6B',      // Coral red
  'Transportation': '#4ECDC4',     // Teal
  'Shopping': '#45B7D1',           // Sky blue
  'Entertainment': '#96CEB4',      // Mint green
  'Bills & Utilities': '#FECA57',  // Golden yellow
  'Healthcare': '#FF9FF3',         // Pink
  'Travel': '#54A0FF',             // Bright blue
  'Education': '#5F27CD',          // Purple
  'Income': '#00D2D3',             // Cyan
  'Other': '#C8C8C8'               // Light gray
};

export default function SpendingPieChart({ transactions }: SpendingPieChartProps) {
  // Calculate category totals for expenses only (exclude Income category)
  const categoryTotals = transactions
    .filter(t => t.category !== 'Income') // Exclude income transactions
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

  const renderCustomizedLabel = ({ percentage }: any) => {
    return percentage >= 8 ? `${percentage}%` : '';
  };

  const CustomLegend = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div 
                className="w-4 h-4 rounded-sm flex-shrink-0 shadow-sm border border-border/20"
                style={{ backgroundColor: CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'] }}
              />
              <span className="font-medium text-foreground truncate text-sm">
                {entry.category || 'Uncategorized'}
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-semibold text-foreground text-sm">
                ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-muted-foreground">
                {entry.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex flex-col items-center space-y-6">
          <div className="h-72 w-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={50}
                  labelLine={false}
                  label={renderCustomizedLabel}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.category] || '#C8C8C8'} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full">
            <CustomLegend />
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Total Expenses
            </p>
            <p className="text-2xl font-bold text-foreground">
              ${totalSpent.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}