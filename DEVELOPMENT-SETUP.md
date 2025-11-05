# Development Setup - Pi + Windows Workflow

## Overview

This guide covers setting up **local development** where:

- **Windows Dev Machine**: Runs Next.js dev server (port 3000) and houses the codebase
- **Raspberry Pi**: Runs Discord bot in dev mode, connects to Windows Next.js API

---

## Network Configuration

### Step 1: Find Your Windows IP Address

**On Windows:**

```bash
ipconfig
```

Look for your network adapter (usually Wi-Fi or Ethernet):

```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

**Note your IPv4 address** (example: `192.168.1.100`)

---

## Environment Configuration

### Windows Dev Machine (.env.local)

Your Windows `.env.local` should have:

```bash
# Next.js Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Discord Bot (not used on Windows, but needed for completeness)
DISCORD_BOT_TOKEN=your_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
DEPLOYMENT_MODE=pi

# Database
DATABASE_URL=your_database_url_here
```

### Raspberry Pi (.env.local)

Your Pi `.env.local` needs to point to your Windows machine:

```bash
# API Configuration - CRITICAL: Must point to Windows dev machine
BOT_API_URL=http://192.168.1.100:3000

# Replace 192.168.1.100 with YOUR Windows IP address from Step 1

# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
DEPLOYMENT_MODE=pi
NODE_ENV=development

# Database
DATABASE_URL=your_database_url_here
```

---

## Setting BOT_API_URL on Pi

### Option 1: Manual Edit (Recommended for First Time)

```bash
# SSH into Pi
ssh pi@sunny-pi

# Edit .env.local
nano ~/sunny-stack/.env.local

# Add or update this line (replace with YOUR Windows IP):
BOT_API_URL=http://192.168.1.100:3000

# Save: Ctrl+O, Enter, Ctrl+X
```

### Option 2: Automated Update (From Windows)

**Replace `192.168.1.100` with your actual Windows IP:**

```bash
ssh pi@sunny-pi "grep -q BOT_API_URL ~/sunny-stack/.env.local && sed -i 's|BOT_API_URL=.*|BOT_API_URL=http://192.168.1.100:3000|' ~/sunny-stack/.env.local || echo 'BOT_API_URL=http://192.168.1.100:3000' >> ~/sunny-stack/.env.local"
```

---

## Development Workflow

### 1. Start Next.js on Windows

```bash
# On Windows dev machine
npm run dev
```

**Verify it's running:**

- Open browser: http://localhost:3000
- API endpoint: http://localhost:3000/api/admin/projects

### 2. Start Discord Bot on Pi

```bash
# SSH into Pi
ssh pi@sunny-pi

# Navigate to project
cd ~/sunny-stack

# Start bot in dev mode
npm run bot:dev
```

**Expected Output:**

```
[dotenv] injecting env (47) from .env.local
Bot configuration loaded
Starting in Raspberry Pi mode (Gateway API)
Successfully connected to Discord Gateway
```

### 3. Test API Connection

The bot will attempt to connect to your Windows machine when commands are executed.

**Test with Discord command:**

```
/project-list
```

**Expected behavior:**

- Bot fetches from `http://YOUR_WINDOWS_IP:3000/api/admin/projects`
- Returns project list from Windows Next.js server

---

## Troubleshooting

### Bot Can't Connect to Windows API

**Error:**

```
API request failed: fetch failed
endpoint: /admin/projects
```

**Solutions:**

1. **Verify Windows IP hasn't changed:**

   ```bash
   # On Windows
   ipconfig
   ```

   Update `.env.local` on Pi if IP changed

2. **Check Next.js is running on Windows:**

   ```bash
   # On Windows
   curl http://localhost:3000/api/admin/projects
   ```

   Should return JSON data

3. **Check Windows Firewall:**
   - Allow incoming connections on port 3000
   - Windows Defender Firewall → Allow an app → Node.js

4. **Test connectivity from Pi:**

   ```bash
   # On Pi
   curl http://192.168.1.100:3000/api/admin/projects
   ```

   Replace with your Windows IP

5. **Verify BOT_API_URL on Pi:**
   ```bash
   # On Pi
   grep BOT_API_URL ~/sunny-stack/.env.local
   ```
   Should show: `BOT_API_URL=http://YOUR_WINDOWS_IP:3000`

### Bot Logs Show "injecting env (0)"

**Problem:** Environment variables not loading

**Solution:**

```bash
# On Pi - verify .env.local exists and has content
cat ~/sunny-stack/.env.local | wc -l
```

Should show more than 0 lines

### Commands Not Registering with Discord

**Run deployment script:**

```bash
# On Pi
cd ~/sunny-stack
npm run bot:deploy
```

This registers slash commands with Discord.

---

## Network Architecture

```
┌─────────────────────────────────┐
│   Windows Dev Machine           │
│   IP: 192.168.1.100            │
│                                 │
│   ┌─────────────────────────┐  │
│   │  Next.js Dev Server     │  │
│   │  Port: 3000             │  │
│   │  /api/admin/projects    │  │
│   └─────────────────────────┘  │
└────────────┬────────────────────┘
             │ HTTP Requests
             │ (192.168.1.100:3000)
             ▼
┌─────────────────────────────────┐
│   Raspberry Pi 4B               │
│   IP: 192.168.1.19             │
│                                 │
│   ┌─────────────────────────┐  │
│   │  Discord Bot (Dev)      │  │
│   │  npm run bot:dev        │  │
│   │  BOT_API_URL=           │  │
│   │  http://192.168.1.100:  │  │
│   │         3000            │  │
│   └─────────────────────────┘  │
└────────────┬────────────────────┘
             │ Discord Gateway
             │ WebSocket
             ▼
┌─────────────────────────────────┐
│      Discord Servers            │
│   (Cloud Infrastructure)        │
└─────────────────────────────────┘
```

---

## Production vs Development

### Development (This Guide)

- **Windows**: Runs Next.js dev server
- **Pi**: Runs bot in dev mode with `npm run bot:dev`
- **Connection**: Bot → Windows API via local network
- **Environment**: `.env.local` on both machines

### Production (See PI-DEPLOYMENT.md)

- **Vercel**: Hosts Next.js production site
- **Pi**: Runs bot in Docker container
- **Connection**: Bot → Vercel API via internet
- **Environment**: `.env.production` on Pi

---

## Quick Reference

### Update Windows IP on Pi

```bash
# Replace YOUR_IP with your Windows machine's IP
ssh pi@sunny-pi "sed -i 's|BOT_API_URL=.*|BOT_API_URL=http://YOUR_IP:3000|' ~/sunny-stack/.env.local"
```

### Verify Configuration

```bash
# On Pi - check BOT_API_URL
ssh pi@sunny-pi "grep BOT_API_URL ~/sunny-stack/.env.local"
```

### Test API Connection

```bash
# From Pi - test Windows API endpoint
ssh pi@sunny-pi "curl http://YOUR_WINDOWS_IP:3000/api/admin/projects"
```

### Restart Bot After Config Change

```bash
# On Pi
cd ~/sunny-stack
# Stop bot with Ctrl+C
npm run bot:dev
```

---

## Security Notes

⚠️ **Important:**

- `.env.local` contains sensitive tokens and should NEVER be committed to Git
- Ensure your router's firewall prevents external access to port 3000
- This setup is for **local development only** - not for production
- Production uses `.env.production` with Vercel URLs, not local IPs
