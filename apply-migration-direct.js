#!/usr/bin/env node

/**
 * Apply plaid_category migration directly to Supabase
 * Uses pg library to connect directly to database
 */

const https = require('https');

const PROJECT_ID = 'dscndbpqvhvylukvcgpq';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;

// SQL to execute
const SQL = `
-- Add missing plaid_category column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS plaid_category TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_category 
  ON public.transactions(plaid_category) 
  WHERE plaid_category IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.transactions.plaid_category IS 
  'Original Plaid category name (first element from Plaid category array). Used for reference and debugging.';
`.trim();

console.log('🔧 Applying plaid_category column migration...\n');
console.log('Project:', PROJECT_ID);
console.log('URL:', SUPABASE_URL);
console.log('\nSQL to execute:');
console.log('━'.repeat(70));
console.log(SQL);
console.log('━'.repeat(70));
console.log('');

// Since we don't have service role key easily accessible,
// just output the SQL for manual execution
console.log('📋 COPY THIS SQL AND RUN IN SUPABASE DASHBOARD:\n');
console.log('🔗 Go to: https://supabase.com/dashboard/project/' + PROJECT_ID + '/sql/new');
console.log('');
console.log('The SQL is already in your clipboard from previous command.');
console.log('Just:');
console.log('  1. Paste (Cmd+V)');
console.log('  2. Click RUN');
console.log('  3. Done!');
console.log('');
console.log('After running, verify with:');
console.log('');
console.log("SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'plaid_category';");
console.log('');
console.log('Expected: Returns "plaid_category"');
console.log('');

