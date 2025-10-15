# GitHub Actions Workflows

This directory contains CI/CD workflows for PocketTeller.

## iOS Deployment Workflow

**File:** `ios-deploy.yml`

Automatically builds and deploys the iOS app to TestFlight or App Store using Fastlane and App Store Connect API.

### Required GitHub Secrets

Set these in: Repository Settings → Secrets and variables → Actions

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `APP_STORE_CONNECT_API_KEY` | Base64-encoded .p8 key file | `cat AuthKey_V43L3BZNA9.p8 \| base64` |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID from App Store Connect | [App Store Connect → Users and Access → Keys](https://appstoreconnect.apple.com/access/api) |
| `APPLE_ID` | Your Apple Developer account email | Your login email |
| `MATCH_PASSWORD` | Password for certificates repo | Set your own secure password |
| `VITE_SUPABASE_URL` | Supabase project URL | From Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | From Supabase project settings |

### Setting Up Secrets

#### 1. APP_STORE_CONNECT_API_KEY (Base64 encoded)

```bash
cd ios
cat AuthKey_V43L3BZNA9.p8 | base64 | pbcopy
# Now paste into GitHub Secrets
```

#### 2. APP_STORE_CONNECT_ISSUER_ID

1. Go to [App Store Connect → Keys](https://appstoreconnect.apple.com/access/api)
2. Copy the Issuer ID (above the key table)
3. Add to GitHub Secrets

#### 3. APPLE_ID

Your Apple Developer account email address.

#### 4. MATCH_PASSWORD

Create a secure password for encrypting your certificates. You'll need this same password on all machines that run Fastlane.

### Workflow Triggers

**Automatic:**
- Pushes to `main` branch
- Pushes to `release/*` branches

**Manual:**
- Go to Actions tab → Select workflow → Run workflow
- Choose deployment target: `testflight` or `appstore`

### Usage

#### Deploy to TestFlight (Automatic)

```bash
git push origin main
```

The workflow will automatically:
1. Build the web app
2. Sync with iOS
3. Build the iOS app
4. Upload to TestFlight

#### Deploy to App Store (Manual)

1. Go to GitHub Actions tab
2. Select "iOS - Deploy to TestFlight" workflow
3. Click "Run workflow"
4. Select branch: `main`
5. Select deployment target: `appstore`
6. Click "Run workflow"

### First-Time Setup

Before running the workflow for the first time:

1. **Set up Match (Certificate Management):**
   ```bash
   cd ios
   fastlane match init
   # Follow prompts to create certificates repo
   ```

2. **Add all required GitHub Secrets** (see table above)

3. **Test locally first:**
   ```bash
   ./deploy-ios-app-store.sh
   # Choose TestFlight to test the process
   ```

4. **Push to main** to trigger automatic deployment

### Monitoring

- Check workflow status in GitHub Actions tab
- View build logs for detailed information
- Check App Store Connect for build processing status

### Troubleshooting

**Build fails with "Authentication failed":**
- Verify `APP_STORE_CONNECT_API_KEY` is correctly base64 encoded
- Check `APP_STORE_CONNECT_ISSUER_ID` matches your account
- Verify `APPLE_ID` is correct

**Certificate/Provisioning issues:**
- Make sure Match repository is set up
- Verify `MATCH_PASSWORD` is correct
- Run `fastlane match` locally first

**Build succeeds but not appearing in TestFlight:**
- Processing can take 5-30 minutes
- Check App Store Connect for status
- Look for email from Apple about processing

### Local Development

For local testing and development, use:

```bash
# TestFlight
./deploy-ios-app-store.sh

# Xcode (wireless)
./deploy-ios-wifi.sh
```

---

## Future Workflows

Additional workflows that could be added:

- **Android Deploy** - Deploy to Google Play
- **Web Deploy** - Deploy to Netlify/Vercel
- **Tests** - Run unit and integration tests
- **Lint** - Code quality checks

---

*For more information, see:*
- [iOS Production Guide](../iOS_PRODUCTION_GUIDE.md)
- [Fastlane Documentation](https://docs.fastlane.tools)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

