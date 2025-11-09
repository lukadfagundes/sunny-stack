# PostgreSQL Internet Exposure - Production Setup Guide

**Last Updated**: 2025-11-09
**Architecture**: Hybrid Cloud (Vercel + Self-Hosted Pi)
**Objective**: Securely expose Pi PostgreSQL to Vercel via `db.sunny-stack.com`

---

## Overview

This guide configures secure internet access to your self-hosted PostgreSQL database on Raspberry Pi, allowing Vercel to connect while maintaining security best practices.

**Architecture Flow:**

```
Vercel (Cloud) → db.sunny-stack.com (DNS) → Your Public IP:5432 → Router Port Forward → Pi:5432 → PostgreSQL Container
```

---

## Phase 1: Discovery & Verification

### 1.1 Find Your Public IP Address

**On your Pi, run:**

```bash
curl ifconfig.me
```

**Expected output:** `XX.XXX.XXX.XXX` (your public IP address)

**Save this IP** - you'll need it for DNS configuration.

---

### 1.2 Verify Current PostgreSQL Configuration

**Check if PostgreSQL is currently accessible:**

```bash
# On Pi
docker ps | grep postgres
```

**Expected output:**

```
CONTAINER ID   IMAGE                PORTS                    NAMES
xxxxxxxxxxxx   postgres:15-alpine   0.0.0.0:5432->5432/tcp   postgres
```

✅ **Good:** Port 5432 is exposed to host (`0.0.0.0:5432`)
❌ **Problem:** If you see `127.0.0.1:5432`, PostgreSQL is only accessible locally

**Check PostgreSQL connection settings:**

```bash
# On Pi
docker exec -it postgres cat /var/lib/postgresql/data/postgresql.conf | grep listen_addresses
```

**Expected:** `listen_addresses = '*'`
**If not set:** We'll fix this in Phase 4.

---

### 1.3 Check Current Firewall Status

**On Pi:**

```bash
# Check if UFW is active
sudo ufw status

# Check iptables rules
sudo iptables -L -n | grep 5432
```

**Document the output** - we'll configure this in Phase 3.

---

## Phase 2: DNS Configuration

### 2.1 Access Your DNS Provider

Your domain `sunny-stack.com` is registered somewhere (likely Vercel, Cloudflare, Namecheap, etc.)

**Find your DNS provider:**

1. Check Vercel dashboard → Domains → sunny-stack.com
2. Look for "Nameservers" section
3. Common providers:
   - Vercel DNS
   - Cloudflare
   - Namecheap
   - GoDaddy

---

### 2.2 Create A Record for Database Subdomain

**DNS Record Configuration:**

| Type | Name | Value              | TTL | Priority |
| ---- | ---- | ------------------ | --- | -------- |
| A    | db   | `<YOUR_PUBLIC_IP>` | 300 | N/A      |

**Example (Cloudflare):**

```
Type: A
Name: db
IPv4 address: XX.XXX.XXX.XXX (your public IP from 1.1)
Proxy status: DNS only (gray cloud, NOT proxied)
TTL: Auto
```

**⚠️ CRITICAL:**

- **DO NOT enable Cloudflare proxy (orange cloud)** - PostgreSQL won't work through HTTP proxy
- Use **DNS only mode (gray cloud)**

**Example (Vercel DNS):**

```
Type: A
Name: db
Value: XX.XXX.XXX.XXX
TTL: 60
```

---

### 2.3 Verify DNS Propagation

**Wait 5-10 minutes, then test:**

```bash
# From your Windows machine or Pi
nslookup db.sunny-stack.com
```

**Expected output:**

```
Server:  [your DNS server]
Address:  [DNS server IP]

Name:    db.sunny-stack.com
Address:  XX.XXX.XXX.XXX  (your public IP)
```

✅ **DNS is ready** when you see your public IP address.

---

## Phase 3: Router Port Forwarding

### 3.1 Access Router Admin Panel

**Common router admin URLs:**

- `http://192.168.1.1`
- `http://192.168.0.1`
- `http://10.0.0.1`

**Login with your router credentials** (often on sticker on router).

---

### 3.2 Configure Port Forwarding Rule

**Navigate to:**

- Port Forwarding
- Virtual Servers
- NAT / Port Forwarding
- (name varies by router brand)

**Create new rule:**

| Setting       | Value                  |
| ------------- | ---------------------- |
| Service Name  | PostgreSQL             |
| Protocol      | TCP                    |
| External Port | 5432                   |
| Internal IP   | 192.168.1.19 (your Pi) |
| Internal Port | 5432                   |
| Status        | Enabled                |

**Common router interfaces:**

**Netgear:**

```
Advanced → Advanced Setup → Port Forwarding/Port Triggering
Service Name: PostgreSQL
External Port: 5432
Internal Port: 5432
Internal IP Address: 192.168.1.19
```

**TP-Link:**

```
Forwarding → Virtual Servers → Add New
Service Port: 5432
IP Address: 192.168.1.19
Internal Port: 5432
Protocol: TCP
```

**ASUS:**

```
WAN → Virtual Server / Port Forwarding
Service Name: PostgreSQL
Port Range: 5432
Local IP: 192.168.1.19
Local Port: 5432
Protocol: TCP
```

---

### 3.3 Verify Port Forwarding

**Save router configuration and test:**

**From external network (use your phone's mobile data, or https://www.yougetsignal.com/tools/open-ports/):**

Test if port 5432 is open at your public IP.

⚠️ **Don't test from your local network** - it won't work due to NAT hairpinning.

---

## Phase 4: Pi Firewall Configuration

### 4.1 Configure UFW (Uncomplicated Firewall)

**On Pi:**

```bash
# Check if UFW is installed
sudo ufw status

# If not installed:
sudo apt update
sudo apt install ufw

# Allow SSH (CRITICAL - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow PostgreSQL from internet
sudo ufw allow 5432/tcp comment 'PostgreSQL for Vercel'

# Allow bot health check endpoint
sudo ufw allow 8080/tcp comment 'Bot health check'

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status numbered
```

**Expected output:**

```
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    Anywhere
[ 2] 5432/tcp                   ALLOW IN    Anywhere                   # PostgreSQL for Vercel
[ 3] 8080/tcp                   ALLOW IN    Anywhere                   # Bot health check
```

---

### 4.2 (Optional) Restrict PostgreSQL Access to Vercel IPs

**For enhanced security, limit PostgreSQL to only Vercel's IP ranges:**

Vercel uses dynamic IPs, so this is **optional and complex**. For now, we'll use PostgreSQL's authentication instead.

**Skip this step initially** - we'll secure via strong password + SSL.

---

## Phase 5: PostgreSQL Configuration

### 5.1 Verify PostgreSQL Listen Address

**Check current configuration:**

```bash
# On Pi
docker exec -it postgres cat /var/lib/postgresql/data/postgresql.conf | grep listen_addresses
```

**If it shows:**

```
listen_addresses = 'localhost'
```

**Update docker-compose.yml to set it:**

**Edit `~/sunny-stack/docker-compose.yml`:**

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    environment:
      POSTGRES_USER: sunnystack
      POSTGRES_PASSWORD: <YOUR_DB_PASSWORD>
      POSTGRES_DB: sunnystack
    command:
      - "postgres"
      - "-c"
      - "listen_addresses=*" # ADD THIS
    ports:
      - "0.0.0.0:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sunnystack"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Restart PostgreSQL:**

```bash
cd ~/sunny-stack
docker compose restart postgres
```

---

### 5.2 Configure PostgreSQL Client Authentication

**Check pg_hba.conf:**

```bash
docker exec -it postgres cat /var/lib/postgresql/data/pg_hba.conf
```

**Ensure this line exists:**

```
host    all             all             0.0.0.0/0               scram-sha-256
```

**If not, add it:**

```bash
# On Pi
docker exec -it postgres bash

# Inside container
echo "host    all             all             0.0.0.0/0               scram-sha-256" >> /var/lib/postgresql/data/pg_hba.conf

# Reload configuration
psql -U sunnystack -c "SELECT pg_reload_conf();"

exit
```

---

## Phase 6: Test Database Connection

### 6.1 Test from External Network

**Use your phone's mobile data (not your home WiFi) or a VPS:**

```bash
# Install PostgreSQL client
# Ubuntu/Debian:
sudo apt install postgresql-client

# macOS:
brew install postgresql

# Test connection (use password from .env.production)
psql "postgresql://sunnystack:<YOUR_DB_PASSWORD>@db.sunny-stack.com:5432/sunnystack"
```

**Expected output:**

```
psql (15.x)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.

sunnystack=#
```

✅ **Success!** If you see the PostgreSQL prompt, connection works.

---

### 6.2 Test from Vercel Edge Function

**Create test API route:**

**On Windows, create `app/api/test-db/route.ts`:**

```typescript
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let prisma: PrismaClient | null = null;

  try {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    await prisma.$connect();
    const result =
      await prisma.$queryRaw`SELECT version(), current_database(), current_user`;
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      connection: "successful",
      duration: `${duration}ms`,
      database: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
```

**Deploy to Vercel and test:**

```
https://sunny-stack.com/api/test-db
```

---

## Phase 7: SSL/TLS Configuration (Security Hardening)

### 7.1 Generate SSL Certificates

**Option A: Self-Signed Certificate (Quick)**

```bash
# On Pi
mkdir -p ~/sunny-stack/postgres-ssl
cd ~/sunny-stack/postgres-ssl

# Generate private key
openssl genrsa -out server.key 2048

# Generate certificate (valid 10 years)
openssl req -new -x509 -days 3650 -key server.key -out server.crt -subj "/CN=db.sunny-stack.com"

# Set correct permissions
chmod 600 server.key
chmod 644 server.crt
```

**Option B: Let's Encrypt Certificate (Better - requires certbot)**

⚠️ **Complex setup** - Let's Encrypt requires HTTP/HTTPS validation, which is harder for PostgreSQL. Use Option A for now.

---

### 7.2 Configure PostgreSQL to Use SSL

**Update docker-compose.yml:**

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    environment:
      POSTGRES_USER: sunnystack
      POSTGRES_PASSWORD: <YOUR_DB_PASSWORD>
      POSTGRES_DB: sunnystack
    command:
      - "postgres"
      - "-c"
      - "listen_addresses=*"
      - "-c"
      - "ssl=on"
      - "-c"
      - "ssl_cert_file=/var/lib/postgresql/ssl/server.crt"
      - "-c"
      - "ssl_key_file=/var/lib/postgresql/ssl/server.key"
    ports:
      - "0.0.0.0:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ~/sunny-stack/postgres-ssl:/var/lib/postgresql/ssl:ro # Mount SSL certs
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sunnystack"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Restart PostgreSQL:**

```bash
cd ~/sunny-stack
docker compose down
docker compose up -d
```

---

### 7.3 Update DATABASE_URL for SSL

**Production DATABASE_URL (with SSL):**

```
postgresql://sunnystack:<YOUR_DB_PASSWORD>@db.sunny-stack.com:5432/sunnystack?sslmode=require
```

**For self-signed certificate (Vercel might reject):**

```
postgresql://sunnystack:<YOUR_DB_PASSWORD>@db.sunny-stack.com:5432/sunnystack?sslmode=require&sslaccept=accept_invalid_certs
```

---

## Phase 8: Vercel Environment Variables

### 8.1 Configure Vercel Dashboard

**Go to:** https://vercel.com/your-team/sunny-stack/settings/environment-variables

**Add these variables for Production environment:**

#### **Critical - Database Connection**

```bash
DATABASE_URL=postgresql://sunnystack:<YOUR_DB_PASSWORD>@db.sunny-stack.com:5432/sunnystack?sslmode=require
```

**Use the password from your `.env.production` file**

#### **Critical - Next.js Configuration**

```bash
NEXTAUTH_URL=https://sunny-stack.com
NEXTAUTH_SECRET=<YOUR_NEXTAUTH_SECRET>
NODE_ENV=production
```

**Copy these values from your `.env.production` file**

#### **Critical - Google OAuth**

```bash
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>
GOOGLE_REDIRECT_URI=https://sunny-stack.com/api/auth/callback/google
GOOGLE_REFRESH_TOKEN=<YOUR_GOOGLE_REFRESH_TOKEN>
GOOGLE_PROJECT_ID=<YOUR_GOOGLE_PROJECT_ID>
```

**Copy these values from your `.env.production` file**

#### **Admin Security**

```bash
ADMIN_EMAIL=luka@sunny-stack.com
NEXT_PUBLIC_ADMIN_EMAIL=luka@sunny-stack.com
ADMIN_ROUTE_HASH=6bde736bb52aa194f1d69d140619b25cb9f9a42eb3acb1f6e7a502b375fda6ac
```

#### **Email Service (Resend)**

```bash
RESEND_API_KEY=<YOUR_RESEND_API_KEY>
```

#### **Webhooks**

```bash
GITHUB_WEBHOOK_SECRET=<YOUR_GITHUB_WEBHOOK_SECRET>
VERCEL_WEBHOOK_SECRET=<YOUR_VERCEL_WEBHOOK_SECRET>
```

#### **Error Monitoring (Rollbar)**

```bash
ROLLBAR_ACCESS_TOKEN=<YOUR_ROLLBAR_ACCESS_TOKEN>
```

#### **Bot API Communication**

```bash
BOT_API_KEY=<YOUR_BOT_API_KEY>
BOT_API_URL=https://sunny-stack.com/api
```

**Copy these values from your `.env.production` file**

#### **GitHub CI/CD**

```bash
GITHUB_USERNAME=lukadfagundes
```

---

### 8.2 Redeploy Vercel

After saving environment variables:

**Option 1: Trigger via Git Push**

```bash
git commit --allow-empty -m "chore: trigger Vercel redeployment"
git push origin main
```

**Option 2: Manual Redeploy in Vercel Dashboard**

- Go to Deployments tab
- Click "..." on latest deployment
- Click "Redeploy"

---

## Phase 9: Security Best Practices

### 9.1 Security Checklist

- ✅ **Strong Password**: 64-character hex password (generated)
- ✅ **Firewall**: UFW enabled with only required ports
- ✅ **SSL/TLS**: PostgreSQL SSL enabled (self-signed or Let's Encrypt)
- ✅ **Authentication**: scram-sha-256 (PostgreSQL 14+ default)
- ⚠️ **IP Whitelisting**: Optional - Vercel uses dynamic IPs (complex to implement)
- ✅ **Connection Limits**: PostgreSQL default limits apply
- ✅ **Monitoring**: Set up in Phase 10

---

### 9.2 Recommended Additional Security

**9.2.1 Configure PostgreSQL Connection Limits**

```bash
# On Pi
docker exec -it postgres bash

# Edit postgresql.conf
psql -U sunnystack -c "ALTER SYSTEM SET max_connections = 100;"
psql -U sunnystack -c "ALTER SYSTEM SET shared_buffers = '256MB';"

# Reload
psql -U sunnystack -c "SELECT pg_reload_conf();"
```

**9.2.2 Enable Connection Logging (Audit Trail)**

```bash
docker exec -it postgres bash
psql -U sunnystack -c "ALTER SYSTEM SET log_connections = 'on';"
psql -U sunnystack -c "ALTER SYSTEM SET log_disconnections = 'on';"
psql -U sunnystack -c "SELECT pg_reload_conf();"
```

**View logs:**

```bash
docker logs postgres -f
```

---

### 9.3 Regular Security Maintenance

**Weekly:**

- Check PostgreSQL logs for suspicious activity
- Monitor connection counts
- Review UFW logs

**Monthly:**

- Update PostgreSQL image: `docker pull postgres:15-alpine`
- Rotate SSL certificates (if using short-lived certs)
- Review database user permissions

**Quarterly:**

- Rotate database password
- Update Vercel environment variables
- Audit database access logs

---

## Phase 10: Monitoring & Health Checks

### 10.1 Database Health Check Endpoint

**Create `app/api/health/db/route.ts`:**

```typescript
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let prisma: PrismaClient | null = null;

  try {
    prisma = new PrismaClient();
    await prisma.$connect();

    // Test query
    await prisma.$queryRaw`SELECT 1`;

    const duration = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      latency: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        latency: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
```

**Test endpoint:**

```
https://sunny-stack.com/api/health/db
```

---

### 10.2 Set Up Uptime Monitoring

**Free services:**

1. **UptimeRobot** (https://uptimerobot.com)
   - Monitor `https://sunny-stack.com/api/health/db`
   - Alert on downtime

2. **Pingdom** (free tier)
3. **StatusCake** (free tier)

---

### 10.3 Database Performance Monitoring

**Check current connections:**

```bash
docker exec -it postgres psql -U sunnystack -c "SELECT count(*) FROM pg_stat_activity;"
```

**Monitor slow queries:**

```bash
docker exec -it postgres psql -U sunnystack -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;"
```

---

## Troubleshooting

### Issue: "Connection timed out"

**Check:**

1. Router port forwarding configured correctly
2. Pi firewall allows port 5432
3. DNS propagated: `nslookup db.sunny-stack.com`
4. PostgreSQL container running: `docker ps | grep postgres`

**Test from Pi:**

```bash
psql "postgresql://sunnystack:PASSWORD@localhost:5432/sunnystack"
```

---

### Issue: "SSL connection error"

**Fix:**

1. Verify SSL files exist: `ls -la ~/sunny-stack/postgres-ssl/`
2. Check permissions: `chmod 600 server.key && chmod 644 server.crt`
3. Restart PostgreSQL: `docker compose restart postgres`
4. Try without SSL first: Remove `?sslmode=require` from DATABASE_URL

---

### Issue: "Password authentication failed"

**Check:**

1. Password in DATABASE_URL matches `.env.production`
2. PostgreSQL user exists: `docker exec -it postgres psql -U sunnystack -c "\du"`
3. pg_hba.conf allows connections: See Phase 5.2

---

### Issue: "Vercel deployment still failing"

**Check Vercel build logs:**

1. Go to Vercel Dashboard → Deployments → [latest deployment]
2. Click "View Function Logs"
3. Look for DATABASE_URL errors
4. Verify all environment variables are set

**Common issues:**

- DATABASE_URL not set in "Production" environment (set for "Preview" only)
- Typo in DATABASE_URL
- DNS not propagated yet (wait 15 minutes)

---

## Summary Checklist

Before marking complete, verify:

- [ ] Public IP address obtained (`curl ifconfig.me`)
- [ ] DNS A record created: `db.sunny-stack.com` → public IP
- [ ] DNS propagated: `nslookup db.sunny-stack.com` returns correct IP
- [ ] Router port forwarding: 5432 → 192.168.1.19:5432
- [ ] Pi firewall configured: `sudo ufw status` shows port 5432 allowed
- [ ] PostgreSQL listen address: `listen_addresses = '*'`
- [ ] PostgreSQL pg_hba.conf: allows `0.0.0.0/0` with scram-sha-256
- [ ] SSL certificates generated (optional but recommended)
- [ ] External connection test successful (from mobile data/VPS)
- [ ] Vercel environment variables configured (all 15+ variables)
- [ ] Vercel redeployed with new DATABASE_URL
- [ ] Test API route successful: `/api/test-db`
- [ ] Health check endpoint working: `/api/health/db`
- [ ] Uptime monitoring configured
- [ ] Documentation updated in [ARCHITECTURE.md](trinity/knowledge-base/ARCHITECTURE.md)

---

**Next Steps After Completion:**

1. Delete test API route: `app/api/test-db/route.ts`
2. Monitor Vercel deployments for 24 hours
3. Set up automated database backups (see `docs/DATABASE_BACKUP.md` - TODO)
4. Configure fail2ban on Pi for brute-force protection (see `docs/PI_SECURITY_HARDENING.md` - TODO)

---

**Document Version**: 1.0
**Author**: Trinity Method (Claude Code)
**Related Docs**:

- [ARCHITECTURE.md](../trinity/knowledge-base/ARCHITECTURE.md)
- [.env.production](../.env.production)
- [docker-compose.yml](../docker-compose.yml)
