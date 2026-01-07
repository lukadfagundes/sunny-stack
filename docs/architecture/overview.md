# Architecture Overview

Sunny Stack Portfolio is a modern web application built with Next.js 15, featuring a hybrid cloud + self-hosted architecture optimized for cost efficiency and performance.

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Public Internet                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│              Vercel (Serverless Cloud)               │
│  ┌───────────────────────────────────────────────┐  │
│  │        Next.js 15 Application                 │  │
│  │  ┌─────────────┐      ┌──────────────────┐   │  │
│  │  │   Pages     │      │   API Routes     │   │  │
│  │  │  (SSR/SSG)  │      │  (Serverless)    │   │  │
│  │  └─────────────┘      └──────────────────┘   │  │
│  │         │                      │              │  │
│  │         └──────────┬───────────┘              │  │
│  │                    │                          │  │
│  └────────────────────┼──────────────────────────┘  │
└────────────────────────┼──────────────────────────┘
                         │ DATABASE_URL
                         │ (PostgreSQL connection)
                         ↓
┌─────────────────────────────────────────────────────┐
│           Raspberry Pi (Self-Hosted)                 │
│  ┌────────────────────────────────────────────────┐ │
│  │   PostgreSQL 15 Container (Docker)             │ │
│  │   - Database: sunnystack                       │ │
│  │   - Port: 5432                                 │ │
│  │   - Connection Pool: 20 connections            │ │
│  └────────────────────────────────────────────────┘ │
│                         ↑                            │
│  ┌────────────────────────────────────────────────┐ │
│  │   Discord Bot Container (Docker)               │ │
│  │   - Bot Application (Discord.js)               │ │
│  │   - WebSocket Gateway to Discord               │ │
│  │   - BOT_API_URL → Vercel API                   │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│               Discord Platform                       │
│   - Slash Commands                                   │
│   - Notifications                                    │
│   - Real-time Events                                 │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Framework:** Next.js 15.5.9 (App Router)
- **UI Library:** React 19.0
- **Language:** TypeScript 5.5
- **Styling:** Tailwind CSS 3.4
- **Fonts:** Geist Font Family

### Backend

- **API:** Next.js API Routes (serverless functions)
- **Database:** PostgreSQL 15 (Docker on Raspberry Pi)
- **ORM:** Prisma 6.18.0
- **Authentication:** Google OAuth (custom NextAuth pattern)
- **Email:** Resend API

### Bot & Services

- **Discord Bot:** Discord.js 14.14.1
- **Logging:** Winston 3.18.3 with daily rotation
- **Error Tracking:** Rollbar 2.26.5
- **Monitoring:** Custom service health checks

### Development & Testing

- **Package Manager:** npm
- **Testing:** Jest 30.1.3 + Playwright 1.55.0
- **Linting:** ESLint 9.37.0
- **Type Checking:** TypeScript 5.5

## Deployment Architecture

### Why Hybrid Architecture?

Sunny Stack uses a **hybrid cloud + self-hosted** approach for optimal cost and performance:

| Component            | Location     | Reasoning                                                            |
| -------------------- | ------------ | -------------------------------------------------------------------- |
| **Next.js Frontend** | Vercel       | Automatic scaling, global CDN, zero-config deployment                |
| **API Routes**       | Vercel       | Serverless functions with automatic scaling                          |
| **PostgreSQL**       | Raspberry Pi | 24/7 database at $0/month operating cost                             |
| **Discord Bot**      | Raspberry Pi | WebSocket requires persistent connection (not serverless-compatible) |

**Cost Comparison:**

- **Cloud-only:** ~$20-50/month (managed PostgreSQL + bot hosting)
- **Hybrid:** ~$0/month (after one-time Pi hardware cost)

### Deployment Targets

#### Production

- **Frontend URL:** https://sunny-stack.com
- **API URL:** https://sunny-stack.com/api
- **Database:** Raspberry Pi (local network + port forwarding)
- **Bot:** Raspberry Pi (Docker container)

#### Staging

- **Preview Deployments:** Automatic Vercel preview per branch
- **Database:** Shared Pi database (separate schema)

#### Development

- **Local Server:** http://localhost:3000
- **Database:** Local PostgreSQL or Pi connection
- **Bot:** Local development mode (npm run bot:dev)

## Application Architecture

### Directory Structure

```
sunny-stack/
├── app/                          # Next.js 15 App Router
│   ├── api/                     # API Routes (27 endpoints)
│   │   ├── admin/              # Admin dashboard APIs
│   │   │   ├── analytics/
│   │   │   ├── health/
│   │   │   ├── monitor/
│   │   │   ├── projects/
│   │   │   ├── proposals/
│   │   │   ├── quotes/
│   │   │   ├── reports/
│   │   │   ├── sync/
│   │   │   ├── test-notification/
│   │   │   └── time-entries/
│   │   ├── auth/               # Authentication (Google OAuth)
│   │   │   ├── callback/
│   │   │   ├── session/
│   │   │   ├── signin/
│   │   │   └── signout/
│   │   ├── discord/            # Discord integration
│   │   │   ├── interactions/
│   │   │   └── webhooks/
│   │   ├── send-quote/         # Public quote submission
│   │   └── health/             # Health check
│   ├── admin/                  # Admin dashboard pages
│   ├── (public pages)/         # Public-facing pages
│   │   ├── about/
│   │   ├── contact/
│   │   ├── portfolio/
│   │   ├── quote/
│   │   └── resume/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── providers.tsx           # Client-side providers
├── bot/                         # Discord Bot (19 commands)
│   ├── commands/               # Slash commands
│   │   ├── admin/             # Admin commands (deploy, logs, health)
│   │   ├── general/           # General commands (ping, help)
│   │   ├── monitoring/        # Monitoring commands (status, alerts)
│   │   └── projects/          # Project commands (create, update, time tracking)
│   ├── core/                  # Bot infrastructure
│   │   ├── client.ts          # Discord.js client setup
│   │   ├── logger.ts          # Winston logger
│   │   └── api-client.ts      # Vercel API client
│   ├── events/                # Discord event handlers
│   ├── gateway/               # Gateway lifecycle management
│   ├── interactions/          # Interaction verification
│   ├── notifications/         # Notification senders
│   └── utils/                 # Circuit breaker, rate limiter
├── components/                  # React Components
│   ├── admin/                 # Admin-only components
│   ├── forms/                 # Form components
│   ├── quote/                 # Quote form components
│   └── ui/                    # Reusable UI components
├── lib/                         # Core Utilities
│   ├── admin/                 # Admin utilities
│   ├── auth/                  # Google OAuth implementation
│   ├── charts/                # Chart configuration
│   ├── db/                    # Database layer
│   │   ├── client.ts          # Prisma client
│   │   ├── cache.ts           # Query caching
│   │   └── optimization.ts    # Query optimization
│   ├── errors/                # Error handling
│   │   ├── app-error.ts       # Custom error classes
│   │   ├── async-handler.ts   # Async route wrapper
│   │   └── handler.ts         # Global error handler
│   ├── google/                # Google API services
│   ├── integrations/          # External APIs
│   │   ├── cloudflare.ts
│   │   ├── flyio.ts
│   │   ├── github.ts
│   │   └── vercel.ts
│   ├── middleware/            # Auth middleware
│   ├── monitoring/            # Service health checks
│   ├── pdf/                   # PDF generation
│   ├── webhooks/              # Webhook verification
│   ├── logger.ts              # Winston logger config
│   └── quote-*.ts             # Quote validation/templates
├── hooks/                       # Custom React Hooks
├── prisma/                      # Database Layer
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Schema migrations
├── __tests__/                   # Unit Tests (299 files)
├── e2e/                         # E2E Tests (15 specs)
├── scripts/                     # Deployment & Utility Scripts
├── docs/                        # Documentation
└── trinity/                     # Trinity Method SDK
```

## Data Architecture

### Database Schema

The application uses **PostgreSQL 15** with **Prisma ORM** for type-safe database access.

#### Core Models

**Users**

- Admin users authenticated via Google OAuth
- Single admin user model (expandable for multi-user)

**Projects**

- Client projects with status tracking
- Budget and deadline management
- Soft delete support (deletedAt)
- Relations: quotes, timeEntries, discordMessages

**Quotes**

- Quote requests from public website
- Status workflow: PENDING → APPROVED/DECLINED → CONVERTED
- Can be converted to projects
- Relations: project, proposals

**Proposals**

- PDF proposals generated from quotes
- Base64 data URLs (future: cloud storage)

**Time Entries**

- Time tracking for projects
- Multiple sources: Discord bot, manual, admin dashboard
- Duration calculated automatically

**Monitoring**

- Service health checks (Cloudflare, Vercel, GitHub, etc.)
- Monitoring events and alerts
- System configuration storage

**Discord Integration**

- Discord message log
- API keys for authentication
- Webhook configurations

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────>│  API Routes  │────>│   Prisma     │
│  (React 19)  │<────│ (Next.js 15) │<────│   Client     │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ↓
                                           ┌──────────────┐
                                           │  PostgreSQL  │
                                           │  (Docker)    │
                                           └──────────────┘
```

1. **Input:** User interaction or Discord command
2. **Validation:** Zod schema validation
3. **Processing:** Business logic in API routes
4. **Database:** Prisma ORM queries
5. **Output:** JSON response or Discord embed

## API Architecture

### REST API Design

All API endpoints follow REST principles:

- **GET:** Retrieve data (idempotent)
- **POST:** Create new resources
- **PATCH:** Partial update
- **DELETE:** Soft delete (sets deletedAt)

### Endpoint Categories

#### Public Endpoints

- `/api/health` - Health check
- `/api/send-quote` - Quote submission

#### Authentication Endpoints

- `/api/auth/signin` - Initiate OAuth
- `/api/auth/callback/google` - OAuth callback
- `/api/auth/session` - Session info
- `/api/auth/signout` - Logout

#### Admin Endpoints (Protected)

- `/api/admin/analytics` - Dashboard data
- `/api/admin/projects/*` - Project CRUD
- `/api/admin/quotes/*` - Quote CRUD
- `/api/admin/time-entries/*` - Time tracking
- `/api/admin/monitor/*` - Service monitoring
- `/api/admin/proposals` - Proposal management

#### Integration Endpoints

- `/api/discord/interactions` - Discord slash commands
- `/api/discord/webhooks` - Discord webhooks

### Authentication Flow

```
1. User clicks "Sign in with Google"
   ↓
2. GET /api/auth/signin (initiates OAuth)
   ↓
3. Google OAuth consent screen
   ↓
4. Google redirects to /api/auth/callback/google
   ↓
5. Session cookie set (HTTP-only, secure)
   ↓
6. User redirected to admin dashboard
```

**Authorization:**

- Admin endpoints check session cookie
- Email must match `ADMIN_EMAIL` env var
- Middleware: `lib/middleware/admin-auth.ts`

## Discord Bot Architecture

### Bot Components

**Commands (19 total):**

- **Admin:** deploy, logs, health, restart
- **Projects:** create, list, update, delete, status
- **Time Tracking:** start, stop, log, report
- **Monitoring:** status, alerts, github, services

**Event Handlers:**

- `ready` - Bot startup
- `interactionCreate` - Slash commands
- `error` - Error handling

**Utilities:**

- Circuit breaker (prevents cascade failures)
- Rate limiter (Discord API limits)
- Retry logic (exponential backoff)

### Bot Communication

```
Discord Gateway (WebSocket)
         ↓
  Discord.js Client
         ↓
  Command Handler
         ↓
  API Client (HTTP)
         ↓
Vercel API Routes (REST)
         ↓
  Prisma → PostgreSQL
```

**Why Separate Bot Build?**

- Discord.js requires persistent WebSocket connection
- Vercel serverless functions timeout after 10 seconds
- Bot runs 24/7 on Raspberry Pi in Docker container

## Security Architecture

### Security Layers

**1. Network Security**

- HTTPS enforcement (Vercel automatic)
- Strict-Transport-Security headers
- CORS configuration on API routes

**2. Application Security**

- Content Security Policy (CSP)
- XSS protection headers
- Frame protection (X-Frame-Options: DENY)
- Input validation (Zod schemas)

**3. Authentication & Authorization**

- Google OAuth 2.0
- HTTP-only session cookies
- Admin email allowlist (single admin)
- Discord interaction signature verification

**4. Data Security**

- Environment variables for secrets
- Soft deletes (no hard data deletion)
- Database connection over TLS
- API key authentication for bot endpoints

### Security Headers

```typescript
// Configured in next.config.js
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
];
```

## Performance Architecture

### Performance Targets

- **First Contentful Paint:** < 2 seconds
- **API Response Time:** < 500ms (average)
- **Database Query Time:** < 100ms (with caching)
- **Bundle Size:** < 500KB (first load JS)

### Optimization Strategies

**1. Caching**

- Database query result caching (`lib/db/cache.ts`)
- CDN caching for static assets (Vercel)
- Browser caching (30-day TTL for images)

**2. Code Splitting**

- Automatic route-based code splitting (Next.js)
- Dynamic imports for heavy components
- Optimized package imports (lucide-react)

**3. Database Optimization**

- Connection pooling (20 connections max on Pi)
- Indexes on frequently queried fields
- Compound indexes for multi-field queries

**4. Asset Optimization**

- Next.js Image component (automatic optimization)
- Font optimization (next/font)
- SVG icons instead of icon fonts

### Monitoring

- **Winston logger:** Daily rotating logs
- **Rollbar:** Production error tracking
- **Vercel Analytics:** Performance metrics
- **Service health checks:** External API monitoring
- **Discord notifications:** Critical alerts

## Scalability Architecture

### Current Capacity

- **Traffic:** Vercel auto-scaling (no hard limit)
- **Database:** ~20 concurrent connections (Pi limit)
- **Data Volume:** ~10MB database
- **Users:** Single admin + unlimited public visitors

### Scaling Strategy

**Horizontal Scaling:**

- Vercel serverless functions auto-scale
- Database: Currently single instance (no horizontal scaling)

**Vertical Scaling:**

- Raspberry Pi 4/5 (8GB RAM)
- Vercel Pro plan if needed

**Database Scaling (future):**

- Connection pooling (pgbouncer or Prisma Accelerate)
- Read replicas (if traffic increases)
- Migration to Neon/Supabase serverless PostgreSQL

### Bottleneck Analysis

| Component      | Limit              | Solution                   | Priority |
| -------------- | ------------------ | -------------------------- | -------- |
| PostgreSQL     | Single Pi instance | Migrate to Neon/Supabase   | Medium   |
| Discord Bot    | Single process     | Sharding (if >2500 guilds) | Low      |
| Vercel Timeout | 10 seconds         | Move heavy tasks to Pi     | Low      |
| DB Connections | 20 connections     | Connection pooling         | Medium   |

## Testing Architecture

### Test Strategy

**Unit Tests (Jest):**

- API route handlers
- Utility functions
- React components
- Database models

**Integration Tests (Jest):**

- API endpoint flows
- Database operations
- Authentication flows

**E2E Tests (Playwright):**

- Critical user paths
- Quote submission flow
- Admin dashboard workflows
- Mobile responsiveness
- Accessibility (axe-core)

### Test Coverage

- **Unit Tests:** >80% target
- **Integration Tests:** >60% target
- **E2E Tests:** Critical paths covered

**Test Files:**

- `__tests__/` - 299 test files
- `e2e/` - 15 Playwright specs

## Maintenance & Operations

### Logging Strategy

**Winston Logger:**

- Levels: error, warn, info, debug
- Daily rotating files (14-day retention)
- Separate logs for app and bot
- JSON format for structured logging

**Log Locations:**

- **Vercel:** Console output (captured by Vercel)
- **Raspberry Pi:** `logs/` directory (daily rotation)

### Error Handling

**Custom Error Classes:**

```typescript
AppError; // Base error (500)
ValidationError; // Input validation (400)
AuthError; // Authentication (401)
NotFoundError; // Resource not found (404)
DatabaseError; // Database issues (500)
```

**Error Flow:**

1. Error thrown in route handler
2. Caught by async handler wrapper
3. Logged by Winston
4. Sent to Rollbar (production)
5. Formatted JSON response to client

### Monitoring & Alerts

**Service Monitoring:**

- Cloudflare API status
- Vercel deployment status
- GitHub API status
- Fly.io service status (if applicable)

**Alert Channels:**

- Discord notifications (critical alerts)
- Email notifications (via Resend)
- Dashboard alerts (admin UI)

## Technical Decisions

### Key Decisions & Rationale

**1. Hybrid Architecture**

- **Decision:** Vercel + Raspberry Pi
- **Rationale:** Cost optimization ($0/month vs $20-50/month)

**2. Next.js 15 App Router**

- **Decision:** Use App Router (not Pages Router)
- **Rationale:** Better performance, React 19 support, modern patterns

**3. Prisma ORM**

- **Decision:** Use Prisma instead of raw SQL
- **Rationale:** Type safety, migrations, developer experience

**4. TypeScript Strict Mode Disabled**

- **Decision:** `typescript.ignoreBuildErrors: true`
- **Rationale:** NextAuth v5 compatibility issues (temporary)

**5. Soft Deletes**

- **Decision:** Use `deletedAt` timestamp
- **Rationale:** Data recovery, audit trails, compliance

**6. Google OAuth Only**

- **Decision:** No email/password authentication
- **Rationale:** Security, no password management, single admin use case

## Future Improvements

### Short-term (Next Sprint)

- Fix TypeScript build errors (NextAuth v5)
- Implement comprehensive error boundary testing
- Add TODO/FIXME tracking

### Medium-term (Next Quarter)

- Migrate to NextAuth v5 (when stable)
- Implement Redis caching (if traffic increases)
- Add Prometheus metrics

### Long-term (Next Year)

- Migrate to serverless PostgreSQL (Neon/Supabase)
- Multi-user admin dashboard (RBAC)
- Real-time features (WebSocket)

## Related Documentation

- **Getting Started:** [docs/guides/getting-started.md](../guides/getting-started.md)
- **API Reference:** [docs/api/README.md](../api/README.md)
- **Deployment Guide:** [docs/deployment/DEPLOYMENT-OVERVIEW.md](../deployment/DEPLOYMENT-OVERVIEW.md)
- **Trinity Architecture:** [trinity/knowledge-base/ARCHITECTURE.md](../../trinity/knowledge-base/ARCHITECTURE.md)

---

**Last Updated:** 2026-01-07
**Architecture Version:** 2.0.2
**Maintained by:** Sunny Stack Development Team
