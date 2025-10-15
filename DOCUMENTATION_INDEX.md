# PocketTeller Documentation Index

**Status:** 🔒 Locked and Version Controlled  
**Last Updated:** October 15, 2025

---

## 📱 iOS & TestFlight

### Primary Guides
- **[IOS_TESTFLIGHT_DEPLOYMENT.md](IOS_TESTFLIGHT_DEPLOYMENT.md)** 🔒
  - Complete TestFlight deployment process
  - Step-by-step instructions
  - Troubleshooting guide
  - 17KB, Read-only

- **[TESTFLIGHT_QUICK_START.md](TESTFLIGHT_QUICK_START.md)** 🔒
  - Quick reference card
  - Essential commands
  - Common troubleshooting
  - 2KB, Read-only

- **[iOS_PRODUCTION_GUIDE.md](iOS_PRODUCTION_GUIDE.md)**
  - Complete iOS development guide
  - Configuration details
  - Debug procedures
  - Production-ready checklist

### Deployment Scripts
- **[deploy-ios-testflight.sh](deploy-ios-testflight.sh)** 🔒
  - Automated deployment script
  - One-command upload to TestFlight
  - Pre-flight validation
  - 4.5KB, Executable (read-only)

- **[deploy-ios-wifi.sh](deploy-ios-wifi.sh)**
  - Local wireless deployment
  - For development testing

---

## 🤖 Android

- **[ANDROID_PRODUCTION_GUIDE.md](ANDROID_PRODUCTION_GUIDE.md)**
  - Complete Android guide
  - Build process
  - Troubleshooting

---

## 🚀 General Deployment

- **[AGENTS.md](AGENTS.md)**
  - Overall project documentation
  - Development guidelines
  - Critical rules and best practices

- **[START_HERE.md](START_HERE.md)**
  - Project overview
  - Getting started guide

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**
  - Quick command reference

---

## 🔐 Security & Configuration

- **API Keys:** Stored in `~/.appstoreconnect/private_keys/`
- **Environment:** `ios/.env` (gitignored)
- **Secrets:** Never committed to version control

---

## 📦 Backup

Automatic backup created at: `.documentation-backup/`

**Restore command:**
```bash
cp .documentation-backup/* .
```

---

## 🔒 Protected Files

The following files are read-only to prevent accidental changes:
- `IOS_TESTFLIGHT_DEPLOYMENT.md` (444 permissions)
- `TESTFLIGHT_QUICK_START.md` (444 permissions)
- `deploy-ios-testflight.sh` (555 permissions)

**To edit (if needed):**
```bash
# Make writable
chmod 644 IOS_TESTFLIGHT_DEPLOYMENT.md

# Edit the file
nano IOS_TESTFLIGHT_DEPLOYMENT.md

# Lock it again
chmod 444 IOS_TESTFLIGHT_DEPLOYMENT.md
```

---

## 📝 Version Control

All documentation is tracked in git and should be committed with meaningful messages.

**Commit documentation:**
```bash
git add IOS_TESTFLIGHT_DEPLOYMENT.md TESTFLIGHT_QUICK_START.md deploy-ios-testflight.sh
git commit -m "docs: Add iOS TestFlight deployment documentation"
```

---

## 🆘 Support

For questions or issues, refer to:
1. The specific guide for your platform
2. The troubleshooting section
3. Apple Developer documentation

---

*Documentation is locked and version controlled for production use.*
