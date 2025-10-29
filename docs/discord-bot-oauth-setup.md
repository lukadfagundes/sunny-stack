# Discord Bot OAuth2 Setup Guide

**Issue:** "Private application cannot have a default authorization link"

**Solution:** Configure OAuth2 settings in Discord Developer Portal

**Estimated Time:** 10-15 minutes

---

## Prerequisites

Before starting this guide, you should have:

1. ✅ **Discord Server Created** - If not created yet, follow [DISCORD-SERVER-SETUP.md](../DISCORD-SERVER-SETUP.md) first
2. ✅ **Discord Bot Application** - Created in Discord Developer Portal (name: **Tempest**)
3. ✅ **Developer Mode Enabled** - Discord Settings → Advanced → Developer Mode ✅

**If you haven't created your Discord server and channels yet, follow [DISCORD-SERVER-SETUP.md](../DISCORD-SERVER-SETUP.md) to create the 13-channel structure before continuing.**

---

## Step 1: Navigate to OAuth2 Settings

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application: **Tempest**
3. Click **OAuth2** in the left sidebar
4. Click **URL Generator** (or **OAuth2 URL Generator**)

---

## Step 2: Configure Bot Scopes

### Required Scopes

Select the following scopes:

- ✅ **bot** - Allows your app to add a bot user to a server
- ✅ **applications.commands** - Allows your app to create commands in guilds

---

## Step 3: Configure Bot Permissions

After selecting scopes, the **Bot Permissions** section will appear below.

### Required Permissions for Sunny Stack Bot

**Text Permissions:**

- ✅ **Send Messages** - Send messages in channels
- ✅ **Send Messages in Threads** - Send messages in threads
- ✅ **Embed Links** - Embed links in messages
- ✅ **Attach Files** - Attach files to messages (for PDFs, reports)
- ✅ **Read Message History** - Read message history
- ✅ **Mention Everyone** - Mention @everyone, @here, and all roles (for critical alerts)
- ✅ **Add Reactions** - Add reactions to messages (for confirmations)
- ✅ **Use External Emojis** - Use emojis from other servers

**General Permissions:**

- ✅ **View Channels** - View all channels the bot is added to
- ✅ **Manage Webhooks** - Create/edit webhooks for GitHub, Vercel alerts

---

## Step 4: Generate OAuth2 URL

1. After selecting scopes and permissions, an **OAuth2 URL** will be generated at the bottom
2. **Copy this URL** - It will look like:
   ```
   https://discord.com/oauth2/authorize?client_id=1432712159216930926&permissions=274878024768&scope=bot%20applications.commands
   ```

---

## Step 5: Invite Bot to Your Server

1. Open the OAuth2 URL in a new browser tab
2. Select your **Sunny Stack** server from the dropdown
3. Click **Authorize**
4. Complete the CAPTCHA if prompted
5. Bot will now appear in your server as **offline** (until you run the bot code)

---

## Step 6: Copy Bot Token

1. Go back to Discord Developer Portal
2. Click **Bot** in the left sidebar
3. Under **Token** section, click **Reset Token** (or **Copy** if visible)
4. **Copy the token** - You'll need this for your `.env` file
5. ⚠️ **NEVER share this token** - It gives full access to your bot

---

## Step 7: Configure Bot Settings

### Bot Settings to Enable

1. **Privileged Gateway Intents** (if needed later):
   - ⬜ Presence Intent (not needed for now)
   - ⬜ Server Members Intent (not needed for now)
   - ⬜ Message Content Intent (enable if bot needs to read message content)

2. **Public Bot**:
   - ⬜ Keep **DISABLED** - Your bot is private for personal use

3. **Require OAuth2 Code Grant**:
   - ⬜ Keep **DISABLED**

---

## Environment Variables to Save

After completing setup, save these values:

```bash
# Discord Bot
DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
DISCORD_APPLICATION_ID=1432712159216930926
DISCORD_GUILD_ID=YOUR_SERVER_ID_HERE
```

### How to Get Server (Guild) ID

1. Open Discord
2. Go to **User Settings** → **Advanced**
3. Enable **Developer Mode**
4. Right-click your **Sunny Stack** server icon
5. Click **Copy Server ID**

### How to Get Channel IDs

1. With Developer Mode enabled
2. Right-click any channel (e.g., #alerts-critical)
3. Click **Copy Channel ID**

```bash
# Discord Channels
DISCORD_ADMIN_CHANNEL_ID=COPY_FROM_#bot-commands
DISCORD_ALERT_CRITICAL_CHANNEL_ID=COPY_FROM_#alerts-critical
DISCORD_MONITORING_CHANNEL_ID=COPY_FROM_#monitoring
```

### How to Get Your User ID

1. Right-click your username anywhere in Discord
2. Click **Copy User ID**

```bash
# Discord Admin
DISCORD_ADMIN_USER_ID=YOUR_USER_ID_HERE
```

### How to Get All 13 Channel IDs

You need to copy IDs for all 13 channels in your Discord server. Make sure **Developer Mode** is enabled first!

**For each channel below:**

1. Right-click the channel name in Discord
2. Click **Copy Channel ID**
3. Paste it into your `.env.local` file

**📋 ADMINISTRATIVE (2 channels)**

- `#admin-logs` → `DISCORD_CHANNEL_ADMIN_LOGS`
- `#bot-commands` → `DISCORD_CHANNEL_BOT_COMMANDS`

**💼 PROJECT MANAGEMENT (4 channels)**

- `#active-projects` → `DISCORD_CHANNEL_ACTIVE_PROJECTS`
- `#proposals` → `DISCORD_CHANNEL_PROPOSALS`
- `#tasks` → `DISCORD_CHANNEL_TASKS`
- `#time-tracking` → `DISCORD_CHANNEL_TIME_TRACKING`

**👥 CLIENT COMMUNICATION (2 channels)**

- `#client-inquiries` → `DISCORD_CHANNEL_CLIENT_INQUIRIES`
- `#client-updates` → `DISCORD_CHANNEL_CLIENT_UPDATES`

**📊 AUTOMATION & MONITORING (3 channels)**

- `#calendar-sync` → `DISCORD_CHANNEL_CALENDAR_SYNC`
- `#email-notifications` → `DISCORD_CHANNEL_EMAIL_NOTIFICATIONS`
- `#analytics` → `DISCORD_CHANNEL_ANALYTICS`

**💰 FINANCIAL (2 channels)**

- `#invoices` → `DISCORD_CHANNEL_INVOICES`
- `#payments` → `DISCORD_CHANNEL_PAYMENTS`

**Example `.env.local` entries:**

```bash
# 📋 ADMINISTRATIVE
DISCORD_CHANNEL_ADMIN_LOGS=1234567890123456789
DISCORD_CHANNEL_BOT_COMMANDS=1234567890123456789

# 💼 PROJECT MANAGEMENT
DISCORD_CHANNEL_ACTIVE_PROJECTS=1234567890123456789
DISCORD_CHANNEL_PROPOSALS=1234567890123456789
DISCORD_CHANNEL_TASKS=1234567890123456789
DISCORD_CHANNEL_TIME_TRACKING=1234567890123456789

# 👥 CLIENT COMMUNICATION
DISCORD_CHANNEL_CLIENT_INQUIRIES=1234567890123456789
DISCORD_CHANNEL_CLIENT_UPDATES=1234567890123456789

# 📊 AUTOMATION & MONITORING
DISCORD_CHANNEL_CALENDAR_SYNC=1234567890123456789
DISCORD_CHANNEL_EMAIL_NOTIFICATIONS=1234567890123456789
DISCORD_CHANNEL_ANALYTICS=1234567890123456789

# 💰 FINANCIAL
DISCORD_CHANNEL_INVOICES=1234567890123456789
DISCORD_CHANNEL_PAYMENTS=1234567890123456789
```

**⚠️ Note:** If you haven't created these 13 channels yet, follow [DISCORD-SERVER-SETUP.md](DISCORD-SERVER-SETUP.md) to create the complete server structure first.

---

## Testing Bot Connection

Once you have the token, you can test the bot connection:

```javascript
// test-bot-connection.js
const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  console.log(`✅ Connected to ${client.guilds.cache.size} server(s)`);
  process.exit(0);
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

Run test:

```bash
node test-bot-connection.js
```

Expected output:

```
✅ Bot is online as Tempest#1234
✅ Connected to 1 server(s)
```

---

## Troubleshooting

### Error: "Invalid Token"

- Token was regenerated or copied incorrectly
- Go to Bot settings and copy token again
- Ensure no extra spaces in `.env` file

### Error: "Missing Access"

- Bot doesn't have permission for that channel
- Right-click channel → Edit Channel → Permissions
- Add your bot role and enable required permissions

### Bot Appears Offline

- Bot code is not running yet
- Token is invalid
- Internet connection issue

### Error: "Missing Intents"

- Enable required intents in Discord Developer Portal → Bot → Privileged Gateway Intents
- Update bot code to include required intents

---

## Next Steps

1. ✅ Copy OAuth2 URL and invite bot to server
2. ✅ Copy bot token and save to `.env.local`
3. ✅ Get server ID and channel IDs
4. ✅ Get your user ID
5. ⏳ Wait for bot implementation (Phase 3)
6. ⏳ Run bot and test connection

---

**Setup Status:** Complete OAuth2 and token setup
**Next Phase:** Phase 0 - Prerequisites & Configuration
**Bot Implementation:** Phase 3 (after Phase 0, 1, 1.5, 2)
