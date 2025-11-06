# Sunny Stack Deployment Overview

**Last Updated:** 2025-11-06

---

## Architecture Summary

### Production Architecture

```
┌─────────────────────────────────────┐
│         Vercel (Serverless)         │
│  ┌──────────────────────────────┐   │
│  │   Next.js Website + API      │   │
│  │   https://your-site.vercel.app    │   │
│  └──────────┬───────────────────┘   │
└─────────────┼───────────────────────┘
              │
              │ DATABASE_URL=postgresql://YOUR_PI_IP:5432
              ↓
┌─────────────────────────────────────┐
│      Raspberry Pi (Self-Hosted)     │
│  ┌──────────────────────────────┐   │
│  │   PostgreSQL Container       │   │
│  │   postgres:15-alpine         │   │
│  │   Port: 5432 (exposed)       │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│  ┌──────────↓───────────────────┐   │
│  │   Discord Bot Container      │   │
│  │   your-project-bot:latest     │   │
│  │   BOT_API_URL=               │   │
│  │     your-site.vercel.app/api      │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Component Breakdown

### Vercel (Cloud)

**Hosts:**

- Next.js website (pages, components, styles)
- API routes (app/api/\*)
- Serverless functions

**Connects to:**

- Pi PostgreSQL database (YOUR_PI_IP:5432)

**Environment Variables:**

```bash
DATABASE_URL=postgresql://YOUR_DB_USER:<password>@YOUR_PI_IP:5432/YOUR_DB_NAME
RESEND_API_KEY=<resend-key>
# All other secrets
```

**Deployment:**

- Automatic on `git push origin main`
- Managed via Vercel dashboard
- See: Vercel project settings

---

### Raspberry Pi (Self-Hosted)

**Hosts:**

- PostgreSQL database (Docker container)
- Discord bot (Docker container)

**Does NOT host:**

- ❌ API server (runs on Vercel)
- ❌ Website (runs on Vercel)

**Environment Variables (.env.production):**

```bash
POSTGRES_USER=sunnystack
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=sunnystack

DATABASE_URL=postgresql://YOUR_DB_USER:<password>@postgres:5432/YOUR_DB_NAME
BOT_API_URL=https://your-site.vercel.app/api
DISCORD_TOKEN=<bot-token>
# Other bot-specific variables
```

**Deployment:**

- Manual via SSH
- Docker Compose orchestration
- See: PI-PRODUCTION-DEPLOYMENT.md

---

## Data Flow

### User visits website

```
User → Vercel (Next.js) → Pi PostgreSQL → Vercel (response) → User
```

### User requests quote

```
User → Vercel (API route) → Pi PostgreSQL (store quote) → Vercel (response) → User
```

### Discord bot command

```
Discord User → Pi Bot → Vercel API → Pi PostgreSQL → Vercel API → Pi Bot → Discord User
```

---

## Deployment Workflows

### Testing Workflow (Before Production)

**File:** PI-TESTING-GUIDE.md

**Steps:**

1. Sync files to Pi
2. Install dependencies
3. Start dev PostgreSQL
4. Run migrations
5. Start dev server (npm run dev)
6. Start dev bot (npm run bot:dev)
7. Manual testing in Discord
8. Automated tests (npm run bot:test)
9. Cleanup (delete dev containers and files)

**Duration:** ~15-20 minutes
**Success Criteria:** >90% test pass rate

---

### Production Deployment

**File:** PI-PRODUCTION-DEPLOYMENT.md

**Steps:**

1. Sync production files to Pi
2. Build bot Docker image
3. Start PostgreSQL + Bot containers
4. Run migrations in bot container
5. Verify logs and health checks
6. Test Discord commands
7. Configure Vercel DATABASE_URL

**Duration:** ~10-15 minutes
**Containers:** 2 (postgres, discord-bot)

---

## File Reference

### Deployment Documentation

- **PI-TESTING-GUIDE.md** - Pre-production testing workflow
- **PI-PRODUCTION-DEPLOYMENT.md** - Production deployment guide
- **DEPLOYMENT-OVERVIEW.md** - This file (architecture overview)

### Configuration Files

- **docker-compose.prod.yml** - Production containers (postgres + bot)
- **docker-compose.dev.yml** - Testing containers (postgres + api + bot)
- **Dockerfile** - Bot image build
- **Dockerfile.api** - API image build (testing only, not used in production)
- **.env.production** - Production environment (Pi)
- **.env.local** - Development environment (Windows + Pi testing)
- **.env** - Master secrets (Windows only, never synced)
- **.env.example** - Template for new developers

### Deployment Scripts

- **PI-DEPLOYMENT.md** - Legacy/comprehensive guide (being phased out)
- **RASPBERRY-PI-SETUP.md** - Initial Pi setup and configuration

---

## Environment Variable Strategy

### Windows Development Machine

**.env (Never synced)**

- Master credential vault
- Powers Docker Compose for local PostgreSQL
- Contains all secrets

**.env.local (Synced for testing)**

- Active development configuration
- `DATABASE_URL=localhost:5432` (Windows PostgreSQL)
- `BOT_API_URL=http://localhost:3000/api` (Windows dev server)

---

### Raspberry Pi - Testing

**.env.local (Temporary - deleted after testing)**

- Development testing configuration
- `DATABASE_URL=localhost:5432` (Pi dev PostgreSQL)
- `BOT_API_URL=http://localhost:3000/api` (Pi dev server)

**docker-compose.dev.yml (Temporary - deleted after testing)**

- Runs postgres + api-server for testing
- Deleted before production deployment

---

### Raspberry Pi - Production

**.env.production (Permanent)**

- Production configuration
- `DATABASE_URL=postgresql://...@postgres:5432/...` (Docker container name)
- `BOT_API_URL=https://your-site.vercel.app/api` (Vercel production)

**docker-compose.prod.yml (Permanent)**

- Runs postgres + discord-bot only
- No API server (runs on Vercel)

---

### Vercel - Production

**Environment Variables (Dashboard)**

- `DATABASE_URL=postgresql://...@YOUR_PI_IP:5432/...` (Pi external IP)
- All website/API secrets (Resend, Google OAuth, etc.)

---

## Port Configuration

### Raspberry Pi

| Port | Service    | Exposure     | Purpose                                  |
| ---- | ---------- | ------------ | ---------------------------------------- |
| 5432 | PostgreSQL | 0.0.0.0:5432 | Database (Vercel connection + debugging) |
| 8080 | Bot Health | 0.0.0.0:8080 | Health check endpoint                    |

**Note:** Port 5432 exposed to all interfaces for Vercel connection

---

### Windows Development

| Port | Service    | Exposure       | Purpose                    |
| ---- | ---------- | -------------- | -------------------------- |
| 5432 | PostgreSQL | localhost:5432 | Local development database |
| 3000 | Next.js    | localhost:3000 | Development server         |

---

## Security Considerations

### Pi PostgreSQL Exposure

**Risk:** Port 5432 exposed to `0.0.0.0` (all interfaces)

**Mitigation:**

- Strong password required
- Consider firewall rules (allow only Vercel IPs)
- Consider VPN or Cloudflare Tunnel
- Monitor access logs

### Secrets Management

**Safe:**

- ✅ `.env` never synced to Pi
- ✅ `.env` never committed to Git
- ✅ `.env.production` not committed to Git
- ✅ `.env.local` not committed to Git

**Risky:**

- ⚠️ `.env.example` committed (contains no secrets)
- ⚠️ Secrets in Vercel dashboard (encrypted)

---

## Troubleshooting Quick Reference

### Bot can't connect to Vercel API

**Check:**

```bash
# Verify BOT_API_URL
docker compose -f docker-compose.prod.yml exec discord-bot printenv BOT_API_URL
# Should show: https://your-site.vercel.app/api

# Test from Pi
curl https://your-site.vercel.app/api/health
```

---

### Vercel can't connect to Pi PostgreSQL

**Check:**

```bash
# Test from Windows
psql postgresql://YOUR_DB_USER:<password>@YOUR_PI_IP:5432/YOUR_DB_NAME

# Check firewall
sudo ufw status
```

---

### Migrations fail

**Check:**

```bash
# Verify DATABASE_URL in container
docker compose -f docker-compose.prod.yml exec discord-bot printenv DATABASE_URL
# Should show: postgresql://...@postgres:5432/...

# Run manually
docker compose -f docker-compose.prod.yml exec discord-bot npx prisma migrate deploy
```

---

## Quick Command Reference

### Testing on Pi

```bash
# See PI-TESTING-GUIDE.md
npm install
docker compose -f docker-compose.dev.yml up -d postgres
npx dotenv -e .env.local -- npx prisma migrate deploy
# Terminal 1: npm run dev
# Terminal 2: npm run bot:dev
# Test, then cleanup:
docker compose -f docker-compose.dev.yml down -v
rm -f .env.local docker-compose.dev.yml
```

### Production on Pi

```bash
# See PI-PRODUCTION-DEPLOYMENT.md
docker build --no-cache -t your-project-bot:latest -f Dockerfile .
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec discord-bot npx prisma migrate deploy
docker compose -f docker-compose.prod.yml logs -f
```

### Monitoring

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f discord-bot
curl http://localhost:8080/health
docker stats your-project-bot your-project-db
```

---

## Success Criteria

### Testing Phase

- ✅ All tests pass (>90%)
- ✅ Bot responds in Discord
- ✅ API routes work
- ✅ Database queries execute
- ✅ No errors in logs

### Production Phase

- ✅ PostgreSQL container healthy
- ✅ Bot container healthy
- ✅ Bot connected to Discord
- ✅ Bot calls Vercel API successfully
- ✅ Vercel connects to Pi database
- ✅ Website loads correctly
- ✅ Discord commands work

---

**Questions?** See individual deployment guides for detailed steps.
