# Raspberry Pi Production Deployment Guide

**Architecture:** PostgreSQL + Discord Bot on Pi | Website + API on Vercel

---

## Production Architecture

```
┌─────────────────────────────────────┐
│         Vercel (Serverless)         │
│  ┌──────────────────────────────┐   │
│  │   Next.js Website + API      │   │
│  │   https://your-site.vercel.app    │   │
│  └──────────┬───────────────────┘   │
└─────────────┼───────────────────────┘
              │
              │ DATABASE_URL
              │ postgresql://YOUR_PI_IP:5432
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
│  │   Calls: your-site.vercel.app/api │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Key Points:**

- ✅ Website + API hosted on Vercel (serverless, auto-scaling)
- ✅ PostgreSQL + Bot hosted on Pi (persistent, self-hosted)
- ✅ Vercel API connects to Pi PostgreSQL via external IP
- ✅ Bot calls Vercel API via HTTPS (your-site.vercel.app/api)
- ❌ NO API server container on Pi

---

## Prerequisites

- Raspberry Pi 4B with Docker installed
- SSH access configured (`pi@your-pi`)
- Windows development machine
- `.env.production` configured with production credentials
- Vercel deployment active at `https://your-site.vercel.app`

---

## Environment Configuration

### `.env.production` (Pi Only)

**Required variables:**

```bash
# PostgreSQL Configuration
POSTGRES_USER=sunnystack
POSTGRES_PASSWORD=<secure-production-password>
POSTGRES_DB=sunnystack

# Database Connection (for migrations run on Pi)
DATABASE_URL=postgresql://YOUR_DB_USER:<password>@postgres:5432/YOUR_DB_NAME

# Discord Bot Configuration
DISCORD_TOKEN=<production-bot-token>
DISCORD_CLIENT_ID=<production-client-id>
DISCORD_GUILD_ID=<production-server-id>

# Bot API URL (points to Vercel production)
BOT_API_URL=https://your-site.vercel.app/api

# Deployment Mode
NODE_ENV=production
DEPLOYMENT_MODE=pi
```

**Important:**

- `DATABASE_URL` uses `postgres:5432` (Docker container name)
- `BOT_API_URL` points to Vercel (`https://your-site.vercel.app/api`)
- Bot does NOT connect to localhost API - it calls Vercel

---

## Step 0: Clear Cache

```bash
# Stop containers
docker compose down -v

# Remove all Docker cache/build cache:
docker builder prune -af

# Remove all unused images:
docker image prune -af
```

---

## Step 1: Sync Files to Pi

**From Windows machine:**

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
  | ssh pi@your-pi "cd ~/sunny-stack && tar xzf -"
```

**What syncs:**

- ✅ `Dockerfile` (bot image)
- ✅ `docker-compose.yml`
- ✅ `.env.production`
- ✅ **`.env`** (required for Docker Compose variable substitution)
- ✅ Bot source code (`bot/`)
- ✅ Prisma schema (`prisma/`)
- ❌ `.env.local`, `docker-compose.dev.yml` (testing only)
- ❌ `Dockerfile.api` (not needed - API on Vercel)

**Important:** The `.env` file MUST be synced because Docker Compose reads it for variable substitution (e.g., `${POSTGRES_PASSWORD}`) in docker-compose.yml files, even when `env_file: .env.production` is specified. Without it, PostgreSQL container will fail to start.

---

## Step 2: SSH into Pi

```bash
ssh pi@your-pi
cd ~/sunny-stack
```

---

## Step 3: Verify Environment

```bash
# Check .env.production exists
ls -la .env.production

# Verify BOT_API_URL points to Vercel
grep BOT_API_URL .env.production
# Should show: https://your-site.vercel.app/api

# Verify no dev files remain
ls .env.local docker-compose.dev.yml 2>/dev/null
# Should show: No such file or directory
```

---

## Step 4: Personalize Documentation (First Time Only)

**Before building the bot image, personalize the project documentation to replace placeholder names with your project name.**

```bash
# Edit scripts/personalize-docs.sh and update:
# - PROJECT_NAME="sunny-stack" (change from default)
# - PI_IP="192.168.1.42" (your Pi's IP address)
nano scripts/personalize-docs.sh

# Run personalization script
bash scripts/personalize-docs.sh
```

**What this does:**

- Replaces `your-project-bot` → `sunny-stack-bot` in all documentation
- Replaces `your-project-db` → `sunny-stack-db` in all documentation
- Replaces `YOUR_PI_IP` → your actual Pi IP address

**Verify changes:**

```bash
grep -r "sunny-stack-bot" docs/deployment/ | head -5
```

---

## Step 5: Build Bot Image

```bash
# Clear Docker cache
docker builder prune -af

# Build bot image (now uses correct name from personalize script)
docker build --no-cache --progress=plain \
  -t sunny-stack-bot:latest \
  -f Dockerfile . 2>&1 | tee build-bot.log
```

**Expected:**

- Dependencies installation
- Prisma client generation
- Bot compilation
- Image tagged as `sunny-stack-bot:latest`

**Verify:**

```bash
docker images | grep sunny-stack-bot
```

---

## Step 6: Start Production Services

```bash
docker compose up -d
```

**Service startup order:**

1. PostgreSQL starts first
2. Bot waits for PostgreSQL to be healthy
3. Both services start

**Verify:**

```bash
docker compose ps

```

**Expected:**

- `sunny-stack-db`: Up (healthy)
- `sunny-stack-bot`: Up (healthy)

**Note:** No API container - API runs on Vercel

---

## Step 7: Run Database Migrations

```bash
docker compose -f docker-compose.prod.yml exec discord-bot npx prisma migrate deploy
```

**Why in bot container:** Bot container has Prisma, connects to PostgreSQL via Docker network

**Expected:**

```
✔ All migrations applied successfully
Database schema created
```

**Verify schema:**

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U sunnystack -d sunnystack -c "\dt"
```

---

## Step 8: Verify Production Deployment

### Check Logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```

**PostgreSQL logs - Look for:**

- ✅ `database system is ready to accept connections`
- ✅ `health check passed`

**Bot logs - Look for:**

- ✅ `Connected to Discord Gateway`
- ✅ `Bot ready and operational`
- ✅ `Command discovery complete (18 commands)`
- ✅ `Health server started on port 8080`

### Test Bot Health

```bash
curl http://localhost:8080/health
```

**Expected:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T...",
  "uptime": 123.456
}
```

### Test Discord Commands

**In Discord:**

```
/project-list
```

**Expected:** Bot responds with project list

**Check logs:**

```bash
docker compose -f docker-compose.prod.yml logs -f discord-bot | grep "API request"
```

**Expected:**

```
[info]: API request successful {"endpoint":"/admin/projects","method":"GET","statusCode":200}
```

**This confirms:** Bot is calling Vercel API successfully

---

## Step 9: Configure Vercel Database Connection

**In Vercel Dashboard → Environment Variables:**

```bash
# Add production database URL
DATABASE_URL=postgresql://YOUR_DB_USER:<password>@YOUR_PI_IP:5432/YOUR_DB_NAME
```

**Important:**

- Uses Pi's external IP (`YOUR_PI_IP`)
- Port `5432` must be accessible from Vercel
- Consider using PostgreSQL connection pooling (PgBouncer) for Vercel

**Redeploy Vercel:**

```bash
# Trigger redeployment to pick up new DATABASE_URL
git push origin main
```

---

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Bot only
docker compose -f docker-compose.prod.yml logs -f discord-bot

# PostgreSQL only
docker compose -f docker-compose.prod.yml logs -f postgres

# Last 50 lines
docker compose -f docker-compose.prod.yml logs --tail=50
```

### Check Service Status

```bash
docker compose ps
```

### Check Health

```bash
# Bot health
curl http://localhost:8080/health

# PostgreSQL health
docker compose -f docker-compose.prod.yml exec postgres \
  pg_isready -U YOUR_DB_USER
```

### Restart Services

```bash
# All services
docker compose -f docker-compose.prod.yml restart

# Bot only
docker compose -f docker-compose.prod.yml restart discord-bot

# PostgreSQL only
docker compose -f docker-compose.prod.yml restart postgres
```

### Stop Services

```bash
# Stop all services (preserves data)
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (DELETES DATA!)
docker compose -f docker-compose.prod.yml down -v
```

### View Resource Usage

```bash
docker stats sunny-stack-bot sunny-stack-db
```

---

## Update Deployment (Code Changes)

### From Windows Machine

**1. Sync updated code:**

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
  | ssh pi@your-pi "cd ~/sunny-stack && tar xzf -"
```

### On Pi

**2. Rebuild and redeploy:**

```bash
ssh pi@your-pi
cd ~/sunny-stack

# Stop services
docker compose -f docker-compose.prod.yml down

# Remove old image
docker rmi -f sunny-stack-bot:latest

# Clear build cache
docker builder prune -af

# Rebuild bot image
docker build --no-cache -t sunny-stack-bot:latest -f Dockerfile .

# Start services
docker compose -f docker-compose.prod.yml up -d

# Wait for healthy status
sleep 30

# Run migrations (if schema changed)
docker compose -f docker-compose.prod.yml exec discord-bot npx prisma migrate deploy

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Troubleshooting

### Issue: Bot can't connect to Vercel API

**Check BOT_API_URL:**

```bash
docker compose -f docker-compose.prod.yml exec discord-bot \
  printenv BOT_API_URL
```

**Should show:** `https://your-site.vercel.app/api`

**Test from Pi:**

```bash
curl https://your-site.vercel.app/api/health
```

**Expected:** `{"status":"healthy"}`

### Issue: Vercel can't connect to PostgreSQL

**Check firewall on Pi:**

```bash
sudo ufw status
```

**Allow PostgreSQL port:**

```bash
sudo ufw allow 5432/tcp
```

**Test from Windows:**

```bash
psql postgresql://YOUR_DB_USER:<password>@YOUR_PI_IP:5432/YOUR_DB_NAME
```

### Issue: Migrations fail

**Check DATABASE_URL in container:**

```bash
docker compose -f docker-compose.prod.yml exec discord-bot \
  printenv DATABASE_URL
```

**Should show:** `postgresql://...@postgres:5432/...`

**Run migrations manually:**

```bash
docker compose -f docker-compose.prod.yml exec discord-bot \
  npx prisma migrate deploy
```

### Issue: PostgreSQL won't start

**Check logs:**

```bash
docker compose -f docker-compose.prod.yml logs postgres
```

**Check volume:**

```bash
docker volume inspect sunny-stack_postgres-data
```

**Reset database (WARNING: deletes data):**

```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

---

## Production Checklist

**Before deployment:**

- [ ] `.env.production` has correct production credentials
- [ ] `BOT_API_URL=https://your-site.vercel.app/api` (Vercel, not localhost)
- [ ] `DATABASE_URL` uses `@postgres:5432` (Docker container name)
- [ ] No `.env.local` or `docker-compose.dev.yml` on Pi
- [ ] Vercel has `DATABASE_URL` pointing to Pi (`YOUR_PI_IP:5432`)
- [ ] Pi port 5432 accessible to Vercel
- [ ] Bot image built successfully

**After deployment:**

- [ ] PostgreSQL container shows "Up (healthy)"
- [ ] Bot container shows "Up (healthy)"
- [ ] No API server container (runs on Vercel)
- [ ] Bot logs show "Connected to Discord Gateway"
- [ ] Test Discord command works (`/project-list`)
- [ ] Bot logs show API requests to `your-site.vercel.app/api`
- [ ] Vercel can connect to Pi PostgreSQL

---

## Quick Reference

**One-line sync (production):**

```bash
tar czf - --exclude=node_modules --exclude=.next --exclude=.git --exclude=coverage --exclude=logs --exclude=.env.local --exclude=docker-compose.dev.yml --exclude=playwright-report --exclude=test-results --exclude=*.tsbuildinfo --exclude=*.log --exclude=.swc --exclude=out . | ssh pi@your-pi "cd ~/sunny-stack && tar xzf -"
```

**Complete deployment (from Pi):**

```bash
cd ~/sunny-stack
docker compose -f docker-compose.prod.yml down
docker rmi -f sunny-stack-bot:latest
docker builder prune -af
docker build --no-cache -t sunny-stack-bot:latest -f Dockerfile .
docker compose -f docker-compose.prod.yml up -d
sleep 30
docker compose -f docker-compose.prod.yml exec discord-bot npx prisma migrate deploy
docker compose -f docker-compose.prod.yml logs -f
```

**View status:**

```bash
docker compose ps
curl http://localhost:8080/health
docker stats sunny-stack-bot sunny-stack-db
```

---

**Last Updated:** 2025-11-06
**Architecture:** PostgreSQL + Bot on Pi | Website + API on Vercel
**Containers on Pi:** 2 (postgres, discord-bot)
**Success Criteria:** Bot connects to Discord, calls Vercel API, Vercel connects to Pi database
