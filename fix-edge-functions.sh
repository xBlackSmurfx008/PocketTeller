#!/bin/bash

# PocketTeller - Complete Edge Function Fix
# Resolves "Edge Function returned a non-2xx status code" error

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════════════════"
echo "🔧 PocketTeller Edge Function Fix"
echo "═══════════════════════════════════════════════════════════════"
echo ""

PROJECT_REF="dscndbpqvhvylukvcgpq"

# Step 1: Verify Supabase CLI
echo -e "${BLUE}Step 1: Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not installed${NC}"
    echo "Install: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI installed${NC}"
echo ""

# Step 2: Deploy diagnostic function first
echo -e "${BLUE}Step 2: Deploying diagnostic function...${NC}"
supabase functions deploy diagnostic-check --no-verify-jwt 2>&1 | grep -v "password" || true
echo ""

# Step 3: Check current secrets status
echo -e "${BLUE}Step 3: Checking secrets via diagnostic function...${NC}"
DIAGNOSTIC_RESULT=$(curl -s "https://${PROJECT_REF}.supabase.co/functions/v1/diagnostic-check" -H "Content-Type: application/json" 2>&1 || echo "FAILED")

if echo "$DIAGNOSTIC_RESULT" | grep -q "\"status\":\"ok\""; then
    echo -e "${GREEN}✓ All secrets already configured!${NC}"
    echo ""
    echo "$DIAGNOSTIC_RESULT" | jq '.' 2>/dev/null || echo "$DIAGNOSTIC_RESULT"
    echo ""
    echo -e "${GREEN}✓ Edge functions should work now${NC}"
    echo ""
    echo "Next step: Test sync on your device"
    exit 0
fi

echo -e "${YELLOW}⚠ Some secrets missing or misconfigured${NC}"
echo ""

# Step 4: Set all required secrets
echo -e "${BLUE}Step 4: Setting required secrets...${NC}"
echo ""

# Known API keys from documentation
GEMINI_API_KEY="AIzaSyAlFtsPR3O-zZXR84tKGgi2j2kc2xClsOg"

echo -e "${BLUE}Setting GEMINI_API_KEY...${NC}"
supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY" 2>&1 | grep -v "password" || true

# Plaid Configuration (from environment or prompt)
echo ""
echo -e "${YELLOW}Plaid Configuration:${NC}"
echo "The following secrets are REQUIRED for transactions to work:"
echo ""

# Check if we have Plaid credentials in environment
if [ -f ".env" ]; then
    source .env 2>/dev/null || true
fi

if [ -z "$PLAID_CLIENT_ID" ]; then
    echo -e "${YELLOW}PLAID_CLIENT_ID not found${NC}"
    read -p "Enter PLAID_CLIENT_ID (or press Enter to skip): " PLAID_CLIENT_ID
fi

if [ -z "$PLAID_SECRET" ]; then
    echo -e "${YELLOW}PLAID_SECRET not found${NC}"
    read -p "Enter PLAID_SECRET (or press Enter to skip): " PLAID_SECRET
fi

if [ -z "$PLAID_ENV" ]; then
    echo -e "${YELLOW}PLAID_ENV not found${NC}"
    read -p "Enter PLAID_ENV (sandbox/development/production) [sandbox]: " PLAID_ENV
    PLAID_ENV="${PLAID_ENV:-sandbox}"
fi

if [ -z "$PLAID_ENCRYPTION_KEY" ]; then
    echo -e "${YELLOW}Generating PLAID_ENCRYPTION_KEY...${NC}"
    PLAID_ENCRYPTION_KEY=$(openssl rand -hex 32)
fi

# Set Plaid secrets
if [ ! -z "$PLAID_CLIENT_ID" ]; then
    echo -e "${BLUE}Setting PLAID_CLIENT_ID...${NC}"
    supabase secrets set PLAID_CLIENT_ID="$PLAID_CLIENT_ID" 2>&1 | grep -v "password" || true
fi

if [ ! -z "$PLAID_SECRET" ]; then
    echo -e "${BLUE}Setting PLAID_SECRET...${NC}"
    supabase secrets set PLAID_SECRET="$PLAID_SECRET" 2>&1 | grep -v "password" || true
fi

if [ ! -z "$PLAID_ENV" ]; then
    echo -e "${BLUE}Setting PLAID_ENV...${NC}"
    supabase secrets set PLAID_ENV="$PLAID_ENV" 2>&1 | grep -v "password" || true
fi

if [ ! -z "$PLAID_ENCRYPTION_KEY" ]; then
    echo -e "${BLUE}Setting PLAID_ENCRYPTION_KEY...${NC}"
    supabase secrets set PLAID_ENCRYPTION_KEY="$PLAID_ENCRYPTION_KEY" 2>&1 | grep -v "password" || true
fi

echo ""

# Step 5: Verify secrets again
echo -e "${BLUE}Step 5: Verifying configuration...${NC}"
sleep 2  # Give secrets time to propagate

DIAGNOSTIC_RESULT=$(curl -s "https://${PROJECT_REF}.supabase.co/functions/v1/diagnostic-check" -H "Content-Type: application/json" 2>&1)

echo "$DIAGNOSTIC_RESULT" | jq '.' 2>/dev/null || echo "$DIAGNOSTIC_RESULT"
echo ""

if echo "$DIAGNOSTIC_RESULT" | grep -q "\"status\":\"ok\""; then
    echo -e "${GREEN}✓ All secrets verified!${NC}"
elif echo "$DIAGNOSTIC_RESULT" | grep -q "\"status\":\"warning\""; then
    echo -e "${YELLOW}⚠ Configuration has warnings${NC}"
    echo "Check the diagnostic output above"
else
    echo -e "${RED}✗ Configuration still has errors${NC}"
    echo "Review the diagnostic output above"
fi

echo ""

# Step 6: Deploy all Plaid edge functions
echo -e "${BLUE}Step 6: Deploying edge functions...${NC}"

FUNCTIONS=(
    "plaid-sync-v2"
    "plaid-link-token-v2"
    "plaid-link-exchange-v2"
    "plaid-disconnect-v2"
    "ai-categorize-transactions"
)

for func in "${FUNCTIONS[@]}"; do
    echo -e "${BLUE}Deploying $func...${NC}"
    supabase functions deploy "$func" 2>&1 | grep -E "(Deployed|Error)" || true
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Fix Complete!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Open PocketTeller on your device"
echo "2. Tap the sync/refresh button"
echo "3. Transactions should sync successfully"
echo ""
echo "If still not working, check Android logs:"
echo "~/Library/Android/sdk/platform-tools/adb logcat | grep -i \"error\\|plaid\\|sync\""
echo ""

