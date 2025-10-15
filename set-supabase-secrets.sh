#!/bin/bash

# PocketTeller - Set Supabase Secrets
# This script sets all required secrets found in the documentation

echo "═══════════════════════════════════════════════════════════════"
echo "🔐 Setting Supabase Secrets for PocketTeller"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Project ref
PROJECT_REF="dscndbpqvhvylukvcgpq"

echo "This script will set the following secrets:"
echo "1. GEMINI_API_KEY (for AI features)"
echo "2. STRIPE keys (for payments - TEST mode)"
echo ""
echo -e "${YELLOW}Note: You'll need to authenticate with Supabase first${NC}"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "Step 1: Authenticate with Supabase"
echo "-----------------------------------"
echo "You need to get your access token from:"
echo "https://supabase.com/dashboard/account/tokens"
echo ""
read -p "Enter your Supabase access token (or press Enter to skip): " ACCESS_TOKEN

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}⚠ No access token provided. You can authenticate manually:${NC}"
    echo "export SUPABASE_ACCESS_TOKEN=your_token_here"
    echo "Then run this script again."
    exit 1
fi

# Set the access token
export SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN"

echo ""
echo "Step 2: Link to Supabase Project"
echo "----------------------------------"

# Try to link without password (using access token)
echo "Linking to project: $PROJECT_REF"
supabase link --project-ref $PROJECT_REF --password "" 2>&1 | grep -v "password" || true

echo ""
echo "Step 3: Set Secrets"
echo "-------------------"

# Gemini API Key (from GEMINI_API_SETUP.md)
echo ""
echo -e "${GREEN}Setting GEMINI_API_KEY...${NC}"
supabase secrets set GEMINI_API_KEY=AIzaSyAlFtsPR3O-zZXR84tKGgi2j2kc2xClsOg

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ GEMINI_API_KEY set${NC}"
else
    echo -e "${RED}✗ Failed to set GEMINI_API_KEY${NC}"
fi

# Stripe Test Keys (user needs to provide these)
echo ""
echo -e "${YELLOW}Stripe Keys Setup:${NC}"
echo "You need to get these from: https://dashboard.stripe.com/apikeys"
echo ""
read -p "Enter STRIPE_SECRET_KEY_TEST (or press Enter to skip): " STRIPE_KEY

if [ ! -z "$STRIPE_KEY" ]; then
    echo -e "${GREEN}Setting STRIPE_SECRET_KEY_TEST...${NC}"
    supabase secrets set STRIPE_SECRET_KEY_TEST="$STRIPE_KEY"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ STRIPE_SECRET_KEY_TEST set${NC}"
    else
        echo -e "${RED}✗ Failed to set STRIPE_SECRET_KEY_TEST${NC}"
    fi
fi

read -p "Enter STRIPE_WEBHOOK_SECRET (or press Enter to skip): " WEBHOOK_SECRET

if [ ! -z "$WEBHOOK_SECRET" ]; then
    echo -e "${GREEN}Setting STRIPE_WEBHOOK_SECRET...${NC}"
    supabase secrets set STRIPE_WEBHOOK_SECRET="$WEBHOOK_SECRET"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ STRIPE_WEBHOOK_SECRET set${NC}"
    else
        echo -e "${RED}✗ Failed to set STRIPE_WEBHOOK_SECRET${NC}"
    fi
fi

# Plaid Keys (optional)
echo ""
echo -e "${YELLOW}Plaid Keys Setup (Optional - for bank linking):${NC}"
read -p "Do you want to set Plaid keys now? (y/n): " SET_PLAID

if [ "$SET_PLAID" = "y" ]; then
    read -p "Enter PLAID_CLIENT_ID: " PLAID_CLIENT_ID
    read -p "Enter PLAID_SECRET: " PLAID_SECRET
    read -p "Enter PLAID_ENV (sandbox/development/production): " PLAID_ENV
    
    if [ ! -z "$PLAID_CLIENT_ID" ]; then
        supabase secrets set PLAID_CLIENT_ID="$PLAID_CLIENT_ID"
    fi
    
    if [ ! -z "$PLAID_SECRET" ]; then
        supabase secrets set PLAID_SECRET="$PLAID_SECRET"
    fi
    
    if [ ! -z "$PLAID_ENV" ]; then
        supabase secrets set PLAID_ENV="$PLAID_ENV"
    fi
    
    # Generate encryption key
    echo -e "${GREEN}Generating PLAID_ENCRYPTION_KEY...${NC}"
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    supabase secrets set PLAID_ENCRYPTION_KEY="$ENCRYPTION_KEY"
fi

echo ""
echo "Step 4: Verify Secrets"
echo "----------------------"
supabase secrets list

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Secrets setup complete!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Deploy your edge functions:"
echo "   supabase functions deploy gemini-chat"
echo "   supabase functions deploy ai-categorize-transactions"
echo "   supabase functions deploy stripe-webhook"
echo ""
echo "2. Test the AI chat in your app"
echo "3. Test Stripe checkout"
echo ""
echo "For Stripe setup, see: docs/STRIPE_SETUP_GUIDE.md"
echo "═══════════════════════════════════════════════════════════════"

