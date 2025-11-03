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
  - [Pi Variables (16)](#pi-variables-16)
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

### Pi Variables (16)

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

_(Content to be added)_

### Phase 3: Deployment

_(Content to be added)_

### Phase 4: Health Check

_(Content to be added)_

### Phase 5: Monitoring

_(Content to be added)_

---

## Next.js Deployment (Vercel)

_(Content to be added)_

---

## Discord Bot Deployment (Raspberry Pi)

_(Content to be added)_

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

_(Content to be added)_

---

## Docker Deployment

_(Content to be added)_

---

## Health Checks

_(Content to be added)_

---

## Monitoring

_(Content to be added)_

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
