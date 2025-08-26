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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-6 px-4">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 text-sm">
            <div 
              className="w-4 h-4 rounded-sm flex-shrink-0 shadow-sm"
              style={{ backgroundColor: CATEGORY_COLORS[entry.category] || '#C8C8C8' }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">
                {entry.category}
              </div>
              <div className="text-muted-foreground text-xs">
                ${entry.value.toLocaleString()} ({entry.percentage}%)
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
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-shrink-0">
            <div className="h-72 w-72 mx-auto">
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
          </div>
          
          <div className="flex-1">
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