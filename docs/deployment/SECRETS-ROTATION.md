# Secrets Rotation Guide

Comprehensive guide for rotating authentication secrets, API keys, and credentials in Sunny Stack.

## Table of Contents

- [Overview](#overview)
- [Rotation Schedule](#rotation-schedule)
- [Secrets Inventory](#secrets-inventory)
- [Rotation Procedures](#rotation-procedures)
- [Emergency Rotation](#emergency-rotation)
- [Post-Rotation Verification](#post-rotation-verification)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Why Rotate Secrets?**

Regular secret rotation is a critical security practice that:

- Limits the impact of compromised credentials
- Reduces the window of opportunity for attackers
- Meets compliance requirements (SOC 2, GDPR)
- Follows security best practices

**Rotation Categories:**

- **Immediate**: Rotate within 24 hours if compromised
- **Quarterly**: Rotate every 90 days (high-risk secrets)
- **Annual**: Rotate every 365 days (low-risk secrets)

---

## Rotation Schedule

### Immediate Rotation (Compromise Detected)

**Timeline:** Within 24 hours of suspected compromise

| Secret              | Location                        | Impact                   |
| ------------------- | ------------------------------- | ------------------------ |
| `DISCORD_BOT_TOKEN` | .env.production, GitHub Secrets | Bot stops working        |
| `BOT_API_KEY`       | .env.production, Vercel Env     | Bot-API auth fails       |
| `NEXTAUTH_SECRET`   | .env.production, Vercel Env     | All sessions invalidated |
| `POSTGRES_PASSWORD` | .env.production, Vercel Env     | Database access lost     |
| `PI_SSH_KEY`        | GitHub Secrets                  | Cannot deploy to Pi      |

### Quarterly Rotation (90 Days)

**Timeline:** Every 3 months

| Secret                  | Location                         | Next Rotation |
| ----------------------- | -------------------------------- | ------------- |
| `GOOGLE_CLIENT_SECRET`  | .env.production, Vercel Env      | +90 days      |
| `RESEND_API_KEY`        | Vercel Env                       | +90 days      |
| `GITHUB_WEBHOOK_SECRET` | .env.production, GitHub Settings | +90 days      |
| `VERCEL_WEBHOOK_SECRET` | .env.production, Vercel Settings | +90 days      |

**Recommended Dates:**

- Q1: January 1
- Q2: April 1
- Q3: July 1
- Q4: October 1

### Annual Rotation (365 Days)

**Timeline:** Once per year

| Secret                 | Location                    | Next Rotation |
| ---------------------- | --------------------------- | ------------- |
| `GOOGLE_REFRESH_TOKEN` | .env.production, Vercel Env | +365 days     |
| `ADMIN_ROUTE_HASH`     | .env.production, Vercel Env | +365 days     |
| SSL Certificates       | Pi (if self-managed)        | +365 days     |

**Recommended Date:** January 1 (New Year security refresh)

### Never Rotate

| Secret                   | Reason                          |
| ------------------------ | ------------------------------- |
| `GOOGLE_CLIENT_ID`       | Public identifier, not a secret |
| `DISCORD_APPLICATION_ID` | Public identifier, not a secret |
| `DISCORD_GUILD_ID`       | Public identifier, not a secret |
| `POSTGRES_USER`          | Username, low security risk     |

---

## Secrets Inventory

### Complete Secrets List (14 Secrets)

| #   | Secret Name               | Category           | Rotation Frequency         | Storage Locations              |
| --- | ------------------------- | ------------------ | -------------------------- | ------------------------------ |
| 1   | `DISCORD_BOT_TOKEN`       | Authentication     | Immediate (if compromised) | Pi .env.production             |
| 2   | `BOT_API_KEY`             | Authentication     | Immediate (if compromised) | Pi .env.production, Vercel Env |
| 3   | `NEXTAUTH_SECRET`         | Session Encryption | Immediate (if compromised) | Vercel Env                     |
| 4   | `POSTGRES_PASSWORD`       | Database Auth      | Immediate (if compromised) | Pi .env.production, Vercel Env |
| 5   | `PI_SSH_KEY`              | Infrastructure     | Immediate (if compromised) | GitHub Secrets                 |
| 6   | `GOOGLE_CLIENT_SECRET`    | OAuth              | Quarterly (90 days)        | Pi .env.production, Vercel Env |
| 7   | `RESEND_API_KEY`          | Email API          | Quarterly (90 days)        | Vercel Env                     |
| 8   | `GITHUB_WEBHOOK_SECRET`   | Webhooks           | Quarterly (90 days)        | Pi .env.production, GitHub     |
| 9   | `VERCEL_WEBHOOK_SECRET`   | Webhooks           | Quarterly (90 days)        | Pi .env.production, Vercel     |
| 10  | `GOOGLE_REFRESH_TOKEN`    | OAuth              | Annual (365 days)          | Pi .env.production, Vercel Env |
| 11  | `ADMIN_ROUTE_HASH`        | Access Control     | Annual (365 days)          | Pi .env.production, Vercel Env |
| 12  | `ADMIN_EMAIL`             | Access Control     | Never (update if changed)  | Pi .env.production, Vercel Env |
| 13  | `NEXT_PUBLIC_ADMIN_EMAIL` | Client-side        | Never (update if changed)  | Vercel Env                     |
| 14  | SSL Certificates          | Encryption         | Annual (365 days)          | Pi (if self-managed)           |

---

## Rotation Procedures

### 1. DISCORD_BOT_TOKEN

**When:** Immediate (if compromised) or on-demand

**Impact:** Bot will disconnect from Discord Gateway during rotation

**Procedure:**

1. **Generate New Token:**

   ```bash
   # Visit Discord Developer Portal
   # https://discord.com/developers/applications
   # Navigate to: Your Bot → Bot → Reset Token
   ```

2. **Update Pi Environment:**

   ```bash
   # SSH into Raspberry Pi
   ssh your-pi-user@your-pi-ip

   # Edit .env.production
   nano ~/sunny-stack/.env.production

   # Replace DISCORD_BOT_TOKEN value
   DISCORD_BOT_TOKEN="new-token-here"

   # Save and exit (Ctrl+X, Y, Enter)
   ```

3. **Restart Bot Container:**

   ```bash
   cd ~/sunny-stack
   docker compose -f docker-compose.prod.yml restart discord-bot

   # Verify bot reconnects
   docker logs -f sunny-stack-bot
   # Look for: "Bot ready and operational"
   ```

4. **Revoke Old Token:**
   - In Discord Developer Portal: Bot → Revoke Token (confirm old token)

**Rollback:** Revert .env.production to old token, restart container

---

### 2. BOT_API_KEY

**When:** Immediate (if compromised) or on-demand

**Impact:** Bot cannot authenticate with Vercel API during rotation

**Procedure:**

1. **Generate New Key:**

   ```bash
   # On your local machine
   openssl rand -hex 32
   # Example output: a1b2c3d4e5f6...
   ```

2. **Update Vercel Environment:**

   ```bash
   # Vercel Dashboard → Project → Settings → Environment Variables
   # Edit BOT_API_KEY
   # Value: <new-key-from-step-1>
   # Save and redeploy
   ```

3. **Update Pi Environment:**

   ```bash
   # SSH into Pi
   ssh your-pi-user@your-pi-ip

   # Edit .env.production
   nano ~/sunny-stack/.env.production

   # Replace BOT_API_KEY value
   BOT_API_KEY="new-key-here"
   ```

4. **Restart Bot Container:**

   ```bash
   cd ~/sunny-stack
   docker compose -f docker-compose.prod.yml restart discord-bot
   ```

5. **Verify API Access:**

   ```bash
   # Check bot logs for successful API calls
   docker logs --tail=50 sunny-stack-bot | grep "API"
   ```

**Rollback:** Revert both Vercel and Pi to old key, redeploy Vercel, restart bot

---

### 3. NEXTAUTH_SECRET

**When:** Immediate (if compromised) or on-demand

**Impact:** All user sessions will be invalidated (users must re-login)

**Procedure:**

1. **Generate New Secret:**

   ```bash
   openssl rand -base64 32
   # Example output: Xk7Lm9Np3Qr5St8Uv2Wy4...
   ```

2. **Update Vercel Environment:**

   ```bash
   # Vercel Dashboard → Project → Settings → Environment Variables
   # Edit NEXTAUTH_SECRET
   # Value: <new-secret-from-step-1>
   # Save and redeploy
   ```

3. **Notify Users (if applicable):**

   ```bash
   # Send email/Discord notification
   "Admin session refresh required. Please log in again."
   ```

4. **Verify Login Flow:**
   - Visit https://sunny-stack.com/admin-{ADMIN_ROUTE_HASH}
   - Test Google OAuth login
   - Confirm successful authentication

**Rollback:** Revert Vercel environment variable, redeploy

---

### 4. POSTGRES_PASSWORD

**When:** Immediate (if compromised) or on-demand

**Impact:** Database connections will fail during rotation (downtime: ~5 minutes)

**Procedure:**

**⚠️ WARNING: This rotation requires downtime. Schedule during low-traffic period.**

1. **Generate New Password:**

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Example: b7a8c9d0e1f2...
   ```

2. **Update PostgreSQL Password:**

   ```bash
   # SSH into Pi
   ssh your-pi-user@your-pi-ip

   # Access PostgreSQL container
   docker exec -it sunny-stack-db psql -U sunnystack -d sunnystack

   # Change password (replace <new-password>)
   ALTER USER sunnystack WITH PASSWORD '<new-password>';

   # Exit PostgreSQL
   \q
   ```

3. **Update Pi Environment:**

   ```bash
   # Edit .env.production
   nano ~/sunny-stack/.env.production

   # Update POSTGRES_PASSWORD
   POSTGRES_PASSWORD="new-password-here"

   # Update DATABASE_URL
   DATABASE_URL="postgresql://sunnystack:<new-password>@postgres:5432/sunnystack?connection_limit=20"
   ```

4. **Update Vercel Environment:**

   ```bash
   # Vercel Dashboard → Settings → Environment Variables
   # Edit DATABASE_URL
   # Value: postgresql://sunnystack:<new-password>@YOUR_PI_IP:5432/sunnystack?connection_limit=20
   # Save and redeploy
   ```

5. **Restart Services:**

   ```bash
   # Restart bot container (uses new DATABASE_URL)
   cd ~/sunny-stack
   docker compose -f docker-compose.prod.yml restart discord-bot

   # Wait for Vercel redeploy to complete
   ```

6. **Verify Database Connectivity:**

   ```bash
   # Test from bot container
   docker exec sunny-stack-bot npx prisma db pull

   # Test from Vercel (check deployment logs)
   ```

**Rollback:**

```bash
# Revert PostgreSQL password
docker exec -it sunny-stack-db psql -U sunnystack -d sunnystack
ALTER USER sunnystack WITH PASSWORD '<old-password>';
\q

# Revert .env.production and Vercel env
# Restart services
```

---

### 5. PI_SSH_KEY

**When:** Immediate (if compromised) or on-demand

**Impact:** GitHub Actions cannot deploy to Pi during rotation

**Procedure:**

1. **Generate New SSH Key Pair:**

   ```bash
   # On Pi or secure local machine
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/pi_deploy_new
   # Do not set passphrase (for automation)
   ```

2. **Add New Public Key to Pi:**

   ```bash
   # SSH into Pi
   ssh your-pi-user@your-pi-ip

   # Add new public key to authorized_keys
   cat ~/.ssh/pi_deploy_new.pub >> ~/.ssh/authorized_keys

   # Verify permissions
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Update GitHub Secrets:**

   ```bash
   # GitHub Repo → Settings → Secrets → Actions
   # Edit PI_SSH_KEY
   # Paste contents of ~/.ssh/pi_deploy_new (private key)
   ```

4. **Test Deployment:**

   ```bash
   # Trigger manual deployment via GitHub Actions
   # Repository → Actions → Deploy to Raspberry Pi → Run workflow
   ```

5. **Remove Old Public Key:**

   ```bash
   # SSH into Pi
   ssh your-pi-user@your-pi-ip

   # Edit authorized_keys and remove old key
   nano ~/.ssh/authorized_keys

   # Delete old key line, save
   ```

6. **Delete Old Key Files:**

   ```bash
   rm ~/.ssh/pi_deploy_old ~/.ssh/pi_deploy_old.pub
   ```

**Rollback:** Keep old public key in authorized_keys until new key is verified

---

### 6. GOOGLE_CLIENT_SECRET

**When:** Quarterly (90 days)

**Impact:** OAuth login will fail during rotation (downtime: ~5 minutes)

**Procedure:**

1. **Generate New Secret:**

   ```bash
   # Google Cloud Console
   # https://console.cloud.google.com/apis/credentials
   # Select OAuth 2.0 Client ID
   # Click "Reset Secret" or create new credential
   ```

2. **Update Vercel Environment:**

   ```bash
   # Vercel Dashboard → Settings → Environment Variables
   # Edit GOOGLE_CLIENT_SECRET
   # Value: <new-secret-from-google>
   # Save and redeploy
   ```

3. **Update Pi Environment:**

   ```bash
   # SSH into Pi
   nano ~/sunny-stack/.env.production

   # Update GOOGLE_CLIENT_SECRET
   GOOGLE_CLIENT_SECRET="new-secret-here"

   # Save (bot doesn't use this directly, but keep in sync)
   ```

4. **Test OAuth Login:**
   - Visit admin dashboard
   - Logout if logged in
   - Test Google OAuth login flow

**Rollback:** Revert Vercel environment variable, redeploy

---

### 7. RESEND_API_KEY

**When:** Quarterly (90 days)

**Impact:** Email sending will fail during rotation

**Procedure:**

1. **Generate New API Key:**

   ```bash
   # Resend Dashboard
   # https://resend.com/api-keys
   # Click "Create API Key"
   # Name: "Sunny Stack Production"
   # Copy new key
   ```

2. **Update Vercel Environment:**

   ```bash
   # Vercel Dashboard → Settings → Environment Variables
   # Edit RESEND_API_KEY
   # Value: re_<new-key>
   # Save and redeploy
   ```

3. **Test Email Sending:**

   ```bash
   # Submit test contact form on website
   # Verify email received
   ```

4. **Delete Old API Key:**

   ```bash
   # Resend Dashboard → API Keys
   # Delete old key
   ```

**Rollback:** Revert Vercel environment variable, redeploy (old key must still exist)

---

### 8. GITHUB_WEBHOOK_SECRET

**When:** Quarterly (90 days)

**Impact:** Webhook signature verification will fail

**Procedure:**

1. **Generate New Secret:**

   ```bash
   openssl rand -hex 20
   # Example: a1b2c3d4e5f6g7h8i9j0
   ```

2. **Update GitHub Webhook:**

   ```bash
   # GitHub Repo → Settings → Webhooks
   # Edit webhook
   # Secret: <new-secret-from-step-1>
   # Update webhook
   ```

3. **Update Pi Environment:**

   ```bash
   # SSH into Pi
   nano ~/sunny-stack/.env.production

   # Update GITHUB_WEBHOOK_SECRET
   GITHUB_WEBHOOK_SECRET="new-secret-here"

   # Restart bot if it uses webhooks
   docker compose -f docker-compose.prod.yml restart discord-bot
   ```

**Rollback:** Revert GitHub webhook secret and Pi environment

---

### 9. VERCEL_WEBHOOK_SECRET

**When:** Quarterly (90 days)

**Impact:** Vercel webhook signature verification will fail

**Procedure:**

1. **Generate New Secret:**

   ```bash
   openssl rand -hex 20
   # Example: k1l2m3n4o5p6q7r8s9t0
   ```

2. **Update Vercel Deploy Hook:**

   ```bash
   # Vercel Dashboard → Settings → Git → Deploy Hooks
   # Delete old hook
   # Create new hook with new secret
   ```

3. **Update Pi Environment:**

   ```bash
   # SSH into Pi
   nano ~/sunny-stack/.env.production

   # Update VERCEL_WEBHOOK_SECRET
   VERCEL_WEBHOOK_SECRET="new-secret-here"

   # Restart bot if it uses webhooks
   docker compose -f docker-compose.prod.yml restart discord-bot
   ```

**Rollback:** Revert Vercel deploy hook and Pi environment

---

### 10. GOOGLE_REFRESH_TOKEN

**When:** Annual (365 days)

**Impact:** Bot Google API integrations will fail until new token obtained

**Procedure:**

1. **Obtain New Refresh Token:**

   ```bash
   # Follow google-api-setup.md guide
   # Use OAuth Playground or custom script
   # Ensure all required scopes are granted
   ```

2. **Update Vercel Environment:**

   ```bash
   # Vercel Dashboard → Settings → Environment Variables
   # Edit GOOGLE_REFRESH_TOKEN
   # Value: <new-refresh-token>
   # Redeploy
   ```

3. **Update Pi Environment:**

   ```bash
   # SSH into Pi
   nano ~/sunny-stack/.env.production

   # Update GOOGLE_REFRESH_TOKEN
   GOOGLE_REFRESH_TOKEN="new-token-here"

   # Restart bot
   docker compose -f docker-compose.prod.yml restart discord-bot
   ```

4. **Test Google API Access:**

   ```bash
   # Test Discord bot command that uses Google APIs
   # /calendar list (example)
   ```

**Rollback:** Revert to old refresh token (if not revoked)

---

### 11. ADMIN_ROUTE_HASH

**When:** Annual (365 days)

**Impact:** Admin dashboard URL changes, bookmark updates required

**Procedure:**

1. **Generate New Hash:**

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Example: u1v2w3x4y5z6...
   ```

2. **Update Vercel Environment:**

   ```bash
   # Vercel Dashboard → Settings → Environment Variables
   # Edit ADMIN_ROUTE_HASH
   # Value: <new-hash>
   # Redeploy
   ```

3. **Update Pi Environment:**

   ```bash
   # SSH into Pi
   nano ~/sunny-stack/.env.production

   # Update ADMIN_ROUTE_HASH
   ADMIN_ROUTE_HASH="new-hash-here"
   ```

4. **Update Bookmarks:**

   ```bash
   # New admin URL: https://sunny-stack.com/admin-<new-hash>/
   # Update browser bookmarks
   # Update password manager entry
   ```

5. **Notify Admin:**
   - Send secure notification with new URL
   - Verify old URL returns 404

**Rollback:** Revert environment variables, redeploy

---

### 12. SSL Certificates (Self-Managed)

**When:** Annual (365 days) or 90 days before expiration

**Impact:** HTTPS connections fail if expired

**Procedure:**

**Note:** If using Vercel/Cloudflare, certificates are auto-renewed. This applies only to self-managed Pi certificates.

1. **Check Certificate Expiry:**

   ```bash
   # SSH into Pi
   ssh your-pi-user@your-pi-ip

   # Check expiry date
   openssl x509 -in /path/to/cert.pem -noout -enddate
   ```

2. **Renew Certificate (Let's Encrypt Example):**

   ```bash
   # Renew with certbot
   sudo certbot renew

   # Or force renewal
   sudo certbot renew --force-renewal
   ```

3. **Restart Services Using Certificate:**

   ```bash
   # If using nginx
   sudo systemctl reload nginx

   # If using Docker
   docker compose -f docker-compose.prod.yml restart <service>
   ```

4. **Verify New Certificate:**

   ```bash
   openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null
   # Check "Verify return code: 0 (ok)"
   ```

**Rollback:** Restore old certificate from backup

---

## Emergency Rotation

### Compromise Detected

**Immediate Actions (within 1 hour):**

1. **Assess Scope:**
   - Which secret was compromised?
   - What systems are affected?
   - Is there evidence of unauthorized access?

2. **Isolate Systems:**

   ```bash
   # Stop affected services
   docker compose -f docker-compose.prod.yml down

   # Block unauthorized access (if applicable)
   sudo ufw deny from <suspicious-ip>
   ```

3. **Rotate Compromised Secret:**
   - Follow rotation procedure for specific secret (above)
   - Prioritize secrets with immediate rotation timeline

4. **Audit Logs:**

   ```bash
   # Check Pi auth logs
   sudo journalctl -u ssh -n 100

   # Check Docker logs
   docker logs sunny-stack-bot --since 24h
   docker logs sunny-stack-db --since 24h

   # Check Vercel logs
   # Vercel Dashboard → Deployment → Logs
   ```

5. **Document Incident:**
   - Create incident report in `trinity/sessions/incident-YYYY-MM-DD.md`
   - Include timeline, affected systems, actions taken

6. **Notify Stakeholders:**
   - Internal team (Discord #admin-logs)
   - Users (if data compromised)
   - Service providers (if third-party involved)

### Breach Response Checklist

- [ ] Compromised secret identified
- [ ] Affected systems isolated
- [ ] New secret generated and deployed
- [ ] Old secret revoked
- [ ] Logs audited for unauthorized access
- [ ] Incident documented
- [ ] Stakeholders notified
- [ ] Post-incident review scheduled

---

## Post-Rotation Verification

### Verification Checklist

After rotating ANY secret, verify:

- [ ] **Services Running:** All containers/services restarted successfully
- [ ] **Health Checks:** All health endpoints return 200 OK
- [ ] **Functionality:** Test affected features (auth, emails, bot commands)
- [ ] **Logs:** No authentication errors in logs
- [ ] **Old Secret Revoked:** Old secret deleted/revoked from provider

### Service-Specific Tests

**DISCORD_BOT_TOKEN:**

```bash
# Bot logs show "Bot ready and operational"
docker logs sunny-stack-bot | grep "ready"

# Test bot command in Discord
/ping
```

**BOT_API_KEY:**

```bash
# Bot can call Vercel API
docker logs sunny-stack-bot | grep "API" | tail -10
```

**NEXTAUTH_SECRET:**

```bash
# Login flow works
# Visit https://sunny-stack.com/admin-{ADMIN_ROUTE_HASH}
# Authenticate with Google OAuth
```

**POSTGRES_PASSWORD:**

```bash
# Database queries succeed
docker exec sunny-stack-bot npx prisma db pull

# Vercel API can connect
# Check deployment logs for database connection success
```

**RESEND_API_KEY:**

```bash
# Email sending works
# Submit contact form on website
# Verify email received
```

**GOOGLE_CLIENT_SECRET:**

```bash
# OAuth login works
# Test admin dashboard login
```

---

## Troubleshooting

### Common Issues

**Issue: Bot won't start after rotation**

```bash
# Check logs for error
docker logs sunny-stack-bot

# Common causes:
# - Typo in .env.production
# - Secret not updated in all locations
# - Service not restarted after update

# Solution:
# Verify secret value, restart container
docker compose -f docker-compose.prod.yml restart discord-bot
```

**Issue: Database connection fails**

```bash
# Verify DATABASE_URL format
# postgresql://sunnystack:<password>@postgres:5432/sunnystack?connection_limit=20

# Check PostgreSQL password matches .env
docker exec -it sunny-stack-db psql -U sunnystack -d sunnystack

# If fails, password mismatch - revert and retry
```

**Issue: OAuth login fails**

```bash
# Verify GOOGLE_CLIENT_SECRET updated in Vercel
# Check Vercel deployment logs for errors
# Ensure NEXTAUTH_SECRET is correct

# Test with curl
curl https://sunny-stack.com/api/auth/providers
```

**Issue: Email not sending**

```bash
# Verify RESEND_API_KEY updated in Vercel
# Check Resend dashboard for API errors
# Test API key with curl:

curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@your-domain.com",
    "to": "your-email@example.com",
    "subject": "Test",
    "text": "Test email"
  }'
```

**Issue: GitHub Actions deployment fails**

```bash
# Check PI_SSH_KEY in GitHub Secrets
# Verify new public key added to Pi authorized_keys
# Test SSH connection manually:

ssh -i ~/.ssh/pi_deploy_new your-pi-user@your-pi-ip

# If fails, check key permissions:
chmod 600 ~/.ssh/pi_deploy_new
```

---

## Rotation Tracking

### Rotation Log Template

Track rotations in `trinity/knowledge-base/SECURITY-LOG.md`:

```markdown
## Secret Rotation Log

| Date       | Secret            | Reason    | Rotated By | Verification Status |
| ---------- | ----------------- | --------- | ---------- | ------------------- |
| 2025-11-06 | DISCORD_BOT_TOKEN | Quarterly | Admin      | ✅ Verified         |
| 2025-11-06 | RESEND_API_KEY    | Quarterly | Admin      | ✅ Verified         |
```

### Next Rotation Dates

| Secret                | Last Rotated | Next Rotation |
| --------------------- | ------------ | ------------- |
| DISCORD_BOT_TOKEN     | TBD          | As needed     |
| BOT_API_KEY           | TBD          | As needed     |
| NEXTAUTH_SECRET       | TBD          | As needed     |
| POSTGRES_PASSWORD     | TBD          | As needed     |
| PI_SSH_KEY            | TBD          | As needed     |
| GOOGLE_CLIENT_SECRET  | TBD          | 2026-02-06    |
| RESEND_API_KEY        | TBD          | 2026-02-06    |
| GITHUB_WEBHOOK_SECRET | TBD          | 2026-02-06    |
| VERCEL_WEBHOOK_SECRET | TBD          | 2026-02-06    |
| GOOGLE_REFRESH_TOKEN  | TBD          | 2026-11-06    |
| ADMIN_ROUTE_HASH      | TBD          | 2026-11-06    |

---

## Additional Resources

- **SECURITY.md**: Vulnerability reporting and security policy
- **THIRD-PARTY-SERVICES.md**: Third-party service security details
- **PI-PRODUCTION-DEPLOYMENT.md**: Production deployment procedures
- **TROUBLESHOOTING.md**: General troubleshooting guide

---

**Questions?** Contact luka@sunny-stack.com

**Last Updated:** 2025-11-06
**Document Version:** 1.0.0
