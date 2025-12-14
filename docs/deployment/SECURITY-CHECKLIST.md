# Pre-Deployment Security Checklist

**Version:** 1.0.0
**Last Updated:** 2025-11-06
**Owner:** Luka D Fagundes

---

## Purpose

This checklist ensures that all security controls are in place before deploying code to production. Run this checklist before every major deployment to verify security posture and compliance.

**Estimated Time:** 20-30 minutes

---

## How to Use This Checklist

### Before Deployment

1. Run this checklist on **staging environment first**
2. Document completion date and reviewer
3. Fix any failures before production deployment
4. Keep a copy of completed checklist for audit trail

### During Deployment

1. Keep checklist accessible (printed or on second monitor)
2. Mark items as you verify them
3. Document any anomalies or warnings
4. If any item fails, **STOP deployment** and remediate

### After Deployment

1. Verify monitoring alerts received
2. Perform smoke tests (health check, key features)
3. File completed checklist in `trinity/deployments/YYYY-MM-DD-security-checklist.md`

### Frequency

- **Major Releases:** Full checklist required (all 18 items)
- **Minor Updates:** Abbreviated checklist (Testing + Monitoring sections only)
- **Hotfixes:** Critical sections only (Code Security + Testing)

### Automation

Items marked **[AUTO]** can be automated in CI/CD pipeline. See `.github/workflows/test.yml` for automated checks.

---

## Security Checklist

### 1. Code Security (5 items)

#### 1.1 No Hardcoded Secrets

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Search for common secret patterns
git grep -i "password\|secret\|key\|token" app/ lib/ bot/ | grep -v "test"

# Expected: Only references to environment variables, no actual secrets
# Example PASS: const apiKey = process.env.RESEND_API_KEY
# Example FAIL: const apiKey = "re_abc123xyz789"
```

**Manual Check:**

- Review new code commits for hardcoded credentials
- Check `.env` file is not committed (should be in `.gitignore`)
- Verify no API keys in error messages or logs

**Automated:** [AUTO] - Pre-commit hooks (gitleaks, trufflehog) prevent secret commits

**Failure Remediation:**

- Remove hardcoded secret from code
- Move to environment variable
- Rotate compromised secret immediately
- Force-push to remove from Git history: `git filter-branch` or `BFG Repo-Cleaner`

---

#### 1.2 Input Validation

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Verify validation functions exist and are used
grep -r "validate\|sanitize" lib/ | grep -E "email|phone|url|input"

# Expected: Validation functions present and imported
# Files to check:
# - lib/quote-validation.ts (sanitizeHtml, validateEmail, validatePhone)
# - app/api/send-quote/route.ts (input validation before processing)
```

**Manual Check:**

- **Contact Form:** Email validation, name sanitization
- **Quote Form:** All fields validated (email, phone, company, description)
- **API Routes:** `/api/send-quote`, `/api/admin/*` validate inputs
- **Admin Routes:** Authentication required, authorization checked

**Test:**

```bash
# Run validation tests
npm test -- __tests__/unit/validation.test.ts

# Expected: All validation tests passing
```

**Failure Remediation:**

- Add validation for unvalidated inputs
- Use `zod` or `yup` schemas for structured validation
- Sanitize HTML inputs with `sanitizeHtml()`
- Test validation with malicious payloads

---

#### 1.3 XSS Prevention

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Verify sanitization is used for user-generated content
grep -r "sanitizeHtml\|DOMPurify" lib/ app/

# Expected: sanitizeHtml() used in quote-validation.ts
# File: lib/quote-validation.ts
```

**Manual Check:**

- All user inputs sanitized before display
- React automatically escapes JSX (default protection)
- No `dangerouslySetInnerHTML` without sanitization
- No `eval()`, `Function()`, or `innerHTML` with user data

**Test:**

```bash
# Test XSS prevention
npm test -- __tests__/security/xss-prevention.test.ts

# Expected: XSS tests passing (script tags removed, HTML entities escaped)
```

**Failure Remediation:**

- Add `sanitizeHtml()` to all user-generated content
- Use React's built-in escaping (default)
- Add Content Security Policy headers (see 1.4)
- Test with XSS payloads: `<script>alert('XSS')</script>`

---

#### 1.4 SQL Injection Prevention

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Verify Prisma parameterized queries are used
grep -r "prisma\.\$queryRaw\|prisma\.\$executeRaw" prisma/ app/

# Expected: Only parameterized queries (Prisma.sql or template literals)
# FAIL if raw SQL without parameterization
```

**Manual Check:**

- **Prisma ORM:** All database queries use Prisma Client (parameterized by default)
- **No Raw SQL:** No `db.execute()` or `pg.query()` with string concatenation
- **Type Safety:** TypeScript types prevent SQL injection through Prisma

**Test:**

```bash
# Run SQL injection tests
npm test -- __tests__/security/injection-prevention.test.ts

# Expected: All injection tests passing
```

**Failure Remediation:**

- Replace raw SQL with Prisma queries
- If raw SQL required, use parameterized queries: `prisma.$queryRaw`SELECT \* FROM users WHERE id = ${userId}``
- Never concatenate user input into SQL strings

---

#### 1.5 Authentication/Authorization

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Verify protected routes use middleware
grep -r "withAuth\|getServerSession" app/api/admin/ app/admin-*/

# Expected: All admin routes use withAuth() or getServerSession()
# Files to check:
# - app/api/admin/*/route.ts
# - app/admin-*/page.tsx
```

**Manual Check:**

- **Admin Routes:** `/api/admin/*`, `/admin-*` require authentication
- **Session Validation:** `getServerSession(authOptions)` checks session
- **Role Check:** Admin routes verify `session.user.email === ADMIN_EMAIL`
- **Public Routes:** `/api/send-quote`, `/api/health` allow unauthenticated access

**Test:**

```bash
# Run authentication tests
npm test -- __tests__/security/access-control.test.ts

# Expected: All auth tests passing (401 Unauthorized, 403 Forbidden)
```

**Failure Remediation:**

- Add `withAuth()` middleware to unprotected admin routes
- Verify admin email check: `if (session.user.email !== process.env.ADMIN_EMAIL)`
- Test with non-admin user credentials
- Test without authentication (expect 401)

---

### 2. Configuration Security (4 items)

#### 2.1 .env Not Committed

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Verify .env is in .gitignore
grep "^.env$" .gitignore

# Expected: .env present in .gitignore

# Check Git history for .env commits
git log --all --full-history -- .env

# Expected: Empty output (no .env commits)
```

**Manual Check:**

- `.env` file not committed to repository
- `.env.example` provided with placeholder values
- Production secrets stored in Vercel dashboard (not Git)

**Automated:** [AUTO] - Pre-commit hooks prevent .env commits

**Failure Remediation:**

- Add `.env` to `.gitignore` immediately
- Remove from Git history: `git filter-branch --index-filter "git rm -rf --cached --ignore-unmatch .env" HEAD`
- Rotate all secrets in `.env` (assume compromised)
- Notify team if public repository

---

#### 2.2 Secrets Rotated

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Check last rotation date from SECRETS-ROTATION.md
grep "Last Rotated" docs/deployment/SECRETS-ROTATION.md

# Expected: API keys rotated within 90 days (quarterly)
# Expected: Database password rotated within 180 days (semi-annually)
```

**Manual Check:**

- Review [SECRETS-ROTATION.md](SECRETS-ROTATION.md) rotation log
- Verify API keys rotated quarterly:
  - `RESEND_API_KEY`
  - `BOT_API_KEY`
  - `GITHUB_TOKEN`
  - `DISCORD_BOT_TOKEN`
- Verify critical secrets rotated semi-annually:
  - `NEXTAUTH_SECRET`
  - `DATABASE_URL` (password component)

**Failure Remediation:**

- Rotate overdue secrets immediately per [SECRETS-ROTATION.md](SECRETS-ROTATION.md)
- Update rotation log with new dates
- Test services after rotation
- Set calendar reminder for next rotation

---

#### 2.3 Security Headers Active

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Test security headers on production
curl -I https://sunny-stack.com | grep -E "Content-Security-Policy|X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security|Referrer-Policy|Permissions-Policy"

# Expected headers:
# Content-Security-Policy: default-src 'self' ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Manual Check:**

- Open https://securityheaders.com and test production URL
- Expected grade: A or A+
- Review `next.config.js` headers configuration

**Test:**

```bash
# Run security header tests
npm test -- __tests__/security/security-headers.test.ts

# Expected: All header tests passing
```

**Failure Remediation:**

- Add missing headers to `next.config.js`
- Redeploy to production
- Verify with `curl -I` or securityheaders.com

---

#### 2.4 HTTPS Enforced

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Test HTTP redirects to HTTPS
curl -I http://sunny-stack.com | grep "301\|302"
curl -I http://sunny-stack.com | grep "Location: https"

# Expected: HTTP 301/302 redirect to HTTPS
```

**Manual Check:**

- Visit `http://sunny-stack.com` in browser (should redirect to HTTPS)
- Verify `next.config.js` redirects HTTP to HTTPS:
  ```javascript
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        permanent: true,
        destination: 'https://sunny-stack.com/:path*'
      }
    ];
  }
  ```
- Vercel enforces HTTPS by default

**Failure Remediation:**

- Enable HTTPS redirect in Vercel dashboard
- Add redirect in `next.config.js`
- Verify with `curl -I http://...`

---

### 3. Infrastructure Security (4 items)

#### 3.1 Non-Root Containers

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Check Dockerfile USER directive
grep "^USER" Dockerfile bot/Dockerfile

# Expected: USER node (not root)
```

**Manual Check:**

- Review `Dockerfile` and `bot/Dockerfile`
- Verify `USER node` directive present
- Verify containers don't run as root:
  ```bash
  docker exec sunny-stack-web whoami
  # Expected: node (not root)
  ```

**Failure Remediation:**

- Add `USER node` to Dockerfile before CMD
- Rebuild containers: `docker-compose -f docker-compose.prod.yml up -d --build`
- Verify with `docker exec [container] whoami`

---

#### 3.2 Backups Automated

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Test backup script
./scripts/backup-database.sh --test

# Expected: Backup created successfully, uploaded to Backblaze B2
```

**Manual Check:**

- Verify cron job scheduled: `crontab -l | grep backup-database`
  - Expected: Daily backup at 2am: `0 2 * * * /path/to/backup-database.sh`
- Check recent backups exist:
  ```bash
  ls -lh ~/backups/ | head -10
  # Expected: Daily backups (last 7 days)
  ```
- Verify cloud backups uploaded:
  ```bash
  b2 ls sunny-stack-backups | tail -10
  # Expected: 30-day retention, daily backups
  ```

**Failure Remediation:**

- Schedule cron job: `crontab -e`
- Add: `0 2 * * * /path/to/backup-database.sh`
- Run manual backup: `./scripts/backup-database.sh`
- Verify backup restoration: See [DATABASE-BACKUP-RESTORE.md](DATABASE-BACKUP-RESTORE.md)

---

#### 3.3 Firewall Configured

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Check UFW firewall status
sudo ufw status numbered

# Expected ports open:
# - 22/tcp (SSH) - Allow from specific IPs only
# - 443/tcp (HTTPS) - Allow from anywhere
# - 5432/tcp (PostgreSQL) - Allow from localhost only (deny external)
```

**Manual Check:**

- PostgreSQL port 5432 not accessible externally:
  ```bash
  nmap -p 5432 sunny-stack.com
  # Expected: filtered or closed (not open)
  ```
- SSH port 22 rate limited:
  ```bash
  sudo ufw status | grep 22/tcp
  # Expected: LIMIT 22/tcp (not ALLOW)
  ```

**Failure Remediation:**

- Enable UFW: `sudo ufw enable`
- Deny PostgreSQL external access: `sudo ufw deny 5432/tcp`
- Allow PostgreSQL localhost: Edit `postgresql.conf` to `listen_addresses = 'localhost'`
- Rate limit SSH: `sudo ufw limit 22/tcp`
- Allow HTTPS: `sudo ufw allow 443/tcp`

---

#### 3.4 SSH Secured

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Check SSH configuration
cat /etc/ssh/sshd_config | grep -E "PasswordAuthentication|PermitRootLogin|PubkeyAuthentication"

# Expected:
# PasswordAuthentication no
# PermitRootLogin no
# PubkeyAuthentication yes
```

**Manual Check:**

- SSH key-based authentication only (no password login)
- Root login disabled
- Test password login fails:
  ```bash
  ssh -o PreferredAuthentications=password root@sunny-stack.com
  # Expected: Permission denied (publickey)
  ```

**Failure Remediation:**

- Edit `/etc/ssh/sshd_config`:
  - Set `PasswordAuthentication no`
  - Set `PermitRootLogin no`
  - Set `PubkeyAuthentication yes`
- Restart SSH: `sudo systemctl restart sshd`
- Test with password (should fail)

---

### 4. Monitoring & Logging (3 items)

#### 4.1 Error Monitoring Active

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Test Rollbar error capture
curl -X POST https://sunny-stack.com/api/test-error

# Expected: Error captured in Rollbar dashboard
# Visit: https://rollbar.com/sunny-stack/errors
```

**Manual Check:**

- Rollbar receiving errors (check dashboard for recent errors)
- Email alerts configured for critical errors
- Discord webhook configured (optional)
- Test with intentional error:
  ```javascript
  // Add to test endpoint
  throw new Error("Test deployment - security checklist");
  ```
- Verify error appears in Rollbar within 1 minute

**Failure Remediation:**

- Verify `ROLLBAR_ACCESS_TOKEN` environment variable set
- Check Rollbar configuration in `app/layout.tsx`
- Re-deploy with correct token
- Test with `throw new Error()` in API route

---

#### 4.2 Security Logs Reviewed

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Check recent failed authentication attempts
sudo grep "authentication failed\|Failed password" /var/log/auth.log | tail -20

# Expected: Normal failed login attempts (not brute force pattern)
# Red flag: >10 failures from same IP in short timeframe
```

**Manual Check:**

- Review last 7 days of auth logs
- Check for suspicious IPs (multiple failures)
- Review admin route access attempts:
  ```bash
  grep "403 Forbidden" /var/log/nginx/access.log | tail -20
  # Or in Vercel logs
  ```
- Look for unusual traffic patterns

**Failure Remediation:**

- If brute force detected: Block IP with `sudo ufw deny from [ip]`
- Review logs weekly: Schedule reminder
- Enable automated alerts for failed auth spikes

---

#### 4.3 Alerts Configured

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Test Discord webhook
curl -X POST [DISCORD_WEBHOOK_URL] \
  -H "Content-Type: application/json" \
  -d '{"content": "Security checklist test - alerts working"}'

# Expected: Message appears in Discord channel
```

**Manual Check:**

- **Email Alerts:**
  - Rollbar sends critical error emails
  - GitHub sends security alert emails
  - Dependabot sends vulnerability emails
- **Discord Alerts:**
  - Quote form submissions notify Discord
  - Critical errors forwarded to Discord (optional)
- **Vercel Alerts:**
  - Deployment failures notify email

**Test Email Alert:**

```bash
# Trigger Rollbar critical error (test environment)
# Should send email to configured address
```

**Failure Remediation:**

- Configure Rollbar email notifications (critical errors)
- Add Discord webhook to bot configuration
- Enable GitHub notifications (Settings > Notifications)
- Test each alert channel

---

### 5. Documentation (2 items)

#### 5.1 SECURITY.md Published

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Verify SECURITY.md exists and is accessible
curl -I https://sunny-stack.com/SECURITY.md

# Expected: HTTP 200 OK (or 301 redirect to GitHub)
```

**Manual Check:**

- `SECURITY.md` file exists in repository root
- File contains:
  - Supported versions
  - Vulnerability reporting process
  - Contact email: luka@sunny-stack.com
  - Response timeline (24-48 hours)
  - Scope (in-scope components, out-of-scope)
- File is up-to-date (last updated within 90 days)

**Failure Remediation:**

- Create/update `SECURITY.md` from template
- Commit to repository
- Verify accessible at URL
- Add link to README.md

---

#### 5.2 Incident Response Ready

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Verify INCIDENT-RESPONSE.md exists
ls -lh docs/deployment/INCIDENT-RESPONSE.md

# Expected: File exists and is recent
```

**Manual Check:**

- [INCIDENT-RESPONSE.md](INCIDENT-RESPONSE.md) accessible to team
- Contact information up-to-date:
  - Incident Commander: Luka D Fagundes
  - Email: luka@sunny-stack.com
  - Emergency contact phone number
- Notification templates ready:
  - User notification email template
  - GDPR authority notification template
- Response workflow documented (5 phases)

**Failure Remediation:**

- Create INCIDENT-RESPONSE.md from template (WO-007-T2)
- Update contact information
- Review procedures with team
- Schedule quarterly tabletop exercises

---

### 6. Testing (4 items)

#### 6.1 All Tests Passing

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Run full test suite
npm test

# Expected: 1,063+ tests passing, 0 failures
```

**Automated:** [AUTO] - CI/CD runs tests on every commit

**Manual Check:**

- Review test output for warnings
- Check coverage report (if generated)
- Verify no skipped tests (`.skip`, `xit`)

**Failure Remediation:**

- Fix failing tests before deployment
- If tests fail intermittently, investigate flaky tests
- Rerun: `npm test -- --maxWorkers=1` (single thread)
- Do NOT deploy with failing tests

---

#### 6.2 Security Tests Passing

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Run security-specific tests
npm test -- __tests__/security/

# Expected: 29/29 tests passing
# Test suites:
# - access-control.test.ts (authentication/authorization)
# - csrf-protection.test.ts (CSRF tokens)
# - injection-prevention.test.ts (SQL injection, XSS)
# - rate-limiting.test.ts (API rate limits)
# - security-headers.test.ts (CSP, HSTS, etc.)
```

**Automated:** [AUTO] - CI/CD runs security tests

**Failure Remediation:**

- Review failed test details
- Fix security vulnerability
- Rerun tests
- Do NOT deploy with failing security tests

---

#### 6.3 Security Headers Validated

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Run security header tests
npm test -- __tests__/security/security-headers.test.ts

# Expected: All header tests passing
```

**Manual Check:**

- Test on staging: `curl -I https://staging.sunny-stack.com`
- Verify headers present:
  - `Content-Security-Policy`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Strict-Transport-Security`
  - `Referrer-Policy`
  - `Permissions-Policy`

**Failure Remediation:**

- Fix `next.config.js` headers configuration
- Redeploy to staging
- Re-test with `curl -I`
- Run tests again

---

#### 6.4 Vulnerability Scan Clean

**Status:** ☐ Pass | ☐ Fail

**Verification:**

```bash
# Run npm audit
npm audit

# Expected: 0 vulnerabilities (high/critical)
# Acceptable: Low/moderate vulnerabilities with documented exceptions
```

**Automated:** [AUTO] - Dependabot scans dependencies weekly

**Manual Check:**

- Review `npm audit` output
- Check Dependabot alerts on GitHub
- Verify no ignored high/critical vulnerabilities without justification

**Failure Remediation:**

- Update vulnerable packages: `npm audit fix`
- For unfixable vulnerabilities:
  - Review if package is actually used
  - Consider alternative packages
  - Document exception in ISSUES.md with risk assessment
  - Set reminder to re-check when fix available

---

## Deployment Approval

**Date:** **\*\***\_\_\_**\*\***

**Reviewer:** **\*\***\_\_\_**\*\***

**Deployment:** ☐ Production | ☐ Staging

**Commit SHA:** **\*\***\_\_\_**\*\***

**Checklist Status:** [___/18] items passed

### Failures

List any failed items or write "None":

1. [Item description or "None"]
2. [Item description or "None"]
3. [Item description or "None"]

### Remediation Actions Taken

1. [Action taken or "N/A"]
2. [Action taken or "N/A"]
3. [Action taken or "N/A"]

### Approval Decision

☐ **Approved for Deployment** - All items passed or failures remediated
☐ **Rejected** - Critical failures require fixes before deployment

**Signature:** \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

**Date:** **\*\***\_\_\_**\*\***

---

## Abbreviated Checklists

### Minor Updates (Quick Check)

For minor updates (dependency updates, content changes, bug fixes):

**Checklist (5 items):**

- [ ] 1.1 No Hardcoded Secrets
- [ ] 4.1 Error Monitoring Active
- [ ] 6.1 All Tests Passing
- [ ] 6.3 Security Headers Validated
- [ ] 6.4 Vulnerability Scan Clean

**Time:** 5-10 minutes

---

### Hotfix Checklist (Critical Path Only)

For urgent hotfixes:

**Checklist (3 items):**

- [ ] 1.1 No Hardcoded Secrets
- [ ] 6.1 All Tests Passing
- [ ] 6.2 Security Tests Passing

**Time:** 3-5 minutes

**Note:** Run full checklist post-hotfix within 24 hours

---

## Checklist Automation Roadmap

**Future Enhancements:**

- [ ] Automate checklist in GitHub Actions workflow
- [ ] Generate PDF report of checklist results
- [ ] Store completed checklists in Git (trinity/deployments/)
- [ ] Dashboard for checklist history and trends
- [ ] Slack/Discord notifications for checklist failures
- [ ] Integration with Vercel deployment hooks

---

## Related Documents

- [INCIDENT-RESPONSE.md](INCIDENT-RESPONSE.md) - Security incident procedures
- [SECRETS-ROTATION.md](SECRETS-ROTATION.md) - Credential rotation schedule
- [DATABASE-BACKUP-RESTORE.md](DATABASE-BACKUP-RESTORE.md) - Backup and recovery
- [SECURITY.md](../../SECURITY.md) - Vulnerability disclosure policy
- [PRIVACY.md](../../PRIVACY.md) - Privacy policy (draft)

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-06
**Next Review:** 2026-02-06
**Owner:** Luka D Fagundes
