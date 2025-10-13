#!/bin/bash

# Quick API Keys Status Check for PocketTeller
echo "═══════════════════════════════════════════════════════════════"
echo "🔐 PocketTeller API Keys Status Check"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "CLIENT-SIDE (.env file):"
echo "------------------------"
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    if grep -q "VITE_SUPABASE_URL" .env; then
        echo -e "${GREEN}✓${NC} VITE_SUPABASE_URL configured"
    else
        echo -e "${RED}✗${NC} VITE_SUPABASE_URL missing"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✓${NC} VITE_SUPABASE_ANON_KEY configured"
    else
        echo -e "${RED}✗${NC} VITE_SUPABASE_ANON_KEY missing"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
    echo "   Create it from .env.example"
fi

echo ""
echo "SERVER-SIDE (Supabase Secrets):"
echo "--------------------------------"

if command -v supabase &> /dev/null; then
    SECRETS=$(supabase secrets list 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        # Check core secrets
        if echo "$SECRETS" | grep -q "GEMINI_API_KEY"; then
            echo -e "${GREEN}✓${NC} GEMINI_API_KEY configured"
        else
            echo -e "${YELLOW}⚠${NC} GEMINI_API_KEY not set (AI features won't work)"
        fi
        
        if echo "$SECRETS" | grep -q "STRIPE_SECRET_KEY"; then
            echo -e "${GREEN}✓${NC} STRIPE_SECRET_KEY configured"
        elif echo "$SECRETS" | grep -q "STRIPE_SECRET_KEY_TEST"; then
            echo -e "${GREEN}✓${NC} STRIPE_SECRET_KEY_TEST configured (test mode)"
        else
            echo -e "${YELLOW}⚠${NC} STRIPE_SECRET_KEY not set (payments won't work)"
        fi
        
        if echo "$SECRETS" | grep -q "STRIPE_WEBHOOK_SECRET"; then
            echo -e "${GREEN}✓${NC} STRIPE_WEBHOOK_SECRET configured"
        else
            echo -e "${YELLOW}⚠${NC} STRIPE_WEBHOOK_SECRET not set (webhooks won't verify)"
        fi
        
        # Check Plaid secrets
        if echo "$SECRETS" | grep -q "PLAID_CLIENT_ID"; then
            echo -e "${GREEN}✓${NC} PLAID_CLIENT_ID configured"
        else
            echo -e "${YELLOW}⚠${NC} PLAID_CLIENT_ID not set (bank linking won't work)"
        fi
    else
        echo -e "${YELLOW}⚠${NC} Not linked to Supabase project"
        echo "   Run: supabase link --project-ref dscndbpqvhvylukvcgpq"
    fi
else
    echo -e "${YELLOW}⚠${NC} Supabase CLI not installed"
    echo "   Install: npm install -g supabase"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📖 For detailed setup: API_KEYS_CONFIGURATION.md"
echo "🔧 To set secrets: supabase secrets set KEY_NAME=value"
echo "═══════════════════════════════════════════════════════════════"
