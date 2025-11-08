# Raspberry Pi Production Deployment Guide

**Architecture:** PostgreSQL + Discord Bot on Pi | Website + API on Vercel

---

## Production Architecture

```
┌─────────────────────────────────────┐
│         Vercel (Serverless)         │
│  ┌──────────────────────────────┐   │
│  │   Next.js Website + API      │   │
│  │   https://sunny-stack.com    │   │
│  └──────────┬───────────────────┘   │
└─────────────┼───────────────────────┘
              │
              │ DATABASE_URL
              │ postgresql://192.168.1.19:5432
              ↓
┌─────────────────────────────────────┐
│      Raspberry Pi (Self-Hosted)     │
│  ┌──────────────────────────────┐   │
│  │   PostgreSQL Container       │   │
│  │   Port: 5432                 │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│  ┌──────────↓───────────────────┐   │
│  │   Discord Bot Container      │   │
│  │   Calls: sunny-stack.com/api │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Key Points:**

- ✅ Website + API hosted on Vercel (serverless, auto-scaling)
- ✅ PostgreSQL + Bot hosted on Pi (persistent, self-hosted)
- ✅ Vercel API connects to Pi PostgreSQL via external IP
- ✅ Bot calls Vercel API via HTTPS
- ❌ NO API server container on Pi

---

## Prerequisites

- Raspberry Pi 4B with Docker installed
- SSH access configured (`sunny-pi`)
- Windows development machine
- `.env.production` and `.env` configured
- Vercel deployment active

---

## Environment Configuration

### `.env.production` (Pi Only)

```bash
# PostgreSQL Configuration
POSTGRES_USER=sunnystack
POSTGRES_PASSWORD=<secure-production-password>
POSTGRES_DB=sunnystack

# Database Connection (for migrations run on Pi)
DATABASE_URL=postgresql://sunnystack:<password>@postgres:5432/sunnystack

# Discord Bot Configuration
DISCORD_BOT_TOKEN=<production-bot-token>
DISCORD_APPLICATION_ID=<production-application-id>
DISCORD_GUILD_ID=<production-guild-id>
DISCORD_ADMIN_USER_ID=<your-discord-user-id>

# Bot API URL (points to Vercel production)
BOT_API_URL=https://sunny-stack.com/api
BOT_API_KEY=<secure-api-key>

# Deployment Mode
NODE_ENV=production
DEPLOYMENT_MODE=pi
```

### `.env` (Required for Docker Compose Variable Substitution)

```bash
# Docker Compose reads this file for ${VARIABLE} substitution
POSTGRES_PASSWORD=<same-as-env-production>
POSTGRES_USER=sunnystack
POSTGRES_DB=sunnystack
```

**Critical:** Both `.env` and `.env.production` must exist on Pi. Docker Compose reads `.env` for variable substitution, containers read `.env.production` for runtime config.

---

## Step 1: Clear Everything (Fresh Start)

**On Pi:**

```bash
# Stop and remove all containers
docker compose down -v

# Remove all images
docker image prune -af

# Remove all build cache
docker builder prune -af

# Nuclear option (removes everything)
docker system prune -af --volumes
```

---

## Step 2: Sync Files from Windows to Pi

```bash
tar czf - \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=coverage \
  --exclude=logs \
  --exclude=.env.local \
  --exclude=docker-compose.dev.yml \
  --exclude=playwright-report \
  --exclude=test-results \
  --exclude=*.tsbuildinfo \
  --exclude=*.log \
  --exclude=.swc \
  --exclude=out \
  . \
  | ssh sunny-pi "cd ~/sunny-stack && tar xzf -"
```

**What syncs:**

- ✅ `Dockerfile` (bot image build instructions)
- ✅ `docker-compose.yml` (production services)
- ✅ `.env.production` (container runtime env vars)
- ✅ `.env` (Docker Compose variable substitution)
- ✅ `bot/` (Discord bot source code)
- ✅ `prisma/` (database schema)
- ✅ `lib/` (shared utilities)
- ✅ `package.json`, `package-lock.json`, `tsconfig*.json`

---

## Step 3: Verify Environment on Pi

**SSH into Pi:**

```bash
ssh sunny-pi
cd ~/sunny-stack
```

**Check files:**

```bash
# Verify both env files exist
ls -la .env .env.production

# Verify BOT_API_URL points to Vercel
grep BOT_API_URL .env.production
# Should show: BOT_API_URL=https://sunny-stack.com/api

# Verify docker-compose.yml exists
ls -la docker-compose.yml
```

---

## Step 4: Start PostgreSQL Database ONLY

```bash
# Start only PostgreSQL container
docker compose up -d postgres
```

**Wait for healthy status:**

```bash
# Watch logs until you see "database system is ready to accept connections"
docker compose logs -f postgres
```

**Verify PostgreSQL is healthy:**

```bash
docker compose ps
```

**Expected output:**

```
NAME             STATUS
sunny-stack-db   Up X seconds (healthy)
```

**Test database connection:**

```bash
docker compose exec postgres \
  psql -U sunnystack -d sunnystack -c "SELECT version();"
```

---

## Step 5: Run Database Migrations

**Run Prisma migrations from your Windows machine (easier):**

```bash
# Set DATABASE_URL to point to Pi
DATABASE_URL="postgresql://sunnystack:e57f9b3003def6853e00d95c03960d96385294565244ba5e5ef690bf5afa3ff3@192.168.1.19:5432/sunnystack" npx prisma migrate deploy

```

**Or run migrations on Pi:**

```bash
# Install Node.js dependencies temporarily (for Prisma CLI)
npm install --production=false

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Clean up dev dependencies
npm prune --production
```

**Verify schema:**

```bash
docker compose exec postgres \
  psql -U sunnystack -d sunnystack -c "\dt"
```

**Expected:** List of tables (Project, TimeEntry, Invoice, etc.)

---

## Step 6: Build Discord Bot Image

```bash
# Clear build cache for clean build
docker builder prune -af

# Build bot image with tsc-alias path resolution
docker build --no-cache --progress=plain \
  -t sunny-stack-bot:latest \
  -f Dockerfile . 2>&1 | tee build-bot.log
```

**Build process includes:**

1. **Dependencies installation** - Production dependencies only
2. **Prisma client generation** - Database type definitions
3. **TypeScript compilation** - `tsc --project tsconfig.bot.json`
4. **Path alias transformation** - `tsc-alias` converts `@/lib/...` to relative paths (**fixes module resolution**)
5. **Dotenv validation** - Ensures no runtime dotenv loading
6. **Multi-stage build** - Minimal final image size

**Verify build:**

```bash
docker images | grep sunny-stack-bot
```

**Expected:**

```
sunny-stack-bot   latest   <image-id>   X seconds ago   XXX MB
```

---

## Step 7: Start Discord Bot

```bash
# Start bot container (depends on postgres being healthy)
docker compose up -d discord-bot
```

**Watch bot startup:**

```bash
docker compose logs -f discord-bot
```

**Look for these success messages:**

```
✅ Validating bot configuration...
✅ Bot configuration loaded
✅ Starting in Raspberry Pi mode (Gateway API)
✅ Connected to Discord Gateway
✅ Bot ready and operational
✅ Health server started on port 8080
```

**Verify both containers are healthy:**

```bash
docker compose ps
```

**Expected:**

```
NAME              STATUS
sunny-stack-db    Up X minutes (healthy)
sunny-stack-bot   Up X seconds (healthy)
```

---

## Step 8: Test Bot Health

**Test health endpoint:**

```bash
curl http://localhost:8080/health
```

**Expected:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-07T...",
  "uptime": 123.456
}
```

**Test Discord command in Discord server:**

```
/project-list
```

**Expected:** Bot responds with project list

**Check bot is calling Vercel API:**

```bash
docker compose logs discord-bot | grep "API request"
```

**Expected:**

```
[info]: API request successful {"endpoint":"/admin/projects","method":"GET","statusCode":200}
```

---

## Step 9: Configure Vercel Database Connection

**In Vercel Dashboard → Project → Settings → Environment Variables:**

```bash
DATABASE_URL=postgresql://sunnystack:<password>@192.168.1.19:5432/sunnystack
```

**Redeploy Vercel:**

```bash
git push origin main
```

**Test Vercel can connect to Pi database:**

- Visit your website
- Try an action that requires database (e.g., submit quote request)
- Check Vercel logs for database connection

---

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Database only
docker compose logs -f postgres

# Bot only
docker compose logs -f discord-bot

# Last 50 lines
docker compose logs --tail=50
```

### Check Status

```bash
docker compose ps
```

### Check Health

```bash
# Bot health
curl http://localhost:8080/health

# PostgreSQL health
docker compose exec postgres pg_isready -U sunnystack
```

### Restart Services

```bash
# Restart both
docker compose restart

# Restart database only
docker compose restart postgres

# Restart bot only
docker compose restart discord-bot
```

### Stop Services

```bash
# Stop (preserves data)
docker compose down

# Stop and delete data (DANGEROUS!)
docker compose down -v
```

### Resource Usage

```bash
docker stats sunny-stack-bot sunny-stack-db
```

---

## Update Deployment (Code Changes)

### 1. Sync Updated Code from Windows

```bash
tar czf - \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=coverage \
  --exclude=logs \
  --exclude=.env.local \
  --exclude=docker-compose.dev.yml \
  --exclude=playwright-report \
  --exclude=test-results \
  --exclude=*.tsbuildinfo \
  --exclude=*.log \
  --exclude=.swc \
  --exclude=out \
  . \
  | ssh sunny-pi "cd ~/sunny-stack && tar xzf -"
```

### 2. Rebuild and Restart on Pi

```bash
ssh sunny-pi
cd ~/sunny-stack

# Stop services
docker compose down

# Remove old bot image
docker rmi -f sunny-stack-bot:latest

# Clear cache
docker builder prune -af

# Rebuild bot
docker build --no-cache -t sunny-stack-bot:latest -f Dockerfile .

# Start database first
docker compose up -d postgres

# Wait for healthy
sleep 10

# Start bot
docker compose up -d discord-bot

# Run migrations if schema changed
npx prisma migrate deploy

# Watch logs
docker compose logs -f
```

---

## Troubleshooting

### Issue: Bot crash-looping with "Cannot find module '@/lib/...'"

**Cause:** TypeScript path aliases not transformed to relative paths

**Fix:** Rebuild image with `tsc-alias` (already in Dockerfile):

```bash
docker builder prune -af
docker build --no-cache -t sunny-stack-bot:latest -f Dockerfile .
docker compose up -d discord-bot
```

### Issue: PostgreSQL won't start

**Check logs:**

```bash
docker compose logs postgres
```

**Common causes:**

1. **Missing .env file** - Docker Compose needs `.env` for `${POSTGRES_PASSWORD}` substitution
2. **Corrupted volume** - Delete volume: `docker compose down -v`
3. **Port conflict** - Check if port 5432 is already in use: `sudo netstat -tulpn | grep 5432`

### Issue: Bot can't connect to Vercel API

**Check BOT_API_URL:**

```bash
docker compose exec discord-bot printenv BOT_API_URL
```

**Should show:** `https://sunny-stack.com/api`

**Test from Pi:**

```bash
curl https://sunny-stack.com/api/health
```

### Issue: Vercel can't connect to PostgreSQL

**Check firewall:**

```bash
sudo ufw status
```

**Allow PostgreSQL port:**

```bash
sudo ufw allow 5432/tcp
```

**Test from Windows:**

```bash
psql postgresql://sunnystack:<password>@192.168.1.19:5432/sunnystack
```

---

## Production Checklist

**Before deployment:**

- [ ] `.env.production` has correct credentials
- [ ] `.env` has POSTGRES_PASSWORD for Docker Compose
- [ ] `BOT_API_URL=https://sunny-stack.com/api`
- [ ] `DATABASE_URL` uses `@postgres:5432` (Docker network)
- [ ] Vercel has `DATABASE_URL` pointing to Pi IP
- [ ] Pi port 5432 accessible to Vercel

**After deployment:**

- [ ] PostgreSQL shows "Up (healthy)"
- [ ] Bot shows "Up (healthy)"
- [ ] Bot logs show "Connected to Discord Gateway"
- [ ] `/project-list` command works in Discord
- [ ] Bot logs show API requests to sunny-stack.com
- [ ] Vercel can connect to Pi database

---

## Quick Reference

**Complete deployment from scratch:**

```bash
# On Pi
cd ~/sunny-stack
docker compose down -v
docker builder prune -af
docker compose up -d postgres
# Wait for healthy
npx prisma migrate deploy
docker build --no-cache -t sunny-stack-bot:latest -f Dockerfile .
docker compose up -d discord-bot
docker compose logs -f
```

**View status:**

```bash
docker compose ps
curl http://localhost:8080/health
docker stats sunny-stack-bot sunny-stack-db
```

---

**Last Updated:** 2025-11-07
**Architecture:** PostgreSQL + Bot on Pi | Website + API on Vercel
**Deployment Order:** Database → Migrations → Bot Build → Bot Start
**Success Criteria:** Both containers healthy, bot connects to Discord, calls Vercel API
