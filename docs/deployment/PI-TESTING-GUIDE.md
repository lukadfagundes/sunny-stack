# Raspberry Pi Testing Guide - Quick Workflow

**Purpose:** Test bot and API functionality on Raspberry Pi before production deployment

**Duration:** ~15-20 minutes

---

## Prerequisites

- Raspberry Pi 4B with Docker installed
- SSH access configured (`pi@your-pi`)
- Development machine with project files
- `.env.local` configured for Pi (`localhost:5432`, `localhost:3000`)
- `.env` file required (Docker Compose reads this for variable substitution)

---

## Step 1: Sync Files to Pi

**Run from windows machine in project root:**

```bash
tar czf - \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=coverage \
  --exclude=logs \
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

- ✅ All source code, config files, `.env.local`, and `.env`
- ❌ `node_modules`, `.git`, build artifacts

**Important:** Docker Compose automatically reads `.env` from project root for variable substitution (e.g., `${POSTGRES_PASSWORD}`), even when `env_file: .env.local` is specified. Both files are needed for Pi testing.

---

## Step 2: SSH into Pi

```bash
ssh pi@your-pi
cd ~/sunny-stack
```

---

## Step 3: Clean Up Old Containers

```bash
# Remove any old sunny-stack containers
docker ps -a | grep sunny-stack | awk '{print $1}' | xargs -r docker rm -f

# Remove any old sunny-stack volumes
docker volume ls | grep sunny-stack | awk '{print $2}' | xargs -r docker volume rm
```

**Expected:**

```
Removed old containers (if any)
Removed old volumes (if any)
```

**Why:** Ensures clean testing environment, prevents conflicts with old containers

---

## Step 4: Install Dependencies

```bash
npm install
```

**Expected:** Clean install of all packages from `package-lock.json`

---

## Step 5: Generate Prisma Client

```bash
npx prisma generate
```

**Expected:**

```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

---

## Step 6: Start PostgreSQL Dev Database

```bash
docker compose -f docker-compose.dev.yml up -d postgres
```

**Verify:**

```bash
docker compose -f docker-compose.dev.yml ps
```

**Expected:**

- Container: `sunny-stack-db-dev`
- Status: `Up (healthy)`
- Port: `0.0.0.0:5432->5432/tcp`

---

## Step 7: Run Database Migrations

```bash
npx dotenv -e .env.local -- npx prisma migrate deploy
```

**Expected:**

```
✔ All migrations applied successfully
Database schema created in PostgreSQL
```

**Verify schema:**

```bash
docker compose -f docker-compose.dev.yml exec postgres psql -U sunnystack -d sunnystack -c "\dt"
```

**Expected output:**

```
         List of relations
 Schema |   Name   | Type  |   Owner
--------+----------+-------+------------
 public | Project  | table | sunnystack
 public | _prisma  | table | sunnystack
```

---

## Step 8: Start Dev Server

**Open first SSH terminal:**

```bash
npm run dev
```

**Expected:**

```
▲ Next.js 15.5.4
- Local:        http://localhost:3000
- Network:      http://YOUR_PI_IP:3000
✓ Ready in ~5s
```

**Leave running in terminal 1**

---

## Step 9: Start Bot Dev

**Open second SSH terminal:**

```bash
ssh pi@your-pi
cd ~/sunny-stack
npm run bot:dev
```

**Expected:**

```
[info]: Bot ready and operational
[info]: Connected to Discord Gateway
[info]: Command discovery complete (18 commands)
```

**Leave running in terminal 2**

---

## Step 10: Light Manual Testing

**In Discord, run test commands:**

```
/project-list
```

**Expected:** Bot responds with project list from database

```
/admin-health
```

**Expected:** Bot responds with system health status

**Verify in terminal logs:**

- ✅ API requests successful (200 status codes)
- ✅ Database queries executing
- ✅ No errors in logs

---

## Step 11: Kill Dev Bot

**In terminal 2:**

```
Ctrl + C
```

**Expected:** Bot disconnects gracefully

---

## Step 12: Run Bot Tests

**In terminal 2:**

```bash
npm run bot:test
```

**Expected:**

```
Test Suites: X passed, X total
Tests:       X passed, X total
Pass rate:   >90%
```

**If tests fail:** Review errors and fix before proceeding to production

---

## Step 13: Kill Dev Server

**In terminal 1:**

```
Ctrl + C
```

**Expected:** Next.js server stops gracefully

---

## Step 14: Stop Dev Database

```bash
docker compose -f docker-compose.dev.yml down -v
```

**Flags explained:**

- `-v`: Delete volumes (removes all test data)

**Expected:**

```
✔ Container sunny-stack-db-dev  Removed
✔ Volume postgres-dev-data      Removed
✔ Network sunny-stack-dev-network Removed
```

**Verify cleanup:**

```bash
docker ps -a | grep sunny-stack
docker volume ls | grep sunny-stack
```

**Expected:** No containers or volumes remaining

---

## Step 15: Delete Dev Files

```bash
rm -f .env.local docker-compose.dev.yml
```

**Verify cleanup:**

```bash
ls .env*
ls docker-compose*
```

**Expected:**

- ✅ `.env.production` exists
- ✅ `docker-compose.prod.yml` exists
- ✅ `.env` exists
- ❌ `.env.local` deleted
- ❌ `docker-compose.dev.yml` deleted

---

## Testing Complete ✅

**Next Steps:**

1. Proceed to production deployment (PI-DEPLOYMENT.md Part 3)
2. Build production images
3. Deploy with `docker-compose.prod.yml`

---

## Troubleshooting

### Issue: npm install fails

```bash
# Clear npm cache
npm cache clean --force
npm install
```

### Issue: PostgreSQL won't start

```bash
# Check logs
docker compose -f docker-compose.dev.yml logs postgres

# Force recreate
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d postgres
```

### Issue: Migrations fail

```bash
# Verify DATABASE_URL in .env.local
grep DATABASE_URL .env.local

# Should show: localhost:5432, NOT postgres:5432

# Regenerate Prisma client
npx prisma generate
npx dotenv -e .env.local -- npx prisma migrate deploy
```

### Issue: Bot can't connect to API

```bash
# Verify BOT_API_URL in .env.local
grep BOT_API_URL .env.local

# Should show: http://localhost:3000/api

# Check dev server is running
curl http://localhost:3000/api/health
```

### Issue: Tests fail

```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Run single test file for debugging
npm test -- __tests__/unit/bot/commands/project.test.ts
```

---

## Quick Reference

**One-line sync:**

```bash
tar czf - --exclude=node_modules --exclude=.next --exclude=.git --exclude=coverage --exclude=logs --exclude=playwright-report --exclude=test-results --exclude=*.tsbuildinfo --exclude=*.log --exclude=.swc --exclude=out . | ssh pi@your-pi "cd ~/sunny-stack && tar xzf -"
```

**Complete test workflow (from Pi):**

```bash
# Clean up old containers/volumes
docker ps -a | grep sunny-stack | awk '{print $1}' | xargs -r docker rm -f
docker volume ls | grep sunny-stack | awk '{print $2}' | xargs -r docker volume rm

npm install
npx prisma generate
docker compose -f docker-compose.dev.yml up -d postgres
npx dotenv -e .env.local -- npx prisma migrate deploy

# Terminal 1: npm run dev
# Terminal 2: npm run bot:dev
# Discord: Test commands
# Terminal 2: Ctrl+C, npm run bot:test
# Terminal 1: Ctrl+C

docker compose -f docker-compose.dev.yml down -v
rm -f .env .env.local docker-compose.dev.yml
```

---

**Last Updated:** 2025-11-06
**Purpose:** Pre-production testing on Raspberry Pi
**Duration:** 15-20 minutes
**Success Criteria:** >90% test pass rate, no errors in logs
