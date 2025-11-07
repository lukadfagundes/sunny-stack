# Security Policy

## Supported Versions

We actively maintain and support the following versions of Sunny Stack:

| Version | Support Status | Security Updates |
| ------- | -------------- | ---------------- |
| 1.0.x   | ✅ Supported   | Active           |
| < 1.0   | ❌ Unsupported | None             |

**Current Production Version:** v1.0.0

Security patches are released as needed for the current major version. We recommend always running the latest stable release.

## Reporting a Vulnerability

We take security seriously and appreciate your efforts to responsibly disclose vulnerabilities.

### How to Report

**Preferred Methods:**

1. **Email:** luka@sunny-stack.com
2. **Contact Form:** [https://sunny-stack.com/contact](https://sunny-stack.com/contact) with subject "Security Vulnerability Report"

**Please DO NOT:**

- Open public GitHub issues for security vulnerabilities
- Disclose vulnerabilities publicly before coordination with our team
- Exploit vulnerabilities for malicious purposes

### What to Include

To help us understand and address the issue quickly, please include:

- **Description**: Clear explanation of the vulnerability
- **Impact**: What could an attacker accomplish?
- **Reproduction Steps**: Detailed steps to reproduce the issue
- **Affected Components**: Which part of the system is affected?
- **Proof of Concept**: Code/screenshots demonstrating the vulnerability (if applicable)
- **Suggested Fix**: If you have recommendations (optional)

### Response Timeline

| Stage                  | Timeline             | Description                          |
| ---------------------- | -------------------- | ------------------------------------ |
| **Acknowledgment**     | 24-48 hours          | We'll confirm receipt of your report |
| **Initial Assessment** | 3-5 business days    | We'll validate and assess severity   |
| **Status Update**      | Weekly               | Regular updates on progress          |
| **Resolution**         | See severity table   | Fix deployed to production           |
| **Public Disclosure**  | After fix deployment | Coordinated disclosure with reporter |

**Resolution Timelines by Severity:**

- **Critical:** 7-14 days
- **High:** 14-30 days
- **Medium/Low:** 30-60 days

### Severity Classification

We use the following severity levels based on CVSS scoring:

- **Critical (9.0-10.0)**: Immediate attention, patches within 7 days
- **High (7.0-8.9)**: High priority, patches within 14 days
- **Medium (4.0-6.9)**: Normal priority, patches within 30 days
- **Low (0.1-3.9)**: Low priority, patches within 60 days

## Scope

### In-Scope Components

Security testing is welcome and encouraged on the following:

| Component           | Description                        | Location                 |
| ------------------- | ---------------------------------- | ------------------------ |
| **Next.js Website** | Portfolio website and public pages | app/                     |
| **API Routes**      | Backend API endpoints              | app/api/                 |
| **Discord Bot**     | Discord integration service        | bot/                     |
| **Database Layer**  | PostgreSQL data access via Prisma  | prisma/                  |
| **Authentication**  | NextAuth.js Google OAuth flow      | app/api/auth/            |
| **Contact Forms**   | Quote and contact submission forms | app/contact/, app/quote/ |
| **Admin Dashboard** | Authenticated admin interface      | app/admin-{hash}/        |

### Out-of-Scope

Please **do not** test the following:

- Third-party services (Google APIs, Resend, Vercel, Discord)
- Social engineering attacks against project maintainers
- Physical attacks against infrastructure
- Denial of Service (DoS) attacks
- Automated vulnerability scanning without prior approval
- Brute force attacks against authentication

### Safe Harbor

We commit to:

- Not pursue legal action against researchers who:
  - Follow this disclosure policy
  - Act in good faith
  - Do not exploit vulnerabilities for personal gain
  - Do not harm users or degrade service quality
- Work with you to understand and resolve issues
- Publicly acknowledge your contribution (with your permission)

## Security Update Policy

### Update Distribution

Security updates are distributed through:

1. **Production Deployment:**
   - Vercel (website + API) - Automatic deployment on merge to `main`
   - Raspberry Pi (database + bot) - Manual deployment via GitHub Actions

2. **Security Advisories:**
   - GitHub Security Advisories (if applicable)
   - SECURITY.md updates in repository
   - Notification to affected users (if user data compromised)

### Notification Channels

Critical security updates will be announced via:

- GitHub releases with security tags
- Project README.md changelog section
- Email notifications to registered users (if applicable)

## Security Best Practices

### For Users

If you're deploying your own instance of Sunny Stack:

- **Keep Updated**: Always run the latest stable version
- **Environment Variables**: Never commit `.env` files to version control
- **Database Security**: Use strong passwords (64+ characters recommended)
- **API Keys**: Rotate secrets regularly (see [SECRETS-ROTATION.md](docs/deployment/SECRETS-ROTATION.md))
- **HTTPS Only**: Always use HTTPS in production
- **Access Control**: Limit admin access to trusted individuals only
- **Monitoring**: Enable logging and monitor for suspicious activity

### For Contributors

- **Code Review**: All code changes require review before merge
- **Dependency Updates**: Keep dependencies updated and audit for vulnerabilities
- **Input Validation**: Sanitize all user inputs
- **Secrets Scanning**: Pre-commit hooks prevent secret commits (see `.pre-commit-config.yaml`)
- **Testing**: Write security tests for authentication and authorization flows

## Bug Bounty Program

**Current Status:** No formal bug bounty program

We currently do not offer monetary rewards for vulnerability reports. However:

- We deeply appreciate security research contributions
- Researchers will be acknowledged in our Hall of Fame (with permission)
- We may offer recognition or swag for significant findings

We may establish a formal bug bounty program in the future.

## Hall of Fame

We recognize and thank the following security researchers for their responsible disclosure:

_No reports submitted yet_

---

**Want to contribute to security?** Review our [THIRD-PARTY-SERVICES.md](THIRD-PARTY-SERVICES.md) and [SECRETS-ROTATION.md](docs/deployment/SECRETS-ROTATION.md) documentation.

**Questions?** Contact us at luka@sunny-stack.com

---

**Last Updated:** 2025-11-06
**Policy Version:** 1.0.0
