import { PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

interface Transaction {
  amount: number;
  category: string;
  date: string;
}

interface SpendingPieChartProps {
  transactions: Transaction[];
  dateFilter?: number; // Days being displayed (0 = all time)
}

// Bright colors that work well on dark backgrounds
const BRIGHT_COLORS = [
  '#3B82F6', // Bright blue
  '#10B981', // Bright green
  '#F59E0B', // Bright amber
  '#EF4444', // Bright red
  '#8B5CF6', // Bright purple
  '#06B6D4', // Bright cyan
  '#F97316', // Bright orange
  '#84CC16', // Bright lime
  '#EC4899', // Bright pink
  '#6366F1', // Bright indigo
  '#14B8A6', // Bright teal
  '#F43F5E'  // Bright rose
];

const toCssKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default function SpendingPieChart({ transactions, dateFilter = 30 }: SpendingPieChartProps) {
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

  // Format the time period label
  const getTimePeriodLabel = () => {
    if (dateFilter === 0) return 'All Time';
    if (dateFilter === 30) return 'Last 30 Days';
    if (dateFilter === 60) return 'Last 60 Days';
    if (dateFilter === 90) return 'Last 90 Days';
    if (dateFilter === 180) return 'Last 6 Months';
    if (dateFilter === 365) return 'Last Year';
    return `Last ${dateFilter} Days`;
  };

  // Convert to chart data format
  const chartData = Object.entries(categoryTotals)
    .map(([category, value]) => ({
      category,
      key: toCssKey(category || 'other'),
      value: Math.round(value * 100) / 100,
      percentage: Math.round((value / totalSpent) * 100)
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending

  // Create shadcn ChartContainer config so tooltip/legend can read labels and colors
  // Colors are exposed as CSS vars per key: --color-{key}
  const chartConfig = chartData.reduce((cfg, entry, index) => {
    cfg[entry.key] = { label: entry.category, color: BRIGHT_COLORS[index % BRIGHT_COLORS.length] } as any;
    return cfg;
  }, {} as Record<string, { label: string; color: string }>);

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

  // Tooltip content is provided by shadcn/ui ChartTooltipContent via ChartContainer context

  const renderCustomizedLabel = ({ percentage, cx, cy, midAngle, outerRadius, payload }: any) => {
    if (percentage < 5) return '';
    const RADIAN = Math.PI / 180;
    const offset = 16; // place labels outside the pie, on the surrounding background
    const radius = outerRadius + offset;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill={payload?.key ? `var(--color-${payload.key})` : 'currentColor'}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  // Legend provided by shadcn/ui components

  return (
    <Card className="overflow-hidden card-hover-lift elevation-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Spending by Category</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{getTimePeriodLabel()}</p>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-full max-w-md mx-auto">
            <ChartContainer config={chartConfig} className="h-80 w-full min-h-80">
              <PieChart width={400} height={320}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={40}
                  labelLine
                  label={renderCustomizedLabel}
                  stroke="transparent"
                  strokeWidth={0}
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`var(--color-${entry.key})`} 
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="key" labelKey="category" />} />
              </PieChart>
            </ChartContainer>
          </div>
          
          {/* Scrollable Legend (use the same CSS var as slices for exact parity) */}
          <div className="w-full">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 px-2 min-w-max">
                {chartData.map((entry, index) => (
                  <div key={entry.key} className="flex items-center gap-2 whitespace-nowrap">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: `var(--color-${entry.key})` }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {entry.category}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ${entry.value.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({entry.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}