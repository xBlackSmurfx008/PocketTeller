#!/bin/bash

# Diagnostic Script: Missing Bank Button on Dashboard
# This script helps identify why the "Connect Your Bank" card isn't showing

echo "========================================"
echo "🔍 Bank Button Diagnostic Tool"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in PocketTeller root directory${NC}"
    echo "Please run this script from: /Users/mr.adams/pockettellerxchanges/PocketTeller"
    exit 1
fi

echo -e "${GREEN}✅ In correct directory${NC}"
echo ""

# 2. Check if Dashboard.tsx has the debugging code
echo "🔍 Checking Dashboard.tsx for debug logs..."
if grep -q "Dashboard: Checking Plaid connection" src/components/Dashboard.tsx; then
    echo -e "${GREEN}✅ Debug logs are present${NC}"
else
    echo -e "${RED}❌ Debug logs missing - they should have been added${NC}"
fi
echo ""

# 3. Check if the bank card code exists
echo "🔍 Checking for bank connection card code..."
if grep -q "Connect Your Bank" src/components/Dashboard.tsx; then
    echo -e "${GREEN}✅ Bank card code exists${NC}"
else
    echo -e "${RED}❌ Bank card code missing!${NC}"
fi
echo ""

# 4. Check environment variables
echo "🔍 Checking environment variables..."
if [ -f ".env.local" ] || [ -f ".env" ]; then
    echo -e "${GREEN}✅ Environment file exists${NC}"
    
    if grep -q "VITE_SUPABASE_URL" .env.local 2>/dev/null || grep -q "VITE_SUPABASE_URL" .env 2>/dev/null; then
        echo -e "${GREEN}✅ Supabase URL configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Supabase URL not found${NC}"
    fi
else
    echo -e "${RED}❌ No .env file found${NC}"
fi
echo ""

# 5. Check if node_modules exists
echo "🔍 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Dependencies missing - run: npm install${NC}"
fi
echo ""

# 6. Check if dist directory is stale
echo "🔍 Checking build status..."
if [ -d "dist" ]; then
    DIST_AGE=$(find dist -type f -name "index.html" -mtime +1 2>/dev/null | wc -l)
    if [ "$DIST_AGE" -gt "0" ]; then
        echo -e "${YELLOW}⚠️  Build is older than 24 hours - consider rebuilding${NC}"
        echo "   Run: npm run build"
    else
        echo -e "${GREEN}✅ Recent build found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No dist directory - run: npm run build${NC}"
fi
echo ""

# 7. Check for TypeScript errors
echo "🔍 Checking for TypeScript errors in Dashboard.tsx..."
npx tsc --noEmit src/components/Dashboard.tsx 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No TypeScript errors${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript errors found (see above)${NC}"
fi
echo ""

# 8. Instructions
echo "========================================"
echo "📋 NEXT STEPS"
echo "========================================"
echo ""
echo "1. ${YELLOW}REBUILD THE APP:${NC}"
echo "   npm run build && npm run dev"
echo ""
echo "2. ${YELLOW}OPEN BROWSER CONSOLE:${NC}"
echo "   - Navigate to http://localhost:5173/home"
echo "   - Open DevTools (F12)"
echo "   - Look for logs starting with 🔍 🎨 ✅ ❌"
echo ""
echo "3. ${YELLOW}CHECK THESE VALUES IN CONSOLE:${NC}"
echo "   - isDemo: should be ${GREEN}false${NC}"
echo "   - hasPlaidToken: should be ${GREEN}false${NC}"
echo "   - shouldShowBankCard: should be ${GREEN}true${NC}"
echo ""
echo "4. ${YELLOW}IF ISSUES PERSIST:${NC}"
echo "   Run in browser console:"
echo "   ${GREEN}sessionStorage.removeItem('demo-state');${NC}"
echo "   ${GREEN}location.reload();${NC}"
echo ""
echo "5. ${YELLOW}CHECK DATABASE (Supabase):${NC}"
echo "   - Go to Supabase Dashboard"
echo "   - Table Editor → plaid_items"
echo "   - Should be EMPTY (0 rows) for your user"
echo ""
echo "========================================"
echo "📖 For detailed guide, see:"
echo "   DIAGNOSE_BANK_BUTTON.md"
echo "========================================"

