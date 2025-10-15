// Centralized category normalization utility
export const CATEGORY_ALIASES: Record<string, string> = {
  'Bills & Utilities': 'Utilities',
  'Food & Dining': 'Food & Dining',
  'Transportation': 'Transportation',
  'Entertainment': 'Entertainment',
  'Healthcare': 'Healthcare',
  'Shopping': 'Shopping',
  'Travel': 'Travel',
  'Education': 'Education',
  'Savings': 'Savings',
  'Investments': 'Investments',
  'Income': 'Income'
};

export const STANDARD_CATEGORIES = [
  'Income',
  'Transfer',
  'Subscriptions',
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Housing',
  'Personal Care',
  'Education',
  'Savings',
  'Investments',
  'Insurance',
  'Debt Payments',
  'Other'
];

/**
 * Normalizes category names for consistency across the application
 * @param category - The category name to normalize
 * @returns The normalized category name
 */
export const normalizeCategoryName = (category: string): string => {
  if (!category) return 'Other';
  
  // Check if it's already a standard category
  if (STANDARD_CATEGORIES.includes(category)) {
    return category;
  }
  
  // Apply aliases
  const normalized = CATEGORY_ALIASES[category];
  if (normalized) {
    return normalized;
  }
  
  // Fallback for unknown categories
  return category || 'Other';
};

/**
 * Gets the display color for a category (for charts, badges, etc.)
 * @param category - The category name
 * @returns A CSS color value
 */
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Housing': 'hsl(220, 70%, 50%)',
    'Transportation': 'hsl(120, 60%, 45%)',
    'Food & Dining': 'hsl(30, 80%, 55%)',
    'Utilities': 'hsl(270, 60%, 50%)',
    'Healthcare': 'hsl(340, 70%, 50%)',
    'Entertainment': 'hsl(290, 60%, 55%)',
    'Shopping': 'hsl(180, 60%, 45%)',
    'Personal Care': 'hsl(350, 60%, 55%)',
    'Education': 'hsl(200, 70%, 50%)',
    'Savings': 'hsl(140, 70%, 45%)',
    'Investments': 'hsl(260, 70%, 50%)',
    'Insurance': 'hsl(40, 70%, 50%)',
    'Debt Payments': 'hsl(0, 70%, 50%)',
    'Travel': 'hsl(100, 60%, 50%)',
    'Income': 'hsl(120, 70%, 40%)',
    'Other': 'hsl(0, 0%, 50%)'
  };
  
  return colors[normalizeCategoryName(category)] || colors['Other'];
};

/**
 * Checks if a category is an income category
 * @param category - The category name to check
 * @returns True if it's an income category
 */
export const isIncomeCategory = (category: string): boolean => {
  return normalizeCategoryName(category) === 'Income';
};

/**
 * Checks if a category is an expense category
 * @param category - The category name to check
 * @returns True if it's an expense category (excludes Income and Transfer)
 */
export const isExpenseCategory = (category: string): boolean => {
  const normalized = normalizeCategoryName(category);
  return normalized !== 'Income' && normalized !== 'Transfer';
};