# 🏦 LIVE API Configuration - Critical Knowledge Base

**Date**: September 24, 2025  
**Status**: CRITICAL INFORMATION  
**Purpose**: Document live Plaid API configuration

---

## 🚨 **CRITICAL UNDERSTANDING**

### **financemanager-ai.git = LIVE WORKING VERSION**
- **URL**: `https://github.com/xBlackSmurfx008/financemanager-ai.git`
- **Status**: **LIVE PRODUCTION VERSION**
- **Plaid API**: **LIVE PRODUCTION API** (not sandbox)
- **Supabase Project**: `dscndbpqvhvylukvcgpq` (SAME as PocketTeller)
- **Environment**: Production Plaid API with live credentials

### **PocketTeller = Enhanced Version**
- **URL**: `https://github.com/xBlackSmurfx008/PocketTeller.git`
- **Status**: Enhanced version with same codebase
- **Supabase Project**: `dscndbpqvhvylukvcgpq` (SAME project)
- **Current Issue**: May be using sandbox Plaid API

---

## 🔧 **Current Supabase Configuration**

### **Project Details**
- **Project ID**: `dscndbpqvhvylukvcgpq`
- **URL**: `https://dscndbpqvhvylukvcgpq.supabase.co`
- **Status**: Fully operational with all functions deployed

### **Plaid API Configuration**
The code defaults to sandbox but the LIVE version has production secrets:

```typescript
// Code default (both repositories)
const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';

// LIVE VERSION has this set in Supabase secrets:
// PLAID_ENV=production
// PLAID_CLIENT_ID=live_production_client_id
// PLAID_SECRET=live_production_secret
```

---

## 🎯 **Required Action for PocketTeller**

### **Current Status**
- **PocketTeller**: May be using sandbox Plaid API
- **financemanager-ai**: Using live production Plaid API
- **Same Supabase Project**: Both use `dscndbpqvhvylukvcgpq`

### **Required Configuration**
To make PocketTeller use the LIVE Plaid API (same as financemanager-ai):

```bash
# Update Supabase secrets to match live version
supabase secrets set PLAID_ENV=production
supabase secrets set PLAID_CLIENT_ID=live_production_client_id
supabase secrets set PLAID_SECRET=live_production_secret
```

---

## 🔍 **Verification Steps**

### **Check Current Configuration**
```bash
# Check current Supabase secrets
supabase secrets list

# Verify Plaid environment
# Should show PLAID_ENV=production for live API
```

### **Test Plaid Integration**
1. **Connect Bank Account**: Test with real bank
2. **Verify Transactions**: Ensure real transaction data
3. **Check API Calls**: Monitor for production Plaid endpoints

---

## 📊 **Repository Comparison**

### **Code Comparison**
- **✅ IDENTICAL**: Both repositories have identical code
- **✅ SAME SUPABASE**: Both use same Supabase project
- **⚠️ DIFFERENT SECRETS**: Different Plaid API configuration

### **Key Differences**
| Aspect | financemanager-ai (LIVE) | PocketTeller (Local) |
|--------|-------------------------|---------------------|
| **Plaid API** | Production (Live) | Sandbox (Default) |
| **Supabase Project** | dscndbpqvhvylukvcgpq | dscndbpqvhvylukvcgpq |
| **Code** | Identical | Identical |
| **Status** | Live Working | Enhanced Version |

---

## 🚀 **Production Deployment Strategy**

### **Option 1: Use Same Supabase Project**
- **Advantage**: Same live Plaid API configuration
- **Risk**: May conflict with live version
- **Recommendation**: Use separate Supabase project

### **Option 2: Create New Supabase Project**
- **Advantage**: Isolated environment
- **Required**: Set up new Plaid production credentials
- **Recommendation**: **RECOMMENDED APPROACH**

### **Option 3: Update Existing Project**
- **Advantage**: Keep same project
- **Required**: Coordinate with live version
- **Risk**: May affect live version

---

## 🎯 **Recommended Action Plan**

### **Immediate Steps**
1. **Verify Current Secrets**: Check what Plaid API PocketTeller is using
2. **Obtain Production Credentials**: Get new Plaid production API keys
3. **Create New Supabase Project**: Set up isolated environment
4. **Configure Production API**: Set up new project with production Plaid

### **Long-term Strategy**
1. **Separate Environments**: Keep live and development separate
2. **Independent Deployment**: Deploy PocketTeller independently
3. **Monitor Both**: Track both versions separately

---

## ⚠️ **Critical Warnings**

### **DO NOT**
- ❌ Change secrets in live Supabase project without coordination
- ❌ Deploy to same environment as live version
- ❌ Use sandbox API in production

### **DO**
- ✅ Verify current configuration before making changes
- ✅ Use separate Supabase project for PocketTeller
- ✅ Test thoroughly before production deployment
- ✅ Coordinate with live version if sharing resources

---

## 📞 **Next Steps**

1. **Check Current Configuration**: Verify what Plaid API PocketTeller is using
2. **Plan Deployment Strategy**: Decide on Supabase project approach
3. **Obtain Production Credentials**: Get new Plaid production API keys
4. **Set Up Production Environment**: Configure for live deployment

---

**Last Updated**: September 24, 2025  
**Status**: Critical Information - Action Required  
**Priority**: HIGH - Production deployment planning
