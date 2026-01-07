# Deployment Documentation

Documentation for deploying the Sunny Stack Portfolio application to various environments.

## Overview

Sunny Stack uses a **hybrid cloud + self-hosted architecture** with:

- **Vercel:** Next.js frontend and API routes (serverless)
- **Raspberry Pi:** PostgreSQL database and Discord bot (Docker containers)

This architecture provides the benefits of serverless scaling while minimizing costs through self-hosting.

---

## Quick Start

### Vercel Deployment (Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Automatic Deployment:**

- Push to `main` branch → automatic production deployment
- Push to feature branch → automatic preview deployment

### Raspberry Pi Deployment (Database & Bot)

```bash
# 1. SSH into Raspberry Pi
ssh pi@raspberrypi.local

# 2. Navigate to project directory
cd ~/sunny-stack

# 3. Pull latest changes
git pull origin main

# 4. Start containers
docker compose up -d
```

---

## Deployment Guides

The following deployment guides are planned:

### DEPLOYMENT-OVERVIEW.md (Planned)

Complete deployment architecture and strategy documentation.

**Topics:**

- Architecture diagram
- Component responsibilities
- Deployment flow
- Environment configuration
- Rollback procedures

### RASPBERRY-PI-SETUP.md (Planned)

Initial setup guide for Raspberry Pi (one-time setup).

**Topics:**

- Hardware requirements
- OS installation
- Docker setup
- Network configuration
- Security hardening

### PI-DEPLOYMENT.md (Planned)

Deployment procedures for Raspberry Pi components.

**Topics:**

- Database deployment
- Bot deployment
- Environment variables
- Container management
- Troubleshooting

### GITHUB-ACTIONS-SETUP.md (Planned)

CI/CD pipeline configuration using GitHub Actions.

**Topics:**

- Workflow configuration
- Secrets management
- Automated testing
- Deployment automation
- Status notifications

### TROUBLESHOOTING.md (Planned)

Common deployment issues and solutions.

**Topics:**

- Connection issues
- Database errors
- Bot disconnections
- Build failures
- Performance issues

---

## Environment Configuration

### Vercel Environment Variables

Set via Vercel Dashboard or CLI:

```bash
vercel env add DATABASE_URL production
vercel env add RESEND_API_KEY production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add NEXTAUTH_SECRET production
vercel env add ADMIN_EMAIL production
vercel env add ROLLBAR_ACCESS_TOKEN production
```

### Raspberry Pi Environment Variables

Create `.env.production` on Pi:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sunnystack

# Discord Bot
DISCORD_BOT_TOKEN=your_token
DISCORD_APPLICATION_ID=your_app_id
DISCORD_PUBLIC_KEY=your_public_key
BOT_API_URL=https://sunny-stack.com
BOT_API_SECRET=your_secret

# Node environment
NODE_ENV=production
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test` and `npm run test:e2e`)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build successful locally (`npm run build`)

### Vercel Deployment

- [ ] Vercel environment variables set
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Preview deployment tested
- [ ] Production deployment successful
- [ ] Vercel logs checked for errors

### Raspberry Pi Deployment

- [ ] Pi environment variables set
- [ ] Docker containers running
- [ ] Database migrations applied
- [ ] Discord bot connected
- [ ] Health checks passing
- [ ] Logs monitored for errors

### Post-Deployment

- [ ] Frontend accessible and functional
- [ ] API endpoints responding
- [ ] Database connections stable
- [ ] Discord bot online and responsive
- [ ] Error monitoring active (Rollbar)
- [ ] Performance metrics acceptable

---

## Rollback Procedures

### Vercel Rollback

```bash
# Via Vercel Dashboard
1. Go to Deployments
2. Find previous successful deployment
3. Click "..." menu → "Promote to Production"

# Via Vercel CLI
vercel rollback
```

### Raspberry Pi Rollback

```bash
# Rollback to previous git commit
cd ~/sunny-stack
git reset --hard HEAD~1
docker compose restart

# Rollback database migration
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Monitoring

### Vercel Monitoring

- **Dashboard:** https://vercel.com/dashboard
- **Logs:** `vercel logs`
- **Analytics:** Built-in Vercel Analytics

### Raspberry Pi Monitoring

```bash
# Container status
docker compose ps

# Container logs
docker compose logs -f

# Bot logs
docker compose logs -f bot

# Database logs
docker compose logs -f postgres

# System resources
htop
```

### Application Monitoring

- **Error Tracking:** Rollbar dashboard
- **Service Health:** `/api/admin/health`
- **Discord Notifications:** Automatic alerts for critical issues

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   GitHub Repository                  │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ↓                       ↓
┌─────────────────┐    ┌─────────────────────┐
│  Vercel Deploy  │    │   Pi Deploy (SSH)   │
│  (Automatic)    │    │   (GitHub Actions)  │
└────────┬────────┘    └──────────┬──────────┘
         │                        │
         ↓                        ↓
┌─────────────────┐    ┌─────────────────────┐
│  Next.js Build  │    │  Docker Compose Up  │
└────────┬────────┘    └──────────┬──────────┘
         │                        │
         ↓                        ↓
┌─────────────────┐    ┌─────────────────────┐
│  Production     │    │  PostgreSQL + Bot   │
│  sunny-stack.   │───>│  Running on Pi      │
│  com            │    │                     │
└─────────────────┘    └─────────────────────┘
```

---

## Support

For deployment issues:

- Check **[Troubleshooting Guide](TROUBLESHOOTING.md)** (planned)
- Review **[Architecture Documentation](../architecture/overview.md)**
- Contact: luka@sunny-stack.com

---

**Last Updated:** 2026-01-07
**Note:** Detailed deployment guides are planned for future releases.
