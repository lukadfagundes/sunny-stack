# Deployment Documentation

Complete guide for deploying Sunny Stack to production.

---

## 📚 Documentation Index

### Getting Started

1. **[DEPLOYMENT-OVERVIEW.md](DEPLOYMENT-OVERVIEW.md)** ⭐ Start here
   - Architecture overview
   - Component breakdown
   - Data flow diagrams
   - Quick command reference

2. **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** ✅ Quick reference
   - One-time setup checklist
   - Verification steps
   - Common issues
   - Quick commands

---

### Production Deployment

3. **[PI-PRODUCTION-DEPLOYMENT.md](PI-PRODUCTION-DEPLOYMENT.md)** 🚀 Main guide
   - Step-by-step production deployment
   - PostgreSQL + Bot on Raspberry Pi
   - Environment configuration
   - Health checks and monitoring

4. **[GITHUB-ACTIONS-SETUP.md](GITHUB-ACTIONS-SETUP.md)** ⚙️ Automation
   - GitHub Actions configuration
   - SSH key setup
   - Discord notifications
   - Automatic deployment workflow

---

### Testing and Setup

5. **[PI-TESTING-GUIDE.md](PI-TESTING-GUIDE.md)** 🧪 Pre-production testing
   - 13-step testing workflow
   - Development environment on Pi
   - Automated test execution
   - Cleanup procedures

6. **[RASPBERRY-PI-SETUP.md](RASPBERRY-PI-SETUP.md)** 🔧 Initial setup
   - Raspberry Pi OS installation
   - Network configuration
   - Docker installation
   - Security hardening

---

### Maintenance

7. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** 🔍 Problem solving
   - Common deployment issues
   - Error messages and solutions
   - Performance optimization
   - Debug commands

8. **[SANITIZE-DOCS.md](SANITIZE-DOCS.md)** 🔒 Documentation security
   - Personalizing documentation
   - Sanitization scripts
   - Security best practices
   - Public repository safety

---

## 🎯 Quick Start Guide

### For First-Time Setup

```bash
# 1. Read the overview
docs/deployment/DEPLOYMENT-OVERVIEW.md

# 2. Set up Raspberry Pi
docs/deployment/RASPBERRY-PI-SETUP.md

# 3. Configure GitHub Actions
docs/deployment/GITHUB-ACTIONS-SETUP.md

# 4. Test on Pi
docs/deployment/PI-TESTING-GUIDE.md

# 5. Deploy to production
docs/deployment/PI-PRODUCTION-DEPLOYMENT.md
```

---

### For Daily Deployments

```bash
# Push to main branch
git push origin main

# GitHub Actions automatically:
# - Deploys website/API to Vercel
# - Deploys bot/database to Pi
# - Sends Discord notification

# Verify deployment
docs/deployment/DEPLOYMENT-CHECKLIST.md
```

---

## 🏗️ Architecture Summary

```
┌─────────────────────────────────────┐
│         Vercel (Serverless)         │
│  ┌──────────────────────────────┐   │
│  │   Next.js Website + API      │   │
│  │   https://your-site.vercel   │   │
│  └──────────┬───────────────────┘   │
└─────────────┼───────────────────────┘
              │
              │ DATABASE_URL
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
│  │   Calls: your-site/api       │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Key Points:**

- Website + API hosted on Vercel (serverless)
- PostgreSQL + Bot hosted on Pi (self-hosted)
- Automatic deployment on push to main
- GitHub Actions orchestrates Pi deployment

---

## 📋 Required Secrets

### GitHub Repository Secrets

| Secret                | Description          | How to Get                 |
| --------------------- | -------------------- | -------------------------- |
| `PI_HOST`             | Pi IP address        | `hostname -I` on Pi        |
| `PI_USERNAME`         | SSH username         | Usually `pi`               |
| `PI_SSH_KEY`          | Private SSH key      | Generate with `ssh-keygen` |
| `DISCORD_WEBHOOK_URL` | Notification webhook | Discord server settings    |

### Environment Files

| File              | Location               | Purpose                       |
| ----------------- | ---------------------- | ----------------------------- |
| `.env`            | Windows only           | Master secrets (never synced) |
| `.env.local`      | Windows + Pi (testing) | Development configuration     |
| `.env.production` | Pi only                | Production configuration      |

---

## 🔗 Related Documentation

### API Setup Guides (`docs/`)

- `cloudflare-api-setup.md` - Cloudflare integration
- `cronjob-api-setup.md` - Cron job monitoring
- `discord-bot-oauth-setup.md` - Discord bot configuration
- `fly-io-setup.md` - Fly.io deployment (alternative)
- `google-api-setup.md` - Google OAuth setup

### Testing (`__tests__/`)

- Unit tests for bot commands
- Database helpers tests
- Webhook verification tests

---

## 🛠️ Tools and Scripts

### Deployment Scripts (`scripts/`)

- `setup-pi-autostart.sh` - Configure auto-restart on boot
- `sanitize-docs.sh` - Remove personal info from docs
- `personalize-docs.sh` - Add personal info to docs

### Docker Configuration

- `Dockerfile` - Bot container build
- `docker-compose.prod.yml` - Production containers
- `docker-compose.dev.yml` - Development/testing containers

---

## 📞 Support

**Issues?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Questions?** Review [DEPLOYMENT-OVERVIEW.md](DEPLOYMENT-OVERVIEW.md)

**Setup Help?** Follow [PI-PRODUCTION-DEPLOYMENT.md](PI-PRODUCTION-DEPLOYMENT.md)

---

**Last Updated:** 2025-11-06
**Architecture:** Hybrid Vercel + Raspberry Pi
**Deployment:** Automatic via GitHub Actions
