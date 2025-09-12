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

// High contrast, distinct category colors for better visibility
const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#E74C3C',      // Bright red
  'Transportation': '#3498DB',     // Electric blue
  'Shopping': '#9B59B6',           // Purple
  'Entertainment': '#E67E22',      // Orange
  'Bills & Utilities': '#F39C12',  // Golden orange
  'Healthcare': '#E91E63',         // Pink
  'Travel': '#1ABC9C',             // Turquoise
  'Education': '#8E44AD',          // Dark purple
  'Income': '#27AE60',             // Green
  'Savings': '#2ECC71',            // Emerald green
  'Investments': '#34495E',        // Dark blue-gray
  'Other': '#95A5A6'               // Gray
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
        <div className="bg-card border-2 border-border rounded-lg p-4 shadow-xl backdrop-blur-sm">
          <p className="font-bold text-lg text-foreground mb-1">{data.category}</p>
          <p className="font-semibold text-primary text-base">
            ${data.value.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground font-medium">
            {data.percentage}% of total spending
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ percentage, cx, cy, midAngle, innerRadius, outerRadius }: any) => {
    if (percentage < 5) return ''; // Only show labels for slices >= 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1"
      >
        {`${percentage}%`}
      </text>
    );
  };

  const CustomLegend = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-6">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors shadow-sm">
            <div 
              className="w-5 h-5 rounded-full flex-shrink-0 shadow-md border-2 border-white"
              style={{ backgroundColor: CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'] }}
            />
            <div className="flex-1">
              <div className="font-bold text-foreground text-base">
                {entry.category || 'Uncategorized'}
              </div>
              <div className="font-semibold text-primary text-lg">
                ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {entry.percentage}% of total
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
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth={3}
                  paddingAngle={2}
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