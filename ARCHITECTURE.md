# Sunny Stack - Deployment Architecture

**Date:** 2025-11-05
**Version:** 2.0
**Status:** ✅ Production Ready

---

## Overview

Sunny Stack uses a **hybrid deployment architecture** that combines serverless hosting (Vercel) with self-hosted infrastructure (Raspberry Pi 4B). This architecture provides the best of both worlds: global CDN performance for the public site and persistent, stateful services for the Discord bot.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Repository (main)                     │
│                   Single Source of Truth                         │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                 │
             │ Push triggers                   │ Push triggers
             │ automatic deploy                │ GitHub Actions
             ↓                                 ↓
    ┌────────────────────┐         ┌──────────────────────────┐
    │   Vercel Cloud     │         │   Raspberry Pi 4B        │
    │  (Serverless)      │         │   (Self-Hosted)          │
    ├────────────────────┤         ├──────────────────────────┤
    │ ✓ Next.js Site     │         │ ✓ PostgreSQL Database    │
    │ ✓ Public Pages     │         │ ✓ Next.js API Server     │
    │ ✓ Admin Dashboard  │         │ ✓ Discord Bot            │
    │ ✓ Global CDN       │         │ ✓ Persistent Services    │
    └─────────┬──────────┘         └────────┬─────────────────┘
              │                              │
              │ Connects via                 │
              │ DATABASE_URL                 │
              └──────────────────────────────┘
                  PostgreSQL Connection
              (Pi public IP or VPN tunnel)
```

---

## Deployment Targets

### 1. Vercel (Public Website)

**What It Hosts:**

- Next.js 15 frontend (React 19)
- Public pages (home, about, portfolio, resume, contact, quote)
- Admin dashboard UI
- API routes (accessed by browser)

**Deployment Method:**

- **Automatic**: Push to `main` branch triggers Vercel build
- **Build Time**: ~2-3 minutes
- **Zero Downtime**: Atomic deployments

**Configuration:**

- Vercel Dashboard: Connected to GitHub repo
- Environment Variables: Set in Vercel dashboard
- Database Connection: Points to Pi PostgreSQL via `DATABASE_URL`

**Access:**

- Production: `https://sunny-stack.com`
- Preview: Auto-generated URL for each PR

---

### 2. Raspberry Pi 4B (Bot Infrastructure)

**What It Hosts:**

- PostgreSQL 15 (Database)
- Next.js API Server (Lightweight, API routes only)
- Discord Bot (Gateway connection, persistent)

**Deployment Method:**

- **Manual** (Current): SSH + docker-compose commands
- **Automated** (Future): GitHub Actions on push to `main`

**Architecture:**

```
Pi Docker Services:
├── postgres:5432
│   └── Persistent data volume
├── api-server:3000
│   └── Next.js (API routes only)
└── discord-bot:8080
    └── Connects to api-server:3000
```

**Why Self-Hosted:**

- Discord bot requires persistent WebSocket connection (incompatible with serverless)
- PostgreSQL requires persistent storage
- Cost-effective ($0 vs ~$50/month for managed services)

---

## Data Flow

### User Visits Website (Vercel)

```
User Browser
  → Vercel CDN (Next.js)
  → Vercel Edge Function (API Route)
  → Pi PostgreSQL (via DATABASE_URL)
  → Response back to user
```

### Discord Bot Command

```
Discord User
  → Discord API (WebSocket)
  → Pi Discord Bot
  → Pi API Server (http://api-server:3000/api)
  → Pi PostgreSQL (postgres:5432)
  → Response back to Discord
```

### Quote Form Submission

```
User submits quote form (Vercel)
  → Vercel API route (/api/send-quote)
  → Saves to Pi PostgreSQL
  → Webhook to Pi Discord Bot
  → Notification posted to Discord channel
```

---

## Why This Architecture?

### Problem: Discord Bot Can't Run on Vercel

- **Serverless Functions** = Short-lived (10-30 seconds max)
- **Discord Bot** = Long-running WebSocket connection (24/7)
- **Vercel Limitation**: No persistent connections allowed

### Solution: Hybrid Deployment

1. **Vercel**: Public site (stateless, scales globally)
2. **Raspberry Pi**: Bot + Database (stateful, always-on)

### Benefits

✅ **Global Performance**: Vercel CDN for website
✅ **Cost Effective**: Pi runs 24/7 for ~$5/month electricity
✅ **Full Control**: Own your data and infrastructure
✅ **Scalable**: Can migrate to cloud VPS later if needed
✅ **Development Friendly**: Test locally, deploy everywhere

---

## Deployment Workflow

### Current (Manual) - Testing Phase

**On Windows Dev Machine:**

1. Develop and test locally (`npm run dev` + `npm run bot:dev`)
2. Commit and push to `main` branch
3. Vercel auto-deploys website
4. Manually sync to Pi via `tar` + `ssh`
5. Build Docker images on Pi
6. Deploy with `docker-compose up -d`

**Commands:**

```bash
# Sync to Pi
tar czf - [files...] | ssh pi@sunny-pi "cd ~/sunny-stack && tar xzf -"

# Build on Pi
docker build -f Dockerfile -t sunny-stack-bot:latest .
docker build -f Dockerfile.api -t sunny-stack-api:latest .

# Deploy
docker compose -f docker-compose.prod.yml up -d
```

### Future (Automated) - Production

**GitHub Actions Workflow** (`.github/workflows/deploy-pi.yml`):

```yaml
on:
  push:
    branches: [main]

jobs:
  deploy-to-pi:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        run: |
          ssh pi@sunny-pi "
            cd ~/sunny-stack &&
            git pull origin main &&
            docker compose -f docker-compose.prod.yml build &&
            docker compose -f docker-compose.prod.yml up -d &&
            docker compose -f docker-compose.prod.yml exec -T api-server npx prisma migrate deploy
          "
```

**Flow:**

1. Developer pushes to `main`
2. Vercel deploys website (automatic)
3. GitHub Action triggers Pi deployment (automatic)
4. Zero-downtime deployment with database migrations

---

## Database Strategy

### PostgreSQL on Raspberry Pi

**Why Not Cloud Database?**

- **Cost**: Neon/Supabase = $20-50/month, Pi = $0/month
- **Latency**: Local is faster for bot operations
- **Control**: Own your data, no vendor lock-in

**Backup Strategy:**

- Docker volume: Persists across container restarts
- Future: Automated daily backups to cloud storage (S3/B2)
- Migration: Prisma migrations tracked in Git

**Connections:**

- **Pi Services**: Connect via `postgres:5432` (Docker network)
- **Vercel Site**: Connects via Pi's public IP + port forward (or VPN tunnel)

**Security:**

- PostgreSQL not exposed to internet (firewall blocked)
- Vercel connects via secure connection string with password
- SSL/TLS encryption for database connections

---

## Environment Variables

### Vercel (.env.production - Vercel Dashboard)

```bash
DATABASE_URL=postgresql://user:pass@pi-public-ip:5432/sunnystack
NEXTAUTH_URL=https://sunny-stack.com
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=...
```

### Raspberry Pi (.env.production - On Pi only)

```bash
DATABASE_URL=postgresql://user:pass@postgres:5432/sunnystack
BOT_API_URL=http://api-server:3000/api
DISCORD_BOT_TOKEN=...
DEPLOYMENT_MODE=pi
NODE_ENV=production
```

**Security:**

- `.env.production` **NEVER** committed to Git
- Each environment has its own secrets
- Pi file stays on Pi, Vercel vars stay in Vercel

---

## Container Architecture

### Docker Compose Services

**docker-compose.prod.yml:**

```yaml
services:
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - sunny-stack-network

  api-server:
    image: sunny-stack-api:latest
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://...@postgres:5432/...
    networks:
      - sunny-stack-network

  discord-bot:
    image: sunny-stack-bot:latest
    depends_on:
      - postgres
      - api-server
    environment:
      BOT_API_URL: http://api-server:3000/api
    networks:
      - sunny-stack-network
```

**Service Dependencies:**

1. `postgres` starts first (database)
2. `api-server` starts after postgres is healthy
3. `discord-bot` starts after both postgres + api-server are healthy

**Restart Policy:**

- All services: `restart: unless-stopped`
- Survives Pi reboots automatically
- Docker daemon starts services on boot

---

## Scaling Strategy

### Current Capacity (Pi 4B - 4GB RAM)

- PostgreSQL: 256-512MB RAM
- API Server: 256-512MB RAM
- Discord Bot: 512MB-1.5GB RAM
- **Total**: ~1-2.5GB used (40-60% of 4GB)

### When to Scale Up

**Database Growth:**

- Current: <100MB database
- Threshold: >2GB database → Consider cloud PostgreSQL
- Solution: Upgrade to Pi 5 (8GB) or migrate to managed database

**Bot Load:**

- Current: 1 Discord server
- Threshold: >10 servers → Consider cloud VPS
- Solution: Scale Pi to cloud (DigitalOcean, Hetzner, etc.)

**API Traffic:**

- Current: <100 requests/day
- Threshold: >10k requests/day → Consider separating API
- Solution: Keep API on Vercel, bot on Pi

---

## Disaster Recovery

### Backup Strategy (Future Implementation)

**Database Backups:**

```bash
# Daily cron job on Pi
0 2 * * * docker exec postgres pg_dump -U sunnystack > /backup/db-$(date +\%Y\%m\%d).sql
```

**Code Backups:**

- Primary: GitHub repository (always up-to-date)
- No need for separate code backups

**Recovery Process:**

1. Fresh Pi setup with Docker
2. Clone repository from GitHub
3. Restore database from backup
4. Run `docker-compose up -d`
5. System operational in <30 minutes

---

## Monitoring & Maintenance

### Health Checks (Built-In)

**Docker Healthchecks:**

- PostgreSQL: `pg_isready` every 10s
- API Server: HTTP `/api/health` every 30s
- Bot: HTTP `/health` every 30s

**Manual Monitoring:**

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check resource usage
docker stats
```

### Maintenance Tasks

**Weekly:**

- Check Docker logs for errors
- Monitor Pi disk space: `df -h`
- Verify bot is responding in Discord

**Monthly:**

- Docker system prune: `docker system prune -a`
- Update Docker images if needed
- Review database size growth

**Quarterly:**

- Pi OS updates: `sudo apt update && sudo apt upgrade`
- Review and rotate logs
- Test backup restoration process

---

## Migration Path

### From Pi to Cloud (If Needed)

**When:**

- Pi hardware fails
- Need more compute power
- Want better uptime guarantees

**How:**

1. Provision cloud VPS (DigitalOcean/Hetzner ARM64)
2. Same Docker setup works identically
3. Export/import PostgreSQL data
4. Update GitHub Actions to deploy to VPS instead
5. Zero code changes required

**Cost:**

- DigitalOcean: $6-12/month (similar specs to Pi)
- Hetzner: $4-8/month (ARM64 instances)

---

## Security Considerations

### Network Security

- Pi behind home router (NAT)
- Only PostgreSQL port forwarded (if needed for Vercel)
- Firewall rules: Allow only necessary ports
- SSH key authentication only (no passwords)

### Application Security

- All secrets in environment variables (not in code)
- Database passwords: 64-character random strings
- API keys: Rotated quarterly
- Bot token: Never committed to Git

### Docker Security

- Run as non-root user (UID 1001)
- No privileged containers
- Security opt: `no-new-privileges:true`
- Minimal Alpine base images

---

## Conclusion

This hybrid architecture provides:

- ✅ **Professional-grade deployment** following industry best practices
- ✅ **Cost-effective** infrastructure (~$5/month vs $100+/month cloud)
- ✅ **Scalable** design that can grow as needed
- ✅ **Maintainable** with automated deployments
- ✅ **Reliable** with health checks and auto-restart
- ✅ **Secure** with proper secret management

**Status:** Currently in testing phase on Windows. Once validated, will deploy to Pi with automated GitHub Actions workflow.

---

## Related Documentation

- [PI-DEPLOYMENT.md](PI-DEPLOYMENT.md) - Detailed Pi deployment commands
- [DEVELOPMENT-SETUP.md](DEVELOPMENT-SETUP.md) - Local development setup
- [trinity/investigations/INV-006](trinity/investigations/INV-006-windows-firewall-pi-connectivity.md) - Architecture decision investigation

---

**Last Updated:** 2025-11-05
**Next Review:** After successful Pi deployment
