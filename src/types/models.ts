// Centralized domain type definitions
// All components should import from here to avoid duplication

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account_id?: string;
  category_source?: 'user' | 'plaid' | 'ai' | 'auto';
  plaid_category?: string;
  category_confidence?: number;
  category_reason?: string;
  category_model?: string;
  plaid_transaction_id?: string;
  plaid_account_id?: string;
  merchant_name?: string;
  subcategory?: string;
  location?: {
    address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    lat?: number;
    lon?: number;
    store_number?: string;
  };
  payment_meta?: {
    reference_number?: string;
    ppd_id?: string;
    payee?: string;
    by_order_of?: string;
    payer?: string;
    payment_method?: string;
    payment_processor?: string;
    reason?: string;
  };
  pending?: boolean;
  datetime?: string;
  authorized_date?: string;
  authorized_datetime?: string;
  iso_currency_code?: string;
  unofficial_currency_code?: string;
  transaction_id?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface Goal {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  created_at?: string;
  updated_at?: string;
  user_id: string;
}

export interface CategoryBudget {
  id: string;
  name: string;
  planned: number;
  actual: number;
}

export interface BudgetData {
  income: number;
  categories: CategoryBudget[];
}

export interface TotalsData {
  income: number;
  expenses: number;
  net: number;
}

export interface FinancialData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export interface GroupedTransactions {
  [category: string]: Transaction[];
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  current_balance?: number;
  available_balance?: number;
  type: string;
  subtype?: string;
  account_id?: string;
  plaid_account_id?: string;
  institution_name?: string;
  institution_id?: string;
  mask?: string;
  official_name?: string;
  currency_code?: string;
  credit_limit?: number;
  source?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}