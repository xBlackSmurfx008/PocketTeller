/**
 * Account Categories Utility
 * Categorizes bank accounts into Assets vs Debts based on account type
 */

export interface AccountSummary {
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
}

/**
 * Determines if an account type represents a debt/liability
 * Based on Plaid account types
 */
export function isDebtAccount(type: string, subtype?: string | null): boolean {
  const accountType = type.toLowerCase();
  const accountSubtype = subtype?.toLowerCase() || '';
  
  // Debt account types
  const debtTypes = [
    'credit',        // Credit cards
    'loan',          // All loans
    'mortgage',      // Mortgages
  ];
  
  // Debt subtypes
  const debtSubtypes = [
    'credit card',
    'auto',          // Auto loans
    'student',       // Student loans
    'mortgage',      // Mortgage loans
    'line of credit',
    'home equity',
    'personal',      // Personal loans
  ];
  
  return debtTypes.includes(accountType) || debtSubtypes.some(dt => accountSubtype.includes(dt));
}

/**
 * Determines if an account type represents an asset
 */
export function isAssetAccount(type: string, subtype?: string | null): boolean {
  return !isDebtAccount(type, subtype);
}

/**
 * Categorizes account balance as asset or debt
 * Returns positive number for debts (absolute value)
 */
export function categorizeAccountBalance(
  balance: number,
  type: string,
  subtype?: string | null
): { asset: number; debt: number } {
  const isDebt = isDebtAccount(type, subtype);
  
  if (isDebt) {
    // For debt accounts (credit cards, loans), balance might be negative or positive
    // We want to show debt as a positive number
    return {
      asset: 0,
      debt: Math.abs(balance)
    };
  } else {
    // For asset accounts (checking, savings), show actual balance
    return {
      asset: balance,
      debt: 0
    };
  }
}

/**
 * Calculates total assets and debts from accounts
 */
export function calculateAccountSummary(
  accounts: Array<{
    available_balance?: number | null;
    current_balance?: number | null;
    type: string;
    subtype?: string | null;
  }>
): AccountSummary {
  let totalAssets = 0;
  let totalDebts = 0;
  
  accounts.forEach((account) => {
    // For checking accounts, prioritize available_balance; for others use current_balance
    let balance = 0;
    if (account.type === 'depository' && account.subtype === 'checking') {
      balance = account.available_balance !== null && account.available_balance !== undefined 
        ? Number(account.available_balance) 
        : Number(account.current_balance) || 0;
    } else {
      balance = Number(account.current_balance) || Number(account.available_balance) || 0;
    }
    
    const { asset, debt } = categorizeAccountBalance(balance, account.type, account.subtype);
    
    totalAssets += asset;
    totalDebts += debt;
  });
  
  return {
    totalAssets,
    totalDebts,
    netWorth: totalAssets - totalDebts
  };
}

/**
 * Gets a human-readable label for account type
 */
export function getAccountTypeLabel(type: string, subtype?: string | null): string {
  if (isDebtAccount(type, subtype)) {
    if (subtype) {
      return `${capitalize(subtype)} (Debt)`;
    }
    return `${capitalize(type)} (Debt)`;
  }
  
  if (subtype) {
    return capitalize(subtype);
  }
  return capitalize(type);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

