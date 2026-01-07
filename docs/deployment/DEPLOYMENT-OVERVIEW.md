# Deployment Overview

Comprehensive guide to deploying Sunny Stack Portfolio across its hybrid cloud + self-hosted architecture.

## Architecture Summary

Sunny Stack uses a **dual-deployment architecture** optimized for cost efficiency and performance:

```
┌──────────────────────────────────────────────────┐
│              Public Internet                      │
│              sunny-stack.com                      │
└────────────────────┬─────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ↓                       ↓
┌──────────────────┐    ┌──────────────────────┐
│  Vercel Cloud    │    │  Raspberry Pi (Home) │
│  (Serverless)    │    │  (Self-Hosted)       │
├──────────────────┤    ├──────────────────────┤
│ • Next.js App    │◄───┤ • PostgreSQL DB      │
│ • API Routes     │    │ • Discord Bot        │
│ • Static Assets  │    │ • Docker Compose     │
└──────────────────┘    └──────────────────────┘
```

**Why This Architecture?**

| Component            | Deployment   | Reason                                     |
| -------------------- | ------------ | ------------------------------------------ |
| **Next.js Frontend** | Vercel       | Global CDN, automatic scaling, zero-config |
| **API Routes**       | Vercel       | Serverless scaling, 10s timeout sufficient |
| **PostgreSQL**       | Raspberry Pi | $0/month cost, 24/7 availability needed    |
| **Discord Bot**      | Raspberry Pi | WebSocket requires persistent connection   |

**Cost Comparison:**

- **Full Cloud:** ~$20-50/month (managed database + bot hosting)
- **Hybrid:** ~$0/month (after one-time Pi hardware cost)

---

## Component Responsibilities

### Vercel (Cloud)

**Handles:**

- Next.js application rendering (SSR/SSG)
- API route execution (serverless functions)
- Static asset serving (images, CSS, JS)
- Automatic HTTPS/SSL
- Global CDN distribution

**Limitations:**

- 10-second function timeout (Hobby tier)
- No persistent connections (WebSockets)
- No long-running processes

**Repository:** Same codebase, `vercel.json` configuration

### Raspberry Pi (Self-Hosted)

**Handles:**

- PostgreSQL database (persistent storage)
- Discord bot (24/7 WebSocket connection)
- Database backups (automated via cron)
- Health monitoring server (port 8080)

**Requirements:**

- Raspberry Pi 4B (4GB+ RAM recommended)
- Static IP or DDNS
- Port forwarding (5432 for database)
- Docker and Docker Compose

**Repository:** Same codebase, `docker-compose.yml` configuration

---

## Environment Matrix

### Development

```bash
# Location: Local machine
# Frontend: http://localhost:3000
# Database: Local PostgreSQL OR Pi connection
# Bot: Local development mode (optional)

DATABASE_URL=postgresql://user:pass@localhost:5432/sunnystack_dev
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Staging

```bash
# Location: Vercel preview + Pi staging schema
# Frontend: https://sunny-stack-git-feature-xyz.vercel.app
# Database: Pi (staging schema)
# Bot: Pi (staging mode - optional)

DATABASE_URL=postgresql://user:pass@pi-host:5432/sunnystack_staging
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://sunny-stack-git-feature-xyz.vercel.app
```

### Production

```bash
# Location: Vercel production + Pi production schema
# Frontend: https://sunny-stack.com
# Database: Pi (production)
# Bot: Pi (production)

DATABASE_URL=postgresql://user:pass@pi-host:5432/sunnystack
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://sunny-stack.com
```

---

## Deployment Decision Tree

```mermaid
graph TD
    A[Code Change] --> B{What Changed?}
    B -->|Frontend/API| C[Deploy to Vercel]
    B -->|Database Schema| D[Run Migration]
    B -->|Bot Logic| E[Deploy to Pi]
    B -->|Both| F[Deploy Both]

    C --> G{Auto Deploy?}
    G -->|Push to main| H[Auto Deploy Production]
    G -->|Push to branch| I[Auto Deploy Preview]
    G -->|Manual| J[vercel --prod]

    D --> K[Apply Migration on Pi]
    K --> L[Restart Vercel Build]

    E --> M[SSH to Pi]
    M --> N[Pull Changes]
    N --> O[Rebuild Bot Image]
    O --> P[Restart Containers]

    F --> Q[Deploy Vercel First]
    Q --> R[Then Deploy Pi]
```

---

## Deployment Workflows

### Scenario 1: Frontend/API Change Only

**Example:** UI component update, API endpoint modification

```bash
# 1. Commit changes
git add .
git commit -m "feat: add new dashboard widget"
git push origin main

# 2. Vercel auto-deploys (monitors main branch)
# ✅ Done! No Pi deployment needed.
```

**Automatic Deployment:**

- Push to `main` → Production deployment
- Push to feature branch → Preview deployment
- Deployment time: ~2-3 minutes

### Scenario 2: Database Schema Change

**Example:** Add new column, create new table

```bash
# 1. Create migration locally
npx prisma migrate dev --name add_user_role

# 2. Test migration locally
npm run dev

# 3. Commit migration files
git add prisma/migrations
git commit -m "feat: add user role column"
git push origin main

# 4. SSH to Pi and apply migration
ssh pi@raspberrypi.local
cd ~/sunny-stack
git pull origin main
npx prisma migrate deploy

# 5. Restart Vercel build (to regenerate Prisma Client)
vercel --prod --force
```

**Critical Notes:**

- Always test migrations locally first
- Apply migration on Pi before Vercel deployment
- Backup database before schema changes

### Scenario 3: Discord Bot Update

**Example:** New slash command, bot logic change

```bash
# 1. Update bot code
# Edit files in bot/ directory

# 2. Test locally
npm run bot:dev

# 3. Deploy commands (if new commands added)
npm run bot:deploy

# 4. Commit changes
git add bot/
git commit -m "feat: add /project-status command"
git push origin main

# 5. SSH to Pi
ssh pi@raspberrypi.local
cd ~/sunny-stack

# 6. Pull changes and rebuild
git pull origin main
docker compose down discord-bot
docker build -t sunny-stack-bot:latest -f Dockerfile .
docker compose up -d discord-bot

# 7. Verify bot is online
docker compose logs -f discord-bot
```

**Deployment Time:** ~5-10 minutes (including Docker build)

### Scenario 4: Full Stack Update

**Example:** Feature affecting frontend, API, database, and bot

```bash
# 1. Create migration
npx prisma migrate dev --name feature_xyz

# 2. Test everything locally
npm run dev
npm run bot:dev

# 3. Commit all changes
git add .
git commit -m "feat: complete XYZ feature"
git push origin main

# 4. Deploy database first (SSH to Pi)
ssh pi@raspberrypi.local
cd ~/sunny-stack
git pull origin main
npx prisma migrate deploy

# 5. Deploy bot (on Pi)
docker compose down discord-bot
docker build -t sunny-stack-bot:latest -f Dockerfile .
docker compose up -d discord-bot

# 6. Deploy Vercel (automatic or manual)
vercel --prod --force

# 7. Verify all components
curl https://sunny-stack.com/api/health
docker compose ps
docker compose logs discord-bot
```

**Deployment Order:**

1. Database migration (Pi)
2. Bot deployment (Pi)
3. Vercel deployment (auto or manual)

---

## Rollback Procedures

### Vercel Rollback

**Method 1: Via Dashboard**

```bash
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Find last known good deployment
5. Click "..." → "Promote to Production"
```

**Method 2: Via CLI**

```bash
# Rollback to previous deployment
vercel rollback

# Rollback to specific deployment
vercel rollback [deployment-url]
```

**Rollback Time:** ~30 seconds

### Raspberry Pi Rollback

**Code Rollback:**

```bash
# SSH to Pi
ssh pi@raspberrypi.local
cd ~/sunny-stack

# View commit history
git log --oneline -10

# Rollback to previous commit
git reset --hard HEAD~1

# Restart containers
docker compose restart
```

**Database Migration Rollback:**

```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back [migration-name]

# Manually reverse schema changes (write SQL)
docker compose exec postgres psql -U sunnystack -d sunnystack

# Example: Drop column
ALTER TABLE users DROP COLUMN role;

# Exit psql
\q
```

**⚠️ Warning:** Database rollbacks can cause data loss. Always backup first.

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Environment variables verified
- [ ] Database migration tested locally
- [ ] Build succeeds (`npm run build`)
- [ ] Bot commands tested (if bot changes)

### During Deployment

#### Vercel

- [ ] Preview deployment reviewed
- [ ] Production deployment triggered
- [ ] Build logs checked for errors
- [ ] Deployment completes successfully

#### Raspberry Pi

- [ ] SSH connection established
- [ ] Latest code pulled
- [ ] Migrations applied (if needed)
- [ ] Docker images rebuilt (if needed)
- [ ] Containers restarted
- [ ] Health checks passing

### Post-Deployment

- [ ] Frontend loads successfully
- [ ] API endpoints responding
- [ ] Database queries working
- [ ] Discord bot online
- [ ] No errors in Rollbar
- [ ] Performance metrics acceptable
- [ ] Monitor for 15 minutes

---

## Common Deployment Scenarios

### Emergency Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Make minimal fix
# Edit files...

# 3. Test locally
npm run dev
npm test

# 4. Commit and push
git add .
git commit -m "fix: resolve critical bug in X"
git push origin hotfix/critical-bug

# 5. Create PR and merge to main
# (Use GitHub UI for quick review)

# 6. Verify automatic deployment
# Vercel auto-deploys main

# 7. If Pi changes needed, deploy immediately
ssh pi@raspberrypi.local
cd ~/sunny-stack
git pull origin main
docker compose restart
```

**Hotfix Time:** ~5-10 minutes

### Database Backup Before Deploy

```bash
# SSH to Pi
ssh pi@raspberrypi.local

# Create backup
docker compose exec postgres pg_dump -U sunnystack sunnystack > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
ls -lh backup-*.sql

# Deploy changes
git pull origin main
npx prisma migrate deploy
```

**Restore from Backup:**

```bash
# Drop and recreate database (DESTRUCTIVE)
docker compose exec postgres psql -U sunnystack -c "DROP DATABASE sunnystack;"
docker compose exec postgres psql -U sunnystack -c "CREATE DATABASE sunnystack;"

# Restore backup
cat backup-20260107-143000.sql | docker compose exec -T postgres psql -U sunnystack sunnystack
```

### Scheduled Maintenance

```bash
# 1. Announce maintenance (Discord/Email)
# 2. Put site in maintenance mode (optional)
# 3. Backup database
# 4. Deploy changes (Pi first, then Vercel)
# 5. Run smoke tests
# 6. Monitor for 30 minutes
# 7. Announce completion
```

---

## Monitoring During Deployment

### Vercel Logs

```bash
# Real-time logs
vercel logs --follow

# Recent logs
vercel logs

# Specific deployment
vercel logs [deployment-url]
```

### Raspberry Pi Logs

```bash
# All containers
docker compose logs -f

# Bot only
docker compose logs -f discord-bot

# Database only
docker compose logs -f postgres

# Last 100 lines
docker compose logs --tail=100
```

### Health Checks

```bash
# Frontend health
curl https://sunny-stack.com/api/health

# Bot health (from Pi)
curl http://localhost:8080/health

# Database health (from Pi)
docker compose exec postgres pg_isready -U sunnystack
```

---

## Deployment Best Practices

### 1. Test Before Deploy

- Always test locally first
- Run full test suite
- Test on preview deployment before production

### 2. Deploy During Low Traffic

- Weekday mornings (fewer users)
- Avoid Friday deployments (weekend issues)
- Schedule major changes for maintenance windows

### 3. Deploy Incrementally

- Small, frequent deployments
- Feature flags for gradual rollout
- One change at a time for critical features

### 4. Monitor After Deploy

- Watch logs for 15-30 minutes
- Check error tracking (Rollbar)
- Monitor performance metrics
- Test critical user flows

### 5. Communicate Changes

- Announce maintenance windows
- Update changelog
- Notify team in Discord
- Document breaking changes

### 6. Backup Before Schema Changes

- Always backup database
- Test migration on staging first
- Have rollback plan ready
- Keep backups for 30 days

---

## Deployment Troubleshooting

### Issue: Vercel Build Fails

**Symptoms:**

- Build fails with TypeScript errors
- Module not found errors
- Out of memory errors

**Solutions:**

```bash
# Clear Vercel cache
vercel --force

# Check build logs
vercel logs [deployment-url]

# Verify local build works
npm run build

# Check environment variables
vercel env ls
```

### Issue: Database Connection Failed

**Symptoms:**

- API returns 500 errors
- "Connection refused" in logs
- Prisma client errors

**Solutions:**

```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection from Pi
docker compose exec postgres psql -U sunnystack sunnystack

# Check firewall rules
sudo ufw status

# Restart database
docker compose restart postgres
```

### Issue: Discord Bot Offline

**Symptoms:**

- Bot appears offline in Discord
- Commands don't respond
- "Unknown interaction" errors

**Solutions:**

```bash
# Check bot container status
docker compose ps discord-bot

# View bot logs
docker compose logs discord-bot

# Restart bot
docker compose restart discord-bot

# Verify token is valid
# Check DISCORD_BOT_TOKEN in .env.production
```

For more troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## Deployment Metrics

**Target Deployment Times:**

- Frontend-only: 2-3 minutes (automatic)
- Bot-only: 5-10 minutes (manual)
- Full stack: 10-15 minutes (manual)
- Hotfix: 5-10 minutes (priority)

**Success Criteria:**

- Build completes without errors
- All health checks pass
- No increase in error rate
- Performance within baselines
- Bot responds to commands

---

## Related Documentation

- **[Raspberry Pi Setup](RASPBERRY-PI-SETUP.md)** - Initial Pi configuration
- **[Pi Deployment](PI-DEPLOYMENT.md)** - Pi deployment procedures
- **[GitHub Actions](GITHUB-ACTIONS-SETUP.md)** - CI/CD automation
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Architecture Overview](../architecture/overview.md)** - System architecture

---

**Last Updated:** 2026-01-07
**Deployment Version:** 2.0.0
**Maintained by:** Sunny Stack Development Team
