# Security Best Practices Guide

Comprehensive security guide for developing and deploying Sunny Stack Portfolio.

---

## Security Architecture Overview

### Security Layers

```
┌─────────────────────────────────────────────────┐
│ Layer 1: Network Security                       │
│  • HTTPS enforcement                             │
│  • Firewall (UFW on Pi)                          │
│  • Port forwarding (minimal)                     │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ Layer 2: Application Security                   │
│  • Content Security Policy (CSP)                 │
│  • Security headers                              │
│  • Input validation (Zod)                        │
│  • XSS protection                                │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ Layer 3: Authentication & Authorization         │
│  • Google OAuth 2.0                              │
│  • HTTP-only session cookies                     │
│  • Admin email allowlist                         │
│  • Discord interaction verification              │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ Layer 4: Data Security                          │
│  • Environment variable secrets                  │
│  • Database over TLS                             │
│  • Soft deletes (data retention)                 │
│  • API key authentication                        │
└─────────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### Google OAuth Implementation

**Flow:**

```
1. User clicks "Sign in with Google"
   ↓
2. Redirect to Google OAuth consent screen
   ↓
3. User grants permissions
   ↓
4. Google redirects to /api/auth/callback/google
   ↓
5. Verify user email matches ADMIN_EMAIL
   ↓
6. Create session cookie (HTTP-only, secure)
   ↓
7. Redirect to /admin dashboard
```

**Implementation:**

```typescript
// lib/auth/google-oauth.ts
export async function handleGoogleCallback(code: string) {
  // Exchange code for tokens
  const tokens = await getGoogleTokens(code);

  // Get user profile
  const profile = await getGoogleProfile(tokens.access_token);

  // Verify admin email
  if (profile.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized: Not admin email");
  }

  // Create session
  const session = {
    user: {
      email: profile.email,
      name: profile.name,
      avatar: profile.picture,
    },
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  return session;
}
```

### Session Management

```typescript
// lib/auth/session.ts
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function createSession(user: User) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  return token;
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.user as User;
  } catch (error) {
    return null;
  }
}
```

**Set session cookie (HTTP-only):**

```typescript
// app/api/auth/callback/google/route.ts
import { cookies } from "next/headers";

export async function GET(request: Request) {
  // ... OAuth flow ...

  const token = await createSession(user);

  cookies().set("session", token, {
    httpOnly: true, // Prevent XSS access
    secure: true, // HTTPS only
    sameSite: "lax", // CSRF protection
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return redirect("/admin");
}
```

### Authorization Middleware

```typescript
// lib/middleware/admin-auth.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";

export async function requireAdmin(request: NextRequest) {
  const sessionToken = request.cookies.get("session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await verifySession(sessionToken);

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { user };
}
```

**Usage in API routes:**

```typescript
// app/api/admin/projects/route.ts
import { requireAdmin } from "@/lib/middleware/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth; // Error response

  // Authorized - proceed with logic
  const projects = await prisma.project.findMany();
  return NextResponse.json(projects);
}
```

---

## Environment Variable Security

### Required Secrets

**Development (.env.local):**

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/sunnystack_dev"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Admin
ADMIN_EMAIL="admin@sunny-stack.com"

# Discord Bot
DISCORD_BOT_TOKEN="MTxxx.xxx.xxx"
DISCORD_APPLICATION_ID="1234567890"
DISCORD_PUBLIC_KEY="xxx"
BOT_API_SECRET="random-secret"

# Services
RESEND_API_KEY="re_xxx"
ROLLBAR_ACCESS_TOKEN="xxx"
```

**Production (Vercel):**

- Set via Vercel dashboard or CLI
- Never commit production secrets to Git
- Use different secrets than development

### Secret Generation

```bash
# Generate secure random secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# For NEXTAUTH_SECRET (recommended)
npx auth secret
```

### Secret Rotation

**Example: Rotate Google OAuth credentials**

```bash
# 1. Generate new credentials in Google Cloud Console
# 2. Update Vercel environment variables
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production

# 3. Force redeploy
vercel --prod --force

# 4. Test authentication
# 5. Delete old credentials from Google Cloud Console
```

**Example: Rotate database password**

```bash
# 1. Update password in PostgreSQL
docker compose exec postgres psql -U sunnystack -c "ALTER USER sunnystack WITH PASSWORD 'new_password';"

# 2. Update .env.production on Pi
nano ~/projects/sunny-stack/.env.production

# 3. Update DATABASE_URL in Vercel
vercel env add DATABASE_URL production

# 4. Restart services
docker compose restart
vercel --prod --force
```

### Environment Variable Validation

```javascript
// validate-env.cjs
const requiredEnvVars = [
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "ADMIN_EMAIL",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

console.log("✅ All required environment variables are set");
```

**Run validation on startup:**

```json
// package.json
{
  "scripts": {
    "dev": "node validate-env.cjs && next dev",
    "build": "node validate-env.cjs && next build"
  }
}
```

---

## API Security

### Input Validation (Zod)

```typescript
// lib/validation/project-schema.ts
import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(3).max(200),
  clientName: z.string().min(2).max(100),
  clientEmail: z.string().email(),
  description: z.string().max(5000).optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETE", "ARCHIVED"]),
  budget: z.number().positive().max(1000000).optional(),
  deadline: z.string().datetime().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

**Usage in API route:**

```typescript
// app/api/admin/projects/route.ts
import { createProjectSchema } from "@/lib/validation/project-schema";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();

  // Validate input
  const result = createProjectSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.errors },
      { status: 400 },
    );
  }

  // Validated data
  const data = result.data;

  // Create project
  const project = await prisma.project.create({ data });

  return NextResponse.json(project, { status: 201 });
}
```

### SQL Injection Prevention

**Prisma ORM handles this automatically:**

```typescript
// ✅ Safe: Parameterized query via Prisma
const project = await prisma.project.findUnique({
  where: { id: projectId },
});

// ❌ Never use raw SQL with user input
// DANGEROUS - DO NOT DO THIS:
await prisma.$executeRawUnsafe(
  `SELECT * FROM projects WHERE id = '${userInput}'`,
);

// ✅ If raw SQL needed, use parameterized query
await prisma.$executeRaw`
  SELECT * FROM projects WHERE id = ${projectId}
`;
```

### XSS Prevention

**React automatically escapes output:**

```typescript
// ✅ Safe: React escapes HTML
<div>{project.title}</div>

// ❌ Dangerous: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ If HTML needed, sanitize first
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: sanitized }} />
```

### CSRF Protection

**Next.js + SameSite cookies:**

```typescript
// Session cookie with SameSite=lax (default)
cookies().set("session", token, {
  sameSite: "lax", // Prevents CSRF attacks
});

// For state-changing operations, verify origin
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin !== process.env.NEXTAUTH_URL) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  // Proceed...
}
```

### Rate Limiting

```typescript
// lib/middleware/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function checkRateLimit(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  return null;
}
```

**Usage:**

```typescript
export async function POST(request: NextRequest) {
  const rateLimitError = await checkRateLimit(request);
  if (rateLimitError) return rateLimitError;

  // Proceed...
}
```

---

## Production Security

### Security Headers

**next.config.js:**

```javascript
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://vercel.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
```

### HTTPS Enforcement

**Vercel:** Automatic HTTPS (no configuration needed)

**Raspberry Pi (if exposing database):**

```bash
# Use Cloudflare Tunnel or SSH tunnel instead of exposing port 5432
# More secure than opening port to public internet

# Option 1: Cloudflare Tunnel (recommended)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

# Option 2: SSH tunnel from Vercel
ssh -L 5432:localhost:5432 pi@your-pi-ip
```

### Database Access Control

**PostgreSQL configuration:**

```bash
# Only allow connections from trusted IPs
# docker-compose.yml
environment:
  POSTGRES_HOST_AUTH_METHOD: scram-sha-256  # Strong password hashing

# pg_hba.conf (if customizing)
# Allow only specific IPs
host    sunnystack    sunnystack    192.168.1.0/24    scram-sha-256
```

### SSH Key Management

**Disable password authentication:**

```bash
# /etc/ssh/sshd_config
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin no
```

**Key rotation:**

```bash
# Generate new key
ssh-keygen -t ed25519 -C "new-key-2026"

# Add to Pi
ssh-copy-id -i ~/.ssh/new-key.pub pi@raspberrypi.local

# Test new key
ssh -i ~/.ssh/new-key pi@raspberrypi.local

# Remove old key from authorized_keys
nano ~/.ssh/authorized_keys
```

### Firewall Configuration

```bash
# View current rules
sudo ufw status verbose

# Allow only necessary ports
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 5432/tcp   # PostgreSQL (if needed externally)
sudo ufw allow 8080/tcp   # Bot health check (optional)

# Deny all other incoming
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Enable firewall
sudo ufw enable
```

---

## Monitoring & Incident Response

### Error Tracking (Rollbar)

```typescript
// lib/error-tracking.ts
import Rollbar from "rollbar";

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  environment: process.env.NODE_ENV,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

export function logError(error: Error, context?: any) {
  if (process.env.NODE_ENV === "production") {
    rollbar.error(error, context);
  } else {
    console.error(error, context);
  }
}
```

### Security Alerting

```typescript
// lib/security/alerts.ts
import { sendDiscordNotification } from "@/lib/notifications/discord";

export async function alertSecurityEvent(event: {
  type: "unauthorized_access" | "suspicious_activity" | "failed_login";
  details: string;
  ip?: string;
  userAgent?: string;
}) {
  // Log to database
  await prisma.monitoringAlert.create({
    data: {
      type: "ALERT",
      severity: "CRITICAL",
      source: "security",
      message: `Security Event: ${event.type}`,
      metadata: event,
    },
  });

  // Send Discord notification
  await sendDiscordNotification({
    channel: "security-alerts",
    message: `🚨 Security Alert: ${event.type}`,
    details: event.details,
  });

  // Log to Rollbar
  logError(new Error(`Security event: ${event.type}`), event);
}
```

### Incident Response Procedures

**1. Unauthorized Access Detected:**

```bash
# Immediate actions:
# 1. Rotate all secrets (OAuth, database, API keys)
# 2. Review access logs
# 3. Lock down affected accounts
# 4. Notify stakeholders

# Vercel logs
vercel logs --since 24h | grep -i error

# Pi logs
docker compose logs --since 24h | grep -i unauthorized

# Database audit
docker compose exec postgres psql -U sunnystack -c "
  SELECT * FROM users WHERE created_at > NOW() - INTERVAL '24 hours';
"
```

**2. Data Breach:**

```bash
# Immediate actions:
# 1. Isolate affected systems
# 2. Preserve evidence (logs, backups)
# 3. Assess scope of breach
# 4. Notify affected users (if applicable)
# 5. Implement fixes
# 6. Document incident

# Backup current state
docker compose exec postgres pg_dump -U sunnystack sunnystack > incident-backup-$(date +%Y%m%d-%H%M%S).sql

# Review access logs
grep -i "suspicious pattern" /var/log/nginx/access.log
```

**3. DDoS Attack:**

```bash
# Immediate actions:
# 1. Enable Cloudflare rate limiting
# 2. Block malicious IPs
# 3. Scale infrastructure (if possible)
# 4. Notify hosting provider

# Check request volume
tail -f /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn

# Block IP via UFW
sudo ufw deny from <malicious-ip>
```

---

## Security Audit Checklist

### Monthly Checklist

- [ ] Review access logs for suspicious activity
- [ ] Check for unauthorized users/projects in database
- [ ] Verify all secrets are still secure (not exposed)
- [ ] Update dependencies (npm audit)
- [ ] Review firewall rules (ufw status)
- [ ] Check for failed login attempts (Rollbar)
- [ ] Verify backups are working
- [ ] Test disaster recovery procedures

### Quarterly Checklist

- [ ] Rotate all secrets (OAuth, database, API keys)
- [ ] Security scan (npm audit, Snyk)
- [ ] Review and update CSP headers
- [ ] Penetration testing (if applicable)
- [ ] Access control audit
- [ ] Update security documentation
- [ ] Team security training

### Automated Security Checks

```bash
# Package vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Security scan with Snyk (optional)
npx snyk test
```

---

## Best Practices Summary

### ✅ DO

1. **Use HTTPS everywhere** (automatic on Vercel)
2. **Validate all user input** (Zod schemas)
3. **Use Prisma for database queries** (prevents SQL injection)
4. **Implement rate limiting** (prevent abuse)
5. **Rotate secrets regularly** (quarterly)
6. **Log security events** (Rollbar + database)
7. **Use HTTP-only cookies** (prevent XSS)
8. **Enable firewall on Pi** (UFW)
9. **Keep dependencies updated** (npm audit)
10. **Backup database daily** (automated cron)

### ❌ DON'T

1. **Don't commit secrets to Git** (.env files in .gitignore)
2. **Don't use raw SQL with user input** (use Prisma)
3. **Don't expose unnecessary ports** (minimal attack surface)
4. **Don't use weak passwords** (use generated secrets)
5. **Don't skip input validation** (always validate)
6. **Don't trust client-side validation** (always validate server-side)
7. **Don't log sensitive data** (passwords, tokens)
8. **Don't use deprecated packages** (npm audit)
9. **Don't skip security headers** (CSP, HSTS, etc.)
10. **Don't ignore security alerts** (Dependabot, npm audit)

---

## Related Documentation

- **[Architecture Overview](../architecture/overview.md)** - System architecture
- **[Deployment Overview](../deployment/DEPLOYMENT-OVERVIEW.md)** - Deployment security
- **[Troubleshooting](../deployment/TROUBLESHOOTING.md)** - Security issues

---

**Last Updated:** 2026-01-07
**Security Level:** Production-ready
**Maintained by:** Sunny Stack Development Team
