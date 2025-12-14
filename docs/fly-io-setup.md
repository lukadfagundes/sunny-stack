# Fly.io API Setup Guide

> **ℹ️ Usage Note:** This Sunny Stack project is NOT hosted on Fly.io (uses Vercel + Raspberry Pi).
> This setup guide is for **monitoring external Fly.io projects** via the Discord bot.

**Estimated Time:** 5-10 minutes
**Purpose:** Enable bot to monitor Fly.io-hosted projects (deployments, health, logs)
**Status:** ✅ Active - Monitoring external client/personal projects on Fly.io

---

## Prerequisites

- ✅ Fly.io account with active projects
- ✅ Projects already deployed on Fly.io
- ✅ Access to Fly.io dashboard

---

## Overview

Your Discord bot will monitor Fly.io projects for:

- **Deployment status** - Track successful/failed deployments
- **Application health** - Monitor app uptime and errors
- **Resource usage** - CPU, memory, and scaling alerts
- **Logs** - Stream important logs to Discord channels

---

## Step 1: Create Fly.io API Token

### 1.1 Navigate to Personal Access Tokens

1. Go to [Fly.io Dashboard](https://fly.io/dashboard)
2. Click your **profile icon** (top-right)
3. Select **"Account Settings"** or **"Personal Access Tokens"**
4. Or go directly to: https://fly.io/user/personal_access_tokens

### 1.2 Generate New Token

1. Click **"Create token"** or **"New Access Token"**
2. **Token name:** `Sunny Stack Bot - Monitoring`
3. **Description (optional):** `Discord bot for project monitoring and alerts`
4. **Expiration:**
   - **Recommended:** No expiration (for long-term bot use)
   - **Alternative:** 1 year (set reminder to rotate)
5. Click **"Create token"**

### 1.3 Save Token Immediately

⚠️ **CRITICAL:** The token shows only once!

1. **Copy the token** (starts with `fo1_...` or similar)
2. **Save to `.env.local`:**
   ```bash
   FLY_API_TOKEN=fo1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. **Save to password manager** (backup)

---

## Step 2: Get Your Fly.io Organization Slug

Your bot needs to know which organization to monitor.

### Option A: From Dashboard URL

1. Go to [Fly.io Dashboard](https://fly.io/dashboard)
2. Look at the URL: `https://fly.io/orgs/{org-slug}/`
3. Copy the `{org-slug}` (usually your username or company name)

### Option B: Using Fly CLI

```bash
# List organizations
flyctl orgs list

# Example output:
# Name                    Slug
# Luka D Fagundes        lukadfagundes
# Sunny Stack LLC         sunny-stack
```

Copy your organization slug.

### Add to Environment Variables

```bash
# Add this to .env.local
FLY_ORG_SLUG=your-org-slug
```

---

## Step 3: List Your Fly.io Apps

Identify which apps you want the bot to monitor.

### Using Fly CLI

```bash
# List all apps in your organization
flyctl apps list

# Example output:
# Name                    Owner           Status
# sunny-stack-web         lukadfagundes   running
# client-project-api      lukadfagundes   running
# portfolio-site          lukadfagundes   stopped
```

### Using API (Test Your Token)

```bash
# Test API access
curl -H "Authorization: Bearer YOUR_FLY_TOKEN" \
     https://api.fly.io/v1/apps
```

### Configure Apps to Monitor

Add app names to your environment:

```bash
# Comma-separated list of app names to monitor
FLY_APPS_TO_MONITOR=sunny-stack-web,client-project-api,portfolio-site
```

Or configure in bot config later via Discord commands.

---

## Step 4: Configure Monitoring Settings

### What the Bot Will Monitor

By default, the bot monitors:

1. **Deployments** - New releases, rollbacks
2. **Health Checks** - HTTP endpoint monitoring
3. **Scaling Events** - Instance count changes
4. **Certificate Renewals** - SSL cert expiration warnings
5. **Crashes** - Application restarts and errors

### Discord Channel Mapping

The bot will send Fly.io alerts to:

```bash
# Deployment notifications
DISCORD_CHANNEL_DEPLOYMENTS → Use existing #analytics or #admin-logs

# Critical alerts (crashes, downtime)
DISCORD_CHANNEL_FLY_ALERTS → Use #client-inquiries for urgent issues
```

⚠️ **Note:** You don't need new Discord channels. Map to existing channels in `.env.local`:

```bash
# Example: Send Fly.io alerts to #analytics
FLY_ALERTS_CHANNEL_ID=same-as-DISCORD_CHANNEL_ANALYTICS
```

---

## Step 5: Test API Access

### Create Test Script

Create `tools/test-fly-api.js`:

```javascript
const axios = require("axios");
require("dotenv").config({ path: ".env.local" });

const FLY_API_TOKEN = process.env.FLY_API_TOKEN;
const FLY_ORG_SLUG = process.env.FLY_ORG_SLUG || "";

async function testFlyAPI() {
  try {
    console.log("🧪 Testing Fly.io API access...\n");

    // Test 1: List apps
    const appsResponse = await axios.get("https://api.fly.io/v1/apps", {
      headers: { Authorization: `Bearer ${FLY_API_TOKEN}` },
    });

    console.log("✅ API Access: Success");
    console.log(`✅ Apps Found: ${appsResponse.data.length}`);

    if (appsResponse.data.length > 0) {
      console.log("\n📦 Your Fly.io Apps:");
      appsResponse.data.forEach((app) => {
        console.log(`   - ${app.name} (${app.status})`);
      });
    }

    // Test 2: Get organization info
    if (FLY_ORG_SLUG) {
      const orgResponse = await axios.get(
        `https://api.fly.io/v1/orgs/${FLY_ORG_SLUG}`,
        { headers: { Authorization: `Bearer ${FLY_API_TOKEN}` } },
      );
      console.log(`\n✅ Organization: ${orgResponse.data.name}`);
    }

    console.log("\n🎉 Fly.io API setup complete!");
  } catch (error) {
    console.error("❌ Error testing Fly.io API:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(
        `   Message: ${error.response.data.error || error.response.statusText}`,
      );
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

testFlyAPI();
```

### Run Test

```bash
npm install axios  # If not already installed
node tools/test-fly-api.js
```

### Expected Output

```
🧪 Testing Fly.io API access...

✅ API Access: Success
✅ Apps Found: 3

📦 Your Fly.io Apps:
   - sunny-stack-web (running)
   - client-project-api (running)
   - portfolio-site (stopped)

✅ Organization: Luka D Fagundes

🎉 Fly.io API setup complete!
```

---

## Step 6: Environment Variables Summary

Add these to your `.env.local`:

```bash
# Required
FLY_API_TOKEN=fo1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLY_ORG_SLUG=your-org-slug

# Optional (but recommended)
FLY_APPS_TO_MONITOR=app1,app2,app3
FLY_ALERTS_CHANNEL_ID=same-as-DISCORD_CHANNEL_ANALYTICS
```

---

## Troubleshooting

### Error: "Unauthorized" (401)

- Token is invalid or expired
- Regenerate token in Fly.io dashboard
- Ensure you copied the full token (no spaces)

### Error: "Forbidden" (403)

- Token doesn't have required permissions
- Create a new token with full access
- Verify you're accessing your own organization

### Error: "Not Found" (404)

- Organization slug is incorrect
- App name doesn't exist
- Check spelling and case-sensitivity

### No Apps Returned

- You may not have any apps deployed
- Deploy a test app first: `flyctl launch`
- Verify organization membership

---

## API Rate Limits

**Fly.io API Limits:**

- **Rate:** ~100 requests/minute (per token)
- **Monitoring Frequency:** Bot checks every 5 minutes by default
- **Estimated Usage:** ~12 requests/hour per app

With 3 apps monitored:

- ~36 requests/hour
- ~864 requests/day
- Well within limits ✅

---

## Security Best Practices

1. **Never commit token** - Keep in `.env.local` (gitignored)
2. **Use read-only tokens** - If Fly.io offers scoped tokens, use read-only
3. **Rotate regularly** - Regenerate tokens every 6-12 months
4. **Monitor usage** - Check Fly.io dashboard for unexpected API calls
5. **Revoke if compromised** - Immediately revoke and regenerate if exposed

---

## Bot Monitoring Features

Once configured, your bot can:

### Slash Commands

```
/fly status [app-name]         # Get app status
/fly logs [app-name] [lines]   # Fetch recent logs
/fly scale [app-name]          # Check current scaling
/fly deploys [app-name]        # List recent deployments
```

### Automated Alerts

Bot sends Discord notifications for:

- ✅ Successful deployments
- ❌ Failed deployments
- ⚠️ Health check failures
- 📈 Scaling events (auto-scale triggered)
- 🔒 Certificate expiration warnings (7 days before)
- 💥 Application crashes

---

## Next Steps

1. ✅ Add `FLY_API_TOKEN` to `.env.local`
2. ✅ Add `FLY_ORG_SLUG` to `.env.local`
3. ✅ Test API access with test script
4. ⏳ Continue with Cloudflare API setup
5. ⏳ Continue with cron-job.org API setup
6. ⏳ Complete Phase 0 environment configuration

---

## Additional Resources

- **Fly.io API Docs:** https://fly.io/docs/reference/api/
- **Fly.io Status:** https://status.flyio.net/
- **Fly.io Community:** https://community.fly.io/
- **CLI Reference:** https://fly.io/docs/flyctl/

---

**Setup Status:** Complete Fly.io API Integration
**Time Taken:** ~5-10 minutes
**Next Guide:** [docs/cloudflare-api-setup.md](cloudflare-api-setup.md)
