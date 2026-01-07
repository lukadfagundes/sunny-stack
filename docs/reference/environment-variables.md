# Environment Variables Reference

Complete guide to environment variables used in Sunny Stack Portfolio. This document explains all required and optional variables, their purposes, and setup procedures.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Environment-Specific Configuration](#environment-specific-configuration)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Reference

### Variable Checklist

| Variable               | Required    | Environment | Purpose                     |
| ---------------------- | ----------- | ----------- | --------------------------- |
| `DATABASE_URL`         | Yes         | All         | PostgreSQL connection       |
| `AUTH_SECRET`          | Yes         | All         | NextAuth session encryption |
| `GOOGLE_CLIENT_ID`     | Yes         | All         | Google OAuth                |
| `GOOGLE_CLIENT_SECRET` | Yes         | All         | Google OAuth                |
| `ADMIN_EMAIL`          | Yes         | All         | Admin authorization         |
| `ADMIN_ROUTE_HASH`     | Yes         | All         | Admin URL security          |
| `DISCORD_BOT_TOKEN`    | Conditional | Pi/Local    | Discord bot                 |
| `RESEND_API_KEY`       | Conditional | Production  | Email service               |
| `ROLLBAR_ACCESS_TOKEN` | Conditional | Production  | Error tracking              |
| `BOT_API_KEY`          | Conditional | Pi          | Bot authentication          |
| `VERCEL_API_TOKEN`     | Optional    | Production  | Monitoring                  |
| `GITHUB_API_TOKEN`     | Optional    | Production  | Monitoring                  |
| `CLOUDFLARE_API_TOKEN` | Optional    | Production  | Monitoring                  |

### Setup Time Estimate

- **Basic Setup (Development):** 30-45 minutes
- **Full Setup (Production):** 1-2 hours
- **Google OAuth Setup:** 20-30 minutes
- **Discord Bot Setup:** 15-20 minutes

---

## Required Variables

### Database

#### `DATABASE_URL`

**Format:**

```bash
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?connection_limit=[limit]"
```

**Examples:**

```bash
# Development (local PostgreSQL)
DATABASE_URL="postgresql://sunnystack:password@localhost:5432/sunnystack?connection_limit=15"

# Production (Raspberry Pi Docker)
DATABASE_URL="postgresql://sunnystack:password@postgres:5432/sunnystack?connection_limit=20"

# Staging (Pi with different database)
DATABASE_URL="postgresql://sunnystack:password@postgres:5432/sunnystack_staging?connection_limit=10"
```

**Connection Pooling Limits:**

- Raspberry Pi 4: 15-20 connections (limited RAM)
- Raspberry Pi 5: 25-30 connections (more resources)
- Development: 10-15 connections (shared resources)

**Security Notes:**

- Never commit DATABASE_URL to git
- Use strong passwords (64+ characters recommended)
- Rotate passwords quarterly

**Generation:**

```bash
# Generate secure password
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test connection
docker compose exec postgres psql "${DATABASE_URL}"
```

---

### Authentication & Authorization

#### `AUTH_SECRET`

**Purpose:** Encrypts NextAuth session tokens (JWT)

**Format:** Base64 string (32+ characters)

**Generation:**

```bash
# Generate secure secret
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example:**

```bash
AUTH_SECRET="Xb2kP9mL7qR4wE6vN8uY3aZ5tG1jF0hS9dC8xK4pV2=="
```

**Security Notes:**

- Must be different for each environment (dev, staging, prod)
- Rotate every 6-12 months
- Never share between environments
- Never commit to git

#### `ADMIN_EMAIL`

**Purpose:** Email address authorized to access admin dashboard

**Format:** Valid email address

**Examples:**

```bash
ADMIN_EMAIL="admin@sunny-stack.com"
ADMIN_EMAIL="your-email@gmail.com"
```

**Multiple Admins:**

```bash
# Currently supports single admin only
# For multiple admins, use comma-separated (future feature)
ADMIN_EMAIL="admin1@example.com"
```

**Client-Side Access:**

```bash
# Also set public version for client-side validation
NEXT_PUBLIC_ADMIN_EMAIL="admin@sunny-stack.com"
```

#### `ADMIN_ROUTE_HASH`

**Purpose:** Keeps admin dashboard URL secret (obscurity layer)

**Format:** 64-character hex string

**Generation:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example:**

```bash
ADMIN_ROUTE_HASH="6bde736bb52aa194f1d69d140619b25cb9f9a42eb3acb1f6e7a502b375fda6ac"
```

**Admin URL:**

```
https://sunny-stack.com/admin-{ADMIN_ROUTE_HASH}/
```

**Security Notes:**

- Store in password manager
- Rotate annually
- Never share publicly
- Different hash for each environment

---

### Google OAuth

#### `GOOGLE_CLIENT_ID`

**Purpose:** Google OAuth client identifier

**Format:** `[PROJECT_ID]-[HASH].apps.googleusercontent.com`

**Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://sunny-stack.com/api/auth/callback/google` (production)

**Example:**

```bash
GOOGLE_CLIENT_ID="123456789-abc123def456.apps.googleusercontent.com"
```

#### `GOOGLE_CLIENT_SECRET`

**Purpose:** Google OAuth client secret

**Format:** `GOCSPX-[HASH]`

**Setup:**

1. Same credentials page as Client ID
2. Copy client secret after creating OAuth client

**Example:**

```bash
GOOGLE_CLIENT_SECRET="GOCSPX-abc123def456ghi789jkl012"
```

**Security Notes:**

- Treat as highly sensitive
- Never commit to git
- Rotate if compromised
- Different secret for dev/prod

#### `GOOGLE_REDIRECT_URI`

**Purpose:** OAuth callback URL

**Format:** Full URL with protocol

**Examples:**

```bash
# Development
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# Production
GOOGLE_REDIRECT_URI="https://sunny-stack.com/api/auth/callback/google"
```

**Must match Google Cloud Console exactly!**

#### `GOOGLE_PROJECT_ID`

**Purpose:** Google Cloud project identifier

**Example:**

```bash
GOOGLE_PROJECT_ID="sunny-stack-bot"
```

**Finding:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. View Project Info on dashboard

---

### Discord Bot (Conditional - Required for Bot)

#### `DISCORD_BOT_TOKEN`

**Purpose:** Discord bot authentication token

**Format:** Long alphanumeric string

**Setup:**

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create application
3. Bot → Copy Token

**Example:**

```bash
DISCORD_BOT_TOKEN="your-discord-bot-token-here"
```

**Security Notes:**

- ⚠️ NEVER share this token
- Gives full access to bot
- Rotate if leaked immediately
- Enable privileged gateway intents in Dev Portal

#### `DISCORD_APPLICATION_ID`

**Purpose:** Discord application identifier

**Format:** Snowflake ID (18-19 digits)

**Example:**

```bash
DISCORD_APPLICATION_ID="1432712159216930926"
```

**Finding:**

1. Discord Developer Portal
2. General Information → Application ID

#### `DISCORD_GUILD_ID`

**Purpose:** Discord server (guild) identifier

**Format:** Snowflake ID

**Setup:**

1. Enable Developer Mode: Settings → Advanced → Developer Mode
2. Right-click server icon → Copy Server ID

**Example:**

```bash
DISCORD_GUILD_ID="987654321098765432"
```

#### `DISCORD_ADMIN_USER_ID`

**Purpose:** Discord user authorized for admin bot commands

**Setup:**

1. Enable Developer Mode
2. Right-click your username anywhere → Copy User ID

**Example:**

```bash
DISCORD_ADMIN_USER_ID="123456789012345678"
```

#### Discord Channel IDs

**Format:** Snowflake IDs

**Setup:** Enable Developer Mode, right-click channel → Copy Channel ID

```bash
# Administrative Channels
DISCORD_CHANNEL_ADMIN_LOGS="channel-id-here"
DISCORD_CHANNEL_BOT_COMMANDS="channel-id-here"

# Project Management
DISCORD_CHANNEL_ACTIVE_PROJECTS="channel-id-here"
DISCORD_CHANNEL_PROPOSALS="channel-id-here"
DISCORD_CHANNEL_TASKS="channel-id-here"
DISCORD_CHANNEL_TIME_TRACKING="channel-id-here"

# Client Communication
DISCORD_CHANNEL_CLIENT_INQUIRIES="channel-id-here"
DISCORD_CHANNEL_CLIENT_UPDATES="channel-id-here"

# Automation & Monitoring
DISCORD_CHANNEL_CALENDAR_SYNC="channel-id-here"
DISCORD_CHANNEL_EMAIL_NOTIFICATIONS="channel-id-here"
DISCORD_CHANNEL_ANALYTICS="channel-id-here"

# Financial
DISCORD_CHANNEL_INVOICES="channel-id-here"
DISCORD_CHANNEL_PAYMENTS="channel-id-here"
```

---

### Bot API Authentication (Conditional)

#### `BOT_API_KEY`

**Purpose:** Shared secret for bot-to-API authentication

**Format:** 64-character hex string

**Generation:**

```bash
openssl rand -hex 32
```

**Example:**

```bash
BOT_API_KEY="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
```

**Security Notes:**

- Both Next.js and bot need same key
- Different key per environment
- Rotate quarterly

#### `BOT_API_URL`

**Purpose:** Base URL for bot to call Next.js API

**Examples:**

```bash
# Development (Windows localhost)
BOT_API_URL="http://localhost:3000/api"

# Development (Pi with Docker network)
BOT_API_URL="http://api-server:3000/api"

# Production (Vercel)
BOT_API_URL="https://sunny-stack.com/api"
```

---

## Optional Variables

### Email Service (Recommended for Production)

#### `RESEND_API_KEY`

**Purpose:** Send transactional emails (quote notifications, etc.)

**Format:** `re_[HASH]`

**Setup:**

1. Create account at [Resend.com](https://resend.com)
2. Generate API key
3. Verify domain (for production)

**Example:**

```bash
RESEND_API_KEY="re_abc123def456ghi789jkl012"
```

**Note:** Emails won't send without this (graceful degradation)

---

### Error Tracking (Recommended for Production)

#### `ROLLBAR_ACCESS_TOKEN`

**Purpose:** Production error monitoring and alerting

**Format:** Alphanumeric string

**Setup:**

1. Create account at [Rollbar.com](https://rollbar.com)
2. Create project
3. Copy post_server_item token

**Example:**

```bash
ROLLBAR_ACCESS_TOKEN="abc123def456ghi789jkl012mno345"
```

---

### Service Monitoring (Optional)

#### `VERCEL_API_TOKEN`

**Purpose:** Monitor Vercel deployments

**Setup:**

1. Vercel Dashboard → Settings → Tokens
2. Create token (Read-only recommended)

**Example:**

```bash
VERCEL_API_TOKEN="abc123_vercel_token_def456"
```

#### `GITHUB_API_TOKEN`

**Purpose:** Monitor GitHub repositories and workflows

**Setup:**

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Required scopes: `actions:read`, `checks:read`, `contents:read`, `deployments:read`, `metadata:read`

**Example:**

```bash
GITHUB_API_TOKEN="ghp_abc123def456ghi789jkl012mno345pqr678"
```

#### `CLOUDFLARE_API_TOKEN`

**Purpose:** Monitor DNS/CDN status

**Setup:**

1. Cloudflare Dashboard → My Profile → API Tokens
2. Create token with Zone:Read permissions

**Example:**

```bash
CLOUDFLARE_API_TOKEN="abc123def456ghi789jkl012"
CLOUDFLARE_ZONE_ID="abc123def456ghi789jkl012"
```

#### `FLY_API_TOKEN`

**Purpose:** Monitor Fly.io deployments (if used)

**Setup:**

1. `flyctl auth token`
2. Or: Fly.io Dashboard → Access Tokens

**Example:**

```bash
FLY_API_TOKEN="fo1_abc123def456"
FLY_ORG_SLUG="your-org-slug"
```

---

### Development & Deployment

#### `NODE_ENV`

**Purpose:** Determines environment mode

**Values:**

- `development` - Development mode (detailed logging, hot reload)
- `production` - Production mode (optimizations, minification)
- `test` - Testing mode (isolated data, mocked services)

**Example:**

```bash
NODE_ENV="development"
```

**Auto-set by:**

- `npm run dev` → `development`
- `npm run build` → `production`
- Vercel deployment → `production`

#### `DEPLOYMENT_MODE`

**Purpose:** Discord bot deployment target

**Values:**

- `pi` - Gateway API (persistent WebSocket connection)
- `vercel` - Interactions API (webhook-based, stateless)

**Example:**

```bash
# Use "pi" for local development and Pi deployment
DEPLOYMENT_MODE="pi"
```

**Note:** Always use `pi` mode for local bot development

---

## Environment-Specific Configuration

### Local Development

**.env.local (not committed):**

```bash
# Database
DATABASE_URL="postgresql://sunnystack:password@localhost:5432/sunnystack?connection_limit=15"

# Auth
AUTH_SECRET="local-dev-secret-generate-new-one"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="dev@sunny-stack.com"
NEXT_PUBLIC_ADMIN_EMAIL="dev@sunny-stack.com"
ADMIN_ROUTE_HASH="6bde736bb52aa194f1d69d140619b25cb9f9a42eb3acb1f6e7a502b375fda6ac"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# Discord Bot (optional for local dev)
DISCORD_BOT_TOKEN="your-bot-token"
DISCORD_APPLICATION_ID="your-app-id"
DISCORD_GUILD_ID="your-guild-id"
DISCORD_ADMIN_USER_ID="your-user-id"
DISCORD_CHANNEL_ADMIN_LOGS="channel-id"
# ... other channel IDs ...

# Bot API
BOT_API_KEY="dev-bot-api-key"
BOT_API_URL="http://localhost:3000/api"

# Optional
NODE_ENV="development"
DEPLOYMENT_MODE="pi"
```

### Vercel (Production Frontend + API)

**Vercel Dashboard → Project Settings → Environment Variables:**

```bash
# Database (connects to Pi)
DATABASE_URL="postgresql://sunnystack:PROD_PASSWORD@pi.home.network:5432/sunnystack?connection_limit=20"

# Auth
AUTH_SECRET="production-secret-different-from-dev"
NEXTAUTH_URL="https://sunny-stack.com"
ADMIN_EMAIL="admin@sunny-stack.com"
NEXT_PUBLIC_ADMIN_EMAIL="admin@sunny-stack.com"
ADMIN_ROUTE_HASH="production-hash-different-from-dev"

# Google OAuth
GOOGLE_CLIENT_ID="prod-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-prod-secret"
GOOGLE_REDIRECT_URI="https://sunny-stack.com/api/auth/callback/google"

# Email
RESEND_API_KEY="re_prod_key_here"

# Error Tracking
ROLLBAR_ACCESS_TOKEN="prod_rollbar_token"

# Monitoring (optional)
VERCEL_API_TOKEN="vercel_token"
GITHUB_API_TOKEN="ghp_token"
CLOUDFLARE_API_TOKEN="cloudflare_token"
CLOUDFLARE_ZONE_ID="zone_id"

# DO NOT set Discord bot variables on Vercel
# Bot runs on Pi, not Vercel
```

### Raspberry Pi (Production Database + Bot)

**.env (in Pi project directory):**

```bash
# PostgreSQL (Docker internal network)
POSTGRES_USER=sunnystack
POSTGRES_PASSWORD=PROD_PASSWORD
POSTGRES_DB=sunnystack
DATABASE_URL="postgresql://sunnystack:PROD_PASSWORD@postgres:5432/sunnystack?connection_limit=20"

# Discord Bot
DISCORD_BOT_TOKEN="prod-bot-token"
DISCORD_APPLICATION_ID="prod-app-id"
DISCORD_GUILD_ID="prod-guild-id"
DISCORD_ADMIN_USER_ID="admin-user-id"
DISCORD_CHANNEL_ADMIN_LOGS="channel-id"
# ... all channel IDs ...

# Bot API (connects to Vercel)
BOT_API_KEY="production-bot-api-key-same-as-vercel"
BOT_API_URL="https://sunny-stack.com/api"

# Environment
NODE_ENV="production"
DEPLOYMENT_MODE="pi"
```

---

## Security Best Practices

### Secret Generation

**Strong Secrets:**

```bash
# 32-byte secrets (recommended minimum)
openssl rand -base64 32
openssl rand -hex 32

# 64-byte secrets (extra secure)
openssl rand -base64 64
```

### Secret Storage

**DO:**

- ✅ Use `.env.local` for local development (git-ignored)
- ✅ Use Vercel environment variables for production
- ✅ Store sensitive values in password manager
- ✅ Use different secrets for each environment
- ✅ Document non-secret configuration

**DON'T:**

- ❌ Commit secrets to git (.env files)
- ❌ Share secrets via email/chat
- ❌ Reuse secrets across environments
- ❌ Use weak/predictable secrets
- ❌ Hardcode secrets in source code

### Secret Rotation

**Quarterly Rotation:**

- `AUTH_SECRET`
- `BOT_API_KEY`
- Database passwords

**Annual Rotation:**

- `ADMIN_ROUTE_HASH`

**Rotate Immediately if:**

- Secret leaked/exposed
- Team member leaves
- Security breach suspected

**Rotation Procedure:**

1. Generate new secret
2. Update in environment (Vercel/Pi)
3. Deploy changes
4. Verify functionality
5. Delete old secret

### Environment Variable Precedence

Next.js loads environment variables in this order (later overrides earlier):

1. `.env` - All environments (committed to git)
2. `.env.local` - All environments (git-ignored)
3. `.env.development` - Development only
4. `.env.production` - Production only
5. `.env.test` - Test only
6. System environment variables
7. Vercel environment variables (when deployed)

**Best Practice:**

- Use `.env.example` for documentation (committed)
- Use `.env.local` for development (git-ignored)
- Use Vercel dashboard for production

---

## Troubleshooting

### Issue: Missing Environment Variables

**Symptom:** Application fails to start or specific features don't work

**Solution:**

```bash
# Validate environment variables
npm run validate:env

# Check which variables are loaded
npm run validate:env:pi        # Pi-specific
npm run validate:env:vercel    # Vercel-specific
```

### Issue: DATABASE_URL Connection Failed

**Symptoms:**

- `Error: connect ECONNREFUSED`
- `Error: password authentication failed`

**Solutions:**

```bash
# 1. Check database is running
docker compose ps

# 2. Test connection manually
docker compose exec postgres psql -U sunnystack -d sunnystack

# 3. Verify DATABASE_URL format
echo $DATABASE_URL

# 4. Check connection limit
# If limit too low, increase:
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=25"
```

### Issue: Google OAuth Not Working

**Symptoms:**

- Redirect loop
- "Redirect URI mismatch" error

**Solutions:**

1. **Verify redirect URI matches exactly:**
   - Google Cloud Console
   - `GOOGLE_REDIRECT_URI` variable
   - Case-sensitive, protocol must match

2. **Check authorized domains:**
   - Google Cloud Console → OAuth consent screen
   - Add `sunny-stack.com` and `localhost`

3. **Clear browser cookies:**
   - Old sessions may interfere

### Issue: Discord Bot Not Connecting

**Symptoms:**

- Bot shows offline
- Commands don't work

**Solutions:**

```bash
# 1. Verify bot token
# Discord Developer Portal → Bot → Reset Token

# 2. Check privileged intents enabled
# Developer Portal → Bot → Privileged Gateway Intents
# Enable: Presence Intent, Server Members Intent, Message Content Intent

# 3. Verify bot is invited to server
# Generate invite URL with correct permissions

# 4. Check deployment mode
DEPLOYMENT_MODE="pi"  # Must be "pi" for local/Pi deployment
```

### Issue: Environment Variables Not Loading

**Symptoms:**

- `undefined` when accessing process.env variables
- Features using env vars don't work

**Solutions:**

```bash
# 1. Restart development server
npm run dev

# 2. Check file naming
# Must be .env.local (not .env.development)

# 3. Verify NEXT_PUBLIC_ prefix for client-side vars
NEXT_PUBLIC_ADMIN_EMAIL="admin@example.com"  # ✅ Accessible in browser
ADMIN_EMAIL="admin@example.com"              # ❌ Server-side only

# 4. Check .gitignore
# .env.local should be ignored
cat .gitignore | grep env
```

---

## Related Documentation

- **[Getting Started Guide](../guides/getting-started.md)** - Initial setup
- **[Security Best Practices](../guides/security.md)** - Security guidelines
- **[Deployment Guide](../deployment/README.md)** - Deployment procedures

---

**Last Updated:** 2026-01-07
**Total Variables:** 30+
**Maintained by:** Sunny Stack Development Team
