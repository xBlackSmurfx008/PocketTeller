# iOS TestFlight Deployment Process

**Last Updated:** October 15, 2025  
**App:** PocketTeller  
**Bundle ID:** com.pocketteller.app  
**Team ID:** Z3L3NYSA9D  
**Status:** ✅ Successfully Deployed to TestFlight

---

## 📋 Quick Reference

### One-Command Deployment

```bash
# From project root
./deploy-ios-testflight.sh
```

### Manual Deployment (Step by Step)

```bash
# 1. Build web app
npm run build

# 2. Sync to iOS
npx cap sync ios

# 3. Navigate to iOS directory
cd ios

# 4. Archive the app
xcodebuild -workspace App/App.xcworkspace \
  -scheme App \
  -archivePath ~/Library/Developer/Xcode/Archives/App-$(date +%Y%m%d-%H%M%S).xcarchive \
  archive

# 5. Export IPA
xcodebuild -exportArchive \
  -archivePath ~/Library/Developer/Xcode/Archives/App-*.xcarchive \
  -exportPath ./build \
  -exportOptionsPlist exportOptions.plist

# 6. Upload to TestFlight
xcrun altool --upload-app \
  --type ios \
  --file build/App.ipa \
  --apiKey V43L3BZNA9 \
  --apiIssuer e63db961-afb6-44db-a75b-64174d1dea17
```

---

## 🔐 Initial Setup (One-Time)

### 1. App Store Connect API Key

**Key Details:**
- **Key ID:** V43L3BZNA9
- **Key File:** `AuthKey_V43L3BZNA9.p8`
- **Issuer ID:** e63db961-afb6-44db-a75b-64174d1dea17
- **Apple ID:** mradams@digiwealth.io

**Location:**
```bash
~/.appstoreconnect/private_keys/AuthKey_V43L3BZNA9.p8
```

**Setup Commands:**
```bash
# Create directory
mkdir -p ~/.appstoreconnect/private_keys

# Copy key file
cp ios/AuthKey_V43L3BZNA9.p8 ~/.appstoreconnect/private_keys/

# Set permissions
chmod 600 ~/.appstoreconnect/private_keys/AuthKey_V43L3BZNA9.p8
```

### 2. Export Options Configuration

**File:** `ios/exportOptions.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>Z3L3NYSA9D</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
```

### 3. Environment Configuration

**File:** `ios/.env`

```bash
# App Store Connect API Key Configuration
APP_STORE_CONNECT_API_KEY_KEY_ID=V43L3BZNA9
APP_STORE_CONNECT_API_KEY_ISSUER_ID=e63db961-afb6-44db-a75b-64174d1dea17
APP_STORE_CONNECT_API_KEY_PATH=./AuthKey_V43L3BZNA9.p8
FASTLANE_TEAM_ID=Z3L3NYSA9D
FASTLANE_APP_IDENTIFIER=com.pocketteller.app
FASTLANE_APPLE_ID=mradams@digiwealth.io
FASTLANE_SKIP_WAITING_FOR_BUILD_PROCESSING=true
```

---

## 🚀 Deployment Methods

### Method 1: Xcode (Recommended for Manual Deployment)

**Pros:**
- Visual interface
- Automatic certificate management
- Easy to verify each step
- Built-in error handling

**Steps:**

1. **Build Web App:**
   ```bash
   npm run build
   npx cap sync ios
   ```

2. **Open Xcode:**
   ```bash
   cd ios/App
   open App.xcworkspace
   ```

3. **Archive:**
   - Product → Archive
   - Wait for completion (~30 seconds)

4. **Distribute:**
   - Organizer opens automatically
   - Click "Distribute App"
   - Select "App Store Connect"
   - Select "Upload"
   - Click through prompts (accept defaults)
   - Xcode handles signing automatically
   - Upload starts (~2-5 minutes)

5. **Verify:**
   - Check email for confirmation
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Navigate to TestFlight tab

### Method 2: Command Line (Fastest for CI/CD)

**Pros:**
- Fully automated
- Script-friendly
- No GUI required
- Perfect for CI/CD

**Complete Script:**

```bash
#!/bin/bash
set -e

echo "🚀 Deploying PocketTeller to TestFlight..."

# Configuration
APP_NAME="App"
SCHEME="App"
WORKSPACE="App/App.xcworkspace"
EXPORT_OPTIONS="exportOptions.plist"
API_KEY="V43L3BZNA9"
API_ISSUER="e63db961-afb6-44db-a75b-64174d1dea17"

# Set locale for iOS builds
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Navigate to project root
cd /Users/mr.adams/pockettellerxchanges/PocketTeller

# 1. Clean iOS assets
echo "🧹 Cleaning iOS assets..."
rm -rf ios/App/App/public/*

# 2. Build web app
echo "📦 Building web app..."
npm run build

# 3. Sync to iOS
echo "🔄 Syncing to iOS..."
npx cap sync ios

# 4. Navigate to iOS directory
cd ios

# 5. Create archive
echo "📦 Creating archive..."
ARCHIVE_PATH="$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/App $(date +%Y-%m-%d\ %H.%M.%S).xcarchive"
xcodebuild -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -archivePath "$ARCHIVE_PATH" \
  archive

# 6. Export IPA
echo "📤 Exporting IPA..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath ./build \
  -exportOptionsPlist "$EXPORT_OPTIONS"

# 7. Upload to TestFlight
echo "☁️  Uploading to TestFlight..."
xcrun altool --upload-app \
  --type ios \
  --file build/App.ipa \
  --apiKey "$API_KEY" \
  --apiIssuer "$API_ISSUER"

echo ""
echo "✅ Deployment Complete!"
echo "Check App Store Connect in 5-30 minutes for build processing."
echo "https://appstoreconnect.apple.com"
```

**Save as:** `deploy-ios-testflight.sh`

**Make executable:**
```bash
chmod +x deploy-ios-testflight.sh
```

### Method 3: Fastlane (For Teams & Advanced Automation)

**Setup Required:**
- Fastlane Match for certificate management
- Private GitHub repo for certificates

**Current Status:** ⚠️ Partially configured (needs Match setup)

**To Complete:**
```bash
cd ios
fastlane match init
# Follow prompts to set up certificate storage
fastlane match appstore
```

**Then deploy with:**
```bash
cd ios
fastlane beta
```

---

## 📊 Successful Deployment Record

### October 15, 2025 - First Production Deployment

**Build Information:**
- **Build Number:** 3
- **Delivery UUID:** 526c1039-67fe-40c1-879a-516d13963da2
- **File Size:** 11.3 MB
- **Upload Time:** 5.7 seconds
- **Upload Speed:** 2.0 MB/s
- **Method:** Command line (altool)
- **Status:** ✅ Upload Succeeded

**Configuration:**
- Team: Z3L3NYSA9D (Stephen Adams)
- Signing: Automatic
- Provisioning: Automatic (Xcode-managed)
- Export Method: app-store

**Timeline:**
- 01:00:16 - Web app build started
- 01:00:21 - Web app build completed (5.34s)
- 01:00:27 - iOS sync completed
- 01:09:17 - Archive created
- 01:12:33 - IPA export succeeded
- 01:14:20 - Upload to TestFlight succeeded

**What Works:**
✅ Production URLs (app.pocketbanker.app)  
✅ Supabase integration (real-time database)  
✅ Plaid bank linking  
✅ Stripe subscriptions ($4.99/mo, $32.99/yr)  
✅ AI financial coaching (Gemini 2.5 Flash)  
✅ All core features functional  

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Issue 1: API Key Not Found

**Error:**
```
Error: Failed to load AuthKey file
```

**Solution:**
```bash
# Ensure key is in correct location
mkdir -p ~/.appstoreconnect/private_keys
cp ios/AuthKey_V43L3BZNA9.p8 ~/.appstoreconnect/private_keys/
chmod 600 ~/.appstoreconnect/private_keys/AuthKey_V43L3BZNA9.p8
```

#### Issue 2: No Signing Certificate

**Error:**
```
error: No signing certificate "iOS Distribution" found
```

**Solution:**
Use automatic signing in exportOptions.plist:
```xml
<key>signingStyle</key>
<string>automatic</string>
```

Or in Xcode:
1. Select project → Target → Signing & Capabilities
2. ✅ Check "Automatically manage signing"
3. Select Team: Z3L3NYSA9D

#### Issue 3: Archive Not Found

**Error:**
```
error: archive not found at path
```

**Solution:**
```bash
# List recent archives
ls -lt ~/Library/Developer/Xcode/Archives/

# Use most recent archive path in export command
```

#### Issue 4: Build Processing Stuck

**Symptom:** Build uploaded but not appearing in TestFlight

**Wait Time:** 5-30 minutes is normal

**Check:**
1. Email for processing status
2. App Store Connect → TestFlight tab
3. Activity → iOS Builds

**If stuck > 1 hour:**
- Check export compliance settings
- Verify app doesn't use encryption (or submit docs)
- Contact Apple Developer Support

#### Issue 5: Upload Timeout

**Error:**
```
error: connection timeout
```

**Solution:**
```bash
# Retry upload (IPA already built)
cd ios
xcrun altool --upload-app \
  --type ios \
  --file build/App.ipa \
  --apiKey V43L3BZNA9 \
  --apiIssuer e63db961-afb6-44db-a75b-64174d1dea17
```

---

## 🎯 Pre-Deployment Checklist

### Code Preparation

- [ ] All features tested locally
- [ ] No console errors in Safari Web Inspector
- [ ] Production URLs verified (no localhost)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Linter passing: `npm run lint`
- [ ] Type check passing: `npm run type-check`
- [ ] Build succeeds: `npm run build`

### iOS Specific

- [ ] Bundle ID correct: `com.pocketteller.app`
- [ ] Team ID correct: `Z3L3NYSA9D`
- [ ] Version number updated (if new version)
- [ ] Build number auto-increments
- [ ] Icon assets present (all sizes)
- [ ] Launch screen configured
- [ ] Capacitor config points to `dist`
- [ ] No localhost in `capacitor.config.ts`

### Post-Build Verification

- [ ] Archive created successfully
- [ ] IPA exported without errors
- [ ] IPA file size reasonable (~10-15 MB)
- [ ] Upload completed successfully
- [ ] Received confirmation email
- [ ] Build appears in App Store Connect
- [ ] Build processing complete (wait 5-30 min)

---

## 📱 TestFlight Distribution

### Add Internal Testers

**Internal testers** = App Store Connect users on your team

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. My Apps → PocketTeller → TestFlight
3. Click "App Store Connect Users"
4. Click "+" to add testers
5. Select users from your team
6. Click "Add"

**Limits:** Up to 100 internal testers

### Add External Testers

**External testers** = Anyone with an email address

1. Go to TestFlight → External Testing
2. Click "+" to create a test group
3. Name the group (e.g., "Beta Testers")
4. Add build to group
5. Click "Add Testers"
6. Enter email addresses (comma-separated)
7. Click "Add"

**Limits:** Up to 10,000 external testers

**First Time:** Requires App Review (1-2 days)  
**Subsequent Builds:** Instant distribution (if no major changes)

### Beta App Review

**When Required:**
- First external TestFlight build
- Major feature changes
- New permissions requested

**Timeline:** 1-2 business days

**What to Provide:**
- Beta App Description
- Feedback Email
- What to Test notes
- Demo account (if app requires login)

---

## 🔄 Version Management

### Incrementing Build Numbers

**Automatically (Recommended):**

Fastlane handles this:
```bash
cd ios
fastlane beta  # Auto-increments build number
```

**Manually:**

In Xcode:
1. Select project → Target → General
2. Update "Build" number
3. Leave "Version" same for minor updates

Or command line:
```bash
cd ios/App
agvtool next-version -all
```

### Version vs Build Number

**Version Number (CFBundleShortVersionString):**
- Customer-facing version (1.0.0, 1.1.0, 2.0.0)
- Update for major/minor releases
- Semantic versioning recommended

**Build Number (CFBundleVersion):**
- Internal tracking number (1, 2, 3, 4...)
- Increment for every TestFlight upload
- Must be unique for each upload
- Can reset when version changes

**Example:**
- Version 1.0.0, Build 1 (first upload)
- Version 1.0.0, Build 2 (bug fix)
- Version 1.0.0, Build 3 (another fix)
- Version 1.1.0, Build 4 (new features)

---

## 🔐 Security Best Practices

### Protecting API Keys

**Never Commit:**
- ❌ `AuthKey_*.p8` files
- ❌ `ios/.env` file
- ❌ Passwords or secrets

**Already Protected:**
✅ `.gitignore` includes:
```
AuthKey_*.p8
ios/.env
ios/fastlane/report.xml
```

### Secure Storage Locations

**API Keys:**
```
~/.appstoreconnect/private_keys/AuthKey_V43L3BZNA9.p8
Permissions: 600 (read/write for owner only)
```

**Environment Variables:**
```
ios/.env (gitignored)
```

**Certificates (if using Match):**
```
Private GitHub repository (encrypted)
Match Password: PocketTeller2025!Secure#Certs
```

### Rotating Keys

**If Compromised:**

1. **Revoke in App Store Connect:**
   - https://appstoreconnect.apple.com/access/api
   - Find key → Revoke

2. **Generate New Key:**
   - Click "+" to create new key
   - Download `.p8` file
   - Update Key ID everywhere

3. **Update Configuration:**
   ```bash
   # Update ios/.env
   APP_STORE_CONNECT_API_KEY_KEY_ID=NEW_KEY_ID
   
   # Update deployment scripts
   # Update GitHub Secrets (if using CI/CD)
   ```

---

## 🤖 CI/CD Integration (GitHub Actions)

### GitHub Secrets Configuration

**Required Secrets:**

| Secret Name | Value | How to Get |
|------------|-------|------------|
| `APP_STORE_CONNECT_API_KEY` | Base64-encoded `.p8` file | `cat AuthKey_V43L3BZNA9.p8 \| base64` |
| `APP_STORE_CONNECT_ISSUER_ID` | `e63db961-afb6-44db-a75b-64174d1dea17` | App Store Connect |
| `APPLE_ID` | `mradams@digiwealth.io` | Your Apple email |
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase dashboard |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Supabase dashboard |

### Workflow File

**Location:** `.github/workflows/ios-deploy.yml`

**Triggers:**
- Push to `main` branch → Auto-deploy to TestFlight
- Manual dispatch → Choose TestFlight or App Store

**Manual Trigger:**
1. Go to GitHub → Actions tab
2. Select "iOS - Deploy to TestFlight"
3. Click "Run workflow"
4. Select branch: `main`
5. Choose target: `testflight` or `appstore`
6. Click "Run workflow"

---

## 📊 Monitoring & Analytics

### Check Build Status

**App Store Connect:**
1. https://appstoreconnect.apple.com
2. My Apps → PocketTeller
3. TestFlight → iOS Builds

**Build Statuses:**
- 🔄 **Processing** - Apple is processing (wait 5-30 min)
- ✅ **Ready to Submit** - Available for testing
- ⚠️ **Missing Compliance** - Needs export compliance info
- ❌ **Invalid Binary** - Build failed validation

### Email Notifications

**You'll receive emails for:**
- ✅ Build processing complete
- ⚠️ Build processing failed
- 📱 Beta App Review complete (external testing)
- 🐛 Crash reports from testers

**Email Address:** mradams@digiwealth.io

### TestFlight Metrics

**Available in App Store Connect:**
- Number of testers invited
- Number of testers active
- Installs per build
- Sessions per build
- Crashes per build
- Tester feedback

**View:**
TestFlight → Select Build → Metrics

---

## 🆘 Support Resources

### Documentation

**Official Apple Guides:**
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Distributing Your App](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)
- [Upload Builds Guide](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/)

**Project Documentation:**
- `iOS_PRODUCTION_GUIDE.md` - Complete iOS development guide
- `AGENTS.md` - Overall project documentation
- `APP_STORE_SUBMISSION_GUIDE.md` - Full App Store submission process

### Getting Help

**Apple Developer Support:**
- https://developer.apple.com/support/
- Phone: Check developer.apple.com for regional numbers

**TestFlight Forum:**
- https://developer.apple.com/forums/tags/testflight

**Xcode Issues:**
- https://developer.apple.com/forums/tags/xcode

---

## 🎓 Best Practices

### Release Cadence

**Recommended Schedule:**
- **Daily/Weekly:** Internal testing (rapid iteration)
- **Weekly/Bi-weekly:** External beta testing
- **Monthly:** Production releases to App Store

### Testing Strategy

**Internal Testers (Team):**
- Test every build before external release
- Focus on new features and bug fixes
- Quick feedback cycle (same day)

**External Testers (Beta Users):**
- Test release candidates
- Provide real-world usage feedback
- Test on various devices and iOS versions

### Release Notes

**Always Include:**
- What's new in this build
- Known issues
- What to test specifically
- How to provide feedback

**Example:**
```
Build 3 - October 15, 2025

What's New:
• Added AI financial coaching with Gemini
• Improved transaction categorization
• Bug fixes and performance improvements

Known Issues:
• None

What to Test:
• Try the AI coach feature
• Link your bank account
• Check transaction categorization

Feedback: mradams@digiwealth.io
```

---

## 📝 Change Log

### October 15, 2025
- ✅ Initial TestFlight deployment successful
- ✅ API key configuration completed
- ✅ Automatic signing configured
- ✅ Command-line deployment working
- ✅ Build 3 uploaded successfully
- ✅ Documentation created

---

## 🚀 Quick Command Reference

### Essential Commands

```bash
# Full deployment (one command)
./deploy-ios-testflight.sh

# Just build web app
npm run build

# Just sync to iOS
npx cap sync ios

# Open in Xcode
open ios/App/App.xcworkspace

# List archives
ls -lt ~/Library/Developer/Xcode/Archives/

# Check API key
ls -lh ~/.appstoreconnect/private_keys/

# Upload specific IPA
xcrun altool --upload-app \
  --type ios \
  --file ios/build/App.ipa \
  --apiKey V43L3BZNA9 \
  --apiIssuer e63db961-afb6-44db-a75b-64174d1dea17
```

---

## 📞 Contact Information

**Developer:** Stephen Adams  
**Email:** mradams@digiwealth.io  
**Team ID:** Z3L3NYSA9D  
**App:** PocketTeller  
**Bundle ID:** com.pocketteller.app

---

*This document is maintained as the definitive guide for iOS TestFlight deployments. Update as processes evolve.*

