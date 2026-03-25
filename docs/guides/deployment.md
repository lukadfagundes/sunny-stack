# Deployment Guide

This guide covers deploying sunny-stack to production and other environments.

---

## Prerequisites

Before deploying, ensure:

- All tests pass: `npm test`
- Build succeeds: `npm run build`
- Environment variables configured for all desired services
- Node.js 20+ available in the deployment environment

---

## Environment Configuration

### Required Environment Variables

All environment variables are optional for the application to run, but each variable enables a specific data source. Configure the variables for the services you want active:

| Variable | Service | How to Obtain |
|----------|---------|---------------|
| `GITHUB_TOKEN` | GitHub | [Generate a personal access token](https://github.com/settings/tokens) with `read:user` scope |
| `INSTAGRAM_ACCESS_TOKEN` | Instagram | [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/) long-lived access token |
| `YOUTUBE_API_KEY` | YouTube | [Google Cloud Console](https://console.cloud.google.com/) > YouTube Data API v3 |
| `YOUTUBE_CHANNEL_ID` | YouTube | Your YouTube channel ID |
| `BLUESKY_HANDLE` | Bluesky | Your Bluesky handle (e.g., `user.bsky.social`) |
| `SPOTIFY_CLIENT_ID` | Spotify | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | Spotify | Spotify Developer Dashboard |
| `SPOTIFY_REFRESH_TOKEN` | Spotify | OAuth 2.0 authorization code flow |
| `STEAM_API_KEY` | Steam | [Steam Web API Key](https://steamcommunity.com/dev/apikey) |
| `STEAM_ID` | Steam | Your Steam 64-bit ID ([steamid.io](https://steamid.io)) |

### Environment Files

- **Development:** `.env.local` (local development, git-ignored)
- **Production:** Configured via hosting platform dashboard (Vercel, etc.)

---

## Build Process

### 1. Install Production Dependencies

```bash
npm ci
```

### 2. Run Build

```bash
npm run build
```

Build output location: `.next/`

### 3. Verify Build Locally

```bash
npm run build && npm start
```

Visit http://localhost:3000 to verify the production build works correctly.

---

## Deployment Platforms

### Option 1: Vercel (Recommended)

sunny-stack is configured for Vercel deployment with the following `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "github": {
    "enabled": false
  }
}
```

GitHub auto-deploy integration is disabled. Deployments are triggered via the CI/CD pipeline on release.

#### Setup

1. Install the Vercel CLI:

```bash
npm install -g vercel@latest
```

2. Link the project:

```bash
vercel link
```

3. Configure environment variables in the Vercel dashboard:
   - Go to **Project Settings** > **Environment Variables**
   - Add all 10 environment variables listed above
   - Set them for the **Production** environment

#### Manual Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### CI/CD Deployment

Automated production deployments are triggered by GitHub Releases via `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  release:
    types: [published]

jobs:
  deploy-vercel:
    name: Deploy to Vercel (Production)
    runs-on: ubuntu-latest
    env:
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - name: Install Vercel CLI
        run: npm install -g vercel@latest
      - name: Pull Vercel project configuration
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - name: Build for production
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - name: Deploy to production
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Required GitHub Secrets for CI/CD:**

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token ([create here](https://vercel.com/account/tokens)) |
| `VERCEL_ORG_ID` | Vercel organization/team ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

#### Additional CI/CD Workflows

The project includes 4 GitHub Actions workflows:

| Workflow | File | Trigger |
|----------|------|---------|
| Deploy | `.github/workflows/deploy.yml` | Release published |
| CI | `.github/workflows/ci.yml` | Push/PR to main |
| Code Quality | `.github/workflows/quality.yml` | Push/PR |
| Release | `.github/workflows/release.yml` | Manual/automated |

---

### Option 2: Docker

#### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Build the application
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

> **Note:** To use standalone output mode, add `output: "standalone"` to `next.config.ts`.

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - INSTAGRAM_ACCESS_TOKEN=${INSTAGRAM_ACCESS_TOKEN}
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
      - YOUTUBE_CHANNEL_ID=${YOUTUBE_CHANNEL_ID}
      - BLUESKY_HANDLE=${BLUESKY_HANDLE}
      - SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID}
      - SPOTIFY_CLIENT_SECRET=${SPOTIFY_CLIENT_SECRET}
      - SPOTIFY_REFRESH_TOKEN=${SPOTIFY_REFRESH_TOKEN}
      - STEAM_API_KEY=${STEAM_API_KEY}
      - STEAM_ID=${STEAM_ID}
    restart: unless-stopped
```

#### Build and Run

```bash
# Build image
docker build -t sunny-stack .

# Run container
docker run -p 3000:3000 --env-file .env.local sunny-stack

# Or use docker-compose
docker-compose up -d
```

---

### Option 3: Self-Hosted (VPS/EC2)

#### Setup

1. Provision a server with Node.js 20+ installed
2. Configure firewall to allow port 3000 (or 80/443 with Nginx)

#### Deploy Application

```bash
# Clone repository
git clone https://github.com/strawhatluka/sunny-stack.git
cd sunny-stack

# Install dependencies
npm ci

# Build application
npm run build

# Configure environment
cp .env.example .env.local
nano .env.local  # Edit environment variables

# Start with PM2 (process manager)
npm install -g pm2
pm2 start npm --name "sunny-stack" -- start
pm2 save
pm2 startup
```

#### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name sunny-stack.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d sunny-stack.com
sudo systemctl enable certbot.timer
```

---

## Monitoring & Logging

### Application Monitoring

Vercel Analytics is built-in for Vercel deployments. No additional setup required.

For self-hosted deployments, consider:
- **PM2 monitoring:** `pm2 monit`
- **UptimeRobot:** Free uptime monitoring with alerts

### Error Tracking

Server-side `console.error` with descriptive prefixes per API route. Each route logs errors with context:

```
[github/profile] API responded 401
Bluesky API error: ...
Steam API error: 403
Spotify token refresh error: ...
```

### Log Access

| Platform | Command |
|----------|---------|
| Vercel | `vercel logs` (via Vercel CLI) or Vercel Dashboard > Deployments > Function Logs |
| Docker | `docker logs sunny-stack` |
| PM2 | `pm2 logs sunny-stack` |

---

## Performance Optimization

### Production Optimizations

1. **Security Headers:** CSP, HSTS, X-Frame-Options are configured in `next.config.ts`
2. **Rate Limiting:** 30 requests per minute per IP address via `src/middleware.ts`
3. **ISR Revalidation:** Pages use ISR with 1-hour revalidation for efficient caching
4. **Image Optimization:** Next.js automatic image optimization for remote images
5. **Compression:** Enabled by default in Next.js production builds

### Vercel-Specific Optimizations

- Automatic edge caching for static assets
- Serverless function cold start optimization
- Global CDN distribution

---

## Health Checks

The application does not expose a dedicated `/health` endpoint. To verify the deployment is working:

1. **Check the home page:** `curl -s -o /dev/null -w "%{http_code}" https://sunny-stack.com`
2. **Check an API endpoint:** `curl https://sunny-stack.com/api/activity`
3. **Check the docs API:** `curl "https://sunny-stack.com/api/docs?list=true"`

---

## Post-Deployment Checklist

- [ ] Application is accessible at the production URL
- [ ] Home page loads without errors
- [ ] API endpoints return data (or graceful `null`/`[]` fallbacks)
- [ ] Environment variables configured correctly in the hosting platform
- [ ] SSL certificate installed and valid (HTTPS)
- [ ] Rate limiting is active (test with rapid requests)
- [ ] Security headers present (check with [securityheaders.com](https://securityheaders.com))
- [ ] Logs are accessible and recording API errors
- [ ] CI/CD pipeline triggers deployment on release

---

## Troubleshooting

### Application Does Not Start

1. Check logs: `vercel logs` (Vercel) or `pm2 logs sunny-stack` (self-hosted)
2. Verify environment variables are set correctly
3. Ensure Node.js 20+ is installed
4. Confirm the build completed successfully: `npm run build`

### API Endpoints Return Null

1. Verify the corresponding environment variables are set in the production environment
2. Check logs for API error messages
3. Confirm external API credentials are still valid (tokens may expire)
4. For Spotify: refresh tokens can expire if the app is deauthorized

### Vercel Deployment Fails

1. "Could not retrieve Project Settings" usually means a 403 (token scope issue)
2. Verify `VERCEL_TOKEN` scope matches the team/org that owns the project
3. Use job-level env vars for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` in GitHub Actions
4. Check that the Vercel project is linked correctly: `vercel link`

### Performance Issues

1. Check Vercel Analytics for function execution times
2. Review external API response times (some APIs may be slow)
3. Monitor rate limit hits in logs
4. Verify ISR revalidation is working (pages should cache for 1 hour)

---

## Security Checklist

- [x] All secrets in environment variables (not in code)
- [x] HTTPS enabled (Vercel provides automatic SSL)
- [x] Security headers configured (CSP, HSTS, X-Frame-Options)
- [x] Rate limiting enabled (30 req/min per IP)
- [x] Input validation implemented (docs path, steam appid)
- [x] Path traversal protection in docs route
- [x] No sensitive data exposed in API responses
- [ ] Dependency vulnerabilities checked: `npm audit`

---

## Related Documentation

- [Getting Started](./getting-started.md) - Local development setup
- [API Development](./api-development.md) - API development guide
- [API Reference](../api/README.md) - Complete endpoint documentation


---

*Last updated: 2026-03-24*
