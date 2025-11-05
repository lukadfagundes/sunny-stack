# Raspberry Pi Discord Bot Deployment Commands

## 1. Sync Code from Dev Machine to Pi

**Command:** (Run from Windows dev machine in project root)

```bash
tar -czvf - \
  .dockerignore \
  Dockerfile \
  docker-compose.prod.yml \
  docker-compose.dev.yml \
  .env.local \
  .env.production \
  bot/ \
  lib/ \
  prisma/ \
  scripts/ \
  package.json \
  package-lock.json \
  tsconfig.json \
  tsconfig.bot.json \
  | ssh pi@sunny-pi "cd ~/sunny-stack && tar -xzvf -"
```

**What it does:**

- `tar -czvf -` - Create compressed archive, verbose output, to stdout
- Includes: Docker configs (dev + prod), bot code, shared libs, Prisma schema, deployment scripts, TypeScript configs, environment files
- `ssh pi@sunny-pi` - Connect to Pi
- `tar -xzvf -` - Extract archive on Pi, verbose output
- Shows each file as it syncs

**Files Synced:**

- `.env.local` - **For Pi testing only** (will be deleted before production)
- `.env.production` - Production environment variables
- `docker-compose.dev.yml` - **For Pi testing only** (will be deleted before production)
- `docker-compose.prod.yml` - Production deployment configuration
- `bot/`, `lib/`, `prisma/`, `scripts/` - Application code

**NOT Synced (stays on Windows):**

- `.env` - Contains all secrets, stays on Windows development machine only

**Excludes:** node_modules, .next, test files, documentation (per .dockerignore)

---

## 2. Test Bot on Pi (Development Mode)

**⚠️ IMPORTANT: Test first before production deployment!**

**Command:** (Run on Pi in ~/sunny-stack)

```bash
# Start PostgreSQL with development configuration
docker compose -f docker-compose.dev.yml up -d postgres

# Wait for PostgreSQL to be healthy
sleep 5

# Run Prisma migrations
npx prisma migrate deploy

# Start bot in development mode
npm run bot:dev
```

**What to verify:**

- ✅ Bot connects to Discord gateway successfully
- ✅ PostgreSQL connection works
- ✅ Discord commands respond correctly (test `/project list` in Discord)
- ✅ Database operations work (create/read projects)
- ✅ No errors in logs

**Stop testing:**

```bash
# Stop bot: Ctrl+C
# Stop PostgreSQL: docker compose -f docker-compose.dev.yml down
```

---

## 3. Clean Up Test Files

**⚠️ CRITICAL: Delete development files before production!**

**Command:** (Run on Pi in ~/sunny-stack)

```bash
# Delete development environment file
rm .env.local

# Delete development Docker Compose config
rm docker-compose.dev.yml

# Verify files are deleted
ls -la | grep -E "(\.env\.local|docker-compose\.dev\.yml)"
# Should return nothing
```

**Why this is important:**

- `.env.local` contains development database URLs (localhost:5432)
- `docker-compose.dev.yml` is configured for development testing only
- Production must use `.env.production` and `docker-compose.prod.yml` only

---

## 4. Build Fresh Docker Image on Pi

**Command:** (Run on Pi in ~/sunny-stack)

```bash
docker compose -f docker-compose.prod.yml down && docker rmi -f sunny-stack-bot:latest 2>/dev/null; docker build --no-cache --progress=plain -t sunny-stack-bot:latest -f Dockerfile . 2>&1 | tee build.log
```

**What it does:**

- `docker compose down` - Stop and remove existing container
- `docker rmi -f sunny-stack-bot:latest` - Force remove old image (suppress error if doesn't exist)
- `docker build` options:
  - `--no-cache` - Force rebuild all layers
  - `--progress=plain` - Verbose output showing every command
  - `-t sunny-stack-bot:latest` - Tag as latest
  - `-f Dockerfile` - Use this Dockerfile
- `2>&1 | tee build.log` - Show output AND save to build.log file

**Shows:**

- All Dockerfile steps
- npm install output
- Prisma generation
- TypeScript compilation
- Validation check results

---

## 5. Launch Production Bot and PostgreSQL

**Command:** (Run on Pi in ~/sunny-stack)

```bash
# Start both PostgreSQL and bot in production mode
docker compose -f docker-compose.prod.yml up -d

# Wait for services to initialize
sleep 5

# Run Prisma migrations on production database
docker compose -f docker-compose.prod.yml exec discord-bot npx prisma migrate deploy

# View bot logs
docker compose -f docker-compose.prod.yml logs -f discord-bot
```

**What it does:**

- `docker compose up -d` - Start PostgreSQL + bot containers in detached mode
- `sleep 5` - Wait for containers to initialize
- `exec discord-bot npx prisma migrate deploy` - Run migrations inside bot container
- `logs -f discord-bot` - Follow bot logs in real-time

**Shows:**

- dotenv loading messages (from .env.production)
- Environment variables loaded
- Bot configuration validation
- PostgreSQL connection (via postgres:5432)
- Discord gateway connection
- Health server startup
- Any errors or warnings

**Exit logs:** Press `Ctrl+C` (bot keeps running in background)

---

## Quick Status Check

**Check if bot is running:**

```bash
docker compose -f docker-compose.prod.yml ps discord-bot
```

**View last 50 log lines:**

```bash
docker compose -f docker-compose.prod.yml logs --tail=50 discord-bot
```

**Stop bot:**

```bash
docker compose -f docker-compose.prod.yml down
```

**Restart bot:**

```bash
docker compose -f docker-compose.prod.yml restart discord-bot
```

---

## Full Deploy Workflow (All 3 Steps)

**From Windows dev machine:**

```bash
# Step 1: Sync code
tar -czvf - .dockerignore Dockerfile docker-compose.prod.yml bot/ lib/ prisma/ scripts/ package.json package-lock.json tsconfig.json tsconfig.bot.json .env.production .env.local | ssh pi@sunny-pi "cd ~/sunny-stack && tar -xzvf -"

# Step 2: Build on Pi (via SSH)
ssh pi@sunny-pi "cd ~/sunny-stack && docker compose -f docker-compose.prod.yml down && docker rmi -f sunny-stack-bot:latest 2>/dev/null; docker build --no-cache --progress=plain -t sunny-stack-bot:latest -f Dockerfile . 2>&1 | tee build.log"

# Step 3: Launch bot (via SSH)
ssh pi@sunny-pi "cd ~/sunny-stack && docker compose -f docker-compose.prod.yml up -d discord-bot && sleep 2 && docker compose -f docker-compose.prod.yml logs -f discord-bot"
```

**Note:** Step 3 will keep terminal attached to logs. Press `Ctrl+C` to exit (bot continues running).
