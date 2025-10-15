#!/bin/bash

# Production Deployment Verification Script
# This script checks if all deployment steps are completed

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 PocketTeller Production Deployment Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        ((CHECKS_FAILED++))
        return 1
    fi
}

check_secret() {
    if supabase secrets list 2>/dev/null | grep -q "$1"; then
        echo -e "${GREEN}✓${NC} Secret set: $1"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Secret missing: $1"
        ((CHECKS_FAILED++))
        return 1
    fi
}

echo "📋 Step 1: Checking Prerequisites"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_command "supabase"
check_command "stripe"
check_command "node"
echo ""

echo "📋 Step 2: Checking Supabase Authentication"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if supabase projects list &> /dev/null; then
    echo -e "${GREEN}✓${NC} Supabase CLI authenticated"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Supabase CLI not authenticated"
    echo "   Run: supabase login"
    ((CHECKS_FAILED++))
fi
echo ""

echo "📋 Step 3: Checking Stripe Authentication"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if stripe config --list &> /dev/null; then
    echo -e "${GREEN}✓${NC} Stripe CLI authenticated"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Stripe CLI not authenticated"
    echo "   Run: stripe login"
    ((CHECKS_FAILED++))
fi
echo ""

echo "📋 Step 4: Checking Project Link"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f ".git/config" ] && supabase status &> /dev/null; then
    echo -e "${GREEN}✓${NC} Project is linked to Supabase"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Project may not be linked"
    echo "   Run: supabase link --project-ref dscndbpqvhvylukvcgpq"
    ((CHECKS_FAILED++))
fi
echo ""

echo "📋 Step 5: Checking Supabase Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_secret "STRIPE_SECRET_KEY"
check_secret "STRIPE_PRICE_MONTHLY"
check_secret "STRIPE_PRICE_6MONTH"
check_secret "STRIPE_PRICE_YEARLY"
check_secret "STRIPE_WEBHOOK_SECRET"
echo ""

echo "📋 Step 6: Checking Build Output"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✓${NC} Web build exists (dist/)"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Web build missing"
    echo "   Run: npm run build"
    ((CHECKS_FAILED++))
fi

if [ -d "ios/App/App/public" ] && [ "$(ls -A ios/App/App/public)" ]; then
    echo -e "${GREEN}✓${NC} iOS build synced"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} iOS not synced"
    echo "   Run: npx cap sync ios"
    ((CHECKS_FAILED++))
fi

if [ -d "android/app/src/main/assets/public" ] && [ "$(ls -A android/app/src/main/assets/public)" ]; then
    echo -e "${GREEN}✓${NC} Android build synced"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Android not synced"
    echo "   Run: npx cap sync android"
    ((CHECKS_FAILED++))
fi
echo ""

echo "📋 Step 7: Checking Database Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "supabase/migrations/20251014212730_add_trial_warning_tracking.sql" ]; then
    echo -e "${GREEN}✓${NC} Trial warning migration exists"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Migration file missing"
    ((CHECKS_FAILED++))
fi
echo ""

echo "📋 Step 8: Checking Edge Functions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
FUNCTIONS=("stripe-create-checkout" "stripe-webhook" "stripe-create-portal" "stripe-check-subscription" "trial-expiration-checker")

for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ] && [ -f "supabase/functions/$func/index.ts" ]; then
        echo -e "${GREEN}✓${NC} Function exists: $func"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} Function missing: $func"
        ((CHECKS_FAILED++))
    fi
done
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VERIFICATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Checks Passed:  ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Failed:  ${RED}$CHECKS_FAILED${NC}"
echo ""

TOTAL=$((CHECKS_PASSED + CHECKS_FAILED))
PERCENTAGE=$((CHECKS_PASSED * 100 / TOTAL))

echo "Completion: $PERCENTAGE%"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo "Your deployment is ready for production."
    echo ""
    echo "Next steps:"
    echo "1. Test the subscription page: https://pocketbanker.app/subscription"
    echo "2. Create a test account and verify trial flow"
    echo "3. Monitor Supabase and Stripe dashboards"
else
    echo -e "${YELLOW}⚠️  SOME CHECKS FAILED${NC}"
    echo "Please complete the remaining steps."
    echo ""
    echo "See: PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

