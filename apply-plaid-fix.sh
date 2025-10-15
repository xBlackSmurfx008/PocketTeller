#!/bin/bash

# Apply plaid_category column fix directly to Supabase
# Uses Supabase REST API with service role key

PROJECT_ID="dscndbpqvhvylukvcgpq"
SUPABASE_URL="https://${PROJECT_ID}.supabase.co"

echo "🔧 Applying plaid_category column fix to Supabase..."
echo ""

# Get service role key from environment or secrets
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SERVICE_KEY" ]; then
  echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set in environment"
  echo ""
  echo "Checking Supabase secrets..."
  
  # Try to get from supabase secrets
  SERVICE_KEY=$(supabase secrets list 2>/dev/null | grep "SUPABASE_SERVICE_ROLE_KEY" | awk '{print $2}')
  
  if [ -z "$SERVICE_KEY" ]; then
    echo "❌ Could not find service role key"
    echo ""
    echo "Please set it:"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='your_key_here'"
    echo ""
    echo "Get it from: https://supabase.com/dashboard/project/${PROJECT_ID}/settings/api"
    exit 1
  fi
fi

echo "✅ Service role key found"
echo "📡 Connecting to: $SUPABASE_URL"
echo ""

# SQL to execute
SQL="ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS plaid_category TEXT; CREATE INDEX IF NOT EXISTS idx_transactions_plaid_category ON public.transactions(plaid_category) WHERE plaid_category IS NOT NULL;"

# Try using psql with connection string
if command -v /opt/homebrew/opt/libpq/bin/psql &> /dev/null; then
  echo "Using psql to apply migration..."
  
  # Need DB password for direct connection
  if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "⚠️  SUPABASE_DB_PASSWORD not set"
    echo ""
    echo "Get password from: https://supabase.com/dashboard/project/${PROJECT_ID}/settings/database"
    echo "Then run: export SUPABASE_DB_PASSWORD='your_password'"
    echo ""
    echo "OR run this SQL manually in dashboard:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat supabase/migrations/20250826030000_add_plaid_category_column.sql
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
  fi
  
  # Connect and run migration
  DB_HOST="aws-1-us-east-2.pooler.supabase.com"
  DB_PORT="6543"
  DB_NAME="postgres"
  DB_USER="postgres.${PROJECT_ID}"
  CONNECTION_STRING="postgresql://${DB_USER}:${SUPABASE_DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"
  
  echo "Executing SQL migration..."
  /opt/homebrew/opt/libpq/bin/psql "$CONNECTION_STRING" -f supabase/migrations/20250826030000_add_plaid_category_column.sql
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "Verifying..."
    /opt/homebrew/opt/libpq/bin/psql "$CONNECTION_STRING" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'plaid_category';"
    echo ""
    echo "🎉 Done! plaid_category column is now in database."
  else
    echo ""
    echo "❌ Migration failed. Please apply manually."
  fi
else
  echo "❌ psql not found"
  echo ""
  echo "Please run this SQL in Supabase Dashboard:"
  echo "https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new"
  echo ""
  cat supabase/migrations/20250826030000_add_plaid_category_column.sql
fi

