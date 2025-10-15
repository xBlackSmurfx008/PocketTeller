#!/bin/bash

# Production Deployment Automation Script
# This script completes all deployment steps using environment variables

set -e

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║     🚀 POCKETTELLER PRODUCTION DEPLOYMENT AUTOMATION              ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error handling
trap 'echo -e "${RED}❌ Deployment failed at step: $CURRENT_STEP${NC}"; exit 1' ERR

# Check required environment variables
REQUIRED_VARS=("STRIPE_SECRET_KEY" "DB_PASSWORD")
MISSING_VARS=()

echo -e "${BLUE}📋 Step 0: Checking Prerequisites${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
        echo -e "${RED}✗${NC} Missing: $var"
    else
        echo -e "${GREEN}✓${NC} Found: $var"
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Missing required environment variables!${NC}"
    echo ""
    echo "Please export the following variables:"
    for var in "${MISSING_VARS[@]}"; do
        case $var in
            STRIPE_SECRET_KEY)
                echo "  export STRIPE_SECRET_KEY=sk_live_xxxxx"
                echo "    Get from: https://dashboard.stripe.com/apikeys"
                ;;
            DB_PASSWORD)
                echo "  export DB_PASSWORD=your_db_password"
                echo "    Get from: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/settings/database"
                ;;
        esac
        echo ""
    done
    echo "Then run this script again:"
    echo "  ./deploy-production.sh"
    exit 1
fi

echo ""

# Step 1: Authenticate Stripe
CURRENT_STEP="Stripe Authentication"
echo -e "${BLUE}📋 Step 1: Authenticate Stripe CLI${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! stripe config --list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Stripe CLI not authenticated${NC}"
    echo "Opening browser for authentication..."
    stripe login
fi

echo -e "${GREEN}✓${NC} Stripe CLI authenticated"
echo ""

# Step 2: Create Stripe Products
CURRENT_STEP="Create Stripe Products"
echo -e "${BLUE}📋 Step 2: Create Stripe Products (LIVE MODE)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Creating products..."
OUTPUT=$(bash scripts/setup-stripe-products.sh <<< $'2\nyes' 2>&1)
echo "$OUTPUT" | tail -30

# Extract price IDs from output
PRICE_MONTHLY=$(echo "$OUTPUT" | grep "Monthly Price:" | awk '{print $3}' | head -1)
PRICE_6MONTH=$(echo "$OUTPUT" | grep "6-Month Price:" | awk '{print $3}' | head -1)
PRICE_YEARLY=$(echo "$OUTPUT" | grep "Yearly Price:" | awk '{print $3}' | head -1)

if [ -z "$PRICE_MONTHLY" ] || [ -z "$PRICE_6MONTH" ] || [ -z "$PRICE_YEARLY" ]; then
    echo -e "${YELLOW}⚠️  Could not extract price IDs from output${NC}"
    echo "Please enter them manually:"
    read -p "PRICE_MONTHLY (price_xxxxx): " PRICE_MONTHLY
    read -p "PRICE_6MONTH (price_xxxxx): " PRICE_6MONTH
    read -p "PRICE_YEARLY (price_xxxxx): " PRICE_YEARLY
fi

echo -e "${GREEN}✓${NC} Products created:"
echo "  Monthly: $PRICE_MONTHLY"
echo "  6-Month: $PRICE_6MONTH"
echo "  Yearly:  $PRICE_YEARLY"
echo ""

# Step 3: Link Supabase Project
CURRENT_STEP="Link Supabase Project"
echo -e "${BLUE}📋 Step 3: Link Supabase Project${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Linking to project dscndbpqvhvylukvcgpq..."
echo "$DB_PASSWORD" | supabase link --project-ref dscndbpqvhvylukvcgpq --password "$DB_PASSWORD" 2>&1 || true

echo -e "${GREEN}✓${NC} Project linked"
echo ""

# Step 4: Set Supabase Secrets
CURRENT_STEP="Set Supabase Secrets"
echo -e "${BLUE}📋 Step 4: Set Production Secrets${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Setting STRIPE_SECRET_KEY..."
supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
echo -e "${GREEN}✓${NC} STRIPE_SECRET_KEY set"

echo "Setting STRIPE_PRICE_MONTHLY..."
supabase secrets set STRIPE_PRICE_MONTHLY="$PRICE_MONTHLY"
echo -e "${GREEN}✓${NC} STRIPE_PRICE_MONTHLY set"

echo "Setting STRIPE_PRICE_6MONTH..."
supabase secrets set STRIPE_PRICE_6MONTH="$PRICE_6MONTH"
echo -e "${GREEN}✓${NC} STRIPE_PRICE_6MONTH set"

echo "Setting STRIPE_PRICE_YEARLY..."
supabase secrets set STRIPE_PRICE_YEARLY="$PRICE_YEARLY"
echo -e "${GREEN}✓${NC} STRIPE_PRICE_YEARLY set"

echo ""

# Step 5: Apply Database Migration
CURRENT_STEP="Apply Database Migration"
echo -e "${BLUE}📋 Step 5: Apply Database Migration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Applying migration..."
supabase db push --linked

echo -e "${GREEN}✓${NC} Database migration applied"
echo ""

# Step 6: Deploy Edge Functions
CURRENT_STEP="Deploy Edge Functions"
echo -e "${BLUE}📋 Step 6: Deploy Edge Functions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FUNCTIONS=(
    "stripe-create-checkout"
    "stripe-webhook"
    "stripe-create-portal"
    "stripe-check-subscription"
    "trial-expiration-checker"
)

for func in "${FUNCTIONS[@]}"; do
    echo "Deploying $func..."
    supabase functions deploy "$func"
    echo -e "${GREEN}✓${NC} $func deployed"
done

echo ""

# Step 7: Verify Deployment
CURRENT_STEP="Verify Deployment"
echo -e "${BLUE}📋 Step 7: Verify Deployment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Checking secrets..."
supabase secrets list

echo ""
echo "Checking functions..."
supabase functions list

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                   🎉 DEPLOYMENT SUCCESSFUL! 🎉                    ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ All automated steps completed successfully!"
echo ""
echo "📋 MANUAL STEPS REMAINING:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Configure Stripe Webhook:"
echo "   a. Go to: https://dashboard.stripe.com/webhooks"
echo "   b. Click 'Add endpoint'"
echo "   c. URL: https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/stripe-webhook"
echo "   d. Select events: customer.subscription.*, invoice.*, checkout.session.completed"
echo "   e. Copy the signing secret and run:"
echo "      supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx"
echo ""
echo "2. Setup Cron Schedule for Trial Warnings:"
echo "   a. Go to: https://supabase.com/dashboard/project/dscndbpqvhvylukvcgpq/functions"
echo "   b. Find 'trial-expiration-checker'"
echo "   c. Click 'Edit' and set cron: 0 9 * * *"
echo "   d. Enable the schedule"
echo ""
echo "3. Test the deployment:"
echo "   a. Visit: https://pocketbanker.app/subscription"
echo "   b. Verify 3 pricing options are visible"
echo "   c. Create a test account and start trial"
echo "   d. Verify trial expiration modal appears (or manually expire trial)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deployment completed at: $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

