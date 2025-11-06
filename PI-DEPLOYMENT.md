# Raspberry Pi Deployment Guide - Complete Workflow

**Architecture:** 3 Docker containers on Pi (PostgreSQL → API Server → Discord Bot)

---

## Prerequisites

- Raspberry Pi 4B with Docker installed
- SSH access configured (`pi@sunny-pi`)
- Windows development machine with project files
- `.env.production` configured with production credentials

---

## Environment File Strategy

**Understanding the four environment files:**

### `.env` (Windows Machine Only - Never Synced)

- **Purpose:** Master credential vault + Docker Compose default file
- **Location:** Windows machine permanently
- **Powers:** Local PostgreSQL container (`docker-compose up`)
- **Contains:** All secrets (Discord tokens, Google OAuth, Resend API, etc.)
- **Never:** Synced to Pi, committed to Git, or deleted

### `.env.local` (Windows Machine - Temporarily Synced to Pi)

- **Purpose:** Active development configuration for local bot/API
- **Location:** Windows permanently, Pi temporarily for testing
- **Powers:** Local bot (`npm run bot:dev`) and API (`npm run dev`)
- **Networking:** Uses `localhost:5432` and `localhost:3000` on Windows
- **Lifecycle:** Synced to Pi for testing → Deleted from Pi after production confirmed

### `.env.production` (Pi Only - Permanent)

- **Purpose:** Production configuration for Pi deployment
- **Location:** Raspberry Pi permanently
- **Powers:** Production containers (`docker-compose.prod.yml`)
- **Networking:** Uses Docker container names (`postgres:5432`, `api-server:3000`)
- **Never:** Deleted from Pi, used on Windows

### `.env.example` (Git Repository - Template)

- **Purpose:** Documentation template for setting up environment
- **Location:** Git repository (committed)
- **Contains:** All variable names with examples and setup instructions
- **Usage:** New developers copy to create their `.env` or `.env.local`

**Workflow Summary:**

```
Windows (Permanent):
├── .env           ← Docker PostgreSQL + master secrets
└── .env.local     ← Local bot/API development

Raspberry Pi (After Testing):
└── .env.production ← Production containers only

Raspberry Pi (During Testing - Temporary):
├── .env.local          ← Testing configuration (DELETE after)
├── .env.production     ← Production configuration (KEEP)
└── docker-compose.dev.yml ← Testing compose file (DELETE after)
```

---

## Part 1: Initial Setup (First Time Only)

### 1.1 Create Project Directory on Pi

```bash
ssh pi@sunny-pi "mkdir -p ~/sunny-stack"
```

### 1.2 Verify Docker is Running

```bash
ssh pi@sunny-pi "docker --version && docker compose version"
```

---

## Part 2: Development Testing Workflow

### 2.1 Sync Files to Pi

**Run from Windows machine in project root:**

```bash
tar czf - \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=coverage \
  --exclude=logs \
  --exclude=.env \
  --exclude=playwright-report \
  --exclude=test-results \
  --exclude=*.tsbuildinfo \
  --exclude=*.log \
  --exclude=.swc \
  --exclude=out \
  . \
  | ssh pi@sunny-pi "cd ~/sunny-stack && tar xzf -"
```

**What syncs (everything except):**

- ✅ All source code (app/, bot/, components/, lib/, etc.)
- ✅ All configuration files (Docker, TypeScript, Next.js, etc.)
- ✅ All environment files (.env.local, .env.production, .env.example)
- ✅ All documentation (\*.md files)
- ✅ All test files (**tests**/, e2e/)
- ✅ All build files (Dockerfile, docker-compose, package.json)
- ✅ Trinity Method files (.claude/, trinity/, trinity-hooks/)
- ❌ node_modules (run `npm install` on Pi after sync)
- ❌ .next (build artifacts - regenerated on Pi)
- ❌ .git (version control - not needed on Pi)
- ❌ .env (master secrets - stays on Windows only)
- ❌ Build/temp files (logs/, coverage/, \*.tsbuildinfo)

**Important:**

- The `.` at the end means "sync entire directory"
- `--exclude` flags prevent syncing unnecessary files
- `.env` is explicitly excluded (master secrets stay on Windows)
- You'll manually delete `.env` from Pi if needed (it won't be synced)

**After sync, on Pi:**

```bash
ssh pi@sunny-pi
cd ~/sunny-stack
rm -f .env  # Remove .env if it exists (shouldn't be there)
npm install # Install dependencies
```

### 2.2 Build Images on Pi (Development Mode)

**SSH into Pi:**

```bash
ssh pi@sunny-pi
cd ~/sunny-stack
```

**Clear Docker build cache (important after .dockerignore changes):**

```bash
docker builder prune -af
```

**Build API Server Image:**

```bash
docker build -f Dockerfile.api -t sunny-stack-api-dev:latest .
```

**Expected output:**

- Dependencies installation
- Prisma client generation
- Next.js build (API routes compilation)
- Image tagged as `sunny-stack-api-dev:latest`

**Build Bot Image (optional for dev testing):**

```bash
docker build -f Dockerfile -t sunny-stack-bot-dev:latest .
```

### 2.3 Start Services (Development Mode)

**Start PostgreSQL + API Server:**

```bash
docker compose -f docker-compose.dev.yml up -d postgres api-server
```

**Verify services are running:**

```bash
docker compose -f docker-compose.dev.yml ps
```

**Expected:**

- `sunny-stack-db-dev` - Status: Up, Health: healthy
- `sunny-stack-api-dev` - Status: Up (may take 30-60s to become healthy)

**View API server logs:**

```bash
docker compose -f docker-compose.dev.yml logs -f api-server
```

**Look for:**

- ✓ Compiled successfully
- ✓ Ready on http://0.0.0.0:3000
- ✓ No database connection errors

### 2.4 Run Database Migrations

**From Pi (~/sunny-stack):**

```bash
npx dotenv -e .env.local -- npx prisma migrate deploy
```

**Expected:**

- All migrations applied successfully
- Database schema created in PostgreSQL

**Verify migrations:**

```bash
docker compose -f docker-compose.dev.yml exec postgres psql -U sunnystack -d sunnystack -c "\dt"
```

### 2.5 Test Bot (Development Mode - Outside Container)

**Start bot in dev mode:**

```bash
npm run bot:dev
```

**Expected:**

- Bot connects to Discord gateway
- Bot connects to API server at http://api-server:3000/api
- Commands registered successfully

**Test in Discord:**

```
/project list
```

**Expected:** Bot responds with project list from database via API

### 2.6 Stop Development Services

```bash
# Stop bot: Ctrl+C
# Stop containers:
docker compose -f docker-compose.dev.yml down
```

---

## Part 3: Production Deployment

### 3.1 Clean Up Development Files

**Critical - prevents dev config from interfering:**

```bash
ssh pi@sunny-pi "cd ~/sunny-stack && rm -f .env.local docker-compose.dev.yml"
```

**Verify cleanup:**

```bash
ssh pi@sunny-pi "ls ~/sunny-stack/.env* ~/sunny-stack/docker-compose*"
```

**Should only show:**

- `.env.production`
- `docker-compose.prod.yml`

### 3.2 Build Production Images

**From Pi (~/sunny-stack):**

```bash
# Clear build cache to ensure fresh build
docker builder prune -af

# Build Bot Image
docker build --no-cache --progress=plain \
  -t sunny-stack-bot:latest \
  -f Dockerfile . 2>&1 | tee build-bot.log

# Build API Server Image
docker build --no-cache --progress=plain \
  -t sunny-stack-api:latest \
  -f Dockerfile.api . 2>&1 | tee build-api.log
```

**Flags explained:**

- `--no-cache`: Force rebuild all layers
- `--progress=plain`: Verbose output for troubleshooting
- `-t`: Tag the image
- `2>&1 | tee`: Save output to log file

**Verify images built:**

```bash
docker images | grep sunny-stack
```

**Expected:**

- `sunny-stack-bot:latest`
- `sunny-stack-api:latest`

### 3.3 Start Production Services

**Service startup order:**

1. PostgreSQL (healthy) →
2. API Server (healthy) →
3. Discord Bot

```bash
docker compose -f docker-compose.prod.yml up -d
```

**Verify all services started:**

```bash
docker compose -f docker-compose.prod.yml ps
```

**Expected status:**

- `sunny-stack-db`: Up, healthy
- `sunny-stack-api`: Up, healthy (may take 30-60s)
- `sunny-stack-bot`: Up, healthy

### 3.4 Run Production Migrations

```bash
docker compose -f docker-compose.prod.yml exec api-server npx prisma migrate deploy
```

**Expected:**

- All migrations applied
- No errors

### 3.5 Verify Production Deployment

**Check all logs:**

```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Look for:**

**PostgreSQL:**

- ✓ Database system is ready to accept connections
- ✓ Health check passed

**API Server:**

- ✓ Compiled successfully
- ✓ Ready on http://0.0.0.0:3000
- ✓ No database connection errors

**Bot:**

- ✓ Connected to Discord gateway
- ✓ Health server listening on port 8080
- ✓ Commands registered

**Test Discord command:**

```
/project list
```

**Expected:** Bot responds successfully

---

## Part 4: Monitoring & Maintenance

### Check Service Status

```bash
docker compose -f docker-compose.prod.yml ps
```

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api-server
docker compose -f docker-compose.prod.yml logs -f discord-bot
docker compose -f docker-compose.prod.yml logs -f postgres

# Last 50 lines
docker compose -f docker-compose.prod.yml logs --tail=50
```

### Health Check Status

```bash
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"
```

### Restart Services

```bash
# All services
docker compose -f docker-compose.prod.yml restart

# Specific service
docker compose -f docker-compose.prod.yml restart discord-bot
docker compose -f docker-compose.prod.yml restart api-server
```

### Stop All Services

```bash
docker compose -f docker-compose.prod.yml down
```

**Note:** Data persists in Docker volume `postgres-data`

### Access Database CLI

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U sunnystack -d sunnystack
```

---

## Part 5: Update Deployment (When Code Changes)

### 5.1 From Windows Machine

**Sync updated code (same as initial sync):**

```bash
tar czf - \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=coverage \
  --exclude=logs \
  --exclude=.env \
  --exclude=playwright-report \
  --exclude=test-results \
  --exclude=*.tsbuildinfo \
  --exclude=*.log \
  --exclude=.swc \
  --exclude=out \
  . \
  | ssh pi@sunny-pi "cd ~/sunny-stack && tar xzf -"
```

**Note:** This syncs everything except build artifacts and secrets. If you only changed specific files, you can use `scp` instead for faster sync.

### 5.2 On Pi - Rebuild and Deploy

```bash
ssh pi@sunny-pi
cd ~/sunny-stack

# Install/update dependencies (if package.json changed)
npm install

# Stop services
docker compose -f docker-compose.prod.yml down

# Remove old images
docker rmi -f sunny-stack-bot:latest sunny-stack-api:latest

# Clear build cache
docker builder prune -af

# Rebuild images
docker build --no-cache -t sunny-stack-bot:latest -f Dockerfile .
docker build --no-cache -t sunny-stack-api:latest -f Dockerfile.api .

# Start services
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy (30-60 seconds)
sleep 60

# Run migrations (if schema changed)
docker compose -f docker-compose.prod.yml exec api-server npx prisma migrate deploy

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Part 6: Troubleshooting

### Issue: API Server Build Fails - Files Not Found

**Error:** `COPY app/ ./app/: not found` or `"/postcss.config.js": not found`

**Cause:** `.dockerignore` blocking required files

**Solution:**

1. Verify `.dockerignore` doesn't exclude `app/`, `components/`, `styles/`, `public/`, or config files
2. Sync updated `.dockerignore` to Pi: `scp .dockerignore pi@sunny-pi:~/sunny-stack/`
3. Clear build cache: `docker builder prune -af`
4. Rebuild: `docker build -f Dockerfile.api -t sunny-stack-api:latest .`

### Issue: Bot Can't Connect to API

**Error:** `API request failed - fetch failed` or timeout

**Cause:** Incorrect `BOT_API_URL` in env file

**Solution:**

1. Verify `.env.production` has `BOT_API_URL=http://api-server:3000/api` (container name, not IP)
2. Check api-server is running: `docker compose -f docker-compose.prod.yml ps`
3. Check api-server logs: `docker compose -f docker-compose.prod.yml logs api-server`
4. Verify api-server is healthy: Look for "healthy" status in `docker compose ps`

### Issue: Database Connection Failed

**Error:** `Can't reach database server at postgres:5432`

**Cause:** PostgreSQL not healthy or DATABASE_URL incorrect

**Solution:**

1. Check postgres health: `docker compose -f docker-compose.prod.yml ps postgres`
2. Verify DATABASE_URL uses `@postgres:5432` (container name, not `@localhost`)
3. Check postgres logs: `docker compose -f docker-compose.prod.yml logs postgres`
4. Restart postgres: `docker compose -f docker-compose.prod.yml restart postgres`

### Issue: Migrations Fail

**Error:** `Environment variable not found: DATABASE_URL`

**Cause:** Migration running in wrong context

**Solution:**
Run migrations inside API server container (NOT on Pi host):

```bash
docker compose -f docker-compose.prod.yml exec api-server npx prisma migrate deploy
```

### Issue: Services Don't Start in Order

**Error:** Bot starts before API server is ready

**Cause:** Health checks not passing or depends_on misconfigured

**Solution:**

1. Verify `depends_on` with `condition: service_healthy` in docker-compose.prod.yml
2. Check health status: `docker compose -f docker-compose.prod.yml ps`
3. Wait longer for health checks (services may take 30-60s to become healthy)
4. Restart in order: `docker compose -f docker-compose.prod.yml restart`

### Issue: POSTGRES_PASSWORD Warning

**Error:** `WARN The "POSTGRES_PASSWORD" variable is not set`

**Cause:** Environment file not loaded

**Solution:**
Verify `.env.production` contains `POSTGRES_PASSWORD=<your-password>` and is in the same directory as `docker-compose.prod.yml`

### Issue: Port Already in Use

**Error:** `bind: address already in use`

**Cause:** Another service using port 3000 or 5432

**Solution:**

1. Check what's using the port: `sudo lsof -i :3000` or `sudo lsof -i :5432`
2. Stop conflicting service or change port in docker-compose
3. For development containers: `docker compose -f docker-compose.dev.yml down`

---

## Part 7: Architecture Reference

### Container Network

```
┌─────────────────────────┐
│   Discord Bot           │
│   sunny-stack-bot       │
└───────────┬─────────────┘
            │ BOT_API_URL=http://api-server:3000/api
            ↓
┌─────────────────────────┐
│   API Server (Next.js)  │
│   sunny-stack-api       │
│   Port: 127.0.0.1:3000  │
└───────────┬─────────────┘
            │ DATABASE_URL=postgresql://...@postgres:5432/...
            ↓
┌─────────────────────────┐
│   PostgreSQL 15         │
│   sunny-stack-db        │
│   Port: 5432 (internal) │
│   Volume: postgres-data │
└─────────────────────────┘
```

### Service Dependencies

- **postgres**: No dependencies, starts first
- **api-server**: Depends on `postgres` (condition: service_healthy)
- **discord-bot**: Depends on `postgres` + `api-server` (both healthy)

### Resource Limits (Pi 4B - 4GB RAM)

**PostgreSQL:**

- Memory: 256MB min, 512MB max
- CPU: 0.25 cores min, 0.5 cores max

**API Server:**

- Memory: 256MB min, 512MB max
- CPU: 0.25 cores min, 1.0 core max

**Bot:**

- Memory: 512MB min, 1.5GB max
- CPU: 0.5 cores min, 2.0 cores max

**Total Expected Usage:** ~1-2.5GB RAM (50-60% of 4GB)

### Ports

- **3000**: API Server (bound to 127.0.0.1 only, not exposed externally)
- **5432**: PostgreSQL (internal Docker network only)
- **8080**: Bot health endpoint (optional external access)

### Volumes

- **postgres-data**: Persistent PostgreSQL data
- Location: `/var/lib/docker/volumes/postgres-data`
- Persists across container restarts, rebuilds, and updates
- **Backup:** Important to backup regularly

### Network

- **sunny-stack-network**: Bridge network for inter-container communication
- Containers communicate via container names (dns resolution)
- External access only to explicitly exposed ports

---

## Part 8: Production Checklist

Before deploying to production, verify:

**Environment Configuration:**

- [ ] `.env.production` has correct production credentials
- [ ] `BOT_API_URL=http://api-server:3000/api` (container name, NOT IP or localhost)
- [ ] `DATABASE_URL=postgresql://...@postgres:5432/...` (container name, NOT localhost)
- [ ] `POSTGRES_PASSWORD` is set to secure production password
- [ ] All Discord tokens, API keys are production values (not dev/test)

**File Cleanup:**

- [ ] Deleted `.env.local` from Pi (dev testing only)
- [ ] Deleted `docker-compose.dev.yml` from Pi (dev testing only)
- [ ] No `.env` file on Pi (only `.env.production`)

**Build Process:**

- [ ] Built fresh images with `--no-cache` flag
- [ ] Both images built successfully (bot + api-server)
- [ ] Images tagged correctly (`sunny-stack-bot:latest`, `sunny-stack-api:latest`)

**Deployment Verification:**

- [ ] All three containers show "Up" status
- [ ] All three containers show "healthy" health status
- [ ] Migrations completed successfully (no errors)
- [ ] Bot connects to Discord gateway
- [ ] Bot can call API server successfully
- [ ] API server connects to database
- [ ] Test Discord command works (`/project list`)

**Data Persistence:**

- [ ] PostgreSQL data volume created (`postgres-data`)
- [ ] Data persists after container restart
- [ ] Backup strategy in place for database

**Monitoring:**

- [ ] Can view logs from all services
- [ ] Health checks passing for all services
- [ ] No errors in any service logs

**Auto-Restart:**

- [ ] `restart: unless-stopped` configured for all services
- [ ] Services restart automatically after Pi reboot
- [ ] Verified with test reboot (if possible)

---

## Quick Reference Commands

### One-Line Sync Everything (From Windows)

```bash
tar czf - --exclude=node_modules --exclude=.next --exclude=.git --exclude=coverage --exclude=logs --exclude=.env --exclude=playwright-report --exclude=test-results --exclude=*.tsbuildinfo --exclude=*.log --exclude=.swc --exclude=out . | ssh pi@sunny-pi "cd ~/sunny-stack && tar xzf -"
```

### Build Both Images (On Pi)

```bash
cd ~/sunny-stack && docker builder prune -af && docker build --no-cache -t sunny-stack-bot:latest -f Dockerfile . && docker build --no-cache -t sunny-stack-api:latest -f Dockerfile.api .
```

### Start Production

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Run Migrations

```bash
docker compose -f docker-compose.prod.yml exec api-server npx prisma migrate deploy
```

### View All Logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Check Status

```bash
docker compose -f docker-compose.prod.yml ps
```

### Restart All Services

```bash
docker compose -f docker-compose.prod.yml restart
```

### Stop All Services

```bash
docker compose -f docker-compose.prod.yml down
```

### Complete Update Workflow (From Pi)

```bash
cd ~/sunny-stack
npm install
docker compose -f docker-compose.prod.yml down
docker rmi -f sunny-stack-bot:latest sunny-stack-api:latest
docker builder prune -af
docker build --no-cache -t sunny-stack-bot:latest -f Dockerfile .
docker build --no-cache -t sunny-stack-api:latest -f Dockerfile.api .
docker compose -f docker-compose.prod.yml up -d
sleep 60
docker compose -f docker-compose.prod.yml exec api-server npx prisma migrate deploy
docker compose -f docker-compose.prod.yml logs -f
```

---

## Notes

**Last Updated:** 2025-11-05
**Architecture:** PostgreSQL + Next.js API + Discord Bot (3 containers)
**Platform:** Raspberry Pi 4B (ARM64)
**Docker Compose Version:** 2.x required

**Important Files:**

- `Dockerfile` - Bot container build
- `Dockerfile.api` - API server container build
- `docker-compose.prod.yml` - Production deployment config
- `docker-compose.dev.yml` - Development testing config (delete before prod)
- `.env.production` - Production environment variables
- `.env.local` - Development environment variables (delete before prod)
- `.dockerignore` - Shared exclusions for both builds

**Support:**

- Troubleshooting: See Part 6
- Architecture: See Part 7
- Checklist: See Part 8
