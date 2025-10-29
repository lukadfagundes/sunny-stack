# Sunny Stack Documentation

Welcome to the Sunny Stack Discord Bot + Admin Platform setup documentation!

---

## Quick Start

Follow these guides in order to set up your environment:

### 1. Discord Setup (20 min) 🚀 START HERE

**Required for:** Getting your bot online
**When:** Phase 0 - Before any coding

1. **[DISCORD-SERVER-SETUP.md](../DISCORD-SERVER-SETUP.md)** - Create your Discord server with 13 channels
2. **[discord-bot-oauth-setup.md](discord-bot-oauth-setup.md)** - Configure bot OAuth and get tokens

**What you'll get:**

- ✅ Discord server with organized channels
- ✅ Bot invited to server
- ✅ `DISCORD_BOT_TOKEN`
- ✅ `DISCORD_APPLICATION_ID`
- ✅ `DISCORD_GUILD_ID`
- ✅ `DISCORD_ADMIN_USER_ID`
- ✅ 3 channel IDs (bot-commands, alerts-critical, monitoring)

---

### 2. Google API Setup (30 min)

**Required for:** Google Workspace integrations (Gmail, Drive, Calendar, etc.)
**When:** Phase 0 - Before any coding

**[google-api-setup.md](google-api-setup.md)** - Set up Google OAuth and enable 8 APIs

**What you'll get:**

- ✅ Google Cloud project created
- ✅ 8 APIs enabled (Gmail, Drive, Calendar, Sheets, Docs, Tasks, People, Analytics)
- ✅ OAuth credentials created
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `GOOGLE_REFRESH_TOKEN`
- ✅ `GOOGLE_PROJECT_ID`

---

### 3. Database Setup (5 min)

**Required for:** Storing data for bot and admin dashboard
**When:** Phase 0 - Can be done in parallel with Discord/Google setup

**Steps:**

1. **Go to Vercel Dashboard** → Your Project → **Storage** tab
2. Click **Integrations**
3. Find and click **"Neon"** (serverless Postgres)
4. Click **"Add Integration"** or **"Connect"**
5. Create/authorize Neon account (sign in with GitHub)
6. Configure database:
   - **Region:** Choose closest to you (e.g., US East, EU West)
   - **Database name:** `neon-sunny-stackdb` or similar
7. Click **Create**
8. In the Neon integration page, click **.env.local** tab
9. Click **"Show secret"** button
10. Copy these 5 connection strings:
    - `DATABASE_URL`
    - `DATABASE_URL_UNPOOLED`
    - `POSTGRES_URL`
    - `POSTGRES_PRISMA_URL`
    - `POSTGRES_URL_NON_POOLING`

**What you'll get:**

- ✅ Neon Postgres database (0.5GB free tier)
- ✅ 5 database connection strings
- ✅ Works with both Vercel (Next.js) and Raspberry Pi (bot)

---

### 4. Environment Configuration (15 min)

**Required for:** Running the application
**When:** Phase 0 - After Discord, Google, and Database setup

**Guide:** [.env.example](../.env.example)

**Steps:**

```bash
# 1. Copy template
cp .env.example .env.local

# 2. Fill in Database URLs (from step 3 - Neon)
#    Paste 5 connection strings WITHOUT quotes

# 3. Fill in Discord values (from step 1)
#    7 variables total

# 4. Fill in Google values (from step 2)
#    5 variables total

# 5. Generate secrets
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -hex 32     # BOT_API_KEY
openssl rand -hex 20     # GITHUB_WEBHOOK_SECRET
openssl rand -hex 20     # VERCEL_WEBHOOK_SECRET

# 6. Validate configuration
npx ts-node lib/config-validate.ts
```

**What you'll have:**

- ✅ Complete `.env.local` with all 30 required variables
- ✅ Validated configuration ready for development

---

### 5. External Services Setup (30 min)

**Required for:** Monitoring active projects on Fly.io, Cloudflare, and cron-job.org
**When:** Phase 0 - Can be done in parallel with other setup

**You have active projects on these platforms**, so you need to configure API access:

#### 5.1 Fly.io API Setup (10 min)

**[fly-io-setup.md](fly-io-setup.md)** - Monitor Fly.io deployments and health

**What you'll get:**

- ✅ `FLY_API_TOKEN`
- ✅ `FLY_ORG_SLUG`
- ✅ Deployment alerts to Discord
- ✅ App health monitoring

#### 5.2 Cloudflare API Setup (15 min)

**[cloudflare-api-setup.md](cloudflare-api-setup.md)** - Monitor DNS, CDN, and security

**What you'll get:**

- ✅ `CLOUDFLARE_API_TOKEN`
- ✅ `CLOUDFLARE_ZONE_ID`
- ✅ DNS change alerts
- ✅ Traffic analytics
- ✅ Security threat notifications

#### 5.3 cron-job.org API Setup (5 min)

**[cronjob-api-setup.md](cronjob-api-setup.md)** - Monitor scheduled tasks

**What you'll get:**

- ✅ `CRONJOB_API_KEY`
- ✅ Cron job failure alerts
- ✅ Execution history tracking

---

### 6. Raspberry Pi & CI/CD Setup (45 min) ⚠️ OPTIONAL

**Required for:** 24/7 bot deployment
**When:** Phase 4 (Deployment) - **Skip for now if doing local development**

**[github-secrets.md](github-secrets.md)** - Configure GitHub Actions and Raspberry Pi

**This is only needed when you're ready to deploy the bot to run continuously on a Raspberry Pi. You can develop and test everything locally first.**

---

## Documentation Overview

### Setup Guides (Start Here!)

- **[../DISCORD-SERVER-SETUP.md](../DISCORD-SERVER-SETUP.md)** - Create Discord server structure (13 channels)
- **[discord-bot-oauth-setup.md](discord-bot-oauth-setup.md)** - Discord bot OAuth2 configuration (10-15 min)
- **[google-api-setup.md](google-api-setup.md)** - Google Cloud & OAuth setup (20-30 min)
- **[github-secrets.md](github-secrets.md)** - Raspberry Pi & GitHub Actions setup (30-45 min, Phase 4 only)

### Configuration Files

- **[../.env.example](../.env.example)** - Complete environment variables template with 30 variables
- **[../lib/config-validate.ts](../lib/config-validate.ts)** - Configuration validation script

### Reference Documentation

- **[../AGENT-REVIEW-SUMMARY.md](../AGENT-REVIEW-SUMMARY.md)** - Agent review findings and decisions
- **[../PHASE-0-COMPLETE.md](../PHASE-0-COMPLETE.md)** - Phase 0 completion summary
- **[../ENV-EXAMPLE-UPDATED.md](../ENV-EXAMPLE-UPDATED.md)** - .env.example update details

---

## Setup Checklist

Use this checklist to track your progress:

### Phase 0: Prerequisites (Required Before Coding)

#### Discord Setup

- [ ] Create Discord server (DISCORD-SERVER-SETUP.md)
- [ ] Create 13 channels across 5 categories
- [ ] Create bot in Discord Developer Portal
- [ ] Generate OAuth2 URL and invite bot (discord-bot-oauth-setup.md)
- [ ] Copy bot token
- [ ] Enable Developer Mode
- [ ] Copy server ID, channel IDs, and user ID

#### Google API Setup

- [ ] Create Google Cloud project (google-api-setup.md)
- [ ] Enable 8 required APIs
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 credentials
- [ ] Obtain refresh token via OAuth Playground
- [ ] Copy client ID, client secret, and refresh token

#### Environment Configuration

- [ ] Copy .env.example to .env.local
- [ ] Fill in Discord variables (7 total)
- [ ] Fill in Google variables (5 total)
- [ ] Generate NEXTAUTH_SECRET
- [ ] Generate BOT_API_KEY
- [ ] Generate webhook secrets (2 total)
- [ ] Create Vercel Postgres database
- [ ] Copy DATABASE_URL from Vercel
- [ ] Run config validation: `npx ts-node lib/config-validate.ts`

### Phase 1-3: Development (Local)

Continue with implementation following the Trinity Method workflow.

### Phase 4: Deployment (Optional, When Ready)

- [ ] Set up Raspberry Pi with Docker (github-secrets.md)
- [ ] Configure GitHub Secrets (5 total)
- [ ] Test CI/CD pipeline deployment
- [ ] Verify bot runs 24/7 on Pi

---

## Troubleshooting

### Common Issues

**"Configuration validation failed"**

- Run `npx ts-node lib/config-validate.ts` to see specific errors
- Check .env.local for missing or incorrectly formatted variables
- Compare with .env.example to ensure all required variables are present

**"Invalid Discord bot token"**

- Token was copied incorrectly (extra spaces, missing characters)
- Token was regenerated in Discord Developer Portal
- Solution: Copy token again from Developer Portal > Bot section

**"Google OAuth error"**

- Redirect URI doesn't match Google Cloud Console exactly
- Test user not added to OAuth consent screen (External mode)
- Solution: Verify redirect URI and add yourself as test user

**"Cannot connect to database"**

- DATABASE_URL is incorrect or missing
- Vercel Postgres database not created
- Solution: Create database in Vercel Dashboard and copy connection string

---

## Environment Variables Quick Reference

### Required (27 variables)

**Database (4):**

- `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`

**Next.js & Auth (4):**

- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NODE_ENV`, `ADMIN_EMAIL`

**Admin Security (1):**

- `ADMIN_ROUTE_HASH` (pre-generated)

**Google OAuth (5):**

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_PROJECT_ID`

**Discord Bot (7):**

- `DISCORD_BOT_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_GUILD_ID`, `DISCORD_ADMIN_USER_ID`, `DISCORD_ADMIN_CHANNEL_ID`, `DISCORD_ALERT_CRITICAL_CHANNEL_ID`, `DISCORD_MONITORING_CHANNEL_ID`

**Bot API (2):**

- `BOT_API_KEY`, `BOT_API_URL`

**Email (1):**

- `RESEND_API_KEY` (already configured)

**Webhooks (2):**

- `GITHUB_WEBHOOK_SECRET`, `VERCEL_WEBHOOK_SECRET`

### Optional (3 variables)

- `FLY_API_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CRONJOB_API_KEY`

---

## Time Estimates

**Total Setup Time: ~1-2 hours**

- Discord setup: 20-25 min (server + bot OAuth)
- Google API setup: 20-30 min
- Environment configuration: 15-20 min
- Validation: 5 min

**Raspberry Pi Deployment (Phase 4): +30-45 min**

- Only needed when ready to deploy 24/7
- Can be done later after development is complete

---

## Getting Help

### Documentation Errors

If you find any errors or unclear instructions in the documentation:

1. Check the troubleshooting section above
2. Verify you're following the steps in order
3. Review the specific error message from config validation

### Setup Questions

- Discord issues: See [discord-bot-oauth-setup.md](discord-bot-oauth-setup.md)#troubleshooting
- Google API issues: See [google-api-setup.md](google-api-setup.md)#troubleshooting
- Raspberry Pi issues: See [github-secrets.md](github-secrets.md)#troubleshooting

---

## Next Steps

Once you've completed Phase 0 setup (Discord + Google + Environment):

1. **Verify Configuration:**

   ```bash
   npx ts-node lib/config-validate.ts
   ```

2. **Start Development:**

   ```bash
   npm run dev
   ```

3. **Begin Implementation:**
   Follow the Trinity Method workflow starting with Phase 1

---

**Documentation Status:** ✅ Complete and reviewed
**Last Updated:** 2025-10-28
**Phase:** Phase 0 - Prerequisites & Configuration
