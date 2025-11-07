# Security Policy

Thank you for helping keep Sunny Stack secure! This document outlines our security policy and vulnerability reporting process.

---

## Quick Links

- **Full Security Policy:** [SECURITY.md](../SECURITY.md) (root directory)
- **Third-Party Services:** [THIRD-PARTY-SERVICES.md](../THIRD-PARTY-SERVICES.md)
- **Secrets Rotation:** [docs/deployment/SECRETS-ROTATION.md](../docs/deployment/SECRETS-ROTATION.md)

---

## Reporting a Vulnerability

**Please DO NOT open public GitHub issues for security vulnerabilities.**

### Preferred Reporting Methods

1. **Email:** luka@sunny-stack.com
2. **Contact Form:** [https://sunny-stack.com/contact](https://sunny-stack.com/contact) with subject "Security Vulnerability Report"

### What to Include

- Clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Proof of concept (if applicable)
- Suggested fix (optional)

---

## Response Timeline

| Stage                  | Timeline                       |
| ---------------------- | ------------------------------ |
| **Acknowledgment**     | 24-48 hours                    |
| **Initial Assessment** | 3-5 business days              |
| **Status Updates**     | Weekly                         |
| **Resolution**         | 7-60 days (severity dependent) |

---

## Supported Versions

| Version | Support Status |
| ------- | -------------- |
| 1.0.x   | ✅ Supported   |
| < 1.0   | ❌ Unsupported |

---

## Scope

### In-Scope

- Next.js website and API routes
- Discord bot application
- Database layer (Prisma/PostgreSQL)
- Authentication system (NextAuth.js)
- Contact and quote forms
- Admin dashboard

### Out-of-Scope

- Third-party services (Google, Resend, Vercel, Discord)
- Social engineering attacks
- Physical infrastructure attacks
- Denial of Service (DoS) attacks
- Automated scanning without approval

---

## Security Best Practices

For deployment security guidance:

- **SECURITY.md** - Comprehensive security policy
- **THIRD-PARTY-SERVICES.md** - External service security details
- **SECRETS-ROTATION.md** - Secret rotation procedures

---

## Error Monitoring

Production errors are monitored using **Rollbar** for rapid incident detection.

- **Mean Time to Detection (MTTD):** < 5 minutes
- **Error Dashboard:** Internal (contact maintainer for access)
- **Alerts:** Email + Discord webhook

All errors are logged with stack traces and context for efficient debugging.

## GitHub Security Features

This repository uses:

- **Dependabot Alerts** - Automated dependency vulnerability scanning
- **Dependabot Auto-Merge** - Automatic patch updates after tests pass
- **Secret Scanning** - Pre-commit hooks (Gitleaks, TruffleHog)
- **Code Scanning** - TypeScript strict mode and ESLint
- **Branch Protection** - Required reviews for main branch
- **Security Tests** - 29 automated OWASP Top 10 tests

---

## Safe Harbor

We commit to:

- Not pursuing legal action against good-faith security researchers
- Working collaboratively to resolve issues
- Publicly acknowledging your contribution (with permission)

---

## Questions?

Contact: luka@sunny-stack.com

For complete details, see [SECURITY.md](../SECURITY.md) in the root directory.

---

**Last Updated:** 2025-11-06
