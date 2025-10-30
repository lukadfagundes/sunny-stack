# Discord Bot Deployment Guide

Complete guide for deploying the Sunny Stack Discord bot on both Vercel (Interactions API) and Raspberry Pi (Gateway API).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Discord Application Setup](#discord-application-setup)
3. [Environment Configuration](#environment-configuration)
4. [Vercel Deployment (Interactions API)](#vercel-deployment)
5. [Raspberry Pi Deployment (Gateway API)](#raspberry-pi-deployment)
6. [Command Deployment](#command-deployment)
7. [Webhook Integration](#webhook-integration)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The Sunny Stack Discord bot uses a **hybrid architecture** to leverage the best of both deployment platforms:

### Vercel Deployment (Primary)

- **Mode:** Interactions API (webhook-based)
- **Runtime:** Edge Functions + Node.js
- **Limitations:** 10s timeout, stateless
- **Best For:** Slash command responses, quick interactions
- **Entry Point:** `app/api/discord/interactions/route.ts`

### Raspberry Pi Deployment (Failsafe)

- **Mode:** Gateway API (WebSocket-based)
- **Runtime:** Node.js 18+ with PM2
- **Limitations:** Requires persistent connection
- **Best For:** Real-time events, persistent connection
- **Entry Point:** `bot/index.ts`

### Switching Modes

Set `DEPLOYMENT_MODE` environment variable:

- `vercel` - Uses Interactions API (webhook)
- `pi` - Uses Gateway API (WebSocket)

---

## Discord Application Setup

### 1. Create Discord Application

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "Sunny Stack Bot" (or your preference)
4. Save the **Application ID**

### 2. Create Bot User

1. Navigate to "Bot" tab
2. Click "Add Bot"
3. Under "Privileged Gateway Intents", enable:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent
4. Click "Reset Token" and save the **Bot Token** (keep secret!)
5. Under "Public Key", copy the **Public Key**

### 3. Configure OAuth2

1. Navigate to "OAuth2" → "URL Generator"
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ Send Messages
   - ✅ Send Messages in Threads
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Use Slash Commands
   - ✅ Mention Everyone (for admin mentions)
4. Copy the generated URL and invite bot to your server

### 4. Set Interactions Endpoint URL (Vercel only)

1. After deploying to Vercel, navigate to "General Information"
2. Set "Interactions Endpoint URL" to:
   ```
   https://your-domain.com/api/discord/interactions
   ```
3. Discord will verify the endpoint (must return 200 with PONG)

---

## Environment Configuration

### Required Environment Variables

Create `.env.local` (development) or configure in hosting platform:

```bash
# ======================
# Discord Configuration
# ======================

# Bot Authentication
DISCORD_BOT_TOKEN=<your-bot-token>                    # From Bot tab
DISCORD_APPLICATION_ID=<your-application-id>          # From General Information
DISCORD_PUBLIC_KEY=<your-public-key>                  # From General Information

# Server & User Configuration
DISCORD_GUILD_ID=<your-server-id>                     # Right-click server → Copy ID
DISCORD_ADMIN_USER_ID=<your-user-id>                  # Right-click your profile → Copy ID

# Channel IDs (create these channels in your server)
DISCORD_GENERAL_CHANNEL_ID=<channel-id>               # #general
DISCORD_NOTIFICATIONS_CHANNEL_ID=<channel-id>         # #notifications
DISCORD_ERROR_CHANNEL_ID=<channel-id>                 # #errors

# ======================
# Bot Configuration
# ======================

# Deployment Mode
DEPLOYMENT_MODE=vercel                                # or "pi"

# API Configuration
BOT_API_KEY=<generate-random-32-char-key>            # For bot → API auth
BOT_API_URL=https://your-domain.com                   # Your Next.js API URL

# Webhook Security
DISCORD_WEBHOOK_SECRET=<generate-random-32-char-key>  # For webhook signatures

# ======================
# Next.js (Existing)
# ======================

DATABASE_URL=<your-neon-postgres-url>
RESEND_API_KEY=<your-resend-api-key>
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# ... other existing env vars
```

### Generate Random Keys

```bash
# On Linux/Mac
openssl rand -hex 32

# On Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## Vercel Deployment

### 1. Install Dependencies

```bash
npm install discord.js @discordjs/rest @discordjs/builders discord-api-types @noble/ed25519
```

### 2. Configure Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link
```

### 3. Set Environment Variables

```bash
# Set all required env vars
vercel env add DISCORD_BOT_TOKEN
vercel env add DISCORD_APPLICATION_ID
vercel env add DISCORD_PUBLIC_KEY
vercel env add DISCORD_GUILD_ID
vercel env add DISCORD_ADMIN_USER_ID
vercel env add DISCORD_GENERAL_CHANNEL_ID
vercel env add DISCORD_NOTIFICATIONS_CHANNEL_ID
vercel env add DISCORD_ERROR_CHANNEL_ID
vercel env add DEPLOYMENT_MODE production
vercel env add BOT_API_KEY
vercel env add BOT_API_URL
vercel env add DISCORD_WEBHOOK_SECRET
```

### 4. Deploy

```bash
# Development
vercel

# Production
vercel --prod
```

### 5. Verify Deployment

1. Visit `https://your-domain.com/api/discord/interactions`
2. Should return: `{"error":"Method not allowed. Use POST."}`
3. In Discord Developer Portal, set Interactions Endpoint URL
4. Discord will send a PING request - should auto-verify

---

## Raspberry Pi Deployment

### 1. Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential git
```

### 2. Clone Repository

```bash
cd ~
git clone https://github.com/yourusername/sunny-stack.git
cd sunny-stack
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit with nano/vim
nano .env

# Set DEPLOYMENT_MODE=pi
```

### 5. Create Logs Directory

```bash
mkdir -p logs
chmod 755 logs
```

### 6. Start Bot with PM2

```bash
# Start bot
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the command it prints

# Monitor
pm2 monit
```

### 7. Verify Bot is Running

```bash
# Check status
pm2 status

# View logs
pm2 logs discord-bot

# Real-time monitoring
pm2 monit
```

---

## Command Deployment

### Register Slash Commands

```bash
# Add scripts to package.json
"scripts": {
  "deploy:commands": "tsx scripts/deploy-commands.ts",
  "deploy:commands:global": "tsx scripts/deploy-commands.ts --global",
  "deploy:commands:delete": "tsx scripts/deploy-commands.ts --delete"
}
```

### Deploy to Guild (Fast, Recommended)

```bash
npm run deploy:commands
```

Commands appear **instantly** in your server.

### Deploy Globally (Slow, Production)

```bash
npm run deploy:commands:global
```

Commands appear in **all servers** (1 hour propagation time).

### Delete Commands

```bash
npm run deploy:commands:delete
```

---

## Webhook Integration

### 1. Configure Webhook Endpoint

The admin platform should send webhooks to:

```
POST https://your-domain.com/api/discord/webhooks
```

### 2. Webhook Headers

```http
Content-Type: application/json
x-webhook-signature: sha256=<hmac-signature>
x-webhook-timestamp: <iso-timestamp>
x-webhook-event: <event-type>
```

### 3. Event Types

- `quote.new` - New quote received
- `quote.approved` - Quote approved
- `quote.declined` - Quote declined
- `quote.converted` - Quote converted to project
- `project.created` - New project created
- `project.updated` - Project updated
- `project.status_changed` - Project status changed
- `project.deadline_approaching` - Deadline approaching
- `project.completed` - Project completed
- `proposal.generated` - Proposal PDF generated
- `proposal.sent` - Proposal sent to client
- `proposal.viewed` - Client viewed proposal
- `proposal.accepted` - Client accepted proposal
- `proposal.declined` - Client declined proposal
- `monitoring.alert` - New monitoring alert
- `monitoring.resolved` - Alert resolved
- `monitoring.escalated` - Alert escalated

### 4. Generate HMAC Signature (Example in Node.js)

```javascript
const crypto = require('crypto');

function signWebhook(body, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(body));
  return `sha256=${hmac.digest('hex')}`;
}

// Usage
const payload = { quote: { ... }, eventType: 'new' };
const signature = signWebhook(payload, process.env.DISCORD_WEBHOOK_SECRET);

fetch('https://your-domain.com/api/discord/webhooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-signature': signature,
    'x-webhook-timestamp': new Date().toISOString(),
    'x-webhook-event': 'quote.new',
  },
  body: JSON.stringify(payload),
});
```

---

## Monitoring & Logs

### Vercel Logs

```bash
# Real-time logs
vercel logs --follow

# Filter by function
vercel logs app/api/discord/interactions

# Production logs
vercel logs --prod
```

### PM2 Logs (Raspberry Pi)

```bash
# View all logs
pm2 logs

# View specific app
pm2 logs discord-bot

# Last 100 lines
pm2 logs discord-bot --lines 100

# Error logs only
pm2 logs discord-bot --err

# Clear logs
pm2 flush
```

### Winston Logs (Application)

Logs are written to:

- **Console:** All environments
- **Files (Pi only):**
  - `logs/discord-bot-out.log` - Info logs
  - `logs/discord-bot-error.log` - Error logs

### Health Checks

```bash
# Check bot health via Discord
/admin-health

# Check system monitoring
/monitor-status

# View services
/monitor-services
```

---

## Troubleshooting

### Bot Not Coming Online

**Symptoms:** Bot shows offline in Discord

**Solutions:**

1. Verify `DISCORD_BOT_TOKEN` is correct
2. Check Gateway Intents are enabled
3. Restart bot: `pm2 restart discord-bot`
4. Check logs: `pm2 logs discord-bot`

### Commands Not Appearing

**Symptoms:** Slash commands don't show when typing `/`

**Solutions:**

1. Deploy commands: `npm run deploy:commands`
2. Wait 5 minutes for cache
3. Try in incognito browser window
4. Check bot has `applications.commands` scope
5. Re-invite bot with correct OAuth2 URL

### Webhooks Failing

**Symptoms:** 401 Unauthorized on webhook endpoint

**Solutions:**

1. Verify `DISCORD_WEBHOOK_SECRET` matches sender/receiver
2. Check timestamp is within 5 minutes
3. Ensure HMAC signature calculation is correct
4. Check webhook endpoint is accessible (test with curl)

### Rate Limiting

**Symptoms:** "You are being rate limited" error

**Solutions:**

1. Wait 60 seconds for token refill
2. Reduce command frequency
3. Check rate limiter config in `bot/utils/rate-limiter.ts`

### Circuit Breaker Open

**Symptoms:** "Service unavailable" errors

**Solutions:**

1. Check Next.js API is running
2. Verify `BOT_API_URL` is correct
3. Check API authentication (`BOT_API_KEY`)
4. Wait 60 seconds for circuit breaker to reset
5. Monitor API health: `/admin-health`

### PM2 Bot Crashing

**Symptoms:** Bot restarts frequently

**Solutions:**

1. Check error logs: `pm2 logs discord-bot --err`
2. Increase memory limit in `ecosystem.config.js`
3. Verify all env vars are set
4. Check Node.js version: `node --version` (requires 18+)
5. Restart PM2: `pm2 restart discord-bot`

### Database Connection Errors

**Symptoms:** Commands fail with database errors

**Solutions:**

1. Verify `DATABASE_URL` is correct
2. Check Neon dashboard for connection limits
3. Run Prisma generate: `npx prisma generate`
4. Test connection: `npx prisma db push`

---

## Maintenance

### Update Dependencies

```bash
# Update Discord.js
npm update discord.js @discordjs/rest @discordjs/builders

# Update all
npm update

# Check outdated
npm outdated
```

### Update Bot on Raspberry Pi

```bash
cd ~/sunny-stack

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Regenerate Prisma client
npx prisma generate

# Restart bot
pm2 restart discord-bot

# Monitor
pm2 logs discord-bot
```

### Backup Configuration

```bash
# Export PM2 process list
pm2 save

# Backup .env
cp .env .env.backup

# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

---

## Security Checklist

- ✅ **Bot Token:** Never commit to git, use env vars
- ✅ **Webhook Secret:** Generate strong random key, rotate periodically
- ✅ **API Key:** Unique per environment, never share
- ✅ **Signature Verification:** Always verify webhook signatures
- ✅ **Rate Limiting:** Enabled (5 commands/60s per user)
- ✅ **Permission Checks:** Admin commands restricted
- ✅ **Input Validation:** All inputs sanitized
- ✅ **HTTPS Only:** Use HTTPS for all webhook endpoints
- ✅ **Logs:** Monitor for suspicious activity

---

## Support

For issues or questions:

- Check [E2E Testing Guide](./e2e/discord-bot/README.md)
- Review [Troubleshooting](#troubleshooting) section
- Check Winston logs for detailed errors
- Contact: luka@sunny-stack.com
