#!/bin/bash

# Production Readiness Verification Script for PocketTeller
# This script checks all critical configurations and dependencies

echo "🚀 PocketTeller Production Readiness Check"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ "$1" = "pass" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    elif [ "$1" = "fail" ]; then
        echo -e "${RED}✗${NC} $2"
        ((FAILED++))
    else
        echo -e "${YELLOW}⚠${NC} $2"
        ((WARNINGS++))
    fi
}

echo "1. Checking Required Dependencies"
echo "--------------------------------"

# Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    print_status "pass" "Node.js installed: $NODE_VERSION"
else
    print_status "fail" "Node.js is not installed"
fi

# npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_status "pass" "npm installed: $NPM_VERSION"
else
    print_status "fail" "npm is not installed"
fi

# Supabase CLI
if command_exists supabase; then
    SUPABASE_VERSION=$(supabase --version)
    print_status "pass" "Supabase CLI installed: $SUPABASE_VERSION"
else
    print_status "warn" "Supabase CLI not installed (optional for local dev)"
fi

echo ""
echo "2. Checking Project Files"
echo "------------------------"

# Check critical files
FILES=(
    "package.json"
    "vite.config.ts"
    "capacitor.config.ts"
    "tailwind.config.ts"
    "tsconfig.json"
    "supabase/config.toml"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "pass" "$file exists"
    else
        print_status "fail" "$file is missing"
    fi
done

echo ""
echo "3. Checking Edge Functions"
echo "-------------------------"

FUNCTIONS=(
    "gemini-chat"
    "plaid-link-exchange"
    "plaid-sync"
    "ai-categorize-transactions"
    "ai-spending-insights"
    "plaid-webhook"
)

for func in "${FUNCTIONS[@]}"; do
    if [ -f "supabase/functions/$func/index.ts" ]; then
        print_status "pass" "$func function exists"
    else
        print_status "fail" "$func function is missing"
    fi
done

echo ""
echo "4. Checking Environment Configuration"
echo "------------------------------------"

# Check for .env or environment variables
if [ -f ".env" ]; then
    print_status "pass" ".env file exists"
    
    # Check for required variables
    if grep -q "VITE_SUPABASE_URL" .env; then
        print_status "pass" "VITE_SUPABASE_URL is configured"
    else
        print_status "fail" "VITE_SUPABASE_URL is missing"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env || grep -q "VITE_SUPABASE_PUBLISHABLE_KEY" .env; then
        print_status "pass" "VITE_SUPABASE_ANON_KEY is configured"
    else
        print_status "fail" "VITE_SUPABASE_ANON_KEY is missing"
    fi
else
    print_status "warn" ".env file not found (may be using system environment variables)"
fi

echo ""
echo "5. Checking Mobile Configuration"
echo "-------------------------------"

# Android
if [ -f "android/app/build.gradle" ]; then
    print_status "pass" "Android configuration exists"
    
    if [ -f "android/key.properties" ]; then
        print_status "pass" "Android signing configuration exists"
    else
        print_status "warn" "Android signing not configured (required for release builds)"
    fi
else
    print_status "fail" "Android configuration missing"
fi

# iOS
if [ -d "ios/App" ]; then
    print_status "pass" "iOS configuration exists"
    
    if [ -f "ios/App/App.xcodeproj/project.pbxproj" ]; then
        print_status "pass" "Xcode project exists"
    else
        print_status "fail" "Xcode project missing"
    fi
else
    print_status "fail" "iOS configuration missing"
fi

echo ""
echo "6. Checking Dependencies Installation"
echo "------------------------------------"

if [ -d "node_modules" ]; then
    print_status "pass" "node_modules directory exists"
    
    # Check for critical packages
    PACKAGES=(
        "@capacitor/core"
        "@capacitor/android"
        "@capacitor/ios"
        "@supabase/supabase-js"
        "react"
        "react-dom"
    )
    
    for pkg in "${PACKAGES[@]}"; do
        if [ -d "node_modules/$pkg" ]; then
            print_status "pass" "$pkg installed"
        else
            print_status "fail" "$pkg not installed"
        fi
    done
else
    print_status "fail" "Dependencies not installed. Run: npm install"
fi

echo ""
echo "7. Build Test"
echo "------------"

# Test if we can build the project
echo "Testing production build..."
if npm run build > /tmp/build-test.log 2>&1; then
    print_status "pass" "Production build successful"
    
    # Check dist folder
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        print_status "pass" "Build output created (Size: $DIST_SIZE)"
    fi
else
    print_status "fail" "Production build failed. Check /tmp/build-test.log for details"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo "Your application is ready for production deployment."
    exit 0
else
    echo -e "${RED}✗ Some critical checks failed.${NC}"
    echo "Please fix the issues above before deploying to production."
    exit 1
fi

