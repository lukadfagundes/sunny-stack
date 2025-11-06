# Deployment Checklist

**Quick reference for deploying Sunny Stack**

---

## Architecture Summary

```
Push to main
    ↓
┌───────────────────────┬────────────────────────┐
│                       │                        │
│   Vercel (Automatic)  │   Pi (GitHub Actions)  │
│   ├── Website         │   ├── PostgreSQL       │
│   └── API             │   └── Discord Bot      │
│                       │                        │
└───────────────────────┴────────────────────────┘
```

---

## ✅ One-Time Setup Checklist

### GitHub Secrets

- [ ] `PI_HOST` = Your Pi's IP address (find with `hostname -I` on Pi)
- [ ] `PI_USERNAME` = Your Pi username (default: `pi`)
- [ ] `PI_SSH_KEY` = Private SSH key for GitHub Actions (generate new key)
- [ ] `DISCORD_WEBHOOK_URL` = Discord webhook URL (create in Discord server settings)

**See:** [GITHUB-ACTIONS-SETUP.md](GITHUB-ACTIONS-SETUP.md)

---

### Raspberry Pi Setup

- [ ] Clone repository: `git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git ~/sunny-stack`
- [ ] Create `.env.production` with production credentials
- [ ] Run auto-start setup: `./scripts/setup-pi-autostart.sh`
- [ ] Verify auto-start: `sudo systemctl status sunny-stack`
- [ ] Test reboot: `sudo reboot` → containers restart automatically

**See:** [PI-PRODUCTION-DEPLOYMENT.md](PI-PRODUCTION-DEPLOYMENT.md)

---

### Vercel Setup

- [ ] Connect GitHub repository to Vercel
- [ ] Set environment variable: `DATABASE_URL=postgresql://USER:PASSWORD@YOUR_PI_IP:5432/DATABASE_NAME`
- [ ] Configure automatic deployments on main branch
- [ ] Verify deployment: https://your-site.vercel.app

---

## 🚀 Deployment Workflow

### Normal Push to Main

**1. Make changes locally:**

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

**2. Automatic deployments:**

- ✅ **Vercel** deploys website + API (1-2 minutes)
- ✅ **GitHub Actions** deploys Pi bot + database (3-5 minutes)
- ✅ **Discord** notification sent

**3. Verify:**

- Website: https://your-site.vercel.app
- Bot: Run `/project-list` in Discord
- Logs: GitHub Actions → View workflow run

---

### Testing Before Production

**See:** [PI-TESTING-GUIDE.md](PI-TESTING-GUIDE.md)

**Steps:**

1. Sync files to Pi
2. Run `npm install`
3. Start dev database
4. Run `npm run dev` and `npm run bot:dev`
5. Test in Discord
6. Run automated tests: `npm run bot:test`
7. Cleanup dev environment

**Duration:** 15-20 minutes
**Success criteria:** >90% test pass rate

---

## 🔍 Verification Checklist

### After Deployment

**Vercel (Website):**

- [ ] Website loads: https://your-site.vercel.app
- [ ] API health check: https://your-site.vercel.app/api/health
- [ ] No errors in Vercel logs

**Raspberry Pi (Bot):**

- [ ] SSH into Pi: `ssh pi@your-pi`
- [ ] Check containers: `docker compose -f ~/sunny-stack/docker-compose.prod.yml ps`
- [ ] PostgreSQL: `Up (healthy)`
- [ ] Bot: `Up (healthy)`
- [ ] Bot health: `curl http://localhost:8080/health`
- [ ] Check logs: `docker compose -f ~/sunny-stack/docker-compose.prod.yml logs discord-bot`
- [ ] Verify Discord connection in logs

**Discord (Bot Commands):**

- [ ] Run `/project-list` → Gets projects from database
- [ ] Run `/admin-health` → Shows system health
- [ ] No errors in bot responses

---

## 📊 Monitoring

### GitHub Actions

**Check deployment status:**

1. Go to repository → **Actions** tab
2. View latest workflow run
3. Check for ✅ or ❌

**Expected time:** 3-5 minutes

---

### Discord Notifications

**Successful deployment:**

```
✅ Deployed to Raspberry Pi
Commit: <message>
Author: <username>
Services:
• PostgreSQL: Running
• Discord Bot: Connected
```

**Failed deployment:**

```
❌ Pi Deployment Failed
Commit: <message>
[View Logs]
```

---

### Container Health

**SSH into Pi:**

```bash
ssh pi@your-pi
cd ~/sunny-stack
```

**Check status:**

```bash
# Quick status
docker compose -f docker-compose.prod.yml ps

# Detailed health
sudo systemctl status sunny-stack

# Resource usage
docker stats your-project-bot your-project-db --no-stream

# Logs (live)
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🔧 Common Issues

### GitHub Actions Fails to Connect to Pi

**Fix:**

```bash
# Check Pi is online
ping YOUR_PI_IP

# Check SSH key in GitHub Secrets
# Regenerate if needed - see GITHUB-ACTIONS-SETUP.md
```

---

### Containers Don't Start

**Fix:**

```bash
ssh pi@your-pi
cd ~/sunny-stack

# Check logs
docker compose -f docker-compose.prod.yml logs

# Verify .env.production
ls -la .env.production

# Restart
docker compose -f docker-compose.prod.yml restart
```

---

### Bot Not Responding in Discord

**Fix:**

```bash
ssh pi@your-pi
cd ~/sunny-stack

# Check bot logs
docker compose -f docker-compose.prod.yml logs discord-bot | tail -100

# Check bot health
curl http://localhost:8080/health

# Verify BOT_API_URL
docker compose -f docker-compose.prod.yml exec discord-bot printenv BOT_API_URL
# Should be: https://your-site.vercel.app/api

# Restart bot
docker compose -f docker-compose.prod.yml restart discord-bot
```

---

### Vercel Can't Connect to Database

**Fix:**

```bash
# Test from Windows
psql postgresql://YOUR_DB_USER:<password>@YOUR_PI_IP:5432/YOUR_DB_NAME

# Check Pi firewall
ssh pi@your-pi "sudo ufw status"

# Allow PostgreSQL port
ssh pi@your-pi "sudo ufw allow 5432/tcp"

# Verify DATABASE_URL in Vercel dashboard
# Should be: postgresql://...@YOUR_PI_IP:5432/...
```

---

## 📚 Documentation Reference

| Document                                                   | Purpose                           |
| ---------------------------------------------------------- | --------------------------------- |
| [DEPLOYMENT-OVERVIEW.md](DEPLOYMENT-OVERVIEW.md)           | Architecture overview             |
| [PI-TESTING-GUIDE.md](PI-TESTING-GUIDE.md)                 | Testing workflow (pre-production) |
| [PI-PRODUCTION-DEPLOYMENT.md](PI-PRODUCTION-DEPLOYMENT.md) | Production deployment guide       |
| [GITHUB-ACTIONS-SETUP.md](GITHUB-ACTIONS-SETUP.md)         | GitHub Actions configuration      |
| [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)         | This document                     |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md)                   | Detailed troubleshooting          |

---

## 🎯 Quick Commands

### Deploy to Production

```bash
git push origin main
# Watch GitHub Actions
# Verify in Discord
```

### Check Pi Status

```bash
ssh pi@your-pi "docker compose -f ~/sunny-stack/docker-compose.prod.yml ps"
```

### View Pi Logs

```bash
ssh pi@your-pi "docker compose -f ~/sunny-stack/docker-compose.prod.yml logs -f discord-bot"
```

### Restart Pi Containers

```bash
ssh pi@your-pi "sudo systemctl restart sunny-stack"
```

### Manual Deployment (if GitHub Actions down)

```bash
ssh pi@your-pi
cd ~/sunny-stack
git pull origin main
docker compose -f docker-compose.prod.yml down
docker rmi -f your-project-bot:latest
docker build --no-cache -t your-project-bot:latest -f Dockerfile .
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec discord-bot npx prisma migrate deploy
```

---

**Last Updated:** 2025-11-06
**Architecture:** Vercel (website/API) + Pi (database/bot)
**Deployment:** Automatic on push to main
