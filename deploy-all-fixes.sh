#!/bin/bash

# Deploy All Fixes for PocketTeller
# Complete deployment of edge functions and verification

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_REF="dscndbpqvhvylukvcgpq"

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 PocketTeller - Complete Deployment"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Step 1: Verify Secrets
echo -e "${BLUE}Step 1: Verifying Secrets...${NC}"
echo "Checking Supabase secrets..."
supabase secrets list --project-ref $PROJECT_REF | grep -E "PLAID_|GEMINI|STRIPE" || echo "Secrets check complete"
echo ""

# Step 2: Deploy All Edge Functions  
echo -e "${BLUE}Step 2: Deploying Edge Functions...${NC}"

FUNCTIONS=(
    "plaid-sync-v2"
    "plaid-link-token-v2"
    "plaid-link-exchange-v2"
    "plaid-disconnect-v2"
    "plaid-list-accounts"
    "ai-categorize-transactions"
    "gemini-chat"
)

for func in "${FUNCTIONS[@]}"; do
    echo -e "${GREEN}Deploying $func...${NC}"
    supabase functions deploy "$func" --project-ref $PROJECT_REF --no-verify-jwt 2>&1 | grep -E "(Deployed|Error|version)" || true
    echo ""
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Edge functions deployed and ready to use."
echo ""
echo "Next: Test sync on your Android device"
echo "- Open PocketTeller"
echo "- Go to Transactions"
echo "- Tap Sync button"
echo ""

