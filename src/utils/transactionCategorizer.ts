// Auto-categorization utility for transactions
export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Income',
  'Savings',
  'Investments',
  'Other'
];

// Keywords for auto-categorization
const categoryKeywords = {
  'Food & Dining': [
    'restaurant', 'cafe', 'starbucks', 'mcdonald', 'burger', 'pizza', 'food', 'dining',
    'kitchen', 'bar', 'pub', 'grocery', 'market', 'deli', 'bakery', 'coffee'
  ],
  'Transportation': [
    'uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'transit', 'bus',
    'train', 'airline', 'flight', 'car', 'automotive', 'repair', 'maintenance'
  ],
  'Shopping': [
    'amazon', 'target', 'walmart', 'store', 'shop', 'mall', 'clothing', 'shoes',
    'electronics', 'best buy', 'apple', 'retail', 'purchase', 'buy'
  ],
  'Entertainment': [
    'netflix', 'spotify', 'movie', 'theater', 'game', 'concert', 'music', 'streaming',
    'entertainment', 'subscription', 'youtube', 'hulu', 'disney'
  ],
  'Bills & Utilities': [
    'electric', 'gas', 'water', 'internet', 'phone', 'utility', 'bill', 'insurance',
    'rent', 'mortgage', 'loan', 'payment', 'credit card'
  ],
  'Healthcare': [
    'hospital', 'doctor', 'medical', 'pharmacy', 'health', 'dental', 'vision',
    'clinic', 'medicine', 'prescription'
  ],
  'Travel': [
    'hotel', 'airbnb', 'booking', 'travel', 'vacation', 'trip', 'flight',
    'rental car', 'expedia', 'resort'
  ],
  'Education': [
    'school', 'university', 'college', 'tuition', 'education', 'course',
    'training', 'book', 'learning'
  ],
  'Income': [
    'salary', 'payroll', 'deposit', 'income', 'payment', 'transfer', 'refund'
  ]
};

export function autoCategorizeTransaction(description: string, amount: number): string {
  const desc = description.toLowerCase();
  
  // Check if it's income (positive amount with income keywords)
  if (amount > 0) {
    for (const keyword of categoryKeywords.Income) {
      if (desc.includes(keyword)) {
        return 'Income';
      }
    }
  }
  
  // Check other categories
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'Income') continue; // Already checked above
    
    for (const keyword of keywords) {
      if (desc.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Other';
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account_id?: string;
  category_source?: string;
}

export interface GroupedTransactions {
  [category: string]: Transaction[];
}

export function groupTransactionsByCategory(transactions: Transaction[]): GroupedTransactions {
  const grouped: GroupedTransactions = {};
  
  transactions.forEach(transaction => {
    const category = transaction.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(transaction);
  });
  
  return grouped;
}

export function getCategoryTotals(groupedTransactions: GroupedTransactions): Record<string, number> {
  const totals: Record<string, number> = {};
  
  Object.entries(groupedTransactions).forEach(([category, transactions]) => {
    totals[category] = transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  });
  
  return totals;
}