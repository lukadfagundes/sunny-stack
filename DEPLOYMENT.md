# Deployment Guide

**Project:** Sunny Stack
**Version:** 1.0.0
**Last Updated:** 2025-01-02

---

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
  - [Variable Matrix](#variable-matrix)
  - [Pi Variables (18)](#pi-variables-18)
  - [Vercel Variables (26)](#vercel-variables-26)
- [Deployment Architecture](#deployment-architecture)
- [Deployment Flow](#deployment-flow)
  - [Phase 1: Pre-Flight Validation](#phase-1-pre-flight-validation)
  - [Phase 2: Docker Build](#phase-2-docker-build)
  - [Phase 3: Deployment](#phase-3-deployment)
  - [Phase 4: Health Check](#phase-4-health-check)
  - [Phase 5: Monitoring](#phase-5-monitoring)
- [Next.js Deployment (Vercel)](#nextjs-deployment-vercel)
- [Discord Bot Deployment (Raspberry Pi)](#discord-bot-deployment-raspberry-pi)
- [Environment Validation](#environment-validation)
- [Build Process](#build-process)
- [Docker Deployment](#docker-deployment)
- [Health Checks](#health-checks)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)
- [References](#references)

---

## Introduction

Sunny Stack uses a **decoupled deployment architecture**:

- **Next.js Frontend**: Deployed to Vercel (serverless)
- **Discord Bot**: Deployed to Raspberry Pi 4B (Docker container)

This architecture allows independent deployment, scaling, and maintenance of each component.

### Why Decoupled?

1. **Independent Scaling**: Scale Next.js and bot independently
2. **Cost Optimization**: Bot runs on self-hosted hardware
3. **Reliability**: Frontend remains available if bot goes down
4. **Simplicity**: Each deployment target has specific requirements

---

## Prerequisites

Before deploying, ensure you have:

### Required Tools

- **Node.js** >= 18.17.0
- **npm** >= 10.0.0
- **Docker** (for bot deployment)
- **Git** (for version control)

### Required Accounts

- **Vercel Account**: For Next.js deployment
- **Discord Developer Account**: For bot token
- **Neon Database**: For PostgreSQL database
- **Google Cloud Account**: For OAuth and APIs
- **Resend Account**: For email sending

### Hardware (for Bot)

- **Raspberry Pi 4B** (4GB RAM minimum, 8GB recommended)
- **32GB+ microSD card** (Class 10 or better)
- **Reliable internet connection**
- **Power supply** (official 15W adapter recommended)

For detailed setup instructions, see:

- [RASPBERRY-PI-SETUP.md](./RASPBERRY-PI-SETUP.md)

---

## Environment Variables

### Variable Matrix

Total: **42 environment variables**

| Variable Group         |   Pi   | Vercel | Both  |
| ---------------------- | :----: | :----: | :---: |
| Database               |   -    |   -    |   5   |
| Next.js & Auth         |   -    |   3    |   -   |
| Deployment Mode        |   -    |   -    |   1   |
| Admin Dashboard        |   -    |   3    |   -   |
| Google OAuth           |   -    |   5    |   -   |
| Google Service Account |   -    |   2    |   -   |
| Discord Bot            |   4    |   -    |   -   |
| Discord Channels       |   13   |   -    |   -   |
| Bot API                |   -    |   1    |   1   |
| Email (Resend)         |   -    |   1    |   -   |
| Webhooks               |   -    |   2    |   -   |
| Monitoring             |   -    |   5    |   -   |
| **TOTAL**              | **17** | **22** | **7** |

### Pi Variables (18)

**Required for Discord Bot deployment on Raspberry Pi**

#### Discord Bot (4)

- `DISCORD_BOT_TOKEN` - Bot token from Developer Portal
- `DISCORD_APPLICATION_ID` - Application ID (17-19 digits)
- `DISCORD_GUILD_ID` - Server (guild) ID
- `DISCORD_ADMIN_USER_ID` - Admin user ID

#### Discord Channels (13)

- `DISCORD_CHANNEL_ADMIN_LOGS` - Admin logs channel
- `DISCORD_CHANNEL_BOT_COMMANDS` - Bot commands channel
- `DISCORD_CHANNEL_ACTIVE_PROJECTS` - Active projects channel
- `DISCORD_CHANNEL_PROPOSALS` - Proposals channel
- `DISCORD_CHANNEL_TASKS` - Tasks channel
- `DISCORD_CHANNEL_TIME_TRACKING` - Time tracking channel
- `DISCORD_CHANNEL_CLIENT_INQUIRIES` - Client inquiries channel
- `DISCORD_CHANNEL_CLIENT_UPDATES` - Client updates channel
- `DISCORD_CHANNEL_CALENDAR_SYNC` - Calendar sync channel
- `DISCORD_CHANNEL_EMAIL_NOTIFICATIONS` - Email notifications channel
- `DISCORD_CHANNEL_ANALYTICS` - Analytics channel
- `DISCORD_CHANNEL_INVOICES` - Invoices channel
- `DISCORD_CHANNEL_PAYMENTS` - Payments channel

#### Bot API (1)

- `BOT_API_URL` - Next.js API base URL

### Vercel Variables (26)

**Required for Next.js deployment on Vercel**

_(Full documentation in .env.example)_

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Sunny Stack                          │
│                  Deployment Architecture                 │
└─────────────────────────────────────────────────────────┘

  ┌──────────────────────┐          ┌──────────────────────┐
  │     Vercel Cloud     │          │   Raspberry Pi 4B    │
  │                      │          │                      │
  │  ┌────────────────┐  │          │  ┌────────────────┐  │
  │  │   Next.js App  │  │          │  │  Discord Bot   │  │
  │  │                │  │          │  │   (Docker)     │  │
  │  │  - Frontend    │  │          │  │                │  │
  │  │  - API Routes  │  │◄─────────┤  │  - Gateway API │  │
  │  │  - Admin       │  │  HTTP    │  │  - Commands    │  │
  │  └────────────────┘  │          │  │  - Events      │  │
  │                      │          │  └────────────────┘  │
  └──────────────────────┘          └──────────────────────┘
            │                                 │
            │                                 │
            ├─────────────────────────────────┤
            │                                 │
            ▼                                 ▼
  ┌──────────────────────┐          ┌──────────────────────┐
  │   Neon PostgreSQL    │          │   Discord Gateway    │
  │                      │          │                      │
  │  - Projects         │          │  - Slash Commands    │
  │  - Quotes           │          │  - Interactions      │
  │  - Time Entries     │          │  - Events            │
  └──────────────────────┘          └──────────────────────┘
```

---

## Deployment Flow

### Phase 1: Pre-Flight Validation

1. **Run Prerequisites Check**

   ```bash
   npm run validate:prerequisites
   ```

   This validates:
   - Docker installed and running
   - Node.js version >= 18.17.0
   - All tests pass (52 tests)
   - Bot builds successfully
   - Disk space available (>= 2GB)

2. **Validate Environment Variables**

   ```bash
   # For Pi deployment
   npm run validate:env:pi

   # For Vercel deployment
   npm run validate:env:vercel
   ```

3. **Run Tests**

   ```bash
   npm test
   ```

   Expected: 52 tests pass (50 existing + 2 deployment)

### Phase 2: Docker Build

The Docker build process creates an optimized ARM64 image for Raspberry Pi deployment.

**Build Triggers:**

- Push to `main` branch with changes to `bot/**`, `lib/**`, or `Dockerfile`
- Manual workflow dispatch

**Build Process:**

```yaml
# GitHub Actions automatically:
1. Sets up Docker Buildx for ARM64 cross-compilation
2. Logs in to GitHub Container Registry (ghcr.io)
3. Extracts metadata (tags, labels)
4. Builds multi-stage Docker image for linux/arm64
5. Pushes to ghcr.io with tags: latest, branch name, commit SHA
6. Generates artifact attestation for supply chain security
```

**Multi-Stage Build:**

The Dockerfile uses a 3-stage build to minimize final image size:

1. **deps stage** (node:18-alpine)
   - Installs only bot production dependencies (4 packages)
   - Uses bot/package.json (isolated from root package.json)
   - Runs `npm ci --only=production`

2. **builder stage** (node:18-alpine)
   - Installs TypeScript globally
   - Copies dependencies from deps stage
   - Compiles TypeScript to JavaScript (bot/dist/)

3. **runner stage** (node:18-alpine)
   - Final minimal image with only runtime requirements
   - Installs dumb-init for proper signal handling
   - Creates non-root user (botuser:1001)
   - Copies only compiled code and dependencies
   - Exposes port 8080 for health checks
   - Sets up HEALTHCHECK directive

**Image Optimization:**

Target: **<500MB** (typically achieves ~380MB)

Techniques:

- Alpine Linux base (minimal footprint)
- Only 4 runtime dependencies (discord.js, @prisma/client, dotenv, winston)
- Multi-stage build (dev tools excluded from final image)
- APK cache cleanup
- npm cache cleanup
- .dockerignore excludes tests, docs, Next.js files

**Build Time:** <10 minutes (with GitHub Actions cache)

**Local Testing:**

```bash
# Test ARM64 build locally
./scripts/test-docker-local.sh --arm64

# Clean build (no cache)
./scripts/test-docker-local.sh --arm64 --clean

# AMD64 build (for testing on dev machine)
./scripts/test-docker-local.sh
```

**Build Artifacts:**

- **Image:** `ghcr.io/USERNAME/sunny-stack/discord-bot:latest`
- **Tags:** `latest`, `main-SHA`, `main`
- **Attestation:** Supply chain provenance (viewable on GitHub)

### Phase 3: Deployment

Deployment to Raspberry Pi occurs automatically after successful Docker build, or can be triggered manually.

**Deployment Flow:**

```
1. Pre-Deployment Health Check
   ├─ Test SSH connectivity to Pi
   ├─ Check disk space (<90% threshold)
   ├─ Verify Docker availability
   └─ Backup current image tag

2. Deployment via SSH
   ├─ Log in to GitHub Container Registry
   ├─ Pull latest Docker image
   ├─ Stop existing container (docker-compose down)
   ├─ Start new container (docker-compose up -d)
   └─ Wait for container startup (15s)

3. Post-Deployment Verification
   ├─ Verify container is running
   ├─ Test health endpoint (10 retries, 5s intervals)
   ├─ Verify bot connection to Discord
   ├─ Check resource usage (CPU, memory)
   └─ Clean up old images (keep 7 days)

4. Automatic Rollback (on failure)
   ├─ Triggered if health check fails
   ├─ Stop failed container
   ├─ Restore previous image
   ├─ Start with previous version
   ├─ Verify health after rollback
   └─ Send Discord notification

5. Notification
   ├─ Success: Discord webhook with deployment details
   ├─ Failure: Discord webhook with error logs
   └─ Rollback: Discord webhook with rollback status
```

**Deployment Methods:**

**A. Automatic Deployment (Recommended)**

Triggered automatically on push to `main` branch:

```bash
# Make changes to bot code
git add bot/
git commit -m "feat: add new command"
git push origin main

# GitHub Actions will:
# 1. Run tests
# 2. Build Docker image
# 3. Deploy to Pi
# 4. Verify health
# 5. Send notification
```

**B. Manual Deployment (via GitHub Actions)**

```bash
# Trigger workflow manually
1. Go to: GitHub > Actions > "Deploy Discord Bot to Raspberry Pi"
2. Click "Run workflow"
3. Select branch: main
4. Click "Run workflow"
```

**C. Manual Deployment (SSH to Pi)**

```bash
# SSH to Raspberry Pi
ssh pi@raspberrypi.local

# Navigate to bot directory
cd ~/sunny-stack-bot

# Pull latest image
docker pull ghcr.io/USERNAME/sunny-stack/discord-bot:latest

# Restart container
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl http://localhost:8080/health
docker logs sunny-stack-bot -f
```

**Deployment Secrets:**

Required GitHub Secrets (configure in repository settings):

| Secret                | Description                        | Example                                |
| --------------------- | ---------------------------------- | -------------------------------------- |
| `PI_HOST`             | Raspberry Pi hostname or IP        | `raspberrypi.local`                    |
| `PI_USERNAME`         | SSH username                       | `pi`                                   |
| `PI_SSH_KEY`          | Private SSH key for authentication | (contents of id_ed25519)               |
| `PI_SSH_PORT`         | SSH port (optional, default: 22)   | `22`                                   |
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications  | `https://discord.com/api/webhooks/...` |

**Setup GitHub Secrets:**

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions@sunny-stack"

# Copy public key to Pi
ssh-copy-id -i ~/.ssh/id_ed25519.pub pi@raspberrypi.local

# Add private key to GitHub Secrets
cat ~/.ssh/id_ed25519 | pbcopy  # Copy to clipboard
# Then add to GitHub: Settings > Secrets > Actions > New secret
# Name: PI_SSH_KEY
# Value: (paste private key)
```

**Deployment Configuration:**

File: `docker-compose.prod.yml`

```yaml
services:
  discord-bot:
    image: ghcr.io/USERNAME/sunny-stack/discord-bot:latest
    restart: unless-stopped
    env_file: .env.production
    ports:
      - "8080:8080"
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1.5G
```

**Deployment Logs:**

View deployment logs:

```bash
# GitHub Actions logs
https://github.com/USERNAME/sunny-stack/actions

# Bot logs on Pi (via SSH)
ssh pi@raspberrypi.local "docker logs sunny-stack-bot -f"

# Or with tail
ssh pi@raspberrypi.local "docker logs sunny-stack-bot --tail=100"
```

### Phase 4: Health Check

Comprehensive health monitoring ensures the bot is running correctly after deployment.

**Health Endpoint:**

```bash
GET http://localhost:8080/health
```

**Response Format:**

```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2025-01-03T12:00:00.000Z",
  "version": "1.0.0"
}
```

**Health Check Layers:**

1. **Docker HEALTHCHECK** (Container Level)

   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
     CMD node -e "require('http').get('http://localhost:8080/health', ...)"
   ```

   - Runs every 30 seconds
   - Times out after 10 seconds
   - 5 second grace period on startup
   - 3 retries before marking unhealthy

2. **Deployment Verification** (CI/CD Level)
   - Post-deployment health check with 10 retries
   - 5-second intervals between retries
   - Fails deployment if health check fails
   - Triggers automatic rollback on failure

3. **Systemd Monitoring** (OS Level)
   - Systemd service monitors Docker Compose
   - Auto-restarts on failure
   - Logs to journalctl

4. **Docker Compose Health** (Orchestration Level)
   ```yaml
   healthcheck:
     test: ["CMD", "node", "-e", "..."]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

**Health Check Commands:**

```bash
# Check from local machine
curl http://raspberrypi.local:8080/health

# Check from Pi
curl http://localhost:8080/health

# Check with verbose output
curl -v http://localhost:8080/health

# Check with timeout
curl --max-time 5 http://localhost:8080/health

# Continuous monitoring (every 10s)
watch -n 10 'curl -s http://localhost:8080/health | jq .'
```

**Health Check Troubleshooting:**

| Issue              | Cause                        | Solution                                  |
| ------------------ | ---------------------------- | ----------------------------------------- |
| Connection refused | Container not running        | `docker ps` to check status               |
| Timeout            | Health server not responding | Check logs: `docker logs sunny-stack-bot` |
| 404 Not Found      | Wrong endpoint               | Use `/health` (not `/health/`)            |
| Empty response     | Health server crashed        | Restart container                         |

**Automated Health Monitoring:**

The CI/CD pipeline automatically verifies health:

```yaml
# After deployment
- Waits 15s for startup
- Tests health endpoint (10 retries)
- Verifies bot Discord connection
- Checks resource usage
- Fails deployment if unhealthy
- Triggers automatic rollback
```

**Health Status Indicators:**

| Status       | Container State | Health Check    | Action Required              |
| ------------ | --------------- | --------------- | ---------------------------- |
| ✅ Healthy   | Running         | Passing         | None                         |
| ⚠️ Starting  | Running         | Not yet checked | Wait for start_period (5s)   |
| 🔄 Unhealthy | Running         | Failing         | Check logs, may auto-restart |
| ❌ Down      | Stopped/Exited  | N/A             | Restart container            |

**Health Metrics:**

The health endpoint provides:

- **Status**: healthy/unhealthy
- **Uptime**: Seconds since container start
- **Timestamp**: Current time (ISO 8601)
- **Version**: Bot version from package.json

**Prometheus-style metrics (Future Enhancement):**

```
# Future: Expose metrics on /metrics
discord_bot_commands_total{command="ping"} 42
discord_bot_message_processing_seconds{quantile="0.99"} 0.05
```

### Phase 5: Monitoring

Ongoing monitoring ensures the bot remains healthy and performs optimally.

**Monitoring Layers:**

1. **Docker Stats** (Resource Monitoring)

   ```bash
   # Real-time stats
   docker stats sunny-stack-bot

   # One-time snapshot
   docker stats sunny-stack-bot --no-stream

   # Custom format
   docker stats sunny-stack-bot --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
   ```

2. **Docker Logs** (Application Monitoring)

   ```bash
   # Follow logs
   docker logs sunny-stack-bot -f

   # Last 100 lines
   docker logs sunny-stack-bot --tail=100

   # Since timestamp
   docker logs sunny-stack-bot --since=1h

   # With timestamps
   docker logs sunny-stack-bot -t
   ```

3. **Systemd Journalctl** (System Monitoring)

   ```bash
   # Service logs
   sudo journalctl -u sunny-stack-bot.service -f

   # Last 50 entries
   sudo journalctl -u sunny-stack-bot.service -n 50

   # Since boot
   sudo journalctl -u sunny-stack-bot.service -b
   ```

4. **Health Endpoint** (Uptime Monitoring)

   ```bash
   # Automated health monitoring (every 30s)
   watch -n 30 'curl -sf http://localhost:8080/health | jq .'

   # External monitoring (UptimeRobot, Pingdom, etc.)
   # Add: http://YOUR_PUBLIC_IP:8080/health
   ```

**Resource Monitoring:**

**CPU Usage:**

- **Normal:** 1-5% (idle), 10-30% (active)
- **Warning:** >50% sustained
- **Critical:** >80% sustained

**Memory Usage:**

- **Normal:** 200-500MB
- **Warning:** >800MB
- **Critical:** >1.2GB (approaching limit)

**Disk Usage:**

- **Normal:** <70%
- **Warning:** >80%
- **Critical:** >90%

**Network:**

- Discord Gateway: WebSocket connection
- Bot API: HTTPS to sunny-stack.com
- Database: PostgreSQL connection to Neon

**Monitoring Commands:**

```bash
# Check Pi system resources
ssh pi@raspberrypi.local "top -bn1 | head -20"

# Check disk space
ssh pi@raspberrypi.local "df -h"

# Check memory
ssh pi@raspberrypi.local "free -h"

# Check Docker disk usage
ssh pi@raspberrypi.local "docker system df"

# Check bot container specifically
ssh pi@raspberrypi.local "docker stats sunny-stack-bot --no-stream"
```

**Log Rotation:**

Logs are automatically rotated to prevent disk overflow:

```bash
# Docker logs
max-size: 50m
max-file: 5
# Total: 250MB max

# Application logs (via logrotate)
daily
rotate 7
compress
# Total: ~7 days of logs
```

**Monitoring Alerts:**

Set up alerts for:

1. **Container Down**
   - Discord webhook notification (automatic via CI/CD)
   - Systemd email notification (optional)

2. **High CPU/Memory**
   - Monitor with `docker stats`
   - Alert if >80% for >5 minutes

3. **Disk Space Low**
   - Pre-deployment check fails if >90%
   - Manual monitoring recommended

4. **Health Check Failing**
   - Automatic rollback triggered
   - Discord notification sent

**Monitoring Dashboard (Optional):**

For advanced monitoring, integrate with:

- **Grafana + Prometheus**: Metrics visualization
- **Loki**: Log aggregation
- **cAdvisor**: Container metrics
- **Netdata**: Real-time performance monitoring

**Performance Baselines:**

| Metric                | Expected  | Action If Exceeded            |
| --------------------- | --------- | ----------------------------- |
| Container Start Time  | <30s      | Check logs for startup errors |
| Health Response Time  | <100ms    | Check health server, network  |
| Memory Usage (Idle)   | 200-300MB | Check for memory leaks        |
| Memory Usage (Active) | 300-500MB | Normal under load             |
| CPU Usage (Idle)      | 1-5%      | Normal background tasks       |
| CPU Usage (Active)    | 10-30%    | Normal under load             |
| Discord API Latency   | <200ms    | Check network, Discord status |

**Troubleshooting Performance:**

```bash
# Check CPU usage by process
docker exec sunny-stack-bot top -bn1

# Check memory breakdown
docker exec sunny-stack-bot cat /proc/meminfo

# Check open file descriptors
docker exec sunny-stack-bot ls -la /proc/self/fd | wc -l

# Check network connections
docker exec sunny-stack-bot netstat -an | grep ESTABLISHED
```

---

## Next.js Deployment (Vercel)

The Next.js frontend is deployed to Vercel for serverless hosting with automatic scaling.

**Deployment Process:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod

# Or push to main branch (automatic deployment via Vercel GitHub integration)
git push origin main
```

**Vercel Configuration:**

File: `vercel.json` (if needed for custom configuration)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

**Environment Variables (Vercel Dashboard):**

Required variables (26 total):

1. Navigate to: Project Settings > Environment Variables
2. Add variables for Production, Preview, and Development
3. Variables needed:
   - Database URLs (5)
   - Next.js auth (3)
   - Admin dashboard (3)
   - Google OAuth (5)
   - Google Service Account (2)
   - Resend (1)
   - GitHub webhooks (2)
   - Discord channels (13)

**Deployment Triggers:**

- **Automatic**: Push to `main` branch
- **Preview**: Pull request opened/updated
- **Manual**: Via Vercel CLI or dashboard

**Vercel Deployment Logs:**

View at: https://vercel.com/your-username/sunny-stack/deployments

**Vercel Edge Functions:**

Next.js App Router uses Edge Runtime for optimal performance:

- Fast cold starts (<50ms)
- Global edge network
- Automatic scaling
- Zero configuration

**Post-Deployment Verification:**

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Test production endpoint
curl https://sunny-stack.com/api/health
```

---

## Discord Bot Deployment (Raspberry Pi)

The Discord bot runs on Raspberry Pi 4B in a Docker container for cost-effective, self-hosted operation.

**Quick Start:**

```bash
# 1. Set up Raspberry Pi
curl -fsSL https://raw.githubusercontent.com/yourusername/sunny-stack/main/scripts/pi-setup.sh | bash

# 2. Sync environment variables
./scripts/sync-env-to-pi.sh raspberrypi.local pi

# 3. Deploy (automatic via CI/CD or manual)
ssh pi@raspberrypi.local
cd ~/sunny-stack-bot
docker-compose -f docker-compose.prod.yml up -d
```

**Deployment Architecture:**

```
GitHub Actions (CI/CD)
    ↓
Build ARM64 Docker Image
    ↓
Push to ghcr.io
    ↓
SSH to Raspberry Pi
    ↓
Pull Latest Image
    ↓
Restart Container
    ↓
Health Check
    ↓
Discord Notification
```

**Raspberry Pi Requirements:**

- **Model**: Raspberry Pi 4B
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 32GB+ microSD (Class 10+)
- **OS**: Raspberry Pi OS Lite (64-bit)
- **Network**: Ethernet preferred (WiFi acceptable)
- **Power**: Official 15W USB-C adapter

**Initial Setup Steps:**

1. **Flash Raspberry Pi OS**

   ```bash
   # Use Raspberry Pi Imager
   # Enable SSH and WiFi during flash
   # Username: pi
   # Hostname: raspberrypi.local
   ```

2. **Run Automated Setup**

   ```bash
   ssh pi@raspberrypi.local
   curl -fsSL https://raw.githubusercontent.com/yourusername/sunny-stack/main/scripts/pi-setup.sh | bash
   ```

3. **Configure Environment**

   ```bash
   # From development machine
   ./scripts/sync-env-to-pi.sh raspberrypi.local pi
   ```

4. **Start Bot**
   ```bash
   # Automatic via CI/CD on next push to main
   # Or manual:
   ssh pi@raspberrypi.local
   cd ~/sunny-stack-bot
   docker-compose -f docker-compose.prod.yml up -d
   ```

**Maintenance:**

```bash
# View logs
ssh pi@raspberrypi.local "docker logs sunny-stack-bot -f"

# Restart bot
ssh pi@raspberrypi.local "cd ~/sunny-stack-bot && docker-compose -f docker-compose.prod.yml restart"

# Update bot (pull latest)
ssh pi@raspberrypi.local "cd ~/sunny-stack-bot && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"

# Check health
curl http://raspberrypi.local:8080/health

# Check resources
ssh pi@raspberrypi.local "docker stats sunny-stack-bot --no-stream"
```

**Troubleshooting:**

See comprehensive troubleshooting guide: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

Common issues:

- Bot not connecting: Check DISCORD_BOT_TOKEN
- Health check failing: Check logs with `docker logs sunny-stack-bot`
- High memory usage: Restart container
- Disk space full: Clean old images with `docker system prune`

---

## Environment Validation

Use the validation scripts to check your environment configuration:

```bash
# Validate Pi environment
npm run validate:env:pi

# Validate Vercel environment
npm run validate:env:vercel

# Validate all environment variables
npm run validate:env
```

**Example Output (Success):**

```
============================================================
Environment Variable Validation
Mode: PI
============================================================

⚠️  WARNINGS:

⚠️  GITHUB_WEBHOOK_SECRET is not set (optional)
   GitHub webhook secret (20+ characters)

============================================================
✅ All validations passed!
   (1 warning(s) - optional variables not set)
============================================================
```

**Example Output (Failure):**

```
============================================================
Environment Variable Validation
Mode: PI
============================================================

❌ ERRORS:

❌ DISCORD_BOT_TOKEN is required but not set
   Discord bot token (from Developer Portal)

❌ DATABASE_URL has invalid format
   Neon Postgres connection URL

============================================================
❌ Found 2 error(s)
============================================================
```

For details, see: [scripts/validate-env.ts](./scripts/validate-env.ts)

---

## Build Process

The Docker build process creates an optimized, production-ready ARM64 image for Raspberry Pi deployment. This section covers build architecture, optimization techniques, and troubleshooting.

### Multi-Stage Docker Build

The Dockerfile uses a **3-stage build** to minimize final image size while maintaining build efficiency:

**Stage 1: deps (Dependency Installation)**

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY bot/package*.json ./
RUN npm ci --only=production
```

- **Base Image**: `node:18-alpine` (~120MB vs ~900MB for standard Node image)
- **Purpose**: Install only production dependencies
- **Dependencies**: 4 packages (discord.js, @prisma/client, dotenv, winston)
- **Command**: `npm ci --only=production` (faster, deterministic installs)
- **Layer Caching**: Package files copied separately to maximize cache hits

**Stage 2: builder (TypeScript Compilation)**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
RUN npm install -g typescript
COPY bot/ ./bot/
COPY lib/ ./lib/
COPY tsconfig.json ./
RUN npm run build:bot
```

- **Purpose**: Compile TypeScript to JavaScript
- **Global TypeScript**: Installed globally to avoid bloating node_modules
- **Source Files**: Only bot/, lib/, and tsconfig.json copied
- **Output**: Compiled JavaScript in bot/dist/
- **Size Optimization**: Dev dependencies not included in final image

**Stage 3: runner (Production Runtime)**

```dockerfile
FROM node:18-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 botgroup && \
    adduser --system --uid 1001 --ingroup botgroup botuser

# Copy production files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/bot/dist ./bot/dist
COPY bot/package.json ./bot/

# Set permissions
RUN chown -R botuser:botgroup /app

# Switch to non-root user
USER botuser

# Expose health check port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', ...)"

# Use dumb-init to handle signals
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "bot/dist/index.js"]
```

- **Base**: Fresh node:18-alpine (no build artifacts)
- **dumb-init**: Proper signal handling for graceful shutdown
- **Non-root User**: Security best practice (botuser:1001)
- **Minimal Files**: Only production dependencies and compiled code
- **Health Check**: Built into image for Docker monitoring
- **Size**: ~380MB (vs ~1.2GB without multi-stage build)

### Build Optimization Techniques

**1. Layer Caching**

Docker caches each layer independently. Optimize by ordering from least to most frequently changed:

```dockerfile
# Rarely changes - cached most often
COPY package*.json ./           # Dependencies
RUN npm ci

# Sometimes changes - cached occasionally
COPY tsconfig.json ./           # Build config

# Changes frequently - cached rarely
COPY bot/ ./bot/                # Source code
RUN npm run build
```

**Benefits:**

- Rebuild time: 10 minutes (clean) → 2 minutes (cached dependencies)
- CI/CD efficiency: GitHub Actions caches layers between builds
- Local development: Faster iteration

**2. .dockerignore Configuration**

Exclude unnecessary files from build context:

```dockerignore
# Next.js files (not needed for bot)
.next/
app/
components/
public/
styles/

# Tests
__tests__/
e2e/
*.test.ts
*.spec.ts

# Documentation
*.md
docs/

# Development files
.git/
.vscode/
node_modules/
.env*

# Build artifacts
dist/
build/
```

**Benefits:**

- Build context size: 500MB → 50MB (10x reduction)
- Upload time to Docker daemon: 30s → 3s
- Network transfer: Faster image push/pull

**3. ARM64 Cross-Compilation**

GitHub Actions builds ARM64 images on AMD64 runners using Docker Buildx:

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
  with:
    platforms: linux/arm64

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: linux/arm64
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Benefits:**

- Build on fast AMD64 runners (faster than native Pi builds)
- GitHub Actions cache integration (significant speedup)
- Automated cross-compilation (no manual setup)

**Build Time Comparison:**

- Native build on Pi 4B: ~25 minutes
- Cross-compile on GitHub Actions: ~8 minutes (cached: ~3 minutes)

**4. Alpine Linux Base**

Using `node:18-alpine` instead of `node:18`:

```dockerfile
# Before: node:18 (Debian-based)
# Size: ~900MB
# Package manager: apt

# After: node:18-alpine (Alpine Linux)
# Size: ~120MB
# Package manager: apk
```

**Benefits:**

- Image size: 900MB → 380MB (58% reduction)
- Attack surface: Fewer packages = fewer vulnerabilities
- Download time: 5 minutes → 2 minutes (on Pi)

**5. Build Time Optimization**

Strategies to minimize build time:

**Use npm ci instead of npm install:**

```bash
# npm install: ~90 seconds
npm install

# npm ci: ~30 seconds (3x faster)
npm ci --only=production
```

**Clean APK cache:**

```dockerfile
RUN apk add --no-cache dumb-init
# --no-cache: Don't write to cache directory
# Saves: ~50MB
```

**Minimize RUN commands:**

```dockerfile
# Before: 3 layers
RUN apk update
RUN apk add dumb-init
RUN apk cache clean

# After: 1 layer
RUN apk add --no-cache dumb-init
# Saves: 2 layers, ~10MB
```

### Image Size Reduction Techniques

**Target: <500MB** (Currently achieving ~380MB)

**Breakdown of Image Size:**

| Component               | Size       | Optimization                 |
| ----------------------- | ---------- | ---------------------------- |
| Alpine Linux base       | 120MB      | Use Alpine (not Debian)      |
| Node.js runtime         | 50MB       | Included in Alpine image     |
| Production dependencies | 180MB      | Only install production deps |
| Compiled code           | 10MB       | TypeScript → JS compilation  |
| Prisma client           | 20MB       | Generated, cannot reduce     |
| **Total**               | **~380MB** | **24% under target**         |

**Techniques Applied:**

1. **Multi-stage build**: Exclude dev dependencies and build tools
2. **Alpine base**: 120MB vs 900MB Debian image
3. **Production-only deps**: `npm ci --only=production`
4. **No cache directories**: `--no-cache` flags
5. **Minimal file copying**: Only necessary files in final stage
6. **APK cleanup**: No package manager cache

**Techniques NOT Applied (Future):**

- **UPX compression**: Compress Node binary (risky, can cause issues)
- **Strip symbols**: Remove debug symbols from binaries
- **Custom Node build**: Build minimal Node.js from source

### Build Commands

**Local Build (Testing):**

```bash
# Build for current platform (AMD64 on dev machine)
docker build -t sunny-stack-bot:local .

# Build for ARM64 (requires buildx)
docker buildx build --platform linux/arm64 -t sunny-stack-bot:arm64 .

# Build with no cache (clean build)
docker build --no-cache -t sunny-stack-bot:clean .

# Build with build arguments
docker build --build-arg NODE_ENV=production -t sunny-stack-bot:prod .
```

**CI/CD Build (Automated):**

GitHub Actions automatically builds on:

- Push to `main` branch (with bot/\*\* changes)
- Manual workflow dispatch

```yaml
# Triggered automatically
git push origin main
# Or manually via GitHub UI:
# Actions > "Build and Deploy Bot" > Run workflow
```

### Build Verification

**After Build:**

```bash
# Check image size
docker images sunny-stack-bot

# Inspect image layers
docker history sunny-stack-bot:latest

# Verify architecture
docker inspect sunny-stack-bot:latest | jq '.[0].Architecture'

# Test run locally
docker run --rm -e PORT=8080 sunny-stack-bot:latest

# Check for vulnerabilities
docker scan sunny-stack-bot:latest
```

**Expected Output:**

```
REPOSITORY          TAG       SIZE
sunny-stack-bot     latest    380MB    # ✅ Under 500MB target

Architecture: arm64              # ✅ Correct platform
Vulnerabilities: 0 critical      # ✅ Secure image
```

### Troubleshooting Build Issues

**Common Build Errors:**

1. **"npm ERR! code ENOENT"**
   - **Cause**: Missing package.json
   - **Solution**: Verify COPY commands in Dockerfile

2. **"TypeScript compiler not found"**
   - **Cause**: TypeScript not installed in builder stage
   - **Solution**: Run `npm install -g typescript` in builder

3. **"Cannot find module 'discord.js'"**
   - **Cause**: Dependencies not copied from deps stage
   - **Solution**: Verify `COPY --from=deps` command

4. **Build exceeds 500MB**
   - **Cause**: Including unnecessary files
   - **Solution**: Review .dockerignore, verify multi-stage build

5. **ARM64 build fails on AMD64**
   - **Cause**: Buildx not configured
   - **Solution**: Run `docker buildx create --use`

For more build troubleshooting, see: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#docker-build-failures)

---

## Docker Deployment

Docker deployment on Raspberry Pi uses Docker Compose for orchestration, environment management, and service configuration. This section covers production deployment configuration and best practices.

### docker-compose.prod.yml Configuration

The production Docker Compose file defines the bot service configuration for Raspberry Pi deployment:

**File Location:** `docker-compose.prod.yml`

```yaml
version: "3.8"

services:
  discord-bot:
    image: ghcr.io/USERNAME/sunny-stack/discord-bot:latest
    container_name: sunny-stack-bot
    restart: unless-stopped

    # Environment configuration
    env_file:
      - .env.production

    environment:
      - NODE_ENV=production
      - PORT=8080
      - DEPLOYMENT_MODE=pi

    # Port mapping
    ports:
      - "8080:8080" # Health check endpoint

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1.5G
        reservations:
          cpus: "0.5"
          memory: 512M

    # Health check
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

    # Logging configuration
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
        tag: "{{.Name}}"
```

### Container Configuration Best Practices

**1. Restart Policy**

```yaml
restart: unless-stopped
```

**Options:**

- `no`: Never restart (not recommended for production)
- `always`: Always restart, even after reboot
- `unless-stopped`: Restart unless manually stopped (RECOMMENDED)
- `on-failure`: Restart only on error exit codes

**Why unless-stopped?**

- Automatic recovery from crashes
- Survives system reboots
- Respects manual stops (for maintenance)
- Prevents restart loops during debugging

**2. Environment Files**

```yaml
env_file:
  - .env.production
```

**Best Practices:**

- Separate file for production variables
- Never commit .env files to git
- Validate before deployment: `npm run validate:env:pi`
- Sync from development: `./scripts/sync-env-to-pi.sh`

**Example .env.production:**

```bash
# Discord Bot
DISCORD_BOT_TOKEN=your-production-token
DISCORD_APPLICATION_ID=1234567890123456789
DISCORD_GUILD_ID=your-guild-id

# Database (Neon)
DATABASE_URL=postgresql://user:pass@host/db

# Bot API
BOT_API_URL=https://sunny-stack.com/api
BOT_API_KEY=your-production-key

# Deployment
DEPLOYMENT_MODE=pi
NODE_ENV=production
PORT=8080
```

**3. Port Mapping**

```yaml
ports:
  - "8080:8080"
```

**Format:** `HOST:CONTAINER`

- **8080 (host)**: Accessible on Pi at `http://raspberrypi.local:8080`
- **8080 (container)**: Health check server inside container
- **Access**: External monitoring, deployment verification
- **Security**: Only expose necessary ports

**Why expose 8080?**

- Health check endpoint for monitoring
- Deployment verification
- External uptime monitoring (optional)

**4. Logging Configuration**

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "50m"
    max-file: "5"
```

**Log Rotation Settings:**

- **max-size**: 50MB per log file
- **max-file**: Keep 5 files (250MB total)
- **Total retention**: ~7 days at normal activity
- **Format**: JSON (parseable by log aggregators)

**Why rotate logs?**

- Prevent disk overflow on 32GB SD card
- Maintain performance (large logs slow down `docker logs`)
- Automatic cleanup (no manual intervention)

**View Logs:**

```bash
# All logs
docker logs sunny-stack-bot

# Last 100 lines
docker logs sunny-stack-bot --tail 100

# Follow in real-time
docker logs sunny-stack-bot -f

# Since timestamp
docker logs sunny-stack-bot --since 2024-01-01T00:00:00
```

### Resource Limits for Raspberry Pi 4B

Resource limits prevent the bot from consuming all system resources, ensuring system stability.

**Pi 4B Specifications:**

- **CPU**: 4 cores @ 1.5GHz (ARM Cortex-A72)
- **RAM**: 4GB or 8GB
- **Architecture**: ARM64 (aarch64)

**Recommended Resource Limits (4GB Pi):**

```yaml
deploy:
  resources:
    limits:
      cpus: "2.0" # Max 2 CPU cores
      memory: 1.5G # Max 1.5GB RAM
    reservations:
      cpus: "0.5" # Guaranteed 0.5 cores
      memory: 512M # Guaranteed 512MB RAM
```

**Recommended Resource Limits (8GB Pi):**

```yaml
deploy:
  resources:
    limits:
      cpus: "2.0" # Max 2 CPU cores
      memory: 2.0G # Max 2GB RAM
    reservations:
      cpus: "0.5" # Guaranteed 0.5 cores
      memory: 512M # Guaranteed 512MB RAM
```

**Resource Allocation Strategy:**

| Resource | Limit     | Reservation | Why                                                                |
| -------- | --------- | ----------- | ------------------------------------------------------------------ |
| CPU      | 2.0 cores | 0.5 cores   | Bot needs bursts for command processing, but idle most of the time |
| Memory   | 1.5GB     | 512MB       | Discord.js + Prisma require ~500MB base, allow headroom for spikes |

**Monitoring Resource Usage:**

```bash
# Real-time stats
docker stats sunny-stack-bot

# One-time snapshot
docker stats sunny-stack-bot --no-stream

# Custom format
docker stats sunny-stack-bot --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

**Expected Usage (Normal Operation):**

- **CPU**: 1-5% idle, 10-30% during command processing
- **Memory**: 400-600MB steady state
- **Network**: Minimal (WebSocket + API calls)

**Warnings:**

- **CPU >50% sustained**: Investigate performance issues
- **Memory >1GB sustained**: Possible memory leak
- **Memory >1.4GB**: Approaching limit, restart soon
- **OOMKilled**: Increase memory limit or fix leak

### Health Check Setup and Monitoring

Docker Compose integrates health checks for automatic container monitoring and recovery.

**Health Check Configuration:**

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get(...)"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 15s
```

**Parameters:**

- **interval**: Check every 30 seconds
- **timeout**: Fail if check takes >10 seconds
- **retries**: Mark unhealthy after 3 consecutive failures
- **start_period**: Grace period on startup (15 seconds)

**Health Check States:**

| State       | Meaning                              | Action             |
| ----------- | ------------------------------------ | ------------------ |
| `starting`  | Within start_period, not yet checked | Wait               |
| `healthy`   | Check passed                         | None               |
| `unhealthy` | Failed 3+ consecutive checks         | Alert, investigate |

**Check Container Health:**

```bash
# Check health status
docker ps

# Expected output:
# STATUS: Up 5 minutes (healthy)

# Detailed health info
docker inspect sunny-stack-bot | jq '.[0].State.Health'
```

**Health Check Endpoint:**

```bash
# From Pi
curl http://localhost:8080/health

# From network
curl http://raspberrypi.local:8080/health

# Expected response:
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2025-01-03T12:00:00.000Z",
  "version": "1.0.0"
}
```

**Automatic Actions on Unhealthy:**

Docker Compose does NOT automatically restart on unhealthy status (by design).

**Options:**

1. **Monitor + Manual Intervention** (Current approach)
   - Check logs: `docker logs sunny-stack-bot`
   - Restart if needed: `docker-compose restart discord-bot`

2. **Systemd Auto-Restart** (Recommended for production)
   - See: [RASPBERRY-PI-SETUP.md](./RASPBERRY-PI-SETUP.md#deployment-preparation)
   - Systemd monitors Docker Compose service
   - Auto-restarts on failure

3. **External Monitoring** (Optional)
   - UptimeRobot, Pingdom, etc.
   - Monitor `http://PUBLIC_IP:8080/health`
   - Alert on downtime

### Log Management and Rotation

Proper log management prevents disk overflow and maintains performance.

**Docker Logging Driver:**

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "50m"
    max-file: "5"
    tag: "{{.Name}}"
```

**Log Files Location:**

```bash
# Docker stores logs at:
/var/lib/docker/containers/<container-id>/<container-id>-json.log

# Rotated logs:
/var/lib/docker/containers/<container-id>/<container-id>-json.log.1
/var/lib/docker/containers/<container-id>/<container-id>-json.log.2
...
```

**Log Rotation Behavior:**

- **Trigger**: When log file reaches 50MB
- **Action**: Rename current log to .log.1, compress old logs
- **Cleanup**: Delete logs beyond max-file (5)
- **Total Disk**: Max 250MB (50MB × 5 files)

**Manual Log Management:**

```bash
# View log file sizes
docker inspect sunny-stack-bot | jq '.[0].LogPath' | xargs ls -lh

# Clear logs (keep container running)
truncate -s 0 $(docker inspect sunny-stack-bot | jq -r '.[0].LogPath')

# Or restart container (clears logs)
docker-compose restart discord-bot
```

**Application-Level Logging:**

The bot uses Winston for structured logging:

```typescript
// bot/index.ts
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
```

**Log Levels:**

- `error`: Errors and crashes
- `warn`: Warnings and degraded states
- `info`: General information, startup, shutdown
- `debug`: Detailed debugging (disable in production)

**Best Practices:**

- Set `LOG_LEVEL=info` in production
- Use `LOG_LEVEL=debug` for troubleshooting
- Never log sensitive data (tokens, passwords)
- Include context in log messages

### Deployment Commands

**Start Bot:**

```bash
# Start in background
docker-compose -f docker-compose.prod.yml up -d

# Start with logs
docker-compose -f docker-compose.prod.yml up
```

**Stop Bot:**

```bash
# Graceful stop (30s timeout, then kill)
docker-compose -f docker-compose.prod.yml down

# Force stop immediately
docker-compose -f docker-compose.prod.yml kill
```

**Restart Bot:**

```bash
# Restart without recreating container
docker-compose -f docker-compose.prod.yml restart

# Recreate container (pull new image)
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

**Update Bot:**

```bash
# Pull latest image
docker-compose -f docker-compose.prod.yml pull

# Restart with new image
docker-compose -f docker-compose.prod.yml up -d

# Clean old images
docker image prune -af --filter "until=168h"  # Keep 7 days
```

**Verify Deployment:**

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check health
curl http://localhost:8080/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

For troubleshooting Docker deployment issues, see: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#docker-issues)

---

## Health Checks

Health checks ensure the Discord bot is running correctly and responding to requests. Multiple health check layers provide comprehensive monitoring from container level to application level.

### Health Endpoint Specification

**Endpoint:** `GET /health`
**Port:** 8080
**Protocol:** HTTP
**Location:** Bot health server (`bot/health-server.ts`)

**Request:**

```bash
GET http://localhost:8080/health
```

**Response (Healthy):**

```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2025-01-03T12:00:00.000Z",
  "version": "1.0.0"
}
```

**HTTP Status Codes:**

- **200 OK**: Service is healthy
- **503 Service Unavailable**: Service is unhealthy (not yet implemented, returns 200 or no response)

**Response Fields:**

- `status`: Always "healthy" (future: could be "degraded" or "unhealthy")
- `uptime`: Seconds since bot started
- `timestamp`: Current time in ISO 8601 format
- `version`: Bot version from package.json

### Health Check Layers

The deployment uses multiple health check layers for comprehensive monitoring:

**Layer 1: Docker HEALTHCHECK (Container Level)**

Defined in Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"
```

**Configuration:**

- **Interval**: Check every 30 seconds
- **Timeout**: Fail if check takes >10 seconds
- **Start Period**: 5-second grace period after container start
- **Retries**: Mark unhealthy after 3 consecutive failures

**Purpose:**

- Docker monitors container health automatically
- Provides health status in `docker ps` output
- Can trigger alerts or automated remediation
- Independent of orchestration layer

**Check Status:**

```bash
docker ps
# Look for "(healthy)" or "(unhealthy)" in STATUS column

docker inspect sunny-stack-bot | jq '.[0].State.Health.Status'
# Output: "healthy" or "unhealthy"
```

**Layer 2: Docker Compose Healthcheck (Orchestration Level)**

Defined in docker-compose.prod.yml:

```yaml
healthcheck:
  test:
    [
      "CMD",
      "node",
      "-e",
      "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });",
    ]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 15s
```

**Differences from Dockerfile HEALTHCHECK:**

- **Start Period**: 15 seconds (vs 5s) - allows for slower startup
- **Overrides**: Docker Compose healthcheck overrides Dockerfile healthcheck
- **Service Dependencies**: Can block dependent services from starting

**Purpose:**

- Orchestration-level health monitoring
- Can prevent deployment of unhealthy services
- Integrates with service dependencies

**Layer 3: Application-Level Health Check (Bot Level)**

Implemented in `bot/health-server.ts`:

```typescript
import http from "http";

const server = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: require("../package.json").version,
      }),
    );
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Health server listening on port ${PORT}`);
});
```

**Purpose:**

- Provides detailed health information
- Can include custom health metrics
- Allows external monitoring tools to check health
- Independent HTTP server (doesn't rely on Discord connection)

**Future Enhancements:**

- Check Discord WebSocket connection status
- Check database connectivity
- Include memory/CPU usage metrics
- Return 503 if unhealthy (currently always returns 200)

**Layer 4: Deployment Verification (CI/CD Level)**

GitHub Actions deployment workflow includes health verification:

```yaml
- name: Verify deployment
  run: |
    for i in {1..10}; do
      if curl -sf http://localhost:8080/health; then
        echo "Health check passed"
        exit 0
      fi
      echo "Attempt $i failed, retrying in 5s..."
      sleep 5
    done
    echo "Health check failed after 10 retries"
    exit 1
```

**Configuration:**

- **Retries**: 10 attempts
- **Interval**: 5 seconds between attempts
- **Total Time**: Up to 50 seconds
- **Action on Failure**: Trigger automatic rollback

**Purpose:**

- Verify deployment succeeded before completing
- Prevent deploying broken versions
- Trigger automatic rollback on failure

### Troubleshooting Unhealthy Containers

**Symptom: Container marked as "unhealthy"**

```bash
docker ps
# STATUS: Up 5 minutes (unhealthy)
```

**Diagnosis Steps:**

**Step 1: Check health check logs**

```bash
# View health check output
docker inspect sunny-stack-bot | jq '.[0].State.Health'

# Example output:
{
  "Status": "unhealthy",
  "FailingStreak": 5,
  "Log": [
    {
      "Start": "2025-01-03T12:00:00.000Z",
      "End": "2025-01-03T12:00:10.000Z",
      "ExitCode": 1,
      "Output": "Error: connect ECONNREFUSED 127.0.0.1:8080"
    }
  ]
}
```

**Step 2: Check if health server is running**

```bash
# Try to access health endpoint
docker exec sunny-stack-bot curl http://localhost:8080/health

# If this fails, health server isn't responding
```

**Step 3: Check container logs**

```bash
# Look for health server startup message
docker logs sunny-stack-bot | grep "Health server"

# Expected: "Health server listening on port 8080"
# If missing, health server didn't start
```

**Step 4: Check port binding**

```bash
# Verify port 8080 is exposed and bound
docker port sunny-stack-bot

# Expected output:
# 8080/tcp -> 0.0.0.0:8080

# Check if something else is using port 8080
docker exec sunny-stack-bot netstat -tuln | grep 8080
```

**Common Causes and Solutions:**

| Cause                      | Symptom                              | Solution                                        |
| -------------------------- | ------------------------------------ | ----------------------------------------------- |
| Health server not starting | No "Health server listening" in logs | Check bot/health-server.ts, verify PORT env var |
| Port 8080 in use           | "EADDRINUSE" error                   | Stop conflicting service or change port         |
| Bot crashed                | Container exits immediately          | Check logs for errors, fix bot code             |
| Network issue              | "ECONNREFUSED" in health check       | Verify network configuration, restart container |
| Slow startup               | Unhealthy for <15s, then healthy     | Increase start_period in healthcheck            |
| Resource exhaustion        | High CPU/memory before unhealthy     | Check resources: `docker stats sunny-stack-bot` |

**Recovery Actions:**

**1. Restart container (quick fix)**

```bash
docker-compose -f docker-compose.prod.yml restart
```

**2. Recreate container (if restart fails)**

```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

**3. Check logs after restart**

```bash
docker logs sunny-stack-bot -f
# Wait for "Health server listening on port 8080"
# Wait for "(healthy)" status in docker ps
```

**4. Verify health manually**

```bash
curl http://localhost:8080/health
# Should return: {"status":"healthy",...}

docker ps
# STATUS should show: Up X minutes (healthy)
```

### Health Check Metrics and Monitoring Integration

**Current Metrics:**

The health endpoint provides basic metrics:

```json
{
  "status": "healthy",
  "uptime": 3600, // seconds since start
  "timestamp": "2025-01-03T12:00:00.000Z",
  "version": "1.0.0"
}
```

**Future Metrics (Not Yet Implemented):**

```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2025-01-03T12:00:00.000Z",
  "version": "1.0.0",
  "discord": {
    "connected": true,
    "latency": 45, // Discord API latency (ms)
    "guilds": 1
  },
  "database": {
    "connected": true,
    "latency": 12 // Database query latency (ms)
  },
  "memory": {
    "used": 512000000, // bytes
    "percent": 51.2
  },
  "commands": {
    "processed": 1234, // total commands since start
    "errors": 5
  }
}
```

**External Monitoring Integration:**

**Option 1: UptimeRobot (Free Tier)**

```
URL to monitor: http://YOUR_PUBLIC_IP:8080/health
Interval: 5 minutes
Expected status: 200 OK
Alert: Email/SMS on downtime
```

**Option 2: Pingdom**

Similar to UptimeRobot, supports custom headers and response validation.

**Option 3: Prometheus + Grafana (Advanced)**

Future enhancement: Expose metrics at `/metrics` endpoint:

```
# HELP discord_bot_uptime_seconds Bot uptime in seconds
# TYPE discord_bot_uptime_seconds gauge
discord_bot_uptime_seconds 3600

# HELP discord_bot_commands_total Total commands processed
# TYPE discord_bot_commands_total counter
discord_bot_commands_total 1234
```

**Option 4: Custom Monitoring Script**

Simple cron job on development machine:

```bash
#!/bin/bash
# check-bot-health.sh

HEALTH_URL="http://raspberrypi.local:8080/health"
DISCORD_WEBHOOK="https://discord.com/api/webhooks/..."

if ! curl -sf "$HEALTH_URL" > /dev/null; then
  curl -X POST "$DISCORD_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d '{"content":"🚨 Bot health check failed!"}'
fi
```

Run every 5 minutes:

```cron
*/5 * * * * /path/to/check-bot-health.sh
```

### Common Health Check Failures and Solutions

**1. "Connection refused" (ECONNREFUSED)**

**Cause:** Health server not running or not listening on port 8080

**Diagnosis:**

```bash
docker exec sunny-stack-bot netstat -tuln | grep 8080
# No output = server not listening
```

**Solution:**

```bash
# Check if bot started successfully
docker logs sunny-stack-bot

# Look for errors preventing health server from starting
# Fix code and restart container
```

**2. "Timeout" (ETIMEDOUT)**

**Cause:** Health server responding too slowly (>10 seconds)

**Diagnosis:**

```bash
# Test health endpoint manually
time curl http://localhost:8080/health

# If >10s, something is blocking the health server
```

**Solution:**

```bash
# Check for high CPU/memory usage
docker stats sunny-stack-bot --no-stream

# If resources are normal, check for bugs in health server code
# Increase timeout in healthcheck (last resort)
```

**3. "Unhealthy" immediately after start**

**Cause:** Start period too short for bot initialization

**Diagnosis:**

```bash
# Check how long bot takes to start
docker logs sunny-stack-bot -f
# Time from container start to "Health server listening"
```

**Solution:**

```yaml
# Increase start_period in docker-compose.prod.yml
healthcheck:
  start_period: 30s # Was 15s
```

**4. "Healthy" but bot not working**

**Cause:** Health server running but Discord bot crashed

**Diagnosis:**

```bash
# Health check passes
curl http://localhost:8080/health
# {"status":"healthy",...}

# But bot not responding in Discord
# Check logs
docker logs sunny-stack-bot | grep -i error
```

**Solution:**

This indicates the health check isn't comprehensive enough. Future enhancement: Include Discord connection status in health check.

**5. Intermittent unhealthy status**

**Cause:** Network glitches, resource spikes, or race conditions

**Diagnosis:**

```bash
# Monitor health status over time
watch -n 5 'docker inspect sunny-stack-bot | jq ".[0].State.Health.Status"'

# Monitor resources
docker stats sunny-stack-bot
```

**Solution:**

```bash
# If caused by resource spikes, increase limits
# If caused by network glitches, increase retries
# If caused by slow operations, increase interval
```

For more health check troubleshooting, see: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#health-check-failures)

---

## Monitoring

Comprehensive monitoring ensures the Discord bot remains healthy, performs optimally, and allows for early detection of issues. This section covers monitoring layers, metrics collection, log aggregation, alerts, and dashboards.

### Monitoring Layers

The deployment uses a **three-tier monitoring approach**:

**Layer 1: Infrastructure Monitoring**

Monitors the Raspberry Pi hardware and operating system:

- **CPU Usage**: Core utilization, load average
- **Memory Usage**: RAM utilization, swap usage
- **Disk Usage**: SD card space, I/O operations
- **Network**: Bandwidth usage, connection status
- **Temperature**: CPU temperature (important for Pi)

**Tools:**

- `top` / `htop`: Real-time process monitoring
- `df -h`: Disk space
- `free -h`: Memory usage
- `vcgencmd measure_temp`: CPU temperature (Pi-specific)

**Layer 2: Container Monitoring**

Monitors the Docker container running the bot:

- **Container Status**: Running, stopped, restarting
- **Health Status**: Healthy, unhealthy, starting
- **Resource Usage**: CPU, memory allocated to container
- **Logs**: Application logs from container
- **Restart Count**: Number of container restarts

**Tools:**

- `docker ps`: Container status
- `docker stats`: Resource usage
- `docker logs`: Application logs
- `docker inspect`: Detailed container information

**Layer 3: Application Monitoring**

Monitors the Discord bot application itself:

- **Bot Status**: Online, offline, idle
- **Commands Processed**: Success and failure counts
- **Discord API Latency**: WebSocket ping to Discord
- **Database Connectivity**: Connection pool status
- **Error Rate**: Application errors and exceptions
- **Uptime**: Bot uptime since last restart

**Tools:**

- Health endpoint: `/health`
- Application logs (Winston)
- Discord Gateway status
- Future: Metrics endpoint `/metrics`

### Metrics Collection

**Current Metrics (Available Now):**

**1. System Metrics (Pi Level)**

```bash
# CPU usage
top -bn1 | grep "Cpu(s)"

# Memory usage
free -h

# Disk usage
df -h

# Temperature
vcgencmd measure_temp
```

**Example Output:**

```
%Cpu(s):  5.2 us,  2.1 sy,  0.0 ni, 92.3 id
Mem:           3.7Gi       1.5Gi       1.2Gi
/dev/root        29G        12G        16G   43%
temp=45.2'C
```

**2. Container Metrics (Docker Level)**

```bash
# Real-time stats
docker stats sunny-stack-bot --no-stream

# Custom format
docker stats sunny-stack-bot --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"
```

**Example Output:**

```
NAME              CPU %     MEM USAGE / LIMIT     MEM %     NET I/O
sunny-stack-bot   3.21%     512MiB / 1.5GiB      34.13%    1.2MB / 850kB
```

**3. Application Metrics (Bot Level)**

```bash
# Health endpoint
curl -s http://localhost:8080/health | jq
```

**Example Output:**

```json
{
  "status": "healthy",
  "uptime": 86400,
  "timestamp": "2025-01-03T12:00:00.000Z",
  "version": "1.0.0"
}
```

**Future Metrics (Not Yet Implemented):**

- Commands processed (total, per command)
- Command response time (average, p95, p99)
- Error rate (errors per minute)
- Discord API latency (WebSocket ping)
- Database query latency
- Active connections count
- Memory heap usage

### Log Aggregation Strategies

**Current Logging:**

Docker JSON logs with rotation:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "50m"
    max-file: "5"
```

**View Logs:**

```bash
# All logs
docker logs sunny-stack-bot

# Last 100 lines
docker logs sunny-stack-bot --tail 100

# Follow logs in real-time
docker logs sunny-stack-bot -f

# Since timestamp
docker logs sunny-stack-bot --since 2025-01-01T00:00:00

# Filter by pattern
docker logs sunny-stack-bot 2>&1 | grep ERROR
```

**Log Levels (Winston):**

The bot uses Winston for structured logging:

```typescript
logger.error("Critical error", { error: err }); // Errors and crashes
logger.warn("Degraded state", { reason }); // Warnings
logger.info("Normal operation"); // General info
logger.debug("Detailed debug info"); // Debug (disable in prod)
```

**Production Logging Best Practices:**

```bash
# Set in .env.production
LOG_LEVEL=info  # Don't use debug in production

# Log format
{
  "level": "info",
  "message": "Bot ready",
  "timestamp": "2025-01-03T12:00:00.000Z",
  "service": "discord-bot"
}
```

**Advanced Log Aggregation (Future):**

**Option 1: Loki + Grafana (Lightweight)**

```yaml
# docker-compose.prod.yml
services:
  discord-bot:
    logging:
      driver: loki
      options:
        loki-url: "http://localhost:3100/loki/api/v1/push"
```

**Option 2: ELK Stack (Elasticsearch, Logstash, Kibana)**

Heavy for Raspberry Pi, not recommended unless using external logging service.

**Option 3: Cloud Logging (Papertrail, Loggly)**

Forward logs to cloud service:

```yaml
logging:
  driver: syslog
  options:
    syslog-address: "tcp://logs.papertrailapp.com:12345"
```

**Option 4: Simple File-Based (Current)**

```bash
# Export logs to file for analysis
docker logs sunny-stack-bot > bot-logs-$(date +%Y%m%d).txt

# Compress old logs
gzip bot-logs-*.txt

# Upload to S3/backup (optional)
```

### Alert Configuration for Critical Events

**Current Alerting:**

GitHub Actions deployment workflow sends Discord webhook notifications:

```yaml
- name: Send deployment notification
  if: always()
  run: |
    curl -X POST "$DISCORD_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "content": "Deployment ${{ job.status }}",
        "embeds": [{
          "title": "Bot Deployment",
          "description": "Version ${{ github.sha }}",
          "color": 3066993
        }]
      }'
```

**Recommended Alerts:**

**1. Bot Down**

```bash
# Alert when bot goes offline
# Trigger: Health check fails for >5 minutes
# Action: Discord webhook + email notification
# Severity: CRITICAL
```

**2. High Resource Usage**

```bash
# Alert when resources exceed threshold
# Trigger: CPU >80% for >5 minutes OR Memory >90%
# Action: Discord webhook
# Severity: WARNING
```

**3. Disk Space Low**

```bash
# Alert when disk space running out
# Trigger: Disk usage >85%
# Action: Discord webhook
# Severity: WARNING
```

**4. Container Restarted**

```bash
# Alert when container restarts unexpectedly
# Trigger: Container restart count increases
# Action: Discord webhook with logs
# Severity: WARNING
```

**5. Health Check Failing**

```bash
# Alert when health check fails
# Trigger: Docker marks container unhealthy
# Action: Discord webhook + automatic rollback
# Severity: CRITICAL
```

**Implementation Example (Custom Monitoring Script):**

```bash
#!/bin/bash
# monitor-bot.sh - Run every 5 minutes via cron

WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_HERE"

# Check if bot is healthy
if ! curl -sf http://localhost:8080/health > /dev/null; then
  curl -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{"content":"🚨 **ALERT**: Bot health check failed!"}'
  exit 1
fi

# Check CPU usage
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$CPU > 80" | bc -l) )); then
  curl -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"⚠️ **WARNING**: High CPU usage: ${CPU}%\"}"
fi

# Check memory usage
MEM=$(free | grep Mem | awk '{print ($3/$2) * 100}')
if (( $(echo "$MEM > 90" | bc -l) )); then
  curl -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"⚠️ **WARNING**: High memory usage: ${MEM}%\"}"
fi

# Check disk usage
DISK=$(df -h / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
if [ "$DISK" -gt 85 ]; then
  curl -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"⚠️ **WARNING**: Low disk space: ${DISK}% used\"}"
fi
```

**Install as cron job:**

```bash
# Add to crontab
crontab -e

# Run every 5 minutes
*/5 * * * * /home/pi/scripts/monitor-bot.sh
```

### Dashboard Setup and Visualization

**Current Dashboard:**

Basic monitoring via SSH commands:

```bash
# Dashboard script
#!/bin/bash
# dashboard.sh

clear
echo "================================"
echo "   Sunny Stack Bot Dashboard"
echo "================================"
echo ""

echo "Container Status:"
docker ps | grep sunny-stack-bot

echo ""
echo "Health Check:"
curl -s http://localhost:8080/health | jq

echo ""
echo "Resource Usage:"
docker stats sunny-stack-bot --no-stream

echo ""
echo "System Resources:"
echo "CPU Temp: $(vcgencmd measure_temp)"
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"

echo ""
echo "Recent Logs:"
docker logs sunny-stack-bot --tail 10
```

**Run Dashboard:**

```bash
# One-time view
./dashboard.sh

# Auto-refresh every 5 seconds
watch -n 5 ./dashboard.sh
```

**Advanced Dashboard (Future):**

**Option 1: Grafana (Recommended)**

Lightweight enough for Raspberry Pi 4B:

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

**Metrics Collected:**

- Container metrics (cAdvisor)
- System metrics (Node Exporter)
- Bot metrics (future: /metrics endpoint)

**Option 2: Netdata (Easier Setup)**

All-in-one monitoring solution:

```bash
# Install Netdata on Pi
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access dashboard
http://raspberrypi.local:19999
```

**Features:**

- Real-time system metrics
- Container monitoring
- Low resource usage
- Web-based dashboard

**Option 3: Custom Web Dashboard (Lightweight)**

Simple Node.js + Express dashboard:

```javascript
// dashboard-server.js
const express = require("express");
const { exec } = require("child_process");

const app = express();

app.get("/api/health", (req, res) => {
  exec("curl -s http://localhost:8080/health", (error, stdout) => {
    res.json(JSON.parse(stdout));
  });
});

app.get("/api/stats", (req, res) => {
  exec(
    'docker stats sunny-stack-bot --no-stream --format "{{json .}}"',
    (error, stdout) => {
      res.json(JSON.parse(stdout));
    },
  );
});

app.listen(3000, () => console.log("Dashboard on :3000"));
```

**Performance Monitoring Best Practices:**

**1. Establish Baselines**

Record normal operating metrics:

```
Normal Operation:
- CPU: 1-5% idle, 10-30% active
- Memory: 400-600MB
- Network: <1MB/s
- Disk I/O: <10 MB/s
```

**2. Set Thresholds**

Define when to alert:

```
Warning Thresholds:
- CPU: >50% sustained for >5 minutes
- Memory: >80% of limit (1.2GB / 1.5GB)
- Disk: >85% used
- Network: >10MB/s sustained

Critical Thresholds:
- CPU: >80% sustained for >5 minutes
- Memory: >95% of limit (approaching OOM)
- Disk: >95% used
- Container: Unhealthy for >5 minutes
```

**3. Monitor Trends**

Track metrics over time:

```bash
# Daily stats snapshot
echo "$(date),$(docker stats sunny-stack-bot --no-stream --format '{{.CPUPerc}},{{.MemUsage}}')" >> /home/pi/logs/daily-stats.csv

# Weekly disk usage
df -h / | tail -1 >> /home/pi/logs/weekly-disk.log
```

**4. Regular Reviews**

Schedule regular monitoring reviews:

- **Daily**: Check dashboard for anomalies
- **Weekly**: Review resource trends
- **Monthly**: Analyze logs for patterns
- **Quarterly**: Optimize based on usage patterns

### Monitoring Commands Reference

**Quick Health Check:**

```bash
# One-liner to check if everything is OK
docker ps | grep sunny-stack-bot && curl -sf http://localhost:8080/health && echo "✅ Bot is healthy"
```

**Resource Monitoring:**

```bash
# Container resources
docker stats sunny-stack-bot --no-stream

# System resources
htop

# Disk usage
df -h

# Network usage
ifconfig eth0
```

**Log Monitoring:**

```bash
# Follow logs
docker logs sunny-stack-bot -f

# Error count (last hour)
docker logs sunny-stack-bot --since 1h 2>&1 | grep -c ERROR

# Warning count (last 24 hours)
docker logs sunny-stack-bot --since 24h 2>&1 | grep -c WARN
```

**Historical Data:**

```bash
# Container restart count
docker inspect sunny-stack-bot | jq '.[0].RestartCount'

# Container uptime
docker inspect sunny-stack-bot | jq '.[0].State.StartedAt'

# Image creation date
docker inspect sunny-stack-bot | jq '.[0].Created'
```

For troubleshooting monitoring issues, see: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Troubleshooting

For common issues and solutions, see:

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

Quick links:

- [Docker build failures](./TROUBLESHOOTING.md#docker-build-failures)
- [Health check failures](./TROUBLESHOOTING.md#health-check-failures)
- [Environment variable errors](./TROUBLESHOOTING.md#environment-variable-errors)
- [Network connectivity issues](./TROUBLESHOOTING.md#network-connectivity-issues)

---

## Rollback Procedures

For rollback procedures, see:

- [ROLLBACK.md](./ROLLBACK.md)

Quick links:

- [When to rollback](./ROLLBACK.md#when-to-rollback)
- [Manual rollback](./ROLLBACK.md#manual-rollback-procedure)
- [Automatic rollback](./ROLLBACK.md#automatic-rollback)
- [Verification steps](./ROLLBACK.md#verification-after-rollback)

---

## References

- [Raspberry Pi Setup Guide](./RASPBERRY-PI-SETUP.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Rollback Procedures](./ROLLBACK.md)
- [Environment Variables](./.env.example)
- [ADR-001: Bot Package.json](./trinity/work-orders/ADR-001-bot-package-json.md)
- [ADR-002: Health Server HTTP](./trinity/work-orders/ADR-002-health-server-http.md)
- [ADR-004: Environment Validation](./trinity/work-orders/ADR-004-env-validation.md)

---

**Documentation Status:** 🚧 In Progress
**Phase:** 5.0 Pre-Implementation
**Next Steps:** Complete sections marked with _(Content to be added)_
