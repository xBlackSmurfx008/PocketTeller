#!/bin/bash

# Supabase Secrets Verification Script
# Verifies all required secrets are configured in Supabase

echo "🔐 Verifying Supabase Secrets Configuration"
echo "==========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "Checking required secrets..."
echo ""

# List of required secrets for CORE functionality
REQUIRED_SECRETS=(
    "GEMINI_API_KEY"                    # AI chat, categorization, insights
    "STRIPE_SECRET_KEY"                 # Payment processing (or STRIPE_SECRET_KEY_TEST for dev)
    "STRIPE_WEBHOOK_SECRET"             # Stripe webhook verification
)

# List of required secrets for PLAID functionality
PLAID_SECRETS=(
    "PLAID_CLIENT_ID"                   # Plaid API client ID
    "PLAID_SECRET"                      # Plaid API secret
    "PLAID_ENV"                         # Plaid environment (sandbox/development/production)
    "PLAID_ENCRYPTION_KEY"              # Plaid data encryption
)

# Optional secrets
OPTIONAL_SECRETS=(
    "STRIPE_PRICE_MONTHLY"              # Stripe monthly price ID
    "STRIPE_PRICE_YEARLY"               # Stripe yearly price ID
    "PLAID_WEBHOOK_VERIFICATION_KEY"    # Plaid webhook verification
    "RESEND_API_KEY"                    # Email notifications
    "TWILIO_ACCOUNT_SID"                # SMS notifications
    "TWILIO_AUTH_TOKEN"                 # SMS auth
    "TWILIO_PHONE_NUMBER"               # SMS sender
)

PASSED=0
FAILED=0
WARNINGS=0

echo "Core Required Secrets:"
echo "---------------------"

# Get list of configured secrets
SECRETS_LIST=$(supabase secrets list 2>/dev/null || echo "ERROR")

if [ "$SECRETS_LIST" = "ERROR" ]; then
    echo -e "${RED}✗ Failed to retrieve secrets. Make sure you're linked to a Supabase project.${NC}"
    echo "Run: supabase link --project-ref dscndbpqvhvylukvcgpq"
    exit 1
fi

for secret in "${REQUIRED_SECRETS[@]}"; do
    SECRET_NAME=$(echo "$secret" | awk '{print $1}')
    SECRET_DESC=$(echo "$secret" | cut -d'#' -f2- | xargs)
    if echo "$SECRETS_LIST" | grep -q "^$SECRET_NAME"; then
        echo -e "${GREEN}✓${NC} $SECRET_NAME - $SECRET_DESC"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $SECRET_NAME - $SECRET_DESC"
        ((FAILED++))
    fi
done

echo ""
echo "Plaid Integration Secrets:"
echo "--------------------------"

for secret in "${PLAID_SECRETS[@]}"; do
    SECRET_NAME=$(echo "$secret" | awk '{print $1}')
    SECRET_DESC=$(echo "$secret" | cut -d'#' -f2- | xargs)
    if echo "$SECRETS_LIST" | grep -q "^$SECRET_NAME"; then
        echo -e "${GREEN}✓${NC} $SECRET_NAME - $SECRET_DESC"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} $SECRET_NAME - $SECRET_DESC"
        ((WARNINGS++))
    fi
done

echo ""
echo "Optional Secrets:"
echo "----------------"

for secret in "${OPTIONAL_SECRETS[@]}"; do
    SECRET_NAME=$(echo "$secret" | awk '{print $1}')
    SECRET_DESC=$(echo "$secret" | cut -d'#' -f2- | xargs)
    if echo "$SECRETS_LIST" | grep -q "^$SECRET_NAME"; then
        echo -e "${GREEN}✓${NC} $SECRET_NAME - $SECRET_DESC"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} $SECRET_NAME - $SECRET_DESC (optional)"
        ((WARNINGS++))
    fi
done

echo ""
echo "==========================================="
echo "Summary"
echo "==========================================="
echo -e "${GREEN}Configured: $PASSED${NC}"
echo -e "${RED}Missing: $FAILED${NC}"
echo -e "${YELLOW}Optional: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All required secrets are configured!${NC}"
    echo ""
    echo "To set a missing secret, use:"
    echo "  supabase secrets set SECRET_NAME=value"
    exit 0
else
    echo -e "${RED}✗ Some required secrets are missing.${NC}"
    echo ""
    echo "Configure missing secrets with:"
    echo ""
    
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if ! echo "$SECRETS_LIST" | grep -q "$secret"; then
            echo "  supabase secrets set $secret=your_${secret,,}_value"
        fi
    done
    
    echo ""
    echo "For production, use:"
    echo "  supabase secrets set PLAID_ENV=production"
    echo "  supabase secrets set PLAID_ENCRYPTION_KEY=\$(openssl rand -hex 32)"
    exit 1
fi

