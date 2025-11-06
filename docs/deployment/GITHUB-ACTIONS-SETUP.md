# GitHub Actions Setup Guide

**Purpose:** Configure automatic deployment to Raspberry Pi on push to main

---

## Overview

### Deployment Flow

```
Developer pushes to main
    ↓
GitHub Actions triggered
    ↓
SSH into Raspberry Pi
    ↓
Git pull latest code
    ↓
Build bot Docker image
    ↓
Start PostgreSQL + Bot containers
    ↓
Run database migrations
    ↓
Verify health checks
    ↓
Send Discord notification
```

### What Gets Deployed

**On Pi (via GitHub Actions):**

- PostgreSQL container
- Discord bot container

**On Vercel (automatic integration):**

- Next.js website
- API routes

---

## Required GitHub Secrets

### Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Add These Secrets

| Secret Name           | Description                         | Example                                  |
| --------------------- | ----------------------------------- | ---------------------------------------- |
| `PI_HOST`             | Pi IP address or hostname           | `YOUR_PI_IP` or `your-pi.local`          |
| `PI_USERNAME`         | SSH username on Pi                  | `pi`                                     |
| `PI_SSH_KEY`          | Private SSH key for Pi access       | Contents of private key file (see below) |
| `PI_SSH_PORT`         | SSH port (optional, defaults to 22) | `22`                                     |
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications   | `https://discord.com/api/webhooks/...`   |

---

## Setting Up SSH Key for GitHub Actions

### On Your Windows Machine

**1. Generate a dedicated SSH key for GitHub Actions:**

```bash
ssh-keygen -t ed25519 -C "github-actions@sunny-stack" -f ~/.ssh/sunny-stack-github-actions
```

**Press Enter** when prompted for passphrase (no passphrase for automation)

**2. Copy the public key:**

```bash
cat ~/.ssh/sunny-stack-github-actions.pub
```

**3. Copy the private key (for GitHub secret):**

```bash
cat ~/.ssh/sunny-stack-github-actions
```

Copy the entire private key file contents (starts with `-----BEGIN` and ends with `-----END`)

---

### On the Raspberry Pi

**1. SSH into Pi:**

```bash
ssh pi@your-pi
```

**2. Add the public key to authorized_keys:**

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

**3. Paste the public key** (from step 2 above) on a new line

**4. Set correct permissions:**

```bash
chmod 600 ~/.ssh/authorized_keys
```

**5. Test the connection from Windows:**

```bash
ssh -i ~/.ssh/sunny-stack-github-actions pi@your-pi
```

Should connect without password prompt.

---

## Setting Up Discord Webhook

### Create Webhook in Discord

1. Open Discord server
2. Go to **Server Settings** → **Integrations** → **Webhooks**
3. Click **New Webhook**
4. Name it "GitHub Actions"
5. Select channel (e.g., #admin-logs)
6. Click **Copy Webhook URL**
7. Add to GitHub Secrets as `DISCORD_WEBHOOK_URL`

---

## Initial Pi Setup for GitHub Actions

### 1. Clone Repository on Pi

**SSH into Pi:**

```bash
ssh pi@your-pi
```

**Clone repo:**

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git sunny-stack
cd sunny-stack
```

**Verify:**

```bash
ls -la
# Should see all project files
```

---

### 2. Create .env.production on Pi

**Create the file:**

```bash
nano .env.production
```

**Add production credentials** (see .env.example for template)

**Critical variables:**

```bash
POSTGRES_USER=sunnystack
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=sunnystack
DATABASE_URL=postgresql://YOUR_DB_USER:<password>@postgres:5432/YOUR_DB_NAME
BOT_API_URL=https://your-site.vercel.app/api
DISCORD_TOKEN=<production-token>
DISCORD_CLIENT_ID=<production-id>
DISCORD_GUILD_ID=<production-server-id>
```

**Save and exit:** `Ctrl+X`, `Y`, `Enter`

**Verify:**

```bash
ls -la .env.production
# Should show file exists
```

---

### 3. Configure Auto-Start on Boot

**Make setup script executable:**

```bash
chmod +x scripts/setup-pi-autostart.sh
```

**Run setup script:**

```bash
./scripts/setup-pi-autostart.sh
```

**What this does:**

- Enables Docker to start on boot
- Creates systemd service for containers
- Configures automatic container restart

**Verify:**

```bash
sudo systemctl status sunny-stack
```

**Test reboot:**

```bash
sudo reboot
```

**After reboot, check:**

```bash
ssh pi@your-pi
sudo systemctl status sunny-stack
docker ps
```

Should show containers running.

---

## Testing the Workflow

### Manual Trigger

1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Deploy to Raspberry Pi**
4. Click **Run workflow**
5. Select branch: `main`
6. Click **Run workflow**

### Monitor Deployment

**Watch the logs:**

- Click on the running workflow
- View real-time deployment progress
- Check for errors

**Expected output:**

```
📥 Pulling latest code from GitHub...
✅ Repository updated
🛑 Stopping existing containers...
🧹 Cleaning up old images...
🔨 Building bot image...
✅ Bot image built successfully
🚀 Starting production services...
✅ PostgreSQL is healthy
📊 Running database migrations...
✅ Migrations completed
✅ Bot health check passed
✅ Bot connected to Discord
✅ Deployment Complete
```

---

### Verify Deployment

**SSH into Pi:**

```bash
ssh pi@your-pi
cd ~/sunny-stack
```

**Check containers:**

```bash
docker compose -f docker-compose.prod.yml ps
```

**Expected:**

- `your-project-db`: Up (healthy)
- `your-project-bot`: Up (healthy)

**Check logs:**

```bash
docker compose -f docker-compose.prod.yml logs -f discord-bot
```

**Test bot in Discord:**

```
/project-list
```

---

## Automatic Deployment on Push

### Normal Workflow

**From Windows:**

```bash
# Make code changes
git add .
git commit -m "Update bot feature"
git push origin main
```

**What happens:**

1. ✅ Vercel deploys website/API (automatic)
2. ✅ GitHub Actions deploys Pi (automatic)
3. ✅ Discord notification sent
4. ✅ Containers restart with new code

**Deployment time:** ~3-5 minutes

---

## Troubleshooting

### Workflow Fails to Connect to Pi

**Check:**

1. Pi is online: `ping YOUR_PI_IP`
2. SSH key is correct in GitHub Secrets
3. Pi firewall allows SSH: `sudo ufw status`

**Fix:**

```bash
# On Pi
sudo ufw allow 22/tcp
sudo systemctl restart ssh
```

---

### Build Fails on Pi

**Check:**

1. Disk space: `df -h`
2. Docker running: `docker ps`
3. Build logs in Actions

**Fix:**

```bash
# SSH into Pi
ssh pi@your-pi

# Clean up Docker
docker system prune -af
docker volume prune -f

# Check disk space
df -h
# If low, expand filesystem: sudo raspi-config
```

---

### Containers Don't Start

**Check logs:**

```bash
ssh pi@your-pi
cd ~/sunny-stack
docker compose -f docker-compose.prod.yml logs
```

**Common issues:**

1. `.env.production` missing
2. Port conflicts
3. Memory limits

**Fix:**

```bash
# Check .env.production exists
ls -la .env.production

# Stop conflicting containers
docker ps -a
docker stop <container-id>

# Restart
docker compose -f docker-compose.prod.yml up -d
```

---

### Migrations Fail

**Check:**

```bash
ssh pi@your-pi
cd ~/sunny-stack
docker compose -f docker-compose.prod.yml logs discord-bot | grep -i prisma
```

**Fix:**

```bash
# Run migrations manually
docker compose -f docker-compose.prod.yml exec discord-bot \
  npx prisma migrate deploy

# If still fails, reset (WARNING: deletes data)
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

---

### Discord Notifications Not Sending

**Check:**

1. `DISCORD_WEBHOOK_URL` secret is set
2. Webhook URL is valid
3. Webhook channel still exists

**Fix:**

1. Recreate webhook in Discord
2. Update `DISCORD_WEBHOOK_URL` in GitHub Secrets
3. Re-run workflow

---

## Monitoring Deployments

### View Deployment History

**GitHub:**

1. Go to **Actions** tab
2. View all deployment runs
3. Click on any run to see logs

### View Container Logs

**On Pi:**

```bash
ssh pi@your-pi
cd ~/sunny-stack

# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View bot logs only
docker compose -f docker-compose.prod.yml logs -f discord-bot

# View last 50 lines
docker compose -f docker-compose.prod.yml logs --tail=50
```

### Check Service Status

**Via systemd:**

```bash
ssh pi@your-pi
sudo systemctl status sunny-stack
```

**Via Docker:**

```bash
ssh pi@your-pi
docker compose -f docker-compose.prod.yml ps
docker stats your-project-bot your-project-db --no-stream
```

---

## Manual Operations

### Manual Deployment

**If GitHub Actions is down:**

```bash
ssh pi@your-pi
cd ~/sunny-stack

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml down
docker rmi -f your-project-bot:latest
docker build --no-cache -t your-project-bot:latest -f Dockerfile .
docker compose -f docker-compose.prod.yml up -d

# Run migrations
docker compose -f docker-compose.prod.yml exec discord-bot npx prisma migrate deploy

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

---

### Restart Containers

**Via systemd:**

```bash
ssh pi@your-pi
sudo systemctl restart sunny-stack
```

**Via Docker Compose:**

```bash
ssh pi@your-pi
cd ~/sunny-stack
docker compose -f docker-compose.prod.yml restart
```

---

### Stop Containers

**Via systemd:**

```bash
ssh pi@your-pi
sudo systemctl stop sunny-stack
```

**Via Docker Compose:**

```bash
ssh pi@your-pi
cd ~/sunny-stack
docker compose -f docker-compose.prod.yml down
```

---

## GitHub Secrets Summary

| Secret                | Required    | Purpose                            |
| --------------------- | ----------- | ---------------------------------- |
| `PI_HOST`             | ✅ Yes      | Pi IP/hostname for SSH             |
| `PI_USERNAME`         | ✅ Yes      | SSH username (usually `pi`)        |
| `PI_SSH_KEY`          | ✅ Yes      | Private SSH key for authentication |
| `PI_SSH_PORT`         | ❌ Optional | SSH port (default: 22)             |
| `DISCORD_WEBHOOK_URL` | ✅ Yes      | Discord notifications              |

---

## Quick Command Reference

### Setup (One-time)

```bash
# On Windows: Generate SSH key
ssh-keygen -t ed25519 -C "github-actions@sunny-stack" -f ~/.ssh/sunny-stack-github-actions

# On Pi: Clone repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git ~/sunny-stack

# On Pi: Setup auto-start
cd ~/sunny-stack
chmod +x scripts/setup-pi-autostart.sh
./scripts/setup-pi-autostart.sh
```

### Daily Operations

```bash
# Push to deploy
git push origin main

# Check deployment
# Go to GitHub Actions tab

# Check containers on Pi
ssh pi@your-pi "docker compose -f ~/sunny-stack/docker-compose.prod.yml ps"

# View logs
ssh pi@your-pi "docker compose -f ~/sunny-stack/docker-compose.prod.yml logs -f discord-bot"
```

---

**Last Updated:** 2025-11-06
**Workflow File:** `.github/workflows/deploy-bot.yml`
**Auto-Start Script:** `scripts/setup-pi-autostart.sh`
