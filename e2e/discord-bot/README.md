# Discord Bot E2E Testing Guide

This guide explains how to perform end-to-end testing of the Sunny Stack Discord bot.

## Quick Start (Local Development)

### 1. Set Deployment Mode

Edit `.env.local` and set:

```bash
DEPLOYMENT_MODE=pi
```

### 2. Launch Both Processes

**Terminal 1 - Next.js Site:**

```bash
npm run dev
```

**Terminal 2 - Discord Bot:**

```bash
npm run bot:dev
```

### 3. Deploy Slash Commands (First Time Only)

```bash
npm run bot:deploy
```

The bot will connect to Discord and start listening for commands!

---

## Prerequisites

1. **Test Discord Server**
   - Create a dedicated Discord server for testing
   - Copy server ID to `.env.local` as `DISCORD_GUILD_ID`

2. **Test Bot Application**
   - Create a separate Discord bot application for testing at https://discord.com/developers/applications
   - Copy bot token to `.env.local` as `DISCORD_BOT_TOKEN`
   - Copy application ID as `DISCORD_APPLICATION_ID`
   - Copy public key as `DISCORD_PUBLIC_KEY`

3. **Required Environment Variables**

   ```bash
   # Discord Configuration (Test Bot)
   DISCORD_BOT_TOKEN=<test-bot-token>
   DISCORD_APPLICATION_ID=<test-app-id>
   DISCORD_PUBLIC_KEY=<test-public-key>
   DISCORD_GUILD_ID=<test-server-id>
   DISCORD_ADMIN_USER_ID=<your-discord-user-id>

   # Channels (create these in your test server)
   DISCORD_GENERAL_CHANNEL_ID=<channel-id>
   DISCORD_NOTIFICATIONS_CHANNEL_ID=<channel-id>
   DISCORD_ERROR_CHANNEL_ID=<channel-id>

   # Bot Configuration
   DEPLOYMENT_MODE=pi  # Use Gateway mode for testing
   BOT_API_KEY=<generate-random-key>
   BOT_API_URL=http://localhost:3000  # Local dev server

   # Webhook Security
   DISCORD_WEBHOOK_SECRET=<generate-random-key>
   ```

## Test Scenarios

### 1. Bot Startup & Ready Event

**Steps:**

1. Start the site: `npm run dev` (Terminal 1)
2. Start the bot: `npm run bot:dev` (Terminal 2)
3. Verify bot appears online in Discord server
4. Check #notifications channel for "Bot Online" message
5. Verify bot presence shows "Watching Sunny Stack Admin"

**Expected Results:**

- ✅ Bot shows as online
- ✅ Startup notification sent
- ✅ Channels verified in logs
- ✅ Commands registered successfully

---

### 2. Slash Command Registration

**Steps:**

1. Deploy commands: `npm run bot:deploy`
2. Type `/` in any channel
3. Verify all 18 commands appear

**Expected Commands:**

- `/project-create`, `/project-list`, `/project-status`, `/project-update`, `/project-delete`
- `/quote-list`, `/quote-review`, `/quote-convert`, `/quote-approve`
- `/time-start`, `/time-stop`, `/time-log`, `/time-report`
- `/monitor-status`, `/monitor-services`, `/monitor-alerts`
- `/admin-sync`, `/admin-health`

---

### 3. Project Commands

#### 3.1 Create Project

```
/project-create
  title: E2E Test Project
  client-name: Test Client
  client-email: test@example.com
  description: Testing project creation
  budget: 10000
  status: PLANNING
```

**Expected:**

- ✅ Success embed displayed
- ✅ Project embed with details
- ✅ Project appears in admin dashboard

#### 3.2 List Projects

```
/project-list page:1
```

**Expected:**

- ✅ List of all projects
- ✅ Pagination footer
- ✅ Status icons displayed

#### 3.3 View Project Status

```
/project-status project-id:<id-from-list>
```

**Expected:**

- ✅ Detailed project embed
- ✅ Statistics (quotes, time entries)
- ✅ Timeline information

#### 3.4 Update Project

```
/project-update
  project-id:<id>
  status:IN_PROGRESS
```

**Expected:**

- ✅ Success message
- ✅ Updated project embed
- ✅ Changes reflected

---

### 4. Quote Commands

#### 4.1 List Quotes

```
/quote-list status:PENDING
```

**Expected:**

- ✅ Filtered quote list
- ✅ Client information visible
- ✅ Quick action commands shown

#### 4.2 Review Quote

```
/quote-review quote-id:<id>
```

**Expected:**

- ✅ Full quote details
- ✅ Requirements displayed
- ✅ Proposal status (if exists)

#### 4.3 Approve Quote

```
/quote-approve quote-id:<id> action:APPROVED
```

**Expected:**

- ✅ Quote status updated
- ✅ Next steps shown
- ✅ Notification sent

#### 4.4 Convert to Project

```
/quote-convert
  quote-id:<id>
  budget:15000
  status:PLANNING
```

**Expected:**

- ✅ New project created
- ✅ Quote status updated to CONVERTED
- ✅ Link between quote and project established

---

### 5. Time Tracking Commands

#### 5.1 Start Time Tracking

```
/time-start
  project-id:<id>
  description: Working on homepage redesign
```

**Expected:**

- ✅ Time entry created
- ✅ Entry ID displayed
- ✅ Instructions to stop tracking shown

#### 5.2 Stop Time Tracking

```
/time-stop entry-id:<id>
```

**Expected:**

- ✅ Time entry stopped
- ✅ Duration calculated and displayed
- ✅ Time range shown

#### 5.3 Manual Time Log

```
/time-log
  project-id:<id>
  duration:120
  description: Backend API development
```

**Expected:**

- ✅ Retroactive entry created
- ✅ Duration formatted (2h 0m)

#### 5.4 Generate Report

```
/time-report period:week
```

**Expected:**

- ✅ Total time displayed
- ✅ Project breakdown shown
- ✅ Recent entries listed
- ✅ Percentages calculated

---

### 6. Monitoring Commands

#### 6.1 System Status

```
/monitor-status
```

**Expected:**

- ✅ Overall uptime percentage
- ✅ Service statuses (Fly.io, Cloudflare, etc.)
- ✅ Alert summary
- ✅ Color-coded by health

#### 6.2 Service Details

```
/monitor-services service:fly
```

**Expected:**

- ✅ Detailed service metrics
- ✅ Response times
- ✅ Recent events
- ✅ Configuration info

#### 6.3 Alert List

```
/monitor-alerts severity:CRITICAL
```

**Expected:**

- ✅ Filtered alert list
- ✅ Severity icons
- ✅ Source and timestamp
- ✅ Pagination

---

### 7. Admin Commands

#### 7.1 Sync Data

```
/admin-sync type:all
```

**Expected:**

- ✅ Sync progress shown
- ✅ Results summary (synced, updated, errors)
- ✅ Completion time

#### 7.2 Health Check

```
/admin-health
```

**Expected:**

- ✅ Component status (database, API, Discord, monitoring)
- ✅ Response times
- ✅ Platform metrics
- ✅ Overall health indicator

---

### 8. Permission & Rate Limiting

#### 8.1 Admin-Only Commands

Test with a non-admin user:

```
/project-create ...
```

**Expected:**

- ✅ Permission denied error
- ✅ Ephemeral error message

#### 8.2 Rate Limiting

Execute 6 commands rapidly (within 60 seconds):

```
/admin-health (repeat 6 times)
```

**Expected:**

- ✅ First 5 succeed
- ✅ 6th shows rate limit error
- ✅ Retry time displayed
- ✅ Resets after 60 seconds

---

### 9. Bot Mentions

Send a message:

```
@SunnyStackBot help
```

**Expected:**

- ✅ Help embed displayed
- ✅ List of command categories
- ✅ Instruction to use `/` for commands

---

### 10. Webhook Notifications

#### 10.1 New Quote Webhook

Use curl or Postman to send:

```bash
curl -X POST http://localhost:3000/api/discord/webhooks \
  -H "Content-Type: application/json" \
  -H "x-webhook-event: quote.new" \
  -H "x-webhook-signature: <computed-hmac>" \
  -H "x-webhook-timestamp: <iso-timestamp>" \
  -d '{
    "quote": {
      "id": "test_quote",
      "name": "Webhook Test",
      "email": "webhook@test.com",
      "projectType": "Web App",
      "description": "Testing webhooks",
      "status": "PENDING",
      "createdAt": "2025-01-29T00:00:00Z"
    },
    "eventType": "new"
  }'
```

**Expected:**

- ✅ Notification in #notifications channel
- ✅ Admin mentioned
- ✅ Quick action commands shown

#### 10.2 Project Status Change

Send webhook:

```bash
curl -X POST http://localhost:3000/api/discord/webhooks \
  -H "Content-Type: application/json" \
  -H "x-webhook-event: project.status_changed" \
  -H "x-webhook-signature: <computed-hmac>" \
  -H "x-webhook-timestamp: <iso-timestamp>" \
  -d '{...}'
```

**Expected:**

- ✅ Status change notification
- ✅ Old → New status shown
- ✅ Color based on new status

#### 10.3 Critical Monitoring Alert

Send webhook:

```bash
curl -X POST http://localhost:3000/api/discord/webhooks \
  -H "x-webhook-event: monitoring.alert" \
  ...
```

**Expected:**

- ✅ Critical alert notification
- ✅ Admin mentioned (@user)
- ✅ Red color embed
- ✅ Service status shown

---

### 11. Error Scenarios

#### 11.1 Invalid Project ID

```
/project-status project-id:invalid-id
```

**Expected:**

- ✅ Validation error
- ✅ Clear error message
- ✅ Ephemeral response

#### 11.2 API Down

1. Stop Next.js server
2. Try any command

**Expected:**

- ✅ Circuit breaker opens after 5 failures
- ✅ Error logged
- ✅ User-friendly error message

#### 11.3 Invalid Webhook Signature

Send webhook with wrong signature

**Expected:**

- ✅ 401 Unauthorized response
- ✅ No notification sent
- ✅ Security log entry

---

## Test Automation Scripts

### Generate HMAC Signature (for webhooks)

```javascript
const crypto = require("crypto");

function generateSignature(body, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(body));
  return `sha256=${hmac.digest("hex")}`;
}

const body = { test: "data" };
const secret = process.env.DISCORD_WEBHOOK_SECRET;
console.log(generateSignature(body, secret));
```

### Deploy Test Commands

```bash
# Add to package.json scripts
"bot:start": "tsx bot/index.ts",
"bot:deploy": "tsx scripts/deploy-commands.ts",
"bot:deploy:global": "tsx scripts/deploy-commands.ts --global",
"bot:deploy:delete": "tsx scripts/deploy-commands.ts --delete"
```

---

## Troubleshooting

### Bot Not Coming Online

- Verify `DISCORD_BOT_TOKEN` is correct
- Check bot has "Presence Intent" and "Server Members Intent" enabled
- Ensure bot was invited with correct permissions (applications.commands scope)

### Commands Not Showing

- Run `npm run bot:deploy` to register commands
- Wait 5 minutes for Discord cache to update
- Try in an incognito/private browser window

### Webhooks Failing Verification

- Ensure `DISCORD_WEBHOOK_SECRET` matches between sender and receiver
- Check timestamp is within 5 minutes
- Verify HMAC signature calculation

### Rate Limiting Too Aggressive

- Adjust limits in `bot/utils/rate-limiter.ts` for testing
- Use `resetRateLimit(userId)` in tests

---

## Success Criteria

All tests pass when:

- ✅ Bot comes online successfully
- ✅ All 18 commands execute without errors
- ✅ Webhooks deliver notifications correctly
- ✅ Permissions are enforced
- ✅ Rate limiting works as expected
- ✅ Error handling is graceful
- ✅ Embeds display correctly with Sunny Stack branding
