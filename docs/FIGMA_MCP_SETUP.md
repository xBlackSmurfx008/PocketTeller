# Figma MCP Integration Setup Guide

## Overview

This guide will help you connect Figma to Cursor using the Model Context Protocol (MCP). This integration allows you to:
- Access Figma design files directly from Cursor
- Extract design specifications and components
- Generate code from Figma designs
- Sync design systems with your codebase

## Security Note ⚠️

We're using `figma-developer-mcp@latest` (v0.6.4+) which includes a fix for CVE-2025-53967, a critical security vulnerability. Always ensure you're using the latest version.

## Prerequisites

- Node.js and npm installed on your system
- A Figma account
- Cursor IDE installed

## Step 1: Generate a Figma Personal Access Token

1. **Log in to Figma** at [https://www.figma.com](https://www.figma.com)

2. **Navigate to Account Settings:**
   - Click on your profile picture in the top-right corner
   - Select **Settings** from the dropdown menu

3. **Access Personal Access Tokens:**
   - Scroll down to the **Personal Access Tokens** section
   - Or directly visit: [https://www.figma.com/settings](https://www.figma.com/settings)

4. **Generate a New Token:**
   - Click **Generate new token**
   - Give your token a descriptive name (e.g., "Cursor MCP Integration")
   - Click **Generate token**

5. **Copy and Save Your Token:**
   - ⚠️ **IMPORTANT:** Copy the token immediately - you won't be able to see it again!
   - Store it securely (you'll need it in the next step)

## Step 2: Configure Cursor MCP

✅ **Already Completed!** Your Cursor MCP configuration has been updated.

The configuration file at `~/.cursor/mcp.json` now includes:

```json
{
  "mcpServers": {
    "Figma": {
      "command": "npx",
      "args": [
        "figma-developer-mcp@latest"
      ],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": ""
      }
    }
  }
}
```

## Step 3: Add Your Figma Token

1. **Open the MCP configuration file:**
   ```bash
   open ~/.cursor/mcp.json
   ```
   Or use any text editor:
   ```bash
   nano ~/.cursor/mcp.json
   ```

2. **Add your Figma token:**
   - Find the `"FIGMA_PERSONAL_ACCESS_TOKEN": ""` line
   - Paste your token between the quotes:
   ```json
   "FIGMA_PERSONAL_ACCESS_TOKEN": "figd_YOUR_TOKEN_HERE"
   ```

3. **Save the file**

## Step 4: Restart Cursor

1. **Completely quit Cursor** (Cmd+Q on Mac, Alt+F4 on Windows)
2. **Restart Cursor**
3. The Figma MCP server will automatically connect

## Step 5: Verify the Connection

Once Cursor restarts, the Figma MCP tools should be available. You can verify by:

1. Starting a new chat in Cursor
2. Asking the AI: "Can you access Figma?"
3. The AI should confirm that Figma MCP tools are available

## Available Figma MCP Capabilities

With Figma MCP connected, the AI can:

- **Read Figma Files:** Access design files you have permission to view
- **Extract Components:** Get component specifications, properties, and variants
- **Generate Code:** Convert Figma designs to React/HTML/CSS code
- **Extract Design Tokens:** Get colors, typography, spacing from Figma files
- **Analyze Layouts:** Understand layout structures and responsive behaviors
- **Access Prototypes:** View interactive prototype flows

## Usage Examples

### Example 1: Extract Design Specifications

```
"Can you get the color palette from this Figma file: 
https://www.figma.com/file/ABC123/Design-System"
```

### Example 2: Generate Component Code

```
"Generate a React component based on the 'Button' component 
in this Figma file: https://www.figma.com/file/XYZ789/Components"
```

### Example 3: Implement a Design

```
"Implement the homepage design from this Figma file: 
https://www.figma.com/file/DEF456/Homepage-Design"
```

## Troubleshooting

### Issue: "Figma MCP not responding"

**Solution:**
1. Verify your token is correct in `~/.cursor/mcp.json`
2. Check that the token hasn't expired (Figma tokens don't expire by default, but can be deleted)
3. Restart Cursor completely
4. Check your internet connection

### Issue: "Permission denied" errors

**Solution:**
1. Ensure you have access to the Figma files you're trying to read
2. Check that your token has the necessary permissions
3. Verify you're using the correct file URL

### Issue: "Module not found" or installation errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Install the package manually
npm install -g figma-developer-mcp@latest

# Restart Cursor
```

### Issue: Security vulnerability warnings

**Solution:**
The package should be at version 0.6.4 or higher (includes CVE-2025-53967 fix). Update if needed:
```bash
npm update -g figma-developer-mcp
```

## Additional Configuration Options

### Using Local Installation (Alternative)

If you prefer a local installation instead of `npx`:

1. **Install globally:**
   ```bash
   npm install -g figma-developer-mcp@latest
   ```

2. **Update your `~/.cursor/mcp.json`:**
   ```json
   {
     "mcpServers": {
       "Figma": {
         "command": "figma-developer-mcp",
         "env": {
           "FIGMA_PERSONAL_ACCESS_TOKEN": "figd_YOUR_TOKEN_HERE"
         },
         "args": []
       }
     }
   }
   ```

## Best Practices

1. **Token Security:**
   - Never commit your `mcp.json` file with tokens to version control
   - Rotate tokens periodically for security
   - Use separate tokens for different projects if needed

2. **File Access:**
   - Ensure your team has proper Figma file permissions
   - Use View-only access when you only need to read designs
   - Keep track of which files the AI has access to

3. **Performance:**
   - Large Figma files may take longer to process
   - Start with specific components or frames rather than entire files
   - Cache frequently accessed design data

## Additional Resources

- **Figma Developer Docs:** [https://www.figma.com/developers/api](https://www.figma.com/developers/api)
- **figma-developer-mcp GitHub:** [https://github.com/GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP)
- **Model Context Protocol:** [https://modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Cursor Documentation:** [https://cursor.sh/docs](https://cursor.sh/docs)

## Alternative Figma MCP Servers

If `figma-developer-mcp` doesn't meet your needs, consider these alternatives:

1. **smithery-ai/mcp-figma** - Full-featured Figma API access
   ```bash
   npm install -g @smithery-ai/mcp-figma
   ```

2. **JayZeeDesign/figma-mcp** - Python-based MCP server
   ```bash
   pipx install figma-mcp
   ```

3. **Figma Official MCP** - Requires Figma Pro/Enterprise plan
   - Local or remote server options
   - See: [Figma MCP Documentation](https://developers.figma.com/docs/figma-mcp-server/)

---

## Quick Start Checklist

- [ ] Generate Figma Personal Access Token
- [ ] Add token to `~/.cursor/mcp.json`
- [ ] Restart Cursor
- [ ] Test connection by asking AI about Figma
- [ ] Try accessing a Figma file

---

**Need Help?** 
- Check the [Troubleshooting](#troubleshooting) section above
- Visit the [GitHub Issues](https://github.com/GLips/Figma-Context-MCP/issues)
- Contact your team's Figma admin for access issues

**Last Updated:** October 12, 2025

