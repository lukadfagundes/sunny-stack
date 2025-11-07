# API Security Documentation

**Version:** 1.0.0
**Last Updated:** 2025-11-06
**Owner:** Luka D. Fagundes

---

## Purpose

This document provides comprehensive security information for Sunny Stack API, including authentication methods, authorization models, input validation, rate limiting, and security best practices.

---

## Table of Contents

1. [Authentication Methods](#authentication-methods)
2. [Authorization](#authorization)
3. [Rate Limiting](#rate-limiting)
4. [Input Validation](#input-validation)
5. [Security Headers](#security-headers)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [API Endpoints Security Reference](#api-endpoints-security-reference)

---

## Authentication Methods

Sunny Stack supports multiple authentication methods depending on the use case.

### 1. Google OAuth (NextAuth.js)

**Use Case:** User authentication for admin dashboard

**Flow:** OAuth 2.0 Authorization Code with PKCE

**Implementation:** NextAuth.js v4

**Configuration:**

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
```

**Token Storage:**

- **Method:** Secure HTTP-only cookies
- **Cookie Name:** `next-auth.session-token` (production), `__Secure-next-auth.session-token` (HTTPS)
- **Attributes:**
  - `HttpOnly`: Prevents JavaScript access (XSS protection)
  - `SameSite=Lax`: CSRF protection
  - `Secure`: HTTPS-only (production)
  - `Path=/`: Available to all routes

**Session Duration:**

- **Default:** 7 days
- **Idle Timeout:** No automatic logout (session expires after 7 days)
- **Renewal:** Automatic with refresh token from Google

**Revocation:**

- **Client-Side:** Call `/api/auth/signout`
- **Server-Side:** Session deleted from cookie
- **Google Revocation:** User can revoke access at [https://myaccount.google.com/permissions](https://myaccount.google.com/permissions)

**Example Usage:**

```typescript
// Client-side authentication check
import { useSession } from 'next-auth/react';

function AdminPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "unauthenticated") {
    return <p>Access Denied. Please sign in.</p>;
  }

  return <p>Welcome, {session.user.name}!</p>;
}
```

```typescript
// Server-side authentication check
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ user: session.user });
}
```

---

### 2. API Keys (Bot-to-API Communication)

**Use Case:** Discord bot communicating with API

**Header:** `x-api-key: [YOUR_API_KEY]`

**Scope:** Bot-specific routes (`/api/bot/*`)

**Format:**

```
x-api-key: sk_live_abc123xyz789...
```

**Generation:**

```bash
# Generate secure API key (32 bytes, base64 encoded)
openssl rand -base64 32
```

**Rotation Schedule:**

- **Frequency:** Quarterly (every 90 days)
- **Process:** See [SECRETS-ROTATION.md](../../deployment/SECRETS-ROTATION.md)
- **Emergency:** Immediate rotation if compromised

**Storage:**

- **Vercel:** Environment variable `BOT_API_KEY`
- **Raspberry Pi:** `.env` file (BOT_API_KEY)
- **Never:** Commit to Git, hardcode in source

**Validation:**

```typescript
// lib/middleware/api-key.ts
export function validateApiKey(req: Request): boolean {
  const apiKey = req.headers.get("x-api-key");
  return apiKey === process.env.BOT_API_KEY;
}

// Usage in API route
export async function POST(req: Request) {
  if (!validateApiKey(req)) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  // Process request
}
```

**Example Request:**

```bash
curl -X POST https://sunny-stack.com/api/bot/quote \
  -H "x-api-key: sk_live_abc123xyz789..." \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

---

### 3. Session Tokens (NextAuth)

**Use Case:** Authenticated user sessions

**Format:** JWT (JSON Web Token) signed with `NEXTAUTH_SECRET`

**Structure:**

```json
{
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://lh3.googleusercontent.com/..."
  },
  "accessToken": "ya29.a0AfH6SMA...",
  "iat": 1699296000,
  "exp": 1699900800,
  "jti": "uuid-v4"
}
```

**Storage:** HTTP-only cookies (see Google OAuth section)

**Validation:**

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function validateSession(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return null;
  }

  return session;
}
```

**Expiry:**

- **Default:** 7 days from creation
- **Sliding Expiration:** No (fixed 7-day window)
- **Renewal:** User must re-authenticate after 7 days

**Security Features:**

- Signed with HMAC-SHA256 using `NEXTAUTH_SECRET`
- Cannot be modified without secret key
- Includes `iat` (issued at) and `exp` (expiry) claims
- Automatically refreshed by NextAuth.js

---

### 4. Webhook Signatures

**Use Case:** Verify webhook authenticity from GitHub, Vercel, Discord

**Algorithm:** HMAC-SHA256

**Header Names:**

- **GitHub:** `x-hub-signature-256`
- **Vercel:** `x-vercel-signature`
- **Discord:** `x-signature-ed25519`, `x-signature-timestamp` (Ed25519)

**Validation (GitHub Example):**

```typescript
import crypto from "crypto";

export function verifyGitHubSignature(req: Request, payload: string): boolean {
  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) return false;

  const secret = process.env.GITHUB_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");

  // Timing-safe comparison
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

**Secret Rotation:**

- **Frequency:** Quarterly (with other API keys)
- **Process:**
  1. Generate new secret in provider dashboard
  2. Update environment variable
  3. Redeploy services
  4. Verify webhooks working

**Example Request:**

```bash
curl -X POST https://sunny-stack.com/api/webhooks/github \
  -H "x-hub-signature-256: sha256=abc123..." \
  -H "Content-Type: application/json" \
  -d '{"action": "opened", "pull_request": {...}}'
```

---

## Authorization

Authorization determines what authenticated users can access.

### Admin Role Check

**Admin Identification:**

- **Method:** Email address comparison
- **Environment Variable:** `ADMIN_EMAIL`
- **Example:** `ADMIN_EMAIL=luka@sunny-stack.com`

**Implementation:**

```typescript
export async function isAdmin(email: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not configured");
    return false;
  }

  return email === adminEmail;
}
```

**Usage in Middleware:**

```typescript
// lib/middleware/auth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export function withAuth(handler: Function) {
  return async (req: Request, context?: any) => {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return Response.json(
        { error: "Unauthorized - No session found" },
        { status: 401 },
      );
    }

    if (!isAdmin(session.user.email)) {
      return Response.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    return handler(req, context);
  };
}
```

**Protected Routes:**

- `/api/admin/*` - All admin API routes
- `/admin-*` - Admin dashboard pages

**Failure Responses:**

- **401 Unauthorized:** No session (not authenticated)
- **403 Forbidden:** Session exists but not admin (not authorized)

---

### API Route Protection

**Middleware Application:**

```typescript
// app/api/admin/projects/route.ts
import { withAuth } from "@/lib/middleware/auth";

async function handleRequest(req: Request) {
  // Protected logic - only admin can access
  const projects = await prisma.project.findMany();
  return Response.json({ projects });
}

export const GET = withAuth(handleRequest);
```

**Route-Specific Authorization:**

```typescript
// app/api/quotes/route.ts
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Public route - return limited data
    const publicQuotes = await prisma.quote.findMany({
      where: { status: "approved" },
      select: { id: true, title: true },
    });
    return Response.json({ quotes: publicQuotes });
  }

  if (isAdmin(session.user.email)) {
    // Admin - return all quotes
    const allQuotes = await prisma.quote.findMany();
    return Response.json({ quotes: allQuotes });
  }

  // Regular user - return their quotes only
  const userQuotes = await prisma.quote.findMany({
    where: { email: session.user.email },
  });
  return Response.json({ quotes: userQuotes });
}
```

---

### Resource Ownership

**Principle:** Users can only access their own resources

**Implementation:**

```typescript
// app/api/quotes/[id]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
  });

  if (!quote) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Check ownership (unless admin)
  if (!isAdmin(session.user.email) && quote.email !== session.user.email) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ quote });
}
```

**Access Matrix:**

| Resource             | Public             | Authenticated User | Admin           |
| -------------------- | ------------------ | ------------------ | --------------- |
| **Quotes (All)**     | ❌                 | ❌ Own quotes only | ✅              |
| **Quote (Single)**   | ❌                 | ✅ If owner        | ✅              |
| **Projects (All)**   | ✅ Public projects | ✅ Public projects | ✅ All projects |
| **Project (Single)** | ✅ If public       | ✅ If public       | ✅              |
| **Analytics**        | ❌                 | ❌                 | ✅ Admin only   |
| **Settings**         | ❌                 | ❌                 | ✅ Admin only   |

---

## Rate Limiting

Rate limiting prevents abuse and protects against denial-of-service attacks.

### Vercel Default Limits

**Automatic Rate Limiting (All Deployments):**

- **Edge Functions:** 100 requests / 10 seconds per IP address
- **Serverless Functions:** 500 requests / 10 seconds per deployment
- **Static Assets:** Unlimited (CDN cached)

**Enforcement:**

- Applied per IP address
- Returns HTTP 429 (Too Many Requests) when exceeded
- No persistent IP blocking (resets after time window)

**Response:**

```json
{
  "error": {
    "code": "rate_limited",
    "message": "Too many requests from this IP address"
  }
}
```

---

### Custom Rate Limits

**Planned Implementation (Future Enhancement):**

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimiter = {
  // Contact form: 5 submissions per hour per IP
  contactForm: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "ratelimit:contact",
  }),

  // Quote form: 5 submissions per hour per IP
  quoteForm: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "ratelimit:quote",
  }),

  // Admin routes: 100 requests per minute (authenticated)
  adminApi: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    prefix: "ratelimit:admin",
  }),
};
```

**Usage:**

```typescript
// app/api/send-quote/route.ts
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  const { success, limit, remaining, reset } =
    await rateLimiter.quoteForm.limit(ip);

  if (!success) {
    return Response.json(
      {
        error: "Too many submissions",
        retryAfter: reset,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(reset).toISOString(),
        },
      },
    );
  }

  // Process quote submission
}
```

**Recommended Limits:**

| Endpoint          | Rate Limit   | Window   | Identifier     |
| ----------------- | ------------ | -------- | -------------- |
| `/api/send-quote` | 5 requests   | 1 hour   | IP address     |
| `/api/contact`    | 10 requests  | 1 hour   | IP address     |
| `/api/admin/*`    | 100 requests | 1 minute | Session (user) |
| `/api/bot/*`      | 100 requests | 1 minute | API key        |
| `/api/health`     | Unlimited    | -        | None           |

---

### Abuse Prevention

**Strategies:**

1. **CAPTCHA (Future Enhancement):**
   - Google reCAPTCHA v3 for contact/quote forms
   - Challenge score < 0.5 requires manual review

2. **IP Blocking:**
   - Manual blocking via Vercel dashboard
   - Firewall rules on self-hosted infrastructure

3. **Bot Detection:**
   - User-Agent validation (block empty or suspicious agents)
   - Honeypot fields (hidden form fields that bots fill)

4. **Behavioral Analysis:**
   - Track submission patterns (time between submissions)
   - Flag duplicate submissions (same email, phone, description)

**Example Bot Detection:**

```typescript
export function detectBot(req: Request): boolean {
  const userAgent = req.headers.get("user-agent") || "";

  // Block empty User-Agent
  if (!userAgent) return true;

  // Block known bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}
```

---

## Input Validation

All user inputs must be validated and sanitized to prevent injection attacks.

### Type Checking (TypeScript)

**Compile-Time Safety:**

```typescript
// types/quote.ts
export interface QuoteRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  description: string;
}

// app/api/send-quote/route.ts
export async function POST(req: Request) {
  const body: QuoteRequest = await req.json();

  // TypeScript ensures type safety at compile time
  // Runtime validation still required!
}
```

---

### Schema Validation (Zod - Future Enhancement)

**Runtime Validation:**

```typescript
import { z } from "zod";

const quoteSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  company: z.string().max(100).optional(),
  description: z.string().min(10).max(5000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = quoteSchema.parse(body);

    // `validated` is now type-safe and validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
  }
}
```

---

### Current Validation (lib/quote-validation.ts)

**Email Validation:**

```typescript
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

**Phone Validation (E.164 Format):**

```typescript
export function validatePhone(phone: string): boolean {
  // E.164 format: +[country code][number]
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}
```

**URL Validation:**

```typescript
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS (security best practice)
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
```

**HTML Sanitization:**

```typescript
import sanitizeHtml from "sanitize-html";

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [], // Remove all HTML tags
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
}
```

**Usage Example:**

```typescript
export async function POST(req: Request) {
  const { email, description } = await req.json();

  if (!validateEmail(email)) {
    return Response.json({ error: "Invalid email format" }, { status: 400 });
  }

  const sanitizedDescription = sanitizeInput(description);

  // Proceed with sanitized input
}
```

---

### Validation Rules

**General Principles:**

1. **Whitelist, Don't Blacklist:** Define what's allowed, not what's forbidden
2. **Fail Securely:** Reject invalid input, don't try to "fix" it
3. **Validate on Server:** Never trust client-side validation alone
4. **Sanitize Output:** Escape HTML when displaying user content

**Field-Specific Rules:**

| Field           | Min Length | Max Length | Format                     | Required |
| --------------- | ---------- | ---------- | -------------------------- | -------- |
| **Name**        | 1          | 100        | Letters, spaces, hyphens   | Yes      |
| **Email**       | 3          | 255        | RFC 5322 compliant         | Yes      |
| **Phone**       | 10         | 15         | E.164 format (+1234567890) | No       |
| **Company**     | 0          | 100        | Alphanumeric, spaces       | No       |
| **Description** | 10         | 5000       | Plain text (HTML stripped) | Yes      |

---

### Sanitization

**SQL Injection Prevention:**

```typescript
// Prisma ORM (parameterized queries by default)
const user = await prisma.user.findUnique({
  where: { id: userId }, // Automatically parameterized
});

// ❌ NEVER do this (vulnerable to SQL injection)
// const query = `SELECT * FROM users WHERE id = ${userId}`;
```

**XSS Prevention:**

```typescript
// React automatically escapes JSX
function UserProfile({ name }: { name: string }) {
  return (<h1>Welcome, { name }! < /h1>; / / Safe - auto - escaped);
}

// ❌ NEVER do this (vulnerable to XSS)
// <div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Command Injection Prevention:**

```typescript
// ❌ NEVER execute shell commands with user input
// const { exec } = require('child_process');
// exec(`git log ${userInput}`); // Vulnerable

// ✅ Use libraries instead of shell commands
import simpleGit from "simple-git";
const git = simpleGit();
await git.log(); // Safe
```

**Path Traversal Prevention:**

```typescript
import path from "path";

export function safeFilePath(userInput: string): string {
  const basePath = "/var/uploads";

  // Resolve to absolute path
  const absolutePath = path.resolve(basePath, userInput);

  // Ensure path is within base directory
  if (!absolutePath.startsWith(basePath)) {
    throw new Error("Invalid file path");
  }

  return absolutePath;
}

// ❌ NEVER do this (vulnerable to path traversal)
// const filePath = `/var/uploads/${userInput}`; // User can input "../../etc/passwd"
```

---

## Security Headers

Security headers protect against common web vulnerabilities.

### CORS Configuration

**Same-Origin Policy (Default):**

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://sunny-stack.com",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, x-api-key",
          },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ];
  },
};
```

**Cross-Origin Requests:**

```typescript
// For external API consumers (future)
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Or specific domain
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
}
```

---

### Content Security Policy (CSP)

**Configured in next.config.js:**

```javascript
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
};
```

**CSP Directives:**

- **default-src 'self':** Only load resources from same origin
- **script-src:** Allow scripts from self + Vercel Analytics
- **style-src 'unsafe-inline':** Allow inline styles (Tailwind CSS)
- **img-src https:**: Allow images from HTTPS sources
- **frame-ancestors 'none':** Prevent clickjacking (same as X-Frame-Options: DENY)
- **upgrade-insecure-requests:** Force HTTP to HTTPS

---

### Other Security Headers

**X-Frame-Options:**

```
X-Frame-Options: DENY
```

- Prevents clickjacking by blocking iframe embedding

**X-Content-Type-Options:**

```
X-Content-Type-Options: nosniff
```

- Prevents MIME type sniffing attacks

**Strict-Transport-Security (HSTS):**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

- Forces HTTPS for 1 year, includes subdomains

**Referrer-Policy:**

```
Referrer-Policy: strict-origin-when-cross-origin
```

- Controls referrer information sent to other sites

**Permissions-Policy:**

```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

- Disables browser features not needed

---

### Cache Control

**Public Endpoints:**

```typescript
export async function GET(req: Request) {
  const data = await getPublicData();

  return Response.json(data, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
```

**Private Endpoints:**

```typescript
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const data = await getUserData(session.user.email);

  return Response.json(data, {
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
```

**Sensitive Data:**

```typescript
export async function GET(req: Request) {
  const sensitiveData = await getAdminData();

  return Response.json(sensitiveData, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
```

---

## Error Handling

Proper error handling prevents information disclosure.

### Error Response Format

**Consistent Structure:**

```typescript
interface ErrorResponse {
  error: string; // Error type (Unauthorized, Validation Error)
  message: string; // User-friendly message
  statusCode: number; // HTTP status code
  details?: any; // Optional details (development only)
}
```

**Example:**

```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to access this resource",
  "statusCode": 401
}
```

---

### HTTP Status Codes

**Standard Codes:**

| Code    | Name                  | Usage                                                       |
| ------- | --------------------- | ----------------------------------------------------------- |
| **200** | OK                    | Successful GET, PUT, PATCH                                  |
| **201** | Created               | Successful POST (resource created)                          |
| **204** | No Content            | Successful DELETE                                           |
| **400** | Bad Request           | Validation errors, malformed JSON                           |
| **401** | Unauthorized          | Not authenticated (no session)                              |
| **403** | Forbidden             | Not authorized (authenticated but insufficient permissions) |
| **404** | Not Found             | Resource doesn't exist                                      |
| **405** | Method Not Allowed    | Wrong HTTP method (GET instead of POST)                     |
| **409** | Conflict              | Duplicate resource (email already exists)                   |
| **422** | Unprocessable Entity  | Validation failed (alternative to 400)                      |
| **429** | Too Many Requests     | Rate limit exceeded                                         |
| **500** | Internal Server Error | Unexpected server error                                     |
| **502** | Bad Gateway           | Upstream service failure                                    |
| **503** | Service Unavailable   | Maintenance mode                                            |

---

### Production Error Handling

**No Sensitive Data in Errors:**

```typescript
// ✅ GOOD: Generic error message
export async function POST(req: Request) {
  try {
    await processPayment();
  } catch (error) {
    // Log detailed error server-side
    console.error("Payment processing failed:", error);

    // Return generic error to client
    return Response.json(
      { error: "Payment failed", message: "Please try again later" },
      { status: 500 },
    );
  }
}

// ❌ BAD: Exposes internal details
export async function POST(req: Request) {
  try {
    await processPayment();
  } catch (error) {
    return Response.json(
      {
        error: error.message, // Might expose database schema, API keys, etc.
        stack: error.stack, // Exposes file paths, code structure
      },
      { status: 500 },
    );
  }
}
```

---

### Development vs Production

**Environment-Aware Errors:**

```typescript
export function handleError(error: Error) {
  // Always log to Rollbar/console
  console.error("Error:", error);

  // Production: Generic message
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "Internal Server Error", message: "An error occurred" },
      { status: 500 },
    );
  }

  // Development: Full details
  return Response.json(
    {
      error: error.message,
      stack: error.stack,
      name: error.name,
    },
    { status: 500 },
  );
}
```

---

### Validation Error Responses

**Detailed Validation Errors (User-Facing):**

```typescript
export async function POST(req: Request) {
  const { email, name } = await req.json();

  const errors: Record<string, string> = {};

  if (!email || !validateEmail(email)) {
    errors.email = "Invalid email format";
  }

  if (!name || name.length < 1) {
    errors.name = "Name is required";
  }

  if (Object.keys(errors).length > 0) {
    return Response.json(
      {
        error: "Validation Error",
        message: "Please fix the following errors",
        statusCode: 400,
        details: errors,
      },
      { status: 400 },
    );
  }

  // Process valid input
}
```

**Response:**

```json
{
  "error": "Validation Error",
  "message": "Please fix the following errors",
  "statusCode": 400,
  "details": {
    "email": "Invalid email format",
    "name": "Name is required"
  }
}
```

---

## Best Practices

### 1. Use HTTPS Only

**Enforce HTTPS:**

- Vercel enforces HTTPS by default
- Redirect HTTP to HTTPS (see SECURITY-CHECKLIST.md)
- Use `Strict-Transport-Security` header

**Certificate Management:**

- Vercel provides automatic SSL certificates (Let's Encrypt)
- Renews automatically before expiry
- No manual certificate management required

---

### 2. Validate Content-Type

**Expect application/json:**

```typescript
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    return Response.json(
      { error: "Invalid Content-Type", message: "Expected application/json" },
      { status: 415 }, // Unsupported Media Type
    );
  }

  const body = await req.json();
  // Process JSON body
}
```

---

### 3. Log Security Events

**Events to Log:**

- Failed authentication attempts
- Rate limiting triggers
- Suspicious activity (bot detection, rapid submissions)
- Authorization failures (403 Forbidden)
- Invalid API key usage

**Example:**

```typescript
// lib/logger.ts
export function logSecurityEvent(event: string, details: any) {
  console.warn(`[SECURITY] ${event}:`, details);

  // Send to Rollbar with "warning" level
  Rollbar.warning(event, details);

  // Send to Discord (optional)
  if (process.env.DISCORD_SECURITY_WEBHOOK) {
    notifyDiscord(event, details);
  }
}

// Usage
logSecurityEvent("Failed authentication", {
  email: session?.user?.email,
  ip: req.headers.get("x-forwarded-for"),
  timestamp: new Date().toISOString(),
});
```

---

### 4. Rotate API Keys Regularly

**Schedule:** Quarterly (every 90 days)

**Process:** See [SECRETS-ROTATION.md](../../deployment/SECRETS-ROTATION.md)

**Keys to Rotate:**

- `RESEND_API_KEY`
- `BOT_API_KEY`
- `GITHUB_TOKEN`
- `DISCORD_BOT_TOKEN`
- `NEXTAUTH_SECRET` (semi-annually)
- `DATABASE_URL` (password component, semi-annually)

---

### 5. Monitor Error Rates

**Rollbar Alerts:**

- Critical errors: Immediate notification
- Error rate spike: >50 errors/hour
- New error types: First occurrence of unique error

**Metrics to Track:**

- Error rate (errors per hour/day)
- 401/403 rate (authentication/authorization failures)
- 429 rate (rate limiting triggers)
- Response time (p50, p95, p99)

**Example Alert Configuration:**

```yaml
# Rollbar alert settings
alerts:
  - type: new_item
    level: critical
    notification: email, discord

  - type: occurrence_rate
    threshold: 50
    period: 1h
    notification: email

  - type: deploy
    notification: discord
```

---

### 6. Keep Dependencies Updated

**Dependabot Configuration:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
    commit-message:
      prefix: "chore(deps)"
```

**Security Audits:**

```bash
# Weekly: Run npm audit
npm audit

# Fix vulnerabilities
npm audit fix

# For unfixable vulnerabilities
npm audit fix --force  # Use with caution
```

---

### 7. Test Authentication Flows

**Security Test Suite:**

```bash
# Run authentication tests
npm test -- __tests__/security/access-control.test.ts

# Run authorization tests
npm test -- __tests__/security/authorization.test.ts

# Run all security tests
npm test -- __tests__/security/
```

**Test Coverage:**

- Unauthenticated access to protected routes (expect 401)
- Non-admin access to admin routes (expect 403)
- Invalid API keys (expect 401)
- Expired sessions (expect 401)
- CSRF token validation (if applicable)

---

## API Endpoints Security Reference

Comprehensive security settings for all API endpoints.

| Endpoint                   | Method           | Authentication | Authorization | Rate Limit     | Notes                          |
| -------------------------- | ---------------- | -------------- | ------------- | -------------- | ------------------------------ |
| **PUBLIC ROUTES**          | -                | -              | -             | -              | -                              |
| `/api/health`              | GET              | None           | Public        | Unlimited      | Health check for monitoring    |
| `/api/send-quote`          | POST             | Optional       | Public        | 5/hour per IP  | Contact/quote form submission  |
| **AUTHENTICATION ROUTES**  | -                | -              | -             | -              | -                              |
| `/api/auth/signin`         | GET, POST        | None           | Public        | Vercel default | NextAuth sign in               |
| `/api/auth/signout`        | GET, POST        | Required       | Public        | Vercel default | NextAuth sign out              |
| `/api/auth/session`        | GET              | None           | Public        | Vercel default | Get current session            |
| `/api/auth/callback/*`     | GET, POST        | None           | Public        | Vercel default | OAuth callbacks                |
| **ADMIN ROUTES**           | -                | -              | -             | -              | -                              |
| `/api/admin/projects`      | GET              | Required       | Admin only    | 100/min        | List all projects              |
| `/api/admin/projects/[id]` | GET, PUT, DELETE | Required       | Admin only    | 100/min        | Manage single project          |
| `/api/admin/quotes`        | GET              | Required       | Admin only    | 100/min        | List all quotes                |
| `/api/admin/quotes/[id]`   | GET, PUT, DELETE | Required       | Admin only    | 100/min        | Manage single quote            |
| `/api/admin/analytics`     | GET              | Required       | Admin only    | 100/min        | View analytics dashboard       |
| `/api/admin/settings`      | GET, PUT         | Required       | Admin only    | 100/min        | Manage site settings           |
| **BOT ROUTES**             | -                | -              | -             | -              | -                              |
| `/api/bot/quote`           | POST             | API Key        | Bot only      | 100/min        | Bot-triggered quote submission |
| `/api/bot/health`          | GET              | API Key        | Bot only      | Unlimited      | Bot health check               |

---

### Endpoint-Specific Security

**Public Endpoints:**

- Input validation required
- Rate limiting recommended (prevent spam)
- No sensitive data in responses
- CORS allowed (same-origin or specific origins)

**Authenticated Endpoints:**

- Session validation required (`getServerSession`)
- Resource ownership checks (users can only access their data)
- CSRF protection (NextAuth provides automatically)
- Private caching (`Cache-Control: private`)

**Admin Endpoints:**

- Admin role check required (`isAdmin(email)`)
- Audit logging (log all admin actions)
- No caching (`Cache-Control: no-store`)
- Rate limiting (stricter limits)

**Bot Endpoints:**

- API key validation (`x-api-key` header)
- Limited scope (only bot-specific actions)
- Key rotation quarterly
- Monitoring for unusual patterns

---

## Security Testing

### Unit Tests

**Location:** `__tests__/security/`

**Test Files:**

- `access-control.test.ts` - Authentication/authorization
- `csrf-protection.test.ts` - CSRF token validation
- `injection-prevention.test.ts` - SQL injection, XSS
- `rate-limiting.test.ts` - Rate limit enforcement
- `security-headers.test.ts` - HTTP security headers

**Run Tests:**

```bash
# All security tests
npm test -- __tests__/security/

# Specific test file
npm test -- __tests__/security/access-control.test.ts

# With coverage
npm test -- __tests__/security/ --coverage
```

---

### Integration Tests

**Test Scenarios:**

1. **Unauthenticated Access:**
   - Try accessing `/api/admin/projects` without session
   - Expect: 401 Unauthorized

2. **Non-Admin Access:**
   - Authenticate as non-admin user
   - Try accessing `/api/admin/projects`
   - Expect: 403 Forbidden

3. **Resource Ownership:**
   - User A creates quote
   - User B tries to access User A's quote
   - Expect: 403 Forbidden

4. **Rate Limiting:**
   - Submit 6 quotes from same IP within 1 hour
   - Expect: 6th request returns 429 Too Many Requests

5. **Input Validation:**
   - Submit quote with invalid email
   - Expect: 400 Bad Request with validation errors

---

### Security Scan

**Automated Scanning:**

```bash
# npm audit (dependency vulnerabilities)
npm audit

# Expected: 0 vulnerabilities

# Snyk (alternative)
npx snyk test

# OWASP Dependency Check (Java-based)
# Not typically used for Node.js projects
```

**Manual Penetration Testing:**

Tools to consider (use ethically):

- **Burp Suite Community Edition** - Web application security testing
- **OWASP ZAP** - Open-source security scanner
- **Postman** - API endpoint testing

**Before Testing:**

- Only test on your own infrastructure
- Don't test production without approval
- Follow SECURITY.md responsible disclosure policy

---

## Incident Response

If you discover a security vulnerability:

1. **Do NOT disclose publicly**
2. **Email:** luka@sunny-stack.com
3. **Include:**
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Response Timeline:**

- **Acknowledgment:** 24-48 hours
- **Initial Assessment:** 3-5 business days
- **Fix Deployment:** 7-14 days (critical), 14-30 days (high)

See [INCIDENT-RESPONSE.md](../../deployment/INCIDENT-RESPONSE.md) for full incident response procedures.

---

## Related Documents

- [SECURITY.md](../../SECURITY.md) - Vulnerability disclosure policy
- [PRIVACY.md](../../PRIVACY.md) - Privacy policy (draft)
- [INCIDENT-RESPONSE.md](../../deployment/INCIDENT-RESPONSE.md) - Security incident procedures
- [SECRETS-ROTATION.md](../../deployment/SECRETS-ROTATION.md) - Credential rotation schedule
- [SECURITY-CHECKLIST.md](../../deployment/SECURITY-CHECKLIST.md) - Pre-deployment checklist

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-06
**Next Review:** 2026-02-06
**Owner:** Luka D. Fagundes
