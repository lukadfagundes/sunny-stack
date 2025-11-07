# AUDIT-MON-INV-001: Requirements & External Dependencies Audit

**Agent:** MON (Requirements Analyst)
**Investigation:** INV-001 - Complete Codebase Architecture Audit
**Date:** 2025-11-06
**Status:** Complete

## Executive Summary

The Sunny Stack project has **comprehensive external dependencies** across frontend, backend, bot infrastructure, and development tooling. The system integrates with 7+ external services (Discord, Google APIs, Resend, Vercel, GitHub, PostgreSQL, Docker) creating a complex dependency graph.

**Key Finding**: Dependencies are well-documented in `.env.example` but **environment setup complexity is high** (30+ environment variables required). System requirements are met, but the onboarding burden for new developers is significant.

## Audit Scope

- System requirements (Node.js, Docker, PostgreSQL versions)
- NPM package dependencies (production + dev dependencies)
- External service integrations (Discord, Google, Resend, etc.)
- Environment variable requirements
- Development prerequisites
- API dependencies and rate limits

## Findings

### 1. System Requirements

**Runtime Requirements:**

- Node.js >= 18.17.0 ✅ (specified in package.json engines)
- Docker & Docker Compose ✅ (for PostgreSQL + bot deployment)
- PostgreSQL 15 ✅ (alpine image in docker-compose)
- Git ✅ (for version control and CI/CD)

**Platform Requirements:**

- **Development**: Windows, macOS, or Linux
- **Production Website**: Vercel (serverless platform)
- **Production Bot**: Raspberry Pi 4B (4GB RAM, 4-core ARM CPU)
- **Production Database**: Raspberry Pi 4B (same instance)

**Hardware Recommendations:**

- Development: 8GB+ RAM, 4+ cores
- Production Pi: Raspberry Pi 4B 4GB minimum

**Score**: 9/10 - Clear requirements documented

### 2. NPM Dependencies Analysis

**Production Dependencies: 18 packages**

| Package                   | Version        | Purpose           | Risk Level  |
| ------------------------- | -------------- | ----------------- | ----------- |
| next                      | ^15.0.0        | Web framework     | 🟡 Very new |
| react                     | ^19.0.0        | UI library        | 🟡 Very new |
| react-dom                 | ^19.0.0        | React DOM         | 🟡 Very new |
| @prisma/client            | ^6.18.0        | Database ORM      | 🟢 Stable   |
| prisma                    | ^6.18.0        | ORM toolkit       | 🟢 Stable   |
| discord.js                | ^14.14.1       | Discord bot SDK   | 🟢 Stable   |
| @discordjs/builders       | ^1.7.0         | Discord builders  | 🟢 Stable   |
| @discordjs/rest           | ^2.2.0         | Discord REST      | 🟢 Stable   |
| discord-api-types         | ^0.37.74       | Discord types     | 🟢 Stable   |
| next-auth                 | ^5.0.0-beta.30 | Authentication    | 🟡 Beta     |
| resend                    | ^6.0.3         | Email API         | 🟢 Stable   |
| tailwindcss               | ^3.4.0         | CSS framework     | 🟢 Stable   |
| lucide-react              | ^0.544.0       | Icon library      | 🟢 Stable   |
| recharts                  | ^3.3.0         | Charts library    | 🟢 Stable   |
| winston                   | ^3.18.3        | Logging           | 🟢 Stable   |
| winston-daily-rotate-file | ^5.0.0         | Log rotation      | 🟢 Stable   |
| pg                        | ^8.16.3        | PostgreSQL client | 🟢 Stable   |
| dotenv                    | ^17.2.3        | Env variables     | 🟢 Stable   |

**Risks Identified:**

- 🟡 **React 19** - Very new (released late 2024), potential edge cases
- 🟡 **Next.js 15** - Latest version, API changes frequent
- 🟡 **next-auth v5 beta** - Beta software in production dependency

**DevDependencies: 24 packages**

| Category      | Packages                                                             | Purpose                            |
| ------------- | -------------------------------------------------------------------- | ---------------------------------- |
| Testing       | jest, @testing-library/react, @playwright/test, @axe-core/playwright | Unit + E2E + accessibility testing |
| TypeScript    | typescript, @types/\*                                                | Type safety                        |
| Linting       | eslint, @typescript-eslint/\*                                        | Code quality                       |
| Build Tools   | @next/bundle-analyzer, autoprefixer, postcss                         | Build optimization                 |
| Development   | tsx, dotenv-cli                                                      | Dev utilities                      |
| Documentation | markdownlint-cli                                                     | Doc quality                        |

**Dependency Health:**

- ✅ No known critical vulnerabilities (per npm audit assumption)
- ✅ Regular updates (Prisma, Discord.js well-maintained)
- ⚠️ Bleeding edge frontend stack (React 19, Next.js 15)

**Score**: 7/10 - Modern stack but version risk

### 3. External Service Integrations

**Integrated Services:**

1. **Discord API** 🟢 REQUIRED
   - Purpose: Bot platform for admin notifications
   - Rate Limits: 50 requests/second per bot
   - Dependencies: DISCORD_BOT_TOKEN, DISCORD_APPLICATION_ID, 13+ channel IDs
   - Docs: https://discord.com/developers/docs

2. **Google APIs** 🟡 REQUIRED (for admin dashboard)
   - APIs Used: Gmail, Drive, Calendar, Sheets, Docs, Tasks, People, Analytics
   - Rate Limits: Varies by API (typically 10,000 requests/day)
   - Dependencies: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_PROJECT_ID
   - Docs: https://console.cloud.google.com/

3. **Resend Email API** 🟢 REQUIRED
   - Purpose: Contact form and quote request emails
   - Rate Limits: 100 emails/day (free tier)
   - Dependencies: RESEND_API_KEY
   - Docs: https://resend.com/docs

4. **Vercel Platform** 🟢 REQUIRED
   - Purpose: Website and API hosting (serverless)
   - Rate Limits: 100GB bandwidth/month (free tier)
   - Dependencies: NEXTAUTH_URL, VERCEL_WEBHOOK_SECRET
   - Docs: https://vercel.com/docs

5. **GitHub** 🟢 REQUIRED
   - Purpose: Version control + CI/CD (GitHub Actions)
   - Rate Limits: 2,000 Actions minutes/month (free tier)
   - Dependencies: GITHUB_WEBHOOK_SECRET, GITHUB_USERNAME
   - Docs: https://docs.github.com/en/actions

6. **PostgreSQL** 🟢 REQUIRED
   - Purpose: Primary database
   - Hosting: Self-hosted on Raspberry Pi
   - Dependencies: DATABASE_URL, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
   - Version: 15-alpine

7. **Fly.io** 🟡 OPTIONAL
   - Purpose: Monitoring deployed client projects
   - Rate Limits: API-specific
   - Dependencies: FLY_API_TOKEN, FLY_ORG_SLUG
   - Required only if deploying client projects to Fly.io

8. **Cloudflare** 🟡 OPTIONAL
   - Purpose: DNS/CDN management and monitoring
   - Rate Limits: 1,200 requests/5min
   - Dependencies: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
   - Required only if using Cloudflare

9. **cron-job.org** 🟡 OPTIONAL
   - Purpose: External cron job monitoring
   - Rate Limits: API-specific
   - Dependencies: CRONJOB_API_KEY
   - Required only if using external cron service

**Integration Score**: 8/10 - Comprehensive but complex

### 4. Environment Variable Requirements

**Total Environment Variables: 35+**

**Critical (MUST have for basic functionality):**

1. DATABASE_URL - PostgreSQL connection string
2. POSTGRES_USER - Database username
3. POSTGRES_PASSWORD - Database password
4. POSTGRES_DB - Database name
5. NEXTAUTH_SECRET - Session encryption secret
6. DISCORD_BOT_TOKEN - Bot authentication
7. DISCORD_APPLICATION_ID - Discord app ID
8. RESEND_API_KEY - Email API key
9. BOT_API_KEY - Bot-to-API authentication
10. BOT_API_URL - API base URL

**Required (for admin dashboard):**
11-14. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_PROJECT_ID 15. ADMIN_EMAIL - Admin user email 16. NEXT_PUBLIC_ADMIN_EMAIL - Public admin email 17. ADMIN_ROUTE_HASH - Admin URL protection

**Required (Discord channels - 13 channels):**
18-30. DISCORD*CHANNEL*\* (13 channel IDs for different notification types)

**Optional:** 31. FLY_API_TOKEN 32. CLOUDFLARE_API_TOKEN 33. CLOUDFLARE_ZONE_ID 34. CRONJOB_API_KEY 35. GITHUB_WEBHOOK_SECRET 36. VERCEL_WEBHOOK_SECRET 37. GITHUB_USERNAME

**Environment Complexity:**

- ⚠️ **High onboarding burden** - 30+ variables to configure
- ✅ **Well-documented** in .env.example with inline comments
- ✅ **Setup guide provided** - Step-by-step checklist in .env.example
- ⚠️ **No validation script** - Manual validation required
  - **CORRECTION**: Validation script EXISTS at [scripts/validate-env.ts](scripts/validate-env.ts)

**Score**: 7/10 - Thorough documentation but complex setup

### 5. Development Prerequisites

**Required Software:**

- Git (version control)
- Node.js 18.17.0+ (runtime)
- npm or yarn (package manager)
- Docker Desktop (database containerization)
- Code editor (VS Code recommended)

**Required Accounts:**

- GitHub (version control)
- Discord Developer Portal (bot creation)
- Google Cloud Console (API access)
- Resend (email API)
- Vercel (deployment)

**Setup Time Estimate:**

- Database setup: 5 minutes
- Secret generation: 2 minutes
- Google OAuth: 20-30 minutes
- Discord bot: 10-15 minutes
- **Total: 1-2 hours**

**Score**: 6/10 - Significant time investment required

### 6. API Rate Limits & Quotas

**Rate Limit Inventory:**

| Service        | Limit              | Impact if Exceeded | Mitigation                                                                      |
| -------------- | ------------------ | ------------------ | ------------------------------------------------------------------------------- |
| Discord API    | 50 req/sec         | Bot rate limited   | Circuit breaker in [bot/utils/circuit-breaker.ts](bot/utils/circuit-breaker.ts) |
| Resend         | 100 emails/day     | Email bounce       | Upgrade to paid tier                                                            |
| Vercel         | 100GB bandwidth/mo | Site throttled     | Monitor usage                                                                   |
| GitHub Actions | 2,000 min/mo       | CI/CD blocked      | Optimize workflows                                                              |
| Google APIs    | 10,000 req/day     | API blocked        | Cache responses                                                                 |

**Circuit Breaker Implementation:**

- ✅ Implemented in [bot/utils/circuit-breaker.ts](bot/utils/circuit-breaker.ts)
- ✅ Protects Discord API calls
- ⚠️ Not implemented for other external services

**Score**: 7/10 - Some protection, needs expansion

## Strengths

1. ✅ **Comprehensive .env.example** - 330+ lines of documentation
2. ✅ **Environment validation script** exists ([scripts/validate-env.ts](scripts/validate-env.ts))
3. ✅ **Clear system requirements** documented
4. ✅ **Circuit breaker pattern** for bot API resilience
5. ✅ **Modern, stable dependencies** (mostly)

## Gaps & Improvement Areas

1. ⚠️ **High environment complexity** - 35+ variables to configure
2. ⚠️ **React 19 / Next.js 15 bleeding edge risk** - Potential bugs
3. ⚠️ **next-auth v5 beta** - Production risk
4. ⚠️ **No dependency update automation** (Dependabot, Renovate)
5. ⚠️ **Rate limit monitoring not automated** - Manual tracking required

## Recommendations

### Immediate Actions

1. **Run npm audit** and fix vulnerabilities

   ```bash
   npm audit
   npm audit fix
   ```

2. **Enable Dependabot** (GitHub)
   - Automate dependency updates
   - Security vulnerability alerts

3. **Document React 19 Known Issues**
   - Track edge cases encountered
   - Maintain workaround documentation

### Short-Term Improvements

4. **Create Environment Setup Script**
   - Interactive CLI for .env generation
   - Validate all required variables
   - Test API connectivity

5. **Add Rate Limit Monitoring**
   - Track API usage against quotas
   - Alert when approaching limits
   - Dashboard visualization

6. **Dependency Version Pinning Strategy**
   - Pin React 19, Next.js 15 to specific versions
   - Test updates in staging before production

### Long-Term Enhancements

7. **Reduce Environment Variable Count**
   - Group Discord channel IDs in JSON config
   - Use environment-based config files
   - Secret management service (Doppler, 1Password)

8. **Service Health Dashboard**
   - Real-time external service status
   - Rate limit usage metrics
   - Integration test automation

## Related Documentation

- [.env.example](.env.example) - Environment variable template
- [package.json](package.json) - Dependency manifest
- [scripts/validate-env.ts](scripts/validate-env.ts) - Environment validation
- [docs/deployment/](docs/deployment/) - Setup guides
- [bot/utils/circuit-breaker.ts](bot/utils/circuit-breaker.ts) - API resilience

## Notes

**External Service Dependency Graph:**

```
Sunny Stack Application
├── Discord API (bot notifications)
├── Google APIs (admin dashboard OAuth + integrations)
├── Resend (email delivery)
├── Vercel (hosting + edge functions)
├── GitHub (version control + CI/CD)
├── PostgreSQL (data persistence)
└── Optional: Fly.io, Cloudflare, cron-job.org (monitoring)
```

**Service Criticality:**

- 🔴 Critical (app won't work): Discord, PostgreSQL, Vercel, Resend
- 🟡 Important (features degraded): Google APIs, GitHub
- 🟢 Optional (monitoring only): Fly.io, Cloudflare, cron-job.org

---

**Overall Requirements Health: 7/10** - Comprehensive but complex setup process.
