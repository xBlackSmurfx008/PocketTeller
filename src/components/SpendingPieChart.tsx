import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { CATEGORIES } from '@/utils/transactionCategorizer';

interface Transaction {
  amount: number;
  category: string;
  date: string;
}

interface SpendingPieChartProps {
  transactions: Transaction[];
}

// Consistent colors for categories
const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': 'hsl(var(--chart-1))',
  'Shopping': 'hsl(var(--chart-2))',
  'Transportation': 'hsl(var(--chart-3))',
  'Entertainment': 'hsl(var(--chart-4))',
  'Bills & Utilities': 'hsl(var(--chart-5))',
  'Healthcare': 'hsl(var(--primary))',
  'Education': 'hsl(var(--secondary))',
  'Travel': 'hsl(var(--accent))',
  'Personal Care': 'hsl(var(--muted))',
  'Home & Garden': 'hsl(var(--destructive))',
  'Other': 'hsl(var(--border))',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground">{data.category}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(data.value)} ({data.percent}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function SpendingPieChart({ transactions }: SpendingPieChartProps) {
  const chartData = useMemo(() => {
    // Only include expenses (negative amounts)
    const expenses = transactions.filter(tx => tx.amount < 0);
    
    if (expenses.length === 0) {
      return [];
    }

    // Calculate category totals
    const categoryTotals: Record<string, number> = {};
    let totalSpend = 0;

    expenses.forEach(tx => {
      const amount = Math.abs(tx.amount);
      const category = tx.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      totalSpend += amount;
    });

    // Convert to chart data and sort by value
    return Object.entries(categoryTotals)
      .map(([category, value]) => ({
        category,
        value: Math.round(value),
        percent: Math.round((value / totalSpend) * 100),
        fill: CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'],
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalSpending = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No expense data available</p>
              <p className="text-xs mt-1">Add some transactions to see your spending breakdown</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = chartData.reduce((config, item) => {
    config[item.category] = {
      label: item.category,
      color: item.fill,
    };
    return config;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total spending: {formatCurrency(totalSpending)}
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                nameKey="category"
                label={({ percent }) => `${percent}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-xs text-foreground">
                    {value}: {formatCurrency(entry.payload.value)}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}