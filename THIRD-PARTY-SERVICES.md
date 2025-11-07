# Third-Party Services

This document lists all external services integrated with Sunny Stack, their security implications, and data handling practices.

## Table of Contents

- [Overview](#overview)
- [Authentication Services](#authentication-services)
- [Communication Services](#communication-services)
- [Hosting & Infrastructure](#hosting--infrastructure)
- [Development & CI/CD](#development--cicd)
- [Monitoring & Analytics](#monitoring--analytics)
- [Data Protection Summary](#data-protection-summary)
- [Compliance](#compliance)

---

## Overview

Sunny Stack integrates with **10 external services** to provide functionality. This document details:

- **Service Purpose**: Why we use this service
- **Data Shared**: What information is transmitted
- **Security Controls**: Encryption, authentication, access controls
- **Data Retention**: How long data is stored
- **Privacy Policy**: Link to service provider's privacy policy
- **Compliance**: Certifications and standards (SOC 2, GDPR, etc.)

---

## Authentication Services

### 1. Google OAuth (via NextAuth.js)

**Provider:** Google LLC

**Purpose:** User authentication for admin dashboard access

**Data Shared with Google:**

- Email address (ADMIN_EMAIL only)
- Google account profile information (name, profile picture)
- OAuth 2.0 authorization tokens

**Data Flow:**

```
User → Google OAuth Consent → Google Auth Servers → NextAuth.js → Sunny Stack
```

**Security Controls:**

- **Encryption**: HTTPS/TLS 1.3 for all communications
- **Authentication**: OAuth 2.0 protocol with client ID/secret
- **Access Control**: Only ADMIN_EMAIL can access admin dashboard
- **Token Storage**: Encrypted session cookies (httpOnly, secure, sameSite)
- **Token Expiration**: 30-day refresh token, 1-hour access token

**Data Retention:**

- **Sunny Stack**: Session data stored for 30 days
- **Google**: Per Google's data retention policies

**Privacy Policy:** [https://policies.google.com/privacy](https://policies.google.com/privacy)

**Compliance:** SOC 2, ISO 27001, GDPR compliant

**Configuration Variables:**

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `NEXTAUTH_SECRET`

---

## Communication Services

### 2. Resend (Email API)

**Provider:** Resend Inc.

**Purpose:** Send transactional emails (contact form submissions, quote requests)

**Data Shared with Resend:**

- Sender email address (form submissions)
- Recipient email address (your admin email)
- Email content (contact form messages, quote details)
- Metadata (timestamp, delivery status)

**Data Flow:**

```
User Form Submission → Vercel API Route → Resend API → Email Delivery
```

**Security Controls:**

- **Encryption**: TLS 1.2+ for API communications
- **Authentication**: API key authentication (RESEND_API_KEY)
- **Access Control**: API key restricted to Vercel deployment
- **Rate Limiting**: Resend's built-in rate limiting
- **SPF/DKIM**: Email authentication configured

**Data Retention:**

- **Resend**: Email metadata retained for 30 days (configurable)
- **Email Content**: Not stored by Resend after delivery

**Privacy Policy:** [https://resend.com/legal/privacy-policy](https://resend.com/legal/privacy-policy)

**Compliance:** SOC 2 Type II, GDPR compliant

**Configuration Variables:**

- `RESEND_API_KEY`

---

### 3. Discord (Bot Integration)

**Provider:** Discord Inc.

**Purpose:** Project management automation, notifications, and client communication

**Data Shared with Discord:**

- Bot messages (quotes, project updates, notifications)
- Discord server/channel IDs
- User IDs (for command authorization)
- Message content (commands and responses)

**Data Flow:**

```
Discord User → Discord Gateway → Pi Bot → Vercel API → Discord Gateway → Discord User
```

**Security Controls:**

- **Encryption**: WSS (WebSocket Secure) for Gateway API
- **Authentication**: Bot token authentication (DISCORD_BOT_TOKEN)
- **Access Control**: Admin-only commands restricted by DISCORD_ADMIN_USER_ID
- **Permissions**: Bot uses minimal required permissions
- **Secret Management**: Bot token stored securely, never logged

**Data Retention:**

- **Discord**: Messages stored per Discord's retention policy
- **Sunny Stack**: No message content stored locally

**Privacy Policy:** [https://discord.com/privacy](https://discord.com/privacy)

**Compliance:** SOC 2 Type II, GDPR compliant

**Configuration Variables:**

- `DISCORD_BOT_TOKEN`
- `DISCORD_APPLICATION_ID`
- `DISCORD_GUILD_ID`
- `DISCORD_ADMIN_USER_ID`
- `DISCORD_CHANNEL_*` (various channel IDs)

---

## Hosting & Infrastructure

### 4. Vercel (Website + API Hosting)

**Provider:** Vercel Inc.

**Purpose:** Host Next.js website and API routes with global CDN

**Data Shared with Vercel:**

- Website source code (public repository)
- Environment variables (DATABASE_URL, API keys)
- Request logs (IP addresses, user agents, request paths)
- Build logs and deployment metadata
- API response times and performance metrics

**Data Flow:**

```
User Request → Vercel Edge Network → Next.js App → PostgreSQL on Pi
```

**Security Controls:**

- **Encryption**: TLS 1.3 for all connections
- **DDoS Protection**: Vercel's built-in DDoS mitigation
- **Environment Variables**: Encrypted at rest and in transit
- **Access Control**: Team-based access control
- **Firewall**: Edge network firewall rules
- **Security Headers**: CSP, HSTS, X-Frame-Options configured

**Data Retention:**

- **Logs**: 30 days (Hobby plan) / configurable (Pro plan)
- **Deployments**: Unlimited retention for active projects

**Privacy Policy:** [https://vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy)

**Compliance:** SOC 2 Type II, GDPR compliant

**Configuration:** Vercel Dashboard environment variables

---

### 5. PostgreSQL (Self-Hosted on Raspberry Pi)

**Provider:** Self-hosted (PostgreSQL open-source project)

**Purpose:** Primary application database

**Data Stored:**

- Quote requests (name, email, phone, project details)
- Project data (titles, descriptions, status)
- Time entries (hours, dates, notes)
- Proposal metadata (PDF URLs, status)

**Data Flow:**

```
Vercel API → External IP:5432 → Pi PostgreSQL Container
Bot Container → Internal Docker Network → Pi PostgreSQL Container
```

**Security Controls:**

- **Encryption**: SSL/TLS connections required
- **Authentication**: Password-based authentication (64-character passwords)
- **Access Control**: Database user with limited privileges
- **Network Security**: Port 5432 exposed only to trusted IPs (Vercel + admin)
- **Container Isolation**: Docker security namespaces
- **Backups**: Regular automated backups (see deployment docs)

**Data Retention:**

- **Active Data**: Retained indefinitely
- **Deleted Data**: Soft deletes with 90-day retention
- **Backups**: 30-day retention policy

**Privacy Policy:** N/A (self-hosted)

**Compliance:** GDPR compliant (self-managed)

**Configuration Variables:**

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `DATABASE_URL`

---

### 6. Raspberry Pi (Self-Hosted Infrastructure)

**Provider:** Self-hosted (Raspberry Pi OS)

**Purpose:** Host PostgreSQL database and Discord bot containers

**Data Stored:**

- PostgreSQL database files
- Docker container images
- Application logs
- Environment variables (.env.production)

**Security Controls:**

- **SSH Access**: Key-based authentication only (no password login)
- **Firewall**: UFW configured to allow only required ports
- **Auto-Updates**: Unattended upgrades enabled
- **Container Security**: Docker security best practices
- **Physical Security**: Secured hardware location
- **Monitoring**: Health checks and uptime monitoring

**Data Retention:**

- **Database**: Persistent storage on SSD
- **Logs**: Rotated logs (3 files, 10-50MB each)

**Privacy Policy:** N/A (self-hosted)

**Compliance:** GDPR compliant (self-managed)

**Configuration:** SSH keys stored in GitHub Secrets

---

## Development & CI/CD

### 7. GitHub (Version Control & CI/CD)

**Provider:** GitHub Inc. (Microsoft)

**Purpose:** Source code hosting, version control, CI/CD automation

**Data Shared with GitHub:**

- Source code (public repository)
- Commit history and authorship
- Issue/PR discussions
- GitHub Actions logs
- Secrets (encrypted environment variables)

**Data Flow:**

```
Developer → Git Push → GitHub → GitHub Actions → Raspberry Pi Deployment
```

**Security Controls:**

- **Encryption**: TLS 1.3 for Git operations
- **Authentication**: SSH keys or personal access tokens
- **Access Control**: Branch protection rules, required reviews
- **Secrets Management**: GitHub Secrets (encrypted at rest)
- **Secret Scanning**: Gitleaks + TruffleHog pre-commit hooks
- **Dependency Scanning**: Dependabot alerts enabled

**Data Retention:**

- **Code**: Indefinite retention
- **Actions Logs**: 90 days
- **Artifacts**: 90 days (default)

**Privacy Policy:** [https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)

**Compliance:** SOC 2 Type II, ISO 27001, GDPR compliant

**Configuration Variables (GitHub Secrets):**

- `PI_HOST`
- `PI_USERNAME`
- `PI_SSH_KEY`
- `PI_SSH_PORT`
- `DISCORD_WEBHOOK_URL`

---

### 8. Docker Hub (Container Registry)

**Provider:** Docker Inc.

**Purpose:** Host Docker base images for PostgreSQL and bot containers

**Data Shared with Docker Hub:**

- Pull requests for public images (postgres:15-alpine)
- IP addresses of Pi accessing registry

**Data Flow:**

```
Raspberry Pi → Docker Hub → Pull postgres:15-alpine Image
```

**Security Controls:**

- **Encryption**: HTTPS for image downloads
- **Image Verification**: Official images verified by Docker
- **Pull Rate Limiting**: Docker Hub rate limits applied

**Data Retention:**

- **Images**: Indefinite retention for official images
- **Pull Logs**: Per Docker Hub's retention policy

**Privacy Policy:** [https://www.docker.com/legal/privacy/](https://www.docker.com/legal/privacy/)

**Compliance:** SOC 2, GDPR compliant

**Configuration:** No credentials required (public images)

---

### 9. GitHub Actions (CI/CD Automation)

**Provider:** GitHub Inc. (Microsoft)

**Purpose:** Automated deployment to Raspberry Pi

**Data Shared with GitHub Actions:**

- Source code (for build)
- Environment secrets (for deployment)
- Build logs and deployment status
- Workflow execution metadata

**Data Flow:**

```
Push to main → GitHub Actions Trigger → SSH to Pi → Deploy Containers
```

**Security Controls:**

- **Encryption**: TLS 1.3 for all communications
- **Authentication**: SSH key authentication to Pi
- **Access Control**: Workflow permissions limited to deployments
- **Secrets Management**: GitHub Secrets encrypted at rest
- **Audit Logs**: All workflow runs logged

**Data Retention:**

- **Logs**: 90 days
- **Artifacts**: 90 days

**Privacy Policy:** [https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)

**Compliance:** SOC 2 Type II, ISO 27001, GDPR compliant

**Configuration:** `.github/workflows/deploy-bot.yml`

---

## Monitoring & Analytics

### 10. Vercel Analytics (Optional)

**Provider:** Vercel Inc.

**Purpose:** Website performance monitoring and analytics

**Data Shared with Vercel:**

- Page views and route paths
- Performance metrics (Web Vitals)
- User agent strings
- Anonymized visitor data

**Data Flow:**

```
User Interaction → Vercel Edge → Analytics Dashboard
```

**Security Controls:**

- **Encryption**: TLS 1.3
- **Privacy**: No personal identifiable information collected
- **Anonymization**: IP addresses anonymized
- **Opt-out**: Respect Do Not Track headers

**Data Retention:**

- **Analytics Data**: 30 days (Hobby plan)

**Privacy Policy:** [https://vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy)

**Compliance:** GDPR compliant (anonymized data)

**Configuration:** Optional (enable in Vercel dashboard)

---

## Data Protection Summary

### Encryption Standards

| Service      | In Transit | At Rest                    |
| ------------ | ---------- | -------------------------- |
| Google OAuth | TLS 1.3    | AES-256                    |
| Resend       | TLS 1.2+   | AES-256                    |
| Discord      | WSS        | Encrypted by Discord       |
| Vercel       | TLS 1.3    | AES-256                    |
| PostgreSQL   | SSL/TLS    | Unencrypted (local disk)\* |
| GitHub       | TLS 1.3    | AES-256                    |

\*Note: PostgreSQL data at rest encryption can be enabled via LUKS or similar on Pi SSD

### Data Classification

| Data Type         | Classification | Services Accessing              |
| ----------------- | -------------- | ------------------------------- |
| User Emails       | PII            | Resend, Google OAuth            |
| Quote Requests    | PII            | PostgreSQL, Vercel API, Discord |
| Admin Credentials | Sensitive      | Google OAuth, NextAuth.js       |
| API Keys          | Secrets        | All services (encrypted)        |
| Project Data      | Confidential   | PostgreSQL, Vercel, Discord     |

### Third-Party Access

**Who can access your data?**

- **Sunny Stack Admin**: Full access to all data
- **Vercel**: Access to logs and environment variables
- **Google**: Access to OAuth profile data
- **Resend**: Access to email content during transmission
- **Discord**: Access to bot messages and commands
- **GitHub**: Access to source code and CI/CD logs

**Who CANNOT access your data?**

- Third-party analytics providers (not enabled)
- Advertisers (no ads)
- Data brokers (no data sharing)

---

## Compliance

### GDPR Compliance

Sunny Stack is designed with GDPR principles in mind:

- **Data Minimization**: Only collect necessary data
- **Purpose Limitation**: Data used only for stated purposes
- **Storage Limitation**: Retention policies defined
- **Right to Access**: Users can request their data
- **Right to Erasure**: Users can request data deletion
- **Data Portability**: Data can be exported
- **Consent**: Explicit consent for data collection (contact forms)

### Data Subject Rights

Users have the right to:

- **Access**: Request a copy of their data
- **Rectification**: Correct inaccurate data
- **Erasure**: Request deletion of their data
- **Portability**: Export data in machine-readable format
- **Objection**: Object to data processing

To exercise these rights, contact: luka@sunny-stack.com

### Service Provider Compliance

| Service      | SOC 2 | ISO 27001 | GDPR | HIPAA |
| ------------ | ----- | --------- | ---- | ----- |
| Google OAuth | ✅    | ✅        | ✅   | ❌    |
| Resend       | ✅    | ❌        | ✅   | ❌    |
| Discord      | ✅    | ❌        | ✅   | ❌    |
| Vercel       | ✅    | ❌        | ✅   | ❌    |
| GitHub       | ✅    | ✅        | ✅   | ❌    |
| Docker Hub   | ✅    | ❌        | ✅   | ❌    |

---

## Security Considerations

### Recommended Actions

1. **Review Privacy Policies**: Read linked privacy policies for all services
2. **Minimize Data Sharing**: Only enable necessary integrations
3. **Rotate Secrets**: Follow [SECRETS-ROTATION.md](docs/deployment/SECRETS-ROTATION.md)
4. **Monitor Access**: Review service access logs regularly
5. **Update Dependencies**: Keep all packages and services updated

### Risk Assessment

| Service      | Risk Level | Mitigation                                   |
| ------------ | ---------- | -------------------------------------------- |
| Google OAuth | Low        | OAuth 2.0 protocol, limited scope            |
| Resend       | Low        | Transactional emails only, no storage        |
| Discord      | Medium     | Bot token rotation, admin-only commands      |
| Vercel       | Low        | Encrypted environment variables              |
| PostgreSQL   | Medium     | SSL required, password authentication        |
| GitHub       | Low        | SSH keys, branch protection, secret scanning |

---

## Questions?

For questions about third-party services or data handling:

- **Email**: luka@sunny-stack.com
- **Documentation**: [SECURITY.md](SECURITY.md)
- **Secrets Rotation**: [SECRETS-ROTATION.md](docs/deployment/SECRETS-ROTATION.md)

---

**Last Updated:** 2025-11-06
**Document Version:** 1.0.0
