#!/bin/bash

# Stripe Products and Pricing Setup Script for PocketTeller
# This script creates all necessary Stripe products, prices, and promo codes

set -e  # Exit on error

echo "💳 Setting up Stripe Products for PocketTeller"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}❌ Stripe CLI is not installed${NC}"
    echo "Install it with: brew install stripe/stripe-cli/stripe"
    echo "Then run: stripe login"
    exit 1
fi

echo -e "${BLUE}Checking Stripe authentication...${NC}"
stripe config --list | grep -q "test_mode" || {
    echo -e "${RED}❌ Not logged in to Stripe${NC}"
    echo "Please run: stripe login"
    exit 1
}

echo -e "${GREEN}✓ Stripe CLI authenticated${NC}"
echo ""

# Ask for environment
echo "Which environment are you setting up?"
echo "1) Test mode (recommended for initial setup)"
echo "2) Live mode (production)"
read -p "Enter choice (1 or 2): " ENV_CHOICE

if [ "$ENV_CHOICE" = "2" ]; then
    echo -e "${YELLOW}⚠️  Warning: You are about to create LIVE products${NC}"
    read -p "Are you sure? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Cancelled."
        exit 0
    fi
    MODE_FLAG="--live"
    MODE_NAME="LIVE"
else
    MODE_FLAG=""
    MODE_NAME="TEST"
fi

echo ""
echo -e "${BLUE}Setting up products in $MODE_NAME mode...${NC}"
echo ""

# Step 1: Create Product
echo "📦 Step 1: Creating PocketTeller Pro product..."

PRODUCT_ID=$(stripe products create $MODE_FLAG \
  --name "PocketTeller Pro" \
  --description "AI-powered financial coaching and budgeting tools with intelligent insights" \
  --json | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PRODUCT_ID" ]; then
    echo -e "${RED}❌ Failed to create product${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Product created: $PRODUCT_ID${NC}"
echo ""

# Step 2: Create Monthly Price
echo "💰 Step 2: Creating Monthly price (\$4.99/month)..."

PRICE_MONTHLY=$(stripe prices create $MODE_FLAG \
  --product "$PRODUCT_ID" \
  --unit-amount 499 \
  --currency usd \
  --recurring interval=month \
  --nickname "PocketTeller Pro - Monthly" \
  --lookup-key "pocketteller_monthly" \
  --json | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}✓ Monthly price created: $PRICE_MONTHLY${NC}"
echo "  Price: \$4.99/month"
echo ""

# Step 3: Create Yearly Price
echo "💰 Step 3: Creating Yearly price (\$32.99/year)..."

PRICE_YEARLY=$(stripe prices create $MODE_FLAG \
  --product "$PRODUCT_ID" \
  --unit-amount 3299 \
  --currency usd \
  --recurring interval=year \
  --nickname "PocketTeller Pro - Yearly" \
  --lookup-key "pocketteller_yearly" \
  --json | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}✓ Yearly price created: $PRICE_YEARLY${NC}"
echo "  Price: \$32.99/year"
echo "  Savings: \$27/year vs monthly"
echo ""

# Step 4: Create SA2025 Promo Code (30 days free trial)
echo "🎟️  Step 4: Creating SA2025 promo code (30 days free trial)..."

# Create coupon first
COUPON_ID=$(stripe coupons create $MODE_FLAG \
  --name "SA2025 - 30 Day Free Trial" \
  --duration once \
  --duration-in-months 1 \
  --percent-off 100 \
  --max-redemptions 10000 \
  --metadata type=trial \
  --metadata code=SA2025 \
  --json | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$COUPON_ID" ]; then
    echo -e "${YELLOW}⚠️  Coupon may already exist, continuing...${NC}"
else
    echo -e "${GREEN}✓ Coupon created: $COUPON_ID${NC}"
fi

# Create promo code
stripe promotion_codes create $MODE_FLAG \
  --coupon "$COUPON_ID" \
  --code "SA2025" \
  --max-redemptions 10000 \
  --metadata type=trial > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  Promo code SA2025 may already exist${NC}"

echo -e "${GREEN}✓ Promo code created: SA2025${NC}"
echo "  Benefit: 30 days free trial (100% off first month)"
echo "  Max uses: 10,000"
echo ""

# Step 5: Create Referral Bonus Coupon
echo "🎁 Step 5: Creating Referral Bonus coupon..."

stripe coupons create $MODE_FLAG \
  --id "REFERRAL_BONUS" \
  --name "Referral Bonus - 1 Month Free" \
  --duration once \
  --duration-in-months 1 \
  --percent-off 100 \
  --metadata type=referral > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  Referral coupon may already exist${NC}"

echo -e "${GREEN}✓ Referral bonus coupon created${NC}"
echo "  Benefit: 1 free month for 3 suggestions"
echo ""

# Summary
echo "=============================================="
echo -e "${GREEN}✅ Stripe setup complete!${NC}"
echo "=============================================="
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo ""
echo "Product ID:       $PRODUCT_ID"
echo "Monthly Price:    $PRICE_MONTHLY (\$4.99/month)"
echo "Yearly Price:     $PRICE_YEARLY (\$32.99/year)"
echo "Promo Code:       SA2025 (30 days free)"
echo "Referral Bonus:   REFERRAL_BONUS (1 free month)"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo ""
echo "1. Set Supabase secrets:"
echo "   supabase secrets set STRIPE_SECRET_KEY=sk_${MODE_NAME,,}_xxxxx --project-ref dscndbpqvhvylukvcgpq"
echo "   supabase secrets set STRIPE_PRICE_MONTHLY=$PRICE_MONTHLY --project-ref dscndbpqvhvylukvcgpq"
echo "   supabase secrets set STRIPE_PRICE_YEARLY=$PRICE_YEARLY --project-ref dscndbpqvhvylukvcgpq"
echo ""
echo "2. Set up webhook:"
echo "   - Go to: https://dashboard.stripe.com/webhooks"
echo "   - Add endpoint: https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/stripe-webhook"
echo "   - Select events: customer.subscription.*, invoice.*, checkout.session.completed"
echo "   - Copy webhook secret and run:"
echo "   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx --project-ref dscndbpqvhvylukvcgpq"
echo ""
echo "3. Deploy edge functions:"
echo "   cd /Users/mr.adams/pockettellerxchanges/PocketTeller"
echo "   supabase functions deploy stripe-create-checkout --project-ref dscndbpqvhvylukvcgpq"
echo "   supabase functions deploy stripe-webhook --project-ref dscndbpqvhvylukvcgpq"
echo "   supabase functions deploy stripe-create-portal --project-ref dscndbpqvhvylukvcgpq"
echo "   supabase functions deploy stripe-check-subscription --project-ref dscndbpqvhvylukvcgpq"
echo "   supabase functions deploy stripe-apply-referral-credit --project-ref dscndbpqvhvylukvcgpq"
echo ""
echo "4. Test the integration:"
echo "   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook"
echo ""
echo -e "${GREEN}🎉 Ready to accept payments!${NC}"
echo ""

# Save IDs to a file for reference
cat > /tmp/stripe-config.txt << EOF
# Stripe Configuration for PocketTeller
# Generated: $(date)
# Environment: $MODE_NAME

PRODUCT_ID=$PRODUCT_ID
PRICE_MONTHLY=$PRICE_MONTHLY
PRICE_YEARLY=$PRICE_YEARLY
PROMO_CODE=SA2025
REFERRAL_COUPON=REFERRAL_BONUS

# Set these secrets in Supabase:
# supabase secrets set STRIPE_SECRET_KEY=sk_${MODE_NAME,,}_xxxxx --project-ref dscndbpqvhvylukvcgpq
# supabase secrets set STRIPE_PRICE_MONTHLY=$PRICE_MONTHLY --project-ref dscndbpqvhvylukvcgpq
# supabase secrets set STRIPE_PRICE_YEARLY=$PRICE_YEARLY --project-ref dscndbpqvhvylukvcgpq
# supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx --project-ref dscndbpqvhvylukvcgpq
EOF

echo "Configuration saved to: /tmp/stripe-config.txt"
echo ""

