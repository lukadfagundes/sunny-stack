# Cloudflare API Setup Guide

**Estimated Time:** 10-15 minutes
**Purpose:** Enable bot to monitor and manage Cloudflare DNS, CDN, and security features

---

## Prerequisites

- ✅ Cloudflare account with active domains
- ✅ Domains using Cloudflare nameservers
- ✅ Access to Cloudflare dashboard

---

## Overview

Your Discord bot will monitor and manage:

- **DNS Records** - Monitor changes, add/update records
- **CDN/Cache** - Purge cache, check cache status
- **SSL/TLS** - Certificate status and renewals
- **Analytics** - Traffic stats, threats blocked
- **Firewall Events** - Security threats and blocks
- **Page Rules** - Monitor active rules

---

## Step 1: Create Cloudflare API Token

### 1.1 Navigate to API Tokens

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click your **profile icon** (top-right)
3. Select **"My Profile"**
4. Click **"API Tokens"** (left sidebar)
5. Or go directly to: https://dash.cloudflare.com/profile/api-tokens

### 1.2 Create Custom Token

1. Click **"Create Token"**
2. Scroll down and click **"Get started"** under **"Create Custom Token"**

### 1.3 Configure Token Permissions

**Token name:** `Sunny Stack Bot - Full Access`

**Permissions:** (Click "+ Add more" for each)

**Zone Permissions:**

- Zone → Read
- Zone Settings → Read
- DNS → Edit (for DNS management)
- Analytics → Read
- Logs → Read
- Cache Purge → Purge
- SSL and Certificates → Read
- Firewall Services → Read

**Account Permissions:**

- Account Settings → Read
- Account Analytics → Read

**User Permissions:** (Leave empty unless needed)

### 1.4 Zone Resources

- **Include** → **All zones from an account** → Select your account

Or select specific zones:

- **Include** → **Specific zone** → Select `sunny-stack.com` (and any other domains)

### 1.5 Client IP Address Filtering (Optional)

**Recommended for production:**

- Add your Raspberry Pi's IP address
- Add your home/office IP address
- Leave blank for development (access from anywhere)

### 1.6 TTL (Token Expiration)

- **Recommended:** 1 year (set calendar reminder to rotate)
- **Maximum:** No expiration (for long-term bot use)

### 1.7 Create and Save Token

1. Click **"Continue to summary"**
2. Review permissions
3. Click **"Create Token"**
4. **⚠️ CRITICAL:** Copy the token immediately (shows only once!)

```bash
# Token format (starts with letters/numbers, 40 characters)
# Save to .env.local:
CLOUDFLARE_API_TOKEN=abcdefghijklmnopqrstuvwxyz1234567890ABCD
```

5. **Test the token** (Cloudflare provides a test command):

```bash
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type:application/json"
```

Expected response:

```json
{
  "success": true,
  "result": {
    "id": "...",
    "status": "active"
  }
}
```

---

## Step 2: Get Cloudflare Zone ID

Each domain in Cloudflare has a unique Zone ID.

### 2.1 From Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click on your domain (e.g., `sunny-stack.com`)
3. Scroll down in the **Overview** tab
4. Look for **"API"** section in the right sidebar
5. Copy **"Zone ID"**

**Example:**

```
Zone ID: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 2.2 For Multiple Domains

If you have multiple domains, get the Zone ID for each:

```bash
# Primary domain (sunny-stack.com)
CLOUDFLARE_ZONE_ID=your-primary-zone-id

# Additional domains (optional, for multi-domain monitoring)
CLOUDFLARE_ZONE_ID_CLIENT1=another-zone-id
CLOUDFLARE_ZONE_ID_CLIENT2=another-zone-id
```

Or configure in bot later.

---

## Step 3: Get Cloudflare Account ID (Optional)

For account-level analytics and settings.

### From Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click any domain
3. Look in the right sidebar under **"API"**
4. Copy **"Account ID"**

```bash
# Add to .env.local (optional)
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

---

## Step 4: Test API Access

### Create Test Script

Create `tools/test-cloudflare-api.js`:

```javascript
const axios = require("axios");
require("dotenv").config({ path: ".env.local" });

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

const cloudflareAPI = axios.create({
  baseURL: "https://api.cloudflare.com/client/v4",
  headers: {
    Authorization: `Bearer ${CF_API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

async function testCloudflareAPI() {
  try {
    console.log("🧪 Testing Cloudflare API access...\n");

    // Test 1: Verify token
    const tokenVerify = await cloudflareAPI.get("/user/tokens/verify");
    console.log("✅ Token Status:", tokenVerify.data.result.status);

    // Test 2: List zones
    const zones = await cloudflareAPI.get("/zones");
    console.log(`✅ Zones Found: ${zones.data.result.length}\n`);

    if (zones.data.result.length > 0) {
      console.log("🌐 Your Cloudflare Domains:");
      zones.data.result.forEach((zone) => {
        console.log(`   - ${zone.name} (${zone.status})`);
        console.log(`     Zone ID: ${zone.id}`);
      });
    }

    // Test 3: Get specific zone details
    if (CF_ZONE_ID) {
      const zoneDetails = await cloudflareAPI.get(`/zones/${CF_ZONE_ID}`);
      console.log(`\n✅ Zone Details for ${zoneDetails.data.result.name}:`);
      console.log(`   Status: ${zoneDetails.data.result.status}`);
      console.log(`   Plan: ${zoneDetails.data.result.plan.name}`);
      console.log(
        `   Nameservers: ${zoneDetails.data.result.name_servers.join(", ")}`,
      );

      // Test 4: Get DNS records
      const dnsRecords = await cloudflareAPI.get(
        `/zones/${CF_ZONE_ID}/dns_records`,
      );
      console.log(`   DNS Records: ${dnsRecords.data.result.length}`);

      // Test 5: Get analytics (last 30 days)
      const analytics = await cloudflareAPI.get(
        `/zones/${CF_ZONE_ID}/analytics/dashboard`,
        { params: { since: -43200, until: 0 } }, // Last 30 days
      );
      console.log(
        `   Requests (30d): ${analytics.data.result.totals.requests.all.toLocaleString()}`,
      );
    }

    console.log("\n🎉 Cloudflare API setup complete!");
  } catch (error) {
    console.error("❌ Error testing Cloudflare API:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(
        `   Message: ${error.response.data.errors?.[0]?.message || error.response.statusText}`,
      );
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

testCloudflareAPI();
```

### Run Test

```bash
npm install axios  # If not already installed
node tools/test-cloudflare-api.js
```

### Expected Output

```
🧪 Testing Cloudflare API access...

✅ Token Status: active
✅ Zones Found: 2

🌐 Your Cloudflare Domains:
   - sunny-stack.com (active)
     Zone ID: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   - client-domain.com (active)
     Zone ID: z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4

✅ Zone Details for sunny-stack.com:
   Status: active
   Plan: Free
   Nameservers: abe.ns.cloudflare.com, sue.ns.cloudflare.com
   DNS Records: 12
   Requests (30d): 45,234

🎉 Cloudflare API setup complete!
```

---

## Step 5: Environment Variables Summary

Add these to your `.env.local`:

```bash
# Required
CLOUDFLARE_API_TOKEN=abcdefghijklmnopqrstuvwxyz1234567890ABCD
CLOUDFLARE_ZONE_ID=your-primary-zone-id

# Optional (for account-level features)
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Optional (for multi-domain monitoring)
CLOUDFLARE_ZONES=sunny-stack.com,client-domain.com
```

---

## Step 6: Configure Bot Monitoring

### Discord Channel Mapping

Cloudflare alerts will be sent to:

```bash
# Analytics and traffic stats
CLOUDFLARE_ANALYTICS_CHANNEL_ID=same-as-DISCORD_CHANNEL_ANALYTICS

# Security threats and firewall events
CLOUDFLARE_SECURITY_CHANNEL_ID=same-as-DISCORD_CHANNEL_ADMIN_LOGS

# DNS changes
CLOUDFLARE_DNS_CHANNEL_ID=same-as-DISCORD_CHANNEL_ADMIN_LOGS
```

### Monitoring Features

Once configured, bot can monitor:

1. **DNS Changes** - Alert when DNS records are added/modified/deleted
2. **SSL Expiration** - Warn before SSL certificates expire
3. **Traffic Spikes** - Unusual traffic patterns or DDoS attempts
4. **Firewall Events** - Blocked IPs, threats detected
5. **Cache Ratio** - CDN performance metrics
6. **Uptime** - Domain availability

---

## Troubleshooting

### Error: "Invalid request headers" (6003)

- Token is malformed or incomplete
- Ensure you copied the full token (no spaces)
- Regenerate token if needed

### Error: "Forbidden" (10000)

- Token doesn't have required permissions
- Create new token with correct permissions (see Step 1.3)

### Error: "Zone not found" (1001)

- Zone ID is incorrect
- Copy Zone ID from dashboard (see Step 2)
- Verify zone exists in your account

### Error: "Authentication error" (9109)

- Token has expired
- Token was revoked
- Regenerate new token

### Limited Data Returned

- Free plan has limited analytics (24-hour window)
- Upgrade to Pro for extended analytics
- Bot will work with free plan limits

---

## API Rate Limits

**Cloudflare API Limits:**

- **Free Plan:** 1,200 requests/5 minutes
- **Pro Plan:** 4,800 requests/5 minutes
- **Business+:** Higher limits

**Bot Usage Estimate:**

- DNS monitoring: ~5 requests/minute
- Analytics polling: ~2 requests/minute
- Firewall checks: ~3 requests/minute
- **Total:** ~10 requests/minute (~2,000/day)

Well within Free plan limits ✅

---

## Security Best Practices

1. **Use scoped tokens** - Only grant necessary permissions
2. **Rotate regularly** - Regenerate tokens every 6-12 months
3. **IP filtering** - Restrict to known IPs in production
4. **Monitor token usage** - Check Cloudflare audit logs
5. **Revoke if compromised** - Immediately revoke exposed tokens
6. **Never commit** - Keep in `.env.local` (gitignored)

---

## Bot Commands (Once Implemented)

```
/cloudflare status              # Overall Cloudflare status
/cloudflare dns [domain]        # List DNS records
/cloudflare analytics [domain]  # Show traffic analytics
/cloudflare purge-cache [url]   # Purge cache for URL
/cloudflare ssl [domain]        # Check SSL status
/cloudflare threats             # Recent security threats
```

---

## Next Steps

1. ✅ Add `CLOUDFLARE_API_TOKEN` to `.env.local`
2. ✅ Add `CLOUDFLARE_ZONE_ID` to `.env.local`
3. ✅ Test API access with test script
4. ⏳ Continue with cron-job.org API setup
5. ⏳ Complete Phase 0 environment configuration

---

## Additional Resources

- **Cloudflare API Docs:** https://developers.cloudflare.com/api/
- **API Token Reference:** https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- **Cloudflare Status:** https://www.cloudflarestatus.com/
- **Community Forum:** https://community.cloudflare.com/

---

**Setup Status:** Complete Cloudflare API Integration
**Time Taken:** ~10-15 minutes
**Next Guide:** [docs/cronjob-api-setup.md](cronjob-api-setup.md)
