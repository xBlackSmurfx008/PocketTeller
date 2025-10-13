# Figma MCP - Quick Start Guide

## ✅ Configuration Complete!

Your Cursor IDE is now configured to connect with Figma via the Model Context Protocol (MCP).

## 🎯 What's Been Done

1. ✅ Updated `~/.cursor/mcp.json` with Figma MCP server configuration
2. ✅ Using `figma-developer-mcp@0.6.4` (includes security fix for CVE-2025-53967)
3. ✅ Node.js v20.19.5 verified (compatible - requires >= 18.0.0)
4. ✅ Created comprehensive setup documentation

## 🔑 Next Steps (You Need to Do This)

### Step 1: Get Your Figma Token

1. Go to [https://www.figma.com/settings](https://www.figma.com/settings)
2. Scroll to **Personal Access Tokens**
3. Click **Generate new token**
4. Name it "Cursor MCP Integration"
5. **Copy the token** (you won't see it again!)

### Step 2: Add Token to Configuration

Open the configuration file:
```bash
open ~/.cursor/mcp.json
```

Find the Figma section and add your token:
```json
"Figma": {
  "command": "npx",
  "args": [
    "figma-developer-mcp@latest"
  ],
  "env": {
    "FIGMA_PERSONAL_ACCESS_TOKEN": "figd_YOUR_TOKEN_HERE"  ← Put your token here
  }
}
```

### Step 3: Restart Cursor

1. Completely quit Cursor (Cmd+Q on Mac)
2. Restart Cursor
3. The Figma MCP server will auto-connect

## 🧪 Test It Out

Try these commands in a Cursor chat:

```
"Can you access Figma?"
```

```
"Get the design specs from this Figma file: 
https://www.figma.com/file/YOUR_FILE_ID/Your-Design"
```

```
"Generate React components from this Figma design: 
https://www.figma.com/file/YOUR_FILE_ID/Components"
```

## 📚 Full Documentation

For detailed instructions, troubleshooting, and advanced usage:
- See: `docs/FIGMA_MCP_SETUP.md`

## 🚀 What You Can Do With Figma MCP

- ✅ Access Figma design files directly from Cursor
- ✅ Extract component specifications
- ✅ Generate code from designs (React, HTML, CSS, etc.)
- ✅ Get design tokens (colors, typography, spacing)
- ✅ Analyze layout structures
- ✅ Sync design systems with code

## ⚡ Quick Commands

```bash
# Check if package is available
npm view figma-developer-mcp version

# Manually install (optional)
npm install -g figma-developer-mcp@latest

# View your MCP config
cat ~/.cursor/mcp.json

# Edit your MCP config
nano ~/.cursor/mcp.json
```

## ⚠️ Important Notes

1. **Security:** Never commit `mcp.json` with your token to version control
2. **Permissions:** You need access to Figma files to read them
3. **Version:** Always use v0.6.4+ (includes security fix)
4. **Token Format:** Figma tokens start with `figd_`

## 🔍 Troubleshooting

**Problem:** "Figma MCP not responding"
- **Solution:** Verify token is correct, restart Cursor

**Problem:** "Permission denied"
- **Solution:** Check you have access to the Figma file

**Problem:** Token doesn't work
- **Solution:** Generate a new token, ensure you copied it correctly

## 📞 Need Help?

- Full docs: `docs/FIGMA_MCP_SETUP.md`
- GitHub: [figma-developer-mcp](https://github.com/GLips/Figma-Context-MCP)
- Figma API: [developers.figma.com](https://www.figma.com/developers/api)

---

**Status:** ✅ Configuration Ready | ⏳ Awaiting Token Setup

**Last Updated:** October 12, 2025

