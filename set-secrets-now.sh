#!/bin/bash

# Quick Supabase Secrets Setup for PocketTeller
# This script will set all the secrets we have

echo "═══════════════════════════════════════════════════════════════"
echo "🔐 Setting Supabase Secrets - PocketTeller"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we have access token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  No SUPABASE_ACCESS_TOKEN found${NC}"
    echo ""
    echo "To set secrets, you need an access token from:"
    echo "https://supabase.com/dashboard/account/tokens"
    echo ""
    echo "Once you have it, run:"
    echo "export SUPABASE_ACCESS_TOKEN=your_token_here"
    echo "./set-secrets-now.sh"
    echo ""
    exit 1
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "Linking to Supabase project..."
echo ""

# Try to link (will use access token)
supabase link --project-ref dscndbpqvhvylukvcgpq 2>&1 | grep -v "Enter your database password" || true

echo ""
echo "Setting secrets..."
echo "-------------------"

# Set Gemini API Key (we have this!)
echo ""
echo -e "${GREEN}Setting GEMINI_API_KEY...${NC}"
supabase secrets set GEMINI_API_KEY=AIzaSyAlFtsPR3O-zZXR84tKGgi2j2kc2xClsOg

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ GEMINI_API_KEY set successfully${NC}"
else
    echo -e "${RED}✗ Failed to set GEMINI_API_KEY${NC}"
fi

echo ""
echo "-------------------"
echo ""
echo -e "${YELLOW}For Stripe keys, you need to get them from:${NC}"
echo "https://dashboard.stripe.com/apikeys"
echo ""
echo "Then run:"
echo "supabase secrets set STRIPE_SECRET_KEY_TEST=sk_test_your_key"
echo "supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret"
echo ""

echo "Checking current secrets..."
echo ""
supabase secrets list

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Gemini API key has been set!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Get Stripe keys from dashboard"
echo "2. Set them with: supabase secrets set"
echo "3. Deploy functions: supabase functions deploy gemini-chat"
echo ""

