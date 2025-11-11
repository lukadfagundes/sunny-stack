# API Tokens Setup Guide

This guide covers obtaining all API tokens needed for comprehensive monitoring across your GitHub repositories, Vercel projects, and infrastructure services.

---

## 📋 Quick Reference

| Service      | Token Variable         | Purpose                                   | Scope            |
| ------------ | ---------------------- | ----------------------------------------- | ---------------- |
| GitHub       | `GITHUB_API_TOKEN`     | Monitor ALL repos, workflows, deployments | Multi-repo       |
| Vercel       | `VERCEL_API_TOKEN`     | Monitor ALL projects, builds, domains     | Multi-project    |
| Fly.io       | `FLY_API_TOKEN`        | Monitor apps deployed on Fly.io           | Account-wide     |
| Cloudflare   | `CLOUDFLARE_API_TOKEN` | Monitor DNS/CDN status                    | Account-wide     |
| cron-job.org | `CRONJOB_API_KEY`      | Monitor scheduled jobs                    | Account-wide     |
| Rollbar      | `ROLLBAR_ACCESS_TOKEN` | Error tracking & monitoring               | Project-specific |

---

## 🔑 Token Setup Instructions

### 1. GitHub API Token (`GITHUB_API_TOKEN`)

**What it does:**

- Monitor **ALL** your repositories (not just Sunny Stack)
- Track workflow runs, deployments, and CI/CD status
- Fetch security alerts and Dependabot updates
- Query repository commits, pull requests, and issues

**How to get it:**

1. Go to **GitHub Settings** → [Developer settings](https://github.com/settings/tokens?type=beta)
2. Click **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
3. Fill in token details:
   - **Token name**: `Sunny Stack Discord Bot Monitoring`
   - **Expiration**: 90 days (recommended) or custom
   - **Description**: (optional) "Monitor all repos for Discord bot notifications"
   - **Repository access**: **All repositories** (recommended for multi-repo monitoring)
     - Or select "Only select repositories" if you want to limit scope

4. Scroll down to **Permissions** → **Repository permissions**

   Select these scopes (click each to expand and select "Read-only"):
   - ✅ **Actions**: Read-only (view workflow runs and jobs)
   - ✅ **Checks**: Read-only (view CI/CD check runs)
   - ✅ **Contents**: Read-only (view repository code and commits)
   - ✅ **Deployments**: Read-only (view deployment status)
   - ✅ **Metadata**: Read-only (automatically required and selected)
   - ✅ **Pull requests**: Read-only (view PR status and merges)

5. **Account permissions** (optional):
   - All can be left at "No access" for basic monitoring

6. Click **Generate token** at the bottom
7. **IMPORTANT**: Copy the token immediately (you won't see it again!)
8. Add to `.env.local`:
   ```bash
   GITHUB_API_TOKEN="github_pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
   ```

**Token format**: `github_pat_` followed by 82 characters

**Security tip**: Fine-grained tokens expire automatically. Set a calendar reminder to regenerate before expiration.

---

### 2. Vercel API Token (`VERCEL_API_TOKEN`)

**What it does:**

- Monitor **ALL** your Vercel projects (not just Sunny Stack)
- Track deployments, builds, and production status
- View deployment logs and error rates
- Monitor custom domains and SSL certificates

**How to get it:**

1. Go to **Vercel** → [Account Settings](https://vercel.com/account/tokens)
2. Click **Tokens** → **Create Token**
3. Fill in token details:
   - **Token name**: `Sunny Stack Discord Bot`
   - **Scope**: Choose your team/personal account
   - **Expiration**: No expiration (recommended) or custom
4. Click **Create Token**
5. **IMPORTANT**: Copy the token immediately
6. Add to `.env.local`:
   ```bash
   VERCEL_API_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

**Token format**: 52-character string

**Permission recommendation**: Use **Read-only** access if you only need monitoring. Full access not required.

---

### 3. Fly.io API Token (`FLY_API_TOKEN`)

**What it does:**

- Monitor apps deployed on Fly.io infrastructure
- Track app status, health, and performance
- View deployment history and logs
- Monitor resource usage

**How to get it:**

1. Go to **Fly.io** → [Personal Access Tokens](https://fly.io/user/personal_access_tokens)
2. Click **Create token**
3. Fill in token details:
   - **Token name**: `Sunny Stack Discord Bot`
   - **Token type**: **Read-only** (recommended) or Organization
4. Click **Create Personal Access Token**
5. **IMPORTANT**: Copy the token immediately
6. Add to `.env.local`:
   ```bash
   FLY_API_TOKEN="fo1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

**Also get your Organization Slug:**

```bash
# Run this command (requires flyctl CLI):
flyctl orgs list

# Or get from dashboard URL:
# https://fly.io/organizations/{your-org-slug}
```

Add to `.env.local`:

```bash
FLY_ORG_SLUG="your-organization-slug"
```

**Token format**: `fo1_` followed by ~50 characters

---

### 4. Cloudflare API Token (`CLOUDFLARE_API_TOKEN`)

**What it does:**

- Monitor DNS configuration and status
- Track CDN performance and cache hits
- View security events and DDoS protection
- Monitor SSL/TLS certificate status

**How to get it:**

1. Go to **Cloudflare** → [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token** → **Use template** → **Read all resources**
3. Customize token:
   - **Token name**: `Sunny Stack Discord Bot`
   - **Permissions**:
     - Zone → Zone → Read
     - Zone → Zone Settings → Read
     - Zone → Analytics → Read
   - **Zone Resources**: Include → All zones (or specific domains)
4. Click **Continue to summary** → **Create Token**
5. **IMPORTANT**: Copy the token immediately
6. Add to `.env.local`:
   ```bash
   CLOUDFLARE_API_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

**Also get your Zone ID:**

1. Go to **Cloudflare** → **Websites**
2. Click your domain (e.g., sunny-stack.com)
3. Scroll to **API** section (right sidebar)
4. Copy **Zone ID**

Add to `.env.local`:

```bash
CLOUDFLARE_ZONE_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Token format**: 40-character string
**Zone ID format**: 32-character hex string

---

### 5. cron-job.org API Key (`CRONJOB_API_KEY`)

**What it does:**

- Monitor scheduled cron jobs status
- Track job execution history and failures
- View next scheduled run times
- Get job execution logs

**How to get it:**

1. Go to **cron-job.org** → [API Settings](https://cron-job.org/en/members/api/)
2. Log in to your account
3. Scroll to **API Key** section
4. If no key exists, click **Generate API Key**
5. Copy the displayed key
6. Add to `.env.local`:
   ```bash
   CRONJOB_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

**Token format**: 32-character string

**Note**: If you don't use cron-job.org for scheduled tasks, you can leave this empty.

---

### 6. Rollbar Access Token (`ROLLBAR_ACCESS_TOKEN`)

**What it does:**

- Capture and track client-side errors (React)
- Capture and track server-side errors (Next.js API)
- Monitor error rates and trends
- Alert on new error types

**How to get it:**

1. Go to **[Rollbar.com](https://rollbar.com)** and create account (free tier available)
2. Create a new project: **Sunny Stack**
3. In project settings → **Project Access Tokens**
4. Copy the **post_server_item** token (for server-side) or **post_client_item** (for client-side)
5. Add to `.env.local`:
   ```bash
   ROLLBAR_ACCESS_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

**Token format**: 32-character hex string

**Alternative**: See [WO-006](../trinity/work-orders/WO-006-security-monitoring-automation.md) for Sentry as alternative to Rollbar.

---

## ✅ Verification Checklist

After obtaining all tokens, verify your setup:

```bash
# Run environment validation
node validate-env.cjs
```

Expected output:

```
✅ Valid variables: 39/39
✅ Phase 0 Prerequisites: COMPLETE
✅ Ready to proceed with /trinity-orchestrate
```

Or run TypeScript validation:

```bash
npx ts-node lib/config-validate.ts
```

---

## 🔒 Security Best Practices

### Token Storage

- ✅ **DO**: Store tokens in `.env.local` (gitignored)
- ✅ **DO**: Use different tokens for development vs production
- ❌ **DON'T**: Commit tokens to git
- ❌ **DON'T**: Share tokens in Slack/Discord/email

### Token Rotation

- **GitHub**: Rotate every 90 days (or use expiration)
- **Vercel**: Rotate annually
- **Fly.io**: Rotate every 6 months
- **Cloudflare**: Rotate annually
- **Others**: Rotate when team members leave

### Permission Scopes

- Use **read-only** permissions whenever possible
- GitHub: Use fine-grained tokens (not classic personal access tokens)
- Vercel: Prefer team-scoped tokens over account-scoped
- Cloudflare: Limit to specific zones if monitoring single domain

### Monitoring Token Usage

Most services provide token usage logs:

- **GitHub**: Settings → Developer settings → Personal access tokens → View token usage
- **Vercel**: Settings → Tokens → View activity log
- **Cloudflare**: Audit logs show API token usage

---

## 🆘 Troubleshooting

### "Invalid token" errors

1. Check token was copied correctly (no extra spaces)
2. Verify token hasn't expired (GitHub fine-grained tokens expire)
3. Confirm correct permissions/scopes were granted
4. Try regenerating the token

### "Rate limit exceeded" errors

1. GitHub: 5,000 requests/hour for authenticated requests
2. Vercel: 20 requests/second
3. Solution: Implement caching (already done in `lib/monitoring/service-health-checker.ts`)

### Token not working in production

1. Ensure token is set in production environment (not just `.env.local`)
2. **Vercel**: Add tokens in Project Settings → Environment Variables
3. **Raspberry Pi**: Update `.env` file on Pi

---

## 📚 API Documentation References

- **GitHub REST API**: https://docs.github.com/en/rest
- **Vercel API**: https://vercel.com/docs/rest-api
- **Fly.io API**: https://fly.io/docs/reference/api/
- **Cloudflare API**: https://developers.cloudflare.com/api/
- **cron-job.org API**: https://cron-job.org/en/documentation/
- **Rollbar API**: https://docs.rollbar.com/reference/

---

## 🎯 Next Steps

After setting up all tokens:

1. **Test monitoring commands**:

   ```
   /monitor-status        # Bot and database status
   /monitor-services      # External services health
   /monitor-deployments   # GitHub + Vercel deployments (once implemented)
   ```

2. **Implement monitoring integrations**:
   - See [WO-006](../trinity/work-orders/WO-006-security-monitoring-automation.md) for Rollbar/Sentry
   - See Phase 4 notes for enhancing API monitoring

3. **Set up alerts**:
   - Configure Discord notifications for deployment failures
   - Set up error rate alerts in Rollbar
   - Create uptime alerts for critical services

---

**Last Updated**: 2025-11-10
**Maintained By**: Trinity Method Documentation System
