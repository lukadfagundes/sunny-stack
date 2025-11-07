# Security Incident Response Plan

**Version:** 1.0.0
**Last Updated:** 2025-11-06
**Owner:** Luka D. Fagundes
**Review Frequency:** Quarterly

---

## Purpose

This document defines the procedures for detecting, responding to, and recovering from security incidents at Sunny Stack. It ensures consistent, effective incident handling and compliance with GDPR/CCPA notification requirements.

---

## Table of Contents

1. [Incident Classification](#incident-classification)
2. [Response Team](#response-team)
3. [Response Workflow](#response-workflow)
4. [Response Time SLAs](#response-time-slas)
5. [Notification Requirements](#notification-requirements)
6. [Communication Templates](#communication-templates)
7. [Evidence Preservation](#evidence-preservation)
8. [Post-Incident Actions](#post-incident-actions)
9. [Tabletop Exercise Schedule](#tabletop-exercise-schedule)
10. [Contact Information](#contact-information)

---

## Incident Classification

Security incidents are classified into four severity tiers to prioritize response efforts.

### Critical (Tier 1)

**Definition:** Incidents with severe impact to data confidentiality, integrity, or availability.

**Examples:**

- **Data Breach:** Database dump stolen, unauthorized access to personal data
- **Production Outage:** Website completely down or unavailable
- **Admin Access Compromise:** Unauthorized user gains admin access
- **Encryption Key Exposure:** NEXTAUTH_SECRET or database encryption keys leaked
- **Ransomware/Malware:** System infected with malicious software
- **Website Defacement:** Public-facing pages modified by attacker

**Immediate Response Required:** Within 1 hour

---

### High (Tier 2)

**Definition:** Incidents with significant impact but without immediate data loss.

**Examples:**

- **Service Degradation:** API response times >5 seconds, partial functionality loss
- **Attempted Breach:** Failed SQL injection, repeated failed login attempts (brute force)
- **Sustained DDoS:** Coordinated attack overwhelming servers
- **Data Exfiltration Attempt:** Suspicious database queries, bulk data download attempts
- **Privilege Escalation Attempt:** Non-admin user attempting to access admin routes
- **Suspicious Admin Activity:** Admin account used from unusual location/IP

**Response Required:** Within 4 hours

---

### Medium (Tier 3)

**Definition:** Incidents with potential risk but limited immediate impact.

**Examples:**

- **Suspicious Activity:** Unusual traffic patterns, port scanning
- **Minor Vulnerability Discovered:** Open redirect, misconfigured CORS, outdated dependency with CVE
- **Failed Authentication Spike:** Moderate increase in failed login attempts
- **Misconfiguration Detected:** Security headers missing, overly permissive firewall rules
- **Unpatched Dependency:** Dependabot alert for medium-severity vulnerability
- **Unauthorized Access Attempt:** Repeated 403 Forbidden responses from same IP

**Response Required:** Within 24 hours

---

### Low (Tier 4)

**Definition:** Incidents with minimal risk or false positives.

**Examples:**

- **Security Policy Violation:** User sharing credentials (education needed)
- **Failed Dependabot PR:** Auto-merge failed, manual review needed
- **Dev Secret in Test File:** Non-production secret committed (no production impact)
- **False Positive Alert:** Rollbar error that's actually expected behavior
- **Informational CVE:** Dependency vulnerability that doesn't affect our usage
- **Documentation Gap:** Security documentation missing or outdated

**Response Required:** Within 7 days

---

## Response Team

**Solo Developer Environment:** All roles filled by Luka D. Fagundes

### Incident Commander

**Responsibility:** Overall incident coordination and decision-making
**Primary Contact:** Luka D. Fagundes
**Phone:** [REDACTED - Emergency Contact]
**Email:** luka@sunny-stack.com

**Duties:**

- Declare incident severity and activate response plan
- Coordinate all response activities
- Make decisions on containment and recovery actions
- Authorize notifications to users and authorities
- Lead post-mortem meetings

---

### Technical Lead

**Responsibility:** Technical investigation and remediation
**Primary Contact:** Luka D. Fagundes
**Email:** luka@sunny-stack.com

**Duties:**

- Analyze logs and system state
- Identify attack vectors and scope of compromise
- Implement technical containment measures
- Execute remediation steps
- Verify system integrity after recovery

---

### Communications Lead

**Responsibility:** User and authority notifications
**Primary Contact:** Luka D. Fagundes
**Email:** luka@sunny-stack.com

**Duties:**

- Draft notification emails to affected users
- Prepare GDPR/CCPA regulatory notifications
- Update public status page (if applicable)
- Respond to user inquiries about incident
- Coordinate with legal counsel (if needed)

---

### External Escalation Contacts

**Legal Counsel:** [TBD - Add attorney contact if retained]
**Purpose:** Data breach legal obligations, regulatory compliance

**ISP/Hosting Provider:** Vercel Support
**Purpose:** DDoS mitigation, infrastructure issues
**Contact:** [https://vercel.com/support](https://vercel.com/support)

**Cyber Insurance:** [TBD - If applicable]
**Purpose:** Incident reporting for insurance claims

**Law Enforcement:** [Contact only if required by legal counsel]
**Purpose:** Criminal activity reporting (hacking, fraud)

---

## Response Workflow

Security incident response follows a structured 5-phase workflow.

### Phase 1: Detection

**Objective:** Identify and triage security incidents as quickly as possible.

#### Monitoring Sources

1. **Rollbar Error Monitoring**
   - Application errors, unhandled exceptions
   - Failed authentication attempts
   - Suspicious API usage patterns

2. **GitHub Security Alerts**
   - Dependabot vulnerability alerts
   - Secret scanning alerts
   - Code scanning (if enabled)

3. **Failed Authentication Logs**
   - Check `/var/log/auth.log` on Raspberry Pi
   - Review NextAuth session logs
   - Monitor admin route access attempts

4. **User Reports**
   - Email: luka@sunny-stack.com
   - Contact form: [https://sunny-stack.com/contact](https://sunny-stack.com/contact)

5. **Manual Audits**
   - Weekly log reviews
   - Quarterly security audits
   - Pre-deployment security checklists

#### Triage Process

```
Incident Detected
    ↓
Classify Severity (Critical/High/Medium/Low)
    ↓
Initial Assessment: Scope of Impact
    ↓
Determine: Users affected? Data exposed? System compromised?
    ↓
Document: Date/time, symptoms, initial findings
    ↓
Activate Response Plan (proceed to Phase 2)
```

#### Initial Assessment Questions

- **What happened?** Describe the incident in 1-2 sentences
- **When was it detected?** Date and time
- **How was it detected?** Monitoring alert, user report, audit?
- **What systems are affected?** Website, API, database, bot?
- **How many users affected?** Estimate if unknown
- **Is data compromised?** Personal data exposed or at risk?
- **Is system compromised?** Unauthorized access gained?
- **Is attack ongoing?** Active threat or past incident?

---

### Phase 2: Containment

**Objective:** Stop the incident from spreading and prevent further damage.

#### Immediate Actions (Critical/High)

**Step 1: Isolate Affected Systems (within 1 hour)**

```bash
# Stop affected Docker containers
docker-compose -f docker-compose.prod.yml stop [service-name]

# Block malicious IPs in firewall
sudo ufw deny from [malicious-ip]

# Disable compromised user accounts (if applicable)
# Via database or NextAuth admin panel

# Revoke API keys immediately
# Update environment variables:
# - BOT_API_KEY
# - RESEND_API_KEY
# - NEXTAUTH_SECRET (if compromised)
```

**Step 2: Apply Emergency Firewall Rules**

```bash
# Rate limiting for suspicious endpoints
sudo ufw limit proto tcp from any to any port 443

# Block entire IP ranges if DDoS detected
sudo ufw deny from [cidr-range]

# Allow only known admin IPs (emergency measure)
sudo ufw deny proto tcp from any to any port 5432
sudo ufw allow proto tcp from [admin-ip] to any port 5432
```

**Step 3: Disable Compromised Features**

```bash
# Disable contact/quote forms (comment out route in Next.js)
# Disable admin routes (add maintenance mode)
# Disable bot (stop Discord bot service)

# Deploy emergency maintenance page
git checkout emergency-maintenance
vercel --prod
```

#### Containment Checklist

- [ ] **Affected systems identified and documented**
- [ ] **Malicious IPs blocked in firewall**
- [ ] **Compromised accounts disabled**
- [ ] **API keys revoked and rotated**
- [ ] **Emergency firewall rules applied**
- [ ] **Vulnerable features disabled**
- [ ] **Backups created before remediation**
- [ ] **Incident timeline started**

---

### Phase 3: Eradication

**Objective:** Remove the threat and close all attack vectors.

#### Remove Threat

**Step 1: Identify Attack Vector**

```bash
# Review application logs
docker logs sunny-stack-web --since 24h | grep "ERROR\|WARN"

# Review Rollbar for exceptions
# Visit: https://rollbar.com/sunny-stack/errors

# Review database logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Review system logs
sudo grep -i "auth\|security\|fail" /var/log/syslog | tail -100
```

**Step 2: Remove Malicious Code**

```bash
# If code repository compromised
git log --all --oneline | head -20
git diff [suspicious-commit]^..[suspicious-commit]
git revert [malicious-commit]
git push origin main --force

# Scan for backdoors
grep -r "eval\|exec\|system" app/ lib/ bot/
grep -r "shell_exec\|passthru" app/ lib/ bot/

# Verify no unauthorized files
find . -name "*.php" -o -name "*.sh" -o -name "*.exe"
```

**Step 3: Patch Vulnerability**

```bash
# Update vulnerable dependencies
npm audit fix --force

# Apply security patches
npm update [vulnerable-package]

# Update system packages (Raspberry Pi)
sudo apt update && sudo apt upgrade -y

# Rebuild and redeploy
npm run build
docker-compose -f docker-compose.prod.yml up -d --build
```

#### Credential Rotation

**Immediate Rotation (within 4 hours):**

```bash
# Generate new secrets
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -base64 32  # BOT_API_KEY
openssl rand -base64 32  # DATABASE_ENCRYPTION_KEY

# Update Vercel environment variables
vercel env rm NEXTAUTH_SECRET production
vercel env add NEXTAUTH_SECRET production

# Update Raspberry Pi .env
nano .env
# Update: NEXTAUTH_SECRET, BOT_API_KEY, DATABASE_URL

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Redeploy website
vercel --prod
```

**Per [SECRETS-ROTATION.md](SECRETS-ROTATION.md):**

- Rotate all API keys (Resend, GitHub, Discord)
- Rotate database password
- Rotate OAuth credentials if compromised
- Document rotation in incident timeline

#### Scan for Persistence

**Check for Backdoors:**

```bash
# Unauthorized cron jobs
crontab -l
sudo crontab -l

# Unauthorized systemd services
systemctl list-units --type=service --all | grep -v "loaded"

# Unauthorized SSH keys
cat ~/.ssh/authorized_keys

# Unauthorized Docker containers
docker ps -a

# Unauthorized network listeners
sudo netstat -tulpn | grep LISTEN
```

---

### Phase 4: Recovery

**Objective:** Restore normal operations and verify system integrity.

#### Restore Services

**Step 1: Verify System Clean**

```bash
# Run security scan
npm audit
# Expected: 0 vulnerabilities

# Verify firewall rules
sudo ufw status numbered
# Expected: Only necessary ports open (443, 22, 5432 from localhost)

# Verify no malicious processes
ps aux | grep -v "node\|postgres\|docker"
```

**Step 2: Restart Services**

```bash
# Restart database
docker-compose -f docker-compose.prod.yml restart postgres

# Restart bot
docker-compose -f docker-compose.prod.yml restart bot

# Redeploy website
vercel --prod

# Verify health checks
curl https://sunny-stack.com/api/health
# Expected: 200 OK
```

**Step 3: Re-enable Features**

```bash
# Re-enable contact forms (if disabled)
git revert [emergency-disable-commit]
vercel --prod

# Re-enable admin routes (remove maintenance mode)

# Re-enable bot (start Discord service)
```

#### Functionality Verification

**Run Test Suite:**

```bash
# Run all tests
npm test
# Expected: 1,063+ passing tests

# Run security tests specifically
npm test -- __tests__/security/
# Expected: 29/29 passing

# Run E2E tests (critical flows)
npm run test:e2e
# Expected: All critical paths passing
```

**Manual Verification:**

- [ ] **Website loads correctly (https://sunny-stack.com)**
- [ ] **Contact form submits successfully**
- [ ] **Quote form submits successfully**
- [ ] **Admin login works**
- [ ] **Admin dashboard accessible**
- [ ] **Bot responds to Discord commands**
- [ ] **Database queries return expected results**
- [ ] **Rollbar receiving error logs**
- [ ] **Vercel Analytics collecting data**

#### Monitor Closely (24-48 hours)

**Enhanced Monitoring Period:**

```bash
# Watch logs in real-time
docker logs -f sunny-stack-web
docker logs -f sunny-stack-bot
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Monitor Rollbar errors
# Visit: https://rollbar.com/sunny-stack/errors

# Monitor failed auth attempts
sudo tail -f /var/log/auth.log | grep "Failed\|authentication failure"

# Monitor disk usage (for DDoS)
df -h

# Monitor network traffic (for unusual patterns)
sudo iftop
```

**Alert Triggers:**

- Same malicious IPs detected
- Similar attack patterns observed
- Unexpected errors in Rollbar
- Unusual database queries
- Failed authentication spikes

---

### Phase 5: Post-Mortem

**Objective:** Learn from the incident and prevent recurrence.

#### Timeline Documentation

**Incident Timeline Template:**

```markdown
## Incident Timeline: [Incident Name]

**Incident ID:** INC-[YYYY]-[NNN]
**Severity:** [Critical/High/Medium/Low]
**Status:** Resolved

### Detection

- **2025-11-06 14:32 UTC:** Rollbar alert: Unusual spike in 403 errors
- **2025-11-06 14:35 UTC:** Manual review confirmed brute force attempt on /api/admin/projects

### Containment

- **2025-11-06 14:40 UTC:** Blocked malicious IPs (1.2.3.4, 5.6.7.8) in UFW
- **2025-11-06 14:45 UTC:** Applied rate limiting to /api/admin/\* routes
- **2025-11-06 14:50 UTC:** Verified no successful unauthorized access

### Eradication

- **2025-11-06 15:00 UTC:** Analyzed access logs, identified 247 failed requests from 2 IPs
- **2025-11-06 15:15 UTC:** Rotated NEXTAUTH_SECRET as precaution
- **2025-11-06 15:20 UTC:** Deployed updated middleware with stricter rate limits

### Recovery

- **2025-11-06 15:30 UTC:** Verified website functionality
- **2025-11-06 15:35 UTC:** Ran test suite, all tests passing
- **2025-11-06 15:40 UTC:** Enabled enhanced monitoring

### Post-Mortem

- **2025-11-06 16:00 UTC:** Incident closed, monitoring continues for 48 hours
- **2025-11-07 10:00 UTC:** Post-mortem meeting scheduled
```

#### Root Cause Analysis (5 Whys)

**Example:**

**Problem:** Brute force attack on admin login

**Why #1:** Why did the brute force attack succeed in generating errors?

- **Answer:** Rate limiting was not strict enough (100 req/10s is too high)

**Why #2:** Why was rate limiting not strict enough?

- **Answer:** Default Vercel rate limits were not customized for admin routes

**Why #3:** Why were admin routes not protected with custom rate limits?

- **Answer:** Initial deployment focused on functionality, security hardening was incomplete

**Why #4:** Why was security hardening incomplete?

- **Answer:** No security checklist was run before production deployment

**Why #5:** Why was there no security checklist?

- **Answer:** Checklist existed but was not integrated into deployment workflow

**Root Cause:** Security checklist not enforced in CI/CD pipeline

**Solution:** Add security checklist as mandatory step in GitHub Actions workflow

---

#### Lessons Learned

**What Worked Well:**

- Rollbar alerts detected attack within 3 minutes
- Firewall rules applied quickly (8 minutes from detection)
- No data was compromised

**What Didn't Work:**

- Initial rate limits too permissive
- Manual log review required (no automated analysis)
- No DDoS mitigation plan in place

**What We Should Start Doing:**

- Automated IP blocking for repeated failures
- Stricter rate limits on admin routes (5 req/min instead of 100 req/10s)
- Weekly security log reviews (automated)

**What We Should Stop Doing:**

- Relying on Vercel default rate limits for admin routes
- Manual firewall rule application (automate)

---

#### Action Items

| ID     | Action                                            | Owner | Due Date   | Status |
| ------ | ------------------------------------------------- | ----- | ---------- | ------ |
| AI-001 | Implement custom rate limiting for /api/admin/\*  | Luka  | 2025-11-08 | Open   |
| AI-002 | Add security checklist to CI/CD pipeline          | Luka  | 2025-11-10 | Open   |
| AI-003 | Automate IP blocking for >10 failed auth in 5 min | Luka  | 2025-11-15 | Open   |
| AI-004 | Document incident in ISSUES.md                    | Luka  | 2025-11-07 | Closed |
| AI-005 | Schedule tabletop exercise for DDoS scenario      | Luka  | 2025-12-01 | Open   |

---

## Response Time SLAs

Service Level Agreements for incident response by severity tier.

| Severity     | Initial Response | Containment | Resolution | Notification         |
| ------------ | ---------------- | ----------- | ---------- | -------------------- |
| **Critical** | 1 hour           | 4 hours     | 24 hours   | 24 hours             |
| **High**     | 4 hours          | 24 hours    | 7 days     | 7 days (if required) |
| **Medium**   | 24 hours         | 7 days      | 30 days    | Not required         |
| **Low**      | 7 days           | 30 days     | 90 days    | Not required         |

**Notes:**

- **Initial Response:** Acknowledge incident and begin triage
- **Containment:** Stop the incident from spreading
- **Resolution:** Fully remediate and restore normal operations
- **Notification:** Notify affected users and authorities (if required)

**Exceptions:**

- SLAs apply during business hours (9am-5pm EST, Mon-Fri)
- Critical incidents trigger 24/7 response
- Force majeure events (natural disasters, ISP outages) may extend SLAs

---

## Notification Requirements

### GDPR (European Union)

**Applicable If:** Personal data of EU residents is compromised

**Notification to Supervisory Authority:**

- **Timeframe:** 72 hours from discovery
- **Method:** Email or online form to national Data Protection Authority
- **Required Information:**
  - Nature of breach (type of data, number of subjects affected)
  - Contact point for more information (luka@sunny-stack.com)
  - Likely consequences of the breach
  - Measures taken to address the breach

**Template:** See "Authority Notification (GDPR)" section below

**DPA Contacts:**

- Find your national DPA: [https://edpb.europa.eu/about-edpb/board/members_en](https://edpb.europa.eu/about-edpb/board/members_en)

---

### CCPA (California)

**Applicable If:** Personal information of California residents is compromised

**Notification to California Residents:**

- **Timeframe:** Immediate (without unreasonable delay)
- **Method:** Email to affected California residents
- **Required Information:**
  - Date of breach discovery
  - Types of personal information compromised
  - General description of breach
  - Contact information for more info (luka@sunny-stack.com)
  - What we're doing to prevent future breaches

**Template:** See "User Notification Email" section below

**California Attorney General:**

- If >500 California residents affected, also notify CA Attorney General

---

### User Notification

**When Required:**

- Personal data compromised (GDPR/CCPA)
- Account credentials compromised
- Financial information exposed
- Significant service disruption (>4 hours)

**When Not Required:**

- Low-risk incidents (Medium/Low severity)
- No personal data affected
- Internal systems only (no user impact)

**Notification Method:**

- **Email:** Primary method for all users
- **Website Banner:** For widespread incidents
- **Social Media:** If email delivery fails

---

## Communication Templates

### User Notification Email

```
Subject: Security Incident Notification - Action Required

Dear [User Name],

We are writing to inform you of a security incident that may have affected your account on Sunny Stack (https://sunny-stack.com).

**What Happened:**
On [Date], we discovered [brief description of incident]. Our security team immediately investigated and took action to secure our systems.

**Date Discovered:** [YYYY-MM-DD HH:MM UTC]

**Data Affected:**
The following types of information may have been accessed:
- [X] Email address
- [X] Name
- [ ] Password (hashed, never stored in plain text)
- [ ] Project details from quote submissions
- [ ] OAuth profile information (Google)

**Data NOT Affected:**
- Passwords (we do not store passwords, Google OAuth only)
- Financial information (we do not process payments)
- Social Security numbers (we do not collect SSN)

**Actions We've Taken:**
- Immediately contained the incident (stopped unauthorized access)
- Rotated all API keys and security credentials
- Implemented additional security measures:
  - [Specific measure 1]
  - [Specific measure 2]
- Notified relevant authorities as required by law (GDPR/CCPA)
- Engaged external security experts to audit our systems

**What You Should Do:**

1. **Change Your Password Immediately** (if applicable)
   - Even though we use Google OAuth, consider changing your Google password

2. **Enable Two-Factor Authentication**
   - On your Google account: https://myaccount.google.com/security

3. **Monitor Your Account for Suspicious Activity**
   - Review recent logins to your Google account
   - Check for unusual email activity

4. **Be Cautious of Phishing Attempts**
   - We will never ask for your password via email
   - Verify any emails claiming to be from Sunny Stack

5. **Review Your Recent Transactions** (if applicable)
   - Check credit card statements for unauthorized charges
   - Monitor bank accounts for suspicious activity

**What We're Doing to Prevent This:**
- Implementing stricter rate limiting on admin routes
- Adding automated IP blocking for suspicious activity
- Conducting quarterly security audits
- Requiring additional authentication for sensitive operations
- Enhancing monitoring and alerting systems

**Questions or Concerns?**

We sincerely apologize for this incident and any inconvenience or concern it may cause. The security of your information is our top priority.

If you have questions or concerns, please contact us:
- **Email:** luka@sunny-stack.com
- **Response Time:** 24-48 hours

For privacy-related requests (access, deletion, correction):
- **Email:** luka@sunny-stack.com

**Additional Resources:**
- Identity theft protection tips: https://www.consumer.ftc.gov/articles/0272-how-keep-your-personal-information-secure
- GDPR data subject rights: https://gdpr.eu/right-to-be-forgotten/

Sincerely,
Luka D. Fagundes
Founder, Sunny Stack
[Date]

---
Sunny Stack
https://sunny-stack.com
luka@sunny-stack.com
```

---

### Authority Notification (GDPR)

```
To: [Data Protection Authority Email]
Subject: Personal Data Breach Notification (GDPR Article 33)

Data Protection Authority
[Country]

Dear Sir/Madam,

This is a formal notification of a personal data breach pursuant to GDPR Article 33.

**Data Controller Details:**
- **Name:** Sunny Stack / Luka D. Fagundes
- **Contact:** luka@sunny-stack.com
- **Address:** [Legal entity registered address - TBD]
- **Phone:** [Emergency contact - REDACTED]
- **DPO:** Not appointed (solo developer, <5,000 data subjects)

**Breach Details:**

**1. Nature of the Personal Data Breach:**
- **Type of Breach:** [Confidentiality breach / Integrity breach / Availability breach]
- **Date of Breach:** [YYYY-MM-DD HH:MM UTC]
- **Date Discovered:** [YYYY-MM-DD HH:MM UTC]
- **Description:** [Detailed description of what happened]

**2. Categories and Approximate Number of Data Subjects Affected:**
- **Data Subjects:** Approximately [N] individuals
- **Geographic Location:** [Primarily EU / Worldwide]
- **Special Categories:** [None / Health data / Financial data / etc.]

**3. Categories and Approximate Number of Personal Data Records:**
- **Records Affected:** Approximately [N] records
- **Data Categories:**
  - [X] Email addresses
  - [X] Names
  - [ ] Passwords (hashed only, bcrypt)
  - [ ] IP addresses
  - [ ] OAuth profile data (Google)
  - [ ] Project details from quote forms

**4. Likely Consequences of the Breach:**
- **Risk to Data Subjects:** [Low / Medium / High]
- **Potential Harm:**
  - Identity theft risk: [Low / Medium / High]
  - Phishing risk: [Low / Medium / High]
  - Reputational damage: [Low / Medium / High]
  - Financial loss risk: [Low / Medium / High]
- **Explanation:** [Why this level of risk?]

**5. Measures Taken to Address the Breach:**

**Immediate Containment (within 4 hours):**
- Blocked malicious IP addresses
- Revoked compromised API keys
- Disabled affected systems

**Eradication:**
- Patched vulnerability: [Description]
- Rotated all security credentials
- Removed unauthorized access

**Recovery:**
- Restored normal operations: [Date/Time]
- Verified system integrity
- Enhanced monitoring enabled

**Notification to Data Subjects:**
- Notification sent: [Date/Time]
- Method: Email to all affected individuals
- Response contact: luka@sunny-stack.com

**6. Measures to Mitigate Possible Adverse Effects:**
- Offered identity theft monitoring resources
- Provided guidance on securing Google accounts
- Implemented additional security controls:
  - [Control 1]
  - [Control 2]
  - [Control 3]

**7. Cross-Border Breach:**
- **Other Member States Affected:** [Yes / No]
- **If Yes, List:** [Countries]
- **Coordinating Authority:** [Name of lead DPA]

**8. Contact for Further Information:**
- **Name:** Luka D. Fagundes
- **Email:** luka@sunny-stack.com
- **Phone:** [Emergency contact]
- **Availability:** 9am-5pm EST, Mon-Fri

**9. Supporting Documentation:**
- Incident timeline (attached)
- Technical analysis (attached)
- User notification template (attached)

We take data protection very seriously and have taken all necessary measures to prevent such incidents in the future.

Please contact us if you require additional information or clarification.

Sincerely,
Luka D. Fagundes
Data Controller
Sunny Stack

Date: [YYYY-MM-DD]
```

---

## Evidence Preservation

**Purpose:** Preserve forensic evidence for investigation, legal proceedings, and compliance.

### Logs to Preserve

**Application Logs:**

- Rollbar error logs (automatically retained 90 days)
- Winston application logs (if applicable)
- Next.js server logs (Vercel retains 7 days)

**Access Logs:**

- Vercel access logs (download via CLI)
- Nginx/Apache logs (if self-hosted)
- NextAuth session logs

**Database Logs:**

- PostgreSQL query logs (`/var/log/postgresql/`)
- Database audit logs (if enabled)
- Connection logs

**System Logs:**

- Raspberry Pi syslog (`/var/log/syslog`)
- Auth logs (`/var/log/auth.log`)
- Kernel logs (`/var/log/kern.log`)

---

### Log Collection Commands

```bash
# Download Vercel logs (last 24 hours)
vercel logs [deployment-url] --since 24h > vercel-logs-incident-[date].txt

# Copy PostgreSQL logs
sudo cp /var/log/postgresql/postgresql-14-main.log \
  ~/incident-logs/postgres-[date].log

# Copy system logs
sudo cp /var/log/syslog ~/incident-logs/syslog-[date].log
sudo cp /var/log/auth.log ~/incident-logs/auth-[date].log

# Export Rollbar errors (via API or web interface)
# Visit: https://rollbar.com/sunny-stack/errors
# Filter by date range, export as JSON

# Compress logs for storage
tar -czf incident-[YYYY-MM-DD]-logs.tar.gz ~/incident-logs/
```

---

### Database Snapshots

**Before Remediation:**

```bash
# Take immediate PostgreSQL dump
docker exec sunny-stack-postgres pg_dump -U sunny_user sunny_db > \
  ~/incident-backups/snapshot-before-remediation-[date].sql

# Verify dump integrity
grep -c "COPY" ~/incident-backups/snapshot-before-remediation-[date].sql

# Store securely (encrypted)
gpg --symmetric --cipher-algo AES256 \
  ~/incident-backups/snapshot-before-remediation-[date].sql
```

**After Remediation:**

```bash
# Take post-remediation dump
docker exec sunny-stack-postgres pg_dump -U sunny_user sunny_db > \
  ~/incident-backups/snapshot-after-remediation-[date].sql

# Compare before/after (identify what changed)
diff ~/incident-backups/snapshot-before-[date].sql \
     ~/incident-backups/snapshot-after-[date].sql > \
     ~/incident-backups/changes-[date].diff
```

---

### Network Traffic Capture

**If Ongoing Attack:**

```bash
# Capture network traffic (requires root)
sudo tcpdump -i eth0 -w ~/incident-logs/traffic-[date].pcap

# Capture specific IP
sudo tcpdump -i eth0 host [malicious-ip] -w ~/incident-logs/attacker-[date].pcap

# Analyze captured traffic
tcpdump -r ~/incident-logs/traffic-[date].pcap | head -100
```

---

### Chain of Custody

**Documentation Template:**

```markdown
## Evidence Chain of Custody

**Incident ID:** INC-[YYYY]-[NNN]
**Evidence ID:** EVD-[YYYY]-[NNN]

| Date/Time        | Action                     | Person           | Purpose               |
| ---------------- | -------------------------- | ---------------- | --------------------- |
| 2025-11-06 14:45 | Evidence collected         | Luka D. Fagundes | Initial investigation |
| 2025-11-06 15:00 | Logs compressed            | Luka D. Fagundes | Secure storage        |
| 2025-11-06 15:10 | Evidence encrypted         | Luka D. Fagundes | Confidentiality       |
| 2025-11-07 10:00 | Evidence reviewed          | Luka D. Fagundes | Root cause analysis   |
| 2025-11-10 14:00 | Evidence shared with legal | Luka D. Fagundes | Legal consultation    |

**Storage Location:** `/home/luka/incident-backups/INC-2025-001/`
**Encryption:** AES-256 (GPG)
**Access Control:** Owner-only (chmod 600)
**Retention:** 1 year (delete 2026-11-06)
```

---

### Retention Periods

| Evidence Type          | Retention Period | Reason                                 |
| ---------------------- | ---------------- | -------------------------------------- |
| **Incident Logs**      | 1 year           | Legal compliance, pattern analysis     |
| **Database Snapshots** | 90 days          | Storage constraints, GDPR minimization |
| **Network Captures**   | 90 days          | Storage constraints, privacy concerns  |
| **Incident Timeline**  | Permanent        | Knowledge base, historical record      |
| **Post-Mortem Report** | Permanent        | Lessons learned, pattern recognition   |

---

## Post-Incident Actions

### Post-Mortem Meeting

**When:** Within 7 days of incident resolution
**Participants:** Incident Commander, Technical Lead, Communications Lead (all Luka for solo dev)
**Duration:** 1-2 hours

**Agenda:**

1. **Incident Overview** (10 min)
   - What happened?
   - When did it happen?
   - How was it detected?

2. **Timeline Review** (20 min)
   - Walk through incident timeline
   - Identify response gaps or delays
   - Note what went well

3. **Root Cause Analysis** (30 min)
   - Use 5 Whys method
   - Identify contributing factors
   - Document root cause

4. **Lessons Learned** (20 min)
   - What worked well?
   - What didn't work?
   - What should we start/stop/continue doing?

5. **Action Items** (20 min)
   - Preventive measures
   - Process improvements
   - Tool/technology enhancements
   - Assign owners and due dates

6. **Documentation** (10 min)
   - Finalize incident report
   - Update ISSUES.md
   - Update runbooks

---

### Root Cause Analysis Template

```markdown
## Root Cause Analysis: [Incident Name]

**Incident ID:** INC-[YYYY]-[NNN]
**Date:** [YYYY-MM-DD]
**Analyst:** Luka D. Fagundes

### Problem Statement

[Clear, concise description of the problem]

### 5 Whys Analysis

**Problem:** [Root-level problem]

1. **Why did [problem] occur?**
   - Answer: [Immediate cause]

2. **Why did [immediate cause] happen?**
   - Answer: [Contributing factor 1]

3. **Why did [contributing factor 1] happen?**
   - Answer: [Contributing factor 2]

4. **Why did [contributing factor 2] happen?**
   - Answer: [Contributing factor 3]

5. **Why did [contributing factor 3] happen?**
   - Answer: [Root cause]

### Root Cause

[Final root cause - the systemic issue that allowed the incident to occur]

### Contributing Factors

1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

### Preventive Actions

1. [Action to address root cause]
2. [Action to address contributing factor 1]
3. [Action to address contributing factor 2]
```

---

### Security Improvements

**Process Improvements:**

- Update incident response plan based on lessons learned
- Add new monitoring alerts for detected attack patterns
- Enhance security checklist with new controls
- Schedule additional tabletop exercises for similar scenarios

**Technical Improvements:**

- Patch vulnerabilities
- Implement missing security controls
- Upgrade dependencies
- Enhance logging and monitoring
- Automate incident detection and response

**Documentation Updates:**

- Update SECURITY.md with new disclosure process
- Update SECRETS-ROTATION.md with new rotation procedures
- Update INCIDENT-RESPONSE.md with process improvements
- Create new runbooks for discovered scenarios

---

## Tabletop Exercise Schedule

**Purpose:** Test incident response procedures through simulated scenarios without actual system impact.

### Quarterly Scenarios

**Q1 (January-March): Unauthorized Database Access**

- **Scenario:** SQL injection vulnerability discovered, attacker accessed user data
- **Focus:** Detection, containment, GDPR notification
- **Duration:** 1-2 hours

**Q2 (April-June): DDoS Attack**

- **Scenario:** Website unavailable due to distributed denial of service
- **Focus:** Service restoration, ISP coordination, user communication
- **Duration:** 1-2 hours

**Q3 (July-September): Compromised Admin Account**

- **Scenario:** Admin credentials stolen, unauthorized access to admin dashboard
- **Focus:** Credential rotation, log analysis, privilege escalation prevention
- **Duration:** 1-2 hours

**Q4 (October-December): Data Breach Disclosure**

- **Scenario:** Personal data leaked, GDPR/CCPA notification required
- **Focus:** Regulatory compliance, user notification, legal coordination
- **Duration:** 1-2 hours

---

### Annual Full-Scale Drill

**When:** December (end of year)
**Duration:** Half-day (4 hours)
**Scope:** End-to-end incident response simulation

**Objectives:**

- Test all phases (detection through post-mortem)
- Involve external contacts (legal counsel, ISP)
- Simulate realistic timeline constraints
- Identify gaps in procedures

---

### Tabletop Exercise Template

```markdown
## Tabletop Exercise: [Scenario Name]

**Date:** [YYYY-MM-DD]
**Duration:** [X] hours
**Participants:** Luka D. Fagundes (Incident Commander, Technical Lead, Communications Lead)
**Scenario:** [Brief description]

### Exercise Objectives

1. [Objective 1: e.g., Test GDPR notification process]
2. [Objective 2: e.g., Validate containment procedures]
3. [Objective 3: e.g., Identify documentation gaps]

### Scenario Details

**Initial Situation:**
[Describe the starting conditions - what systems are affected, what symptoms are observed]

**Inject 1 (T+0 min):**

- **Event:** Rollbar alert: Database error spike
- **Information:** 247 errors in last 5 minutes, unusual SQL queries detected
- **Question:** What do you do first?

**Inject 2 (T+15 min):**

- **Event:** Log analysis shows SQL injection attempt succeeded
- **Information:** 1,500 user records may have been accessed
- **Question:** What containment actions do you take?

**Inject 3 (T+30 min):**

- **Event:** Vulnerability patched, attacker blocked
- **Information:** Need to determine if GDPR notification required
- **Question:** Do you notify users? Do you notify DPA?

**Inject 4 (T+60 min):**

- **Event:** Systems restored, monitoring enabled
- **Information:** Post-mortem scheduled
- **Question:** What preventive measures do you recommend?

### Timeline of Exercise

| Time | Event                           | Response                   | Notes              |
| ---- | ------------------------------- | -------------------------- | ------------------ |
| T+0  | Inject 1: Alert received        | [Document actual response] | [Observations]     |
| T+5  | Decision: [What was decided?]   | [Document action taken]    | [Gaps identified?] |
| T+15 | Inject 2: Breach confirmed      | [Document response]        | [Observations]     |
| T+20 | Decision: [Containment action]  | [Document action]          | [Effective?]       |
| T+30 | Inject 3: Notification decision | [Document response]        | [Observations]     |
| T+35 | Decision: [Notify users/DPA?]   | [Document decision]        | [Correct?]         |
| T+60 | Inject 4: Prevention planning   | [Document response]        | [Observations]     |

### Gaps Identified

1. **Gap:** [Description of gap in procedures/tools/knowledge]
   - **Severity:** [High / Medium / Low]
   - **Impact:** [How this affects incident response]

2. **Gap:** [Description]
   - **Severity:** [High / Medium / Low]
   - **Impact:** [Impact description]

[Repeat for all identified gaps]

### Action Items

- [ ] **AI-XXX:** [Action description] - Owner: Luka, Due: [Date]
- [ ] **AI-XXX:** [Action description] - Owner: Luka, Due: [Date]
- [ ] **AI-XXX:** [Action description] - Owner: Luka, Due: [Date]

### Lessons Learned

**What Worked Well:**

- [Positive observation 1]
- [Positive observation 2]

**What Needs Improvement:**

- [Area for improvement 1]
- [Area for improvement 2]

**Process Changes:**

- [Recommended process change 1]
- [Recommended process change 2]

### Exercise Evaluation

**Objectives Met:**

- [x] Objective 1: [Met / Partially Met / Not Met]
- [x] Objective 2: [Met / Partially Met / Not Met]
- [ ] Objective 3: [Met / Partially Met / Not Met]

**Overall Assessment:** [Success / Needs Improvement]

**Next Exercise:** [Date of next tabletop exercise]
```

---

### Exercise Documentation

**Storage Location:** `trinity/exercises/`
**Naming Convention:** `tabletop-YYYY-MM-DD-[scenario-name].md`
**Review:** Post-exercise action items tracked in To-do.md

---

## Contact Information

### Incident Response Email

**Primary Contact:** luka@sunny-stack.com
**Purpose:** Report security incidents, ask security questions
**Response Time:** 24 hours (Critical incidents: 1 hour)

---

### Emergency Contact

**Incident Commander:** Luka D. Fagundes
**Phone:** [REDACTED - Emergency Contact Only]
**Availability:** 24/7 for Critical incidents
**Backup:** None (solo developer)

---

### Legal Counsel

**Attorney:** [TBD - Add attorney contact if retained]
**Specialization:** Data privacy, cybersecurity law
**Purpose:** GDPR/CCPA compliance, breach disclosure, litigation

**When to Contact:**

- Critical incidents involving personal data
- GDPR/CCPA notification required
- Potential legal liability
- Law enforcement requests

---

### Cyber Insurance

**Provider:** [TBD - If applicable]
**Policy Number:** [TBD]
**Contact:** [TBD]
**Purpose:** Incident reporting for insurance claims

**Coverage:**

- Forensic investigation costs
- Legal fees
- Notification costs
- Credit monitoring for affected users
- Business interruption losses

---

### ISP/Hosting Provider

**Vercel Support:**

- **Website:** [https://vercel.com/support](https://vercel.com/support)
- **Purpose:** DDoS mitigation, infrastructure issues, rate limiting assistance
- **SLA:** Enterprise plan (if applicable)

**Internet Service Provider (Raspberry Pi):**

- **Provider:** [ISP Name]
- **Support:** [ISP Support Number]
- **Purpose:** Network outages, DDoS mitigation

---

### Third-Party Services

**Google Cloud Support:**

- **Purpose:** OAuth issues, API quota problems
- **Contact:** [https://support.google.com](https://support.google.com)

**Resend Support:**

- **Purpose:** Email delivery issues
- **Contact:** support@resend.com

**Discord Developer Support:**

- **Purpose:** Bot authentication issues
- **Contact:** [https://support.discord.com](https://support.discord.com)

---

### Regulatory Authorities

**Data Protection Authorities (GDPR):**

- **Find Your DPA:** [https://edpb.europa.eu/about-edpb/board/members_en](https://edpb.europa.eu/about-edpb/board/members_en)

**California Attorney General (CCPA):**

- **Website:** [https://oag.ca.gov](https://oag.ca.gov)
- **Privacy Enforcement:** [https://oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)

**FBI Cyber Division (if criminal activity):**

- **IC3 (Internet Crime Complaint Center):** [https://www.ic3.gov](https://www.ic3.gov)

---

## Document Revision History

| Version | Date       | Author           | Changes                     |
| ------- | ---------- | ---------------- | --------------------------- |
| 1.0.0   | 2025-11-06 | Luka D. Fagundes | Initial creation for WO-007 |

---

## Related Documents

- [SECURITY.md](../../SECURITY.md) - Vulnerability disclosure policy
- [PRIVACY.md](../../PRIVACY.md) - Privacy policy (draft)
- [SECRETS-ROTATION.md](SECRETS-ROTATION.md) - Credential rotation procedures
- [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) - Pre-deployment security checklist
- [DATABASE-BACKUP-RESTORE.md](DATABASE-BACKUP-RESTORE.md) - Backup and recovery procedures
- [ISSUES.md](../../trinity/knowledge-base/ISSUES.md) - Issue tracking and patterns

---

**Document Owner:** Luka D. Fagundes
**Review Frequency:** Quarterly
**Next Review:** 2026-02-06
**Approved By:** Luka D. Fagundes
**Approval Date:** 2025-11-06
