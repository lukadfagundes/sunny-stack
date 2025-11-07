# AUDIT-ROR-INV-001: System Design & Architectural Patterns Audit

**Agent:** ROR (Design Architect)
**Investigation:** INV-001 - Complete Codebase Architecture Audit
**Date:** 2025-11-06
**Status:** Complete

## Executive Summary

Sunny Stack employs a **hybrid micro-services architecture** combining serverless functions (Vercel) with self-hosted stateful services (Raspberry Pi). The design demonstrates strong architectural patterns including separation of concerns, container orchestration, API-first design, and event-driven bot architecture.

**Key Finding**: Architecture is **well-designed for the use case** (portfolio + admin bot) with appropriate technology choices. The decoupled nature of website/API and bot allows independent scaling and deployment.

## Audit Scope

- Overall system architecture and component relationships
- Design patterns (MVC, container/presentational, event-driven, etc.)
- Data flow and communication patterns
- Database schema design
- API design principles
- Security architecture
- Scalability design

## Findings

### 1. Overall System Architecture

**Architecture Style: Hybrid Serverless + Self-Hosted**

```
┌──────────────────────────────────────────────────────────┐
│              SUNNY STACK SYSTEM DESIGN                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  CLIENT LAYER (Browser)                                 │
│  ├── Next.js SSR Pages (SEO-optimized)                 │
│  ├── React Client Components (interactive UI)          │
│  └── Tailwind CSS (styling)                            │
│                   │                                      │
│                   │ HTTPS                                │
│                   ▼                                      │
│  APPLICATION LAYER (Vercel Edge)                        │
│  ├── Next.js 15 App Router                             │
│  ├── API Routes (REST endpoints)                       │
│  ├── Server Actions (form handling)                    │
│  └── Middleware (auth, logging)                        │
│                   │                                      │
│          ┌────────┴────────┐                            │
│          │                 │                             │
│          ▼                 ▼                             │
│  DATA LAYER         BOT LAYER (Pi)                      │
│  (PostgreSQL/Pi)    ├── Discord.js Client               │
│  ├── Prisma ORM    ├── Event Handlers                  │
│  ├── Migrations    ├── Slash Commands                  │
│  └── Connection    ├── Notifications                    │
│      Pooling       └── Circuit Breaker                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Architecture Patterns:**

- ✅ **Separation of Concerns** - Website, API, Bot, Database isolated
- ✅ **API-First Design** - Bot communicates with website via REST API
- ✅ **Event-Driven Architecture** - Discord bot uses event handlers
- ✅ **Container Orchestration** - Docker Compose for multi-container deployment
- ✅ **Stateless Web Layer** - Vercel serverless functions (auto-scaling)
- ✅ **Stateful Bot Layer** - Discord WebSocket connection (persistent)

**Score**: 9/10 - Excellent architectural separation

### 2. Component Relationship Mapping

**Data Flow:**

```
1. User Visits Website → Vercel Edge → Next.js SSR → Browser
2. User Submits Quote → API Route → Email (Resend) → Admin
3. User Submits Quote → API Route → Discord Webhook → Bot Notification
4. Bot Command → Discord Event → Bot Handler → API Call → PostgreSQL → Response
5. Admin Dashboard → OAuth → Google → Session → Prisma → PostgreSQL → UI
```

**Integration Points:**

- Website ↔ PostgreSQL (via Prisma, external IP connection)
- Website ↔ Resend (email delivery)
- Website ↔ Google OAuth (admin authentication)
- Bot ↔ Discord API (WebSocket + REST)
- Bot ↔ Website API (REST with API key auth)
- Bot ↔ PostgreSQL (via Prisma, localhost connection)

**Score**: 8/10 - Clear data flows, well-documented

### 3. Design Patterns Analysis

**Frontend Patterns:**

- ✅ **Container/Presentational** - `QuoteContainer.tsx` (state) vs `GuidedQuoteForm.tsx` (UI)
- ✅ **Compound Components** - Form sections compose into complete forms
- ✅ **Custom Hooks** - `useMultiStepForm`, `useFormValidation`, `useTechnicalForm`
- ✅ **HOC Pattern** - `app/providers.tsx` wraps app with context providers
- ✅ **Server Components** - Default Next.js 15 pattern for SEO/performance

**Backend Patterns:**

- ✅ **Repository Pattern** - Prisma ORM abstracts database access
- ✅ **Factory Pattern** - Discord embed builder creates consistent message formats
- ✅ **Strategy Pattern** - Guided vs Technical quote form modes
- ✅ **Circuit Breaker** - `bot/utils/circuit-breaker.ts` for API resilience
- ✅ **Rate Limiter** - `bot/utils/rate-limiter.ts` for Discord API protection

**Data Patterns:**

- ✅ **ORM Pattern** - Prisma for type-safe database queries
- ✅ **Migration Pattern** - Prisma migrations for schema versioning
- ✅ **Soft Delete** - `deletedAt` timestamp in models (Projects, Quotes)
- ✅ **Audit Log** - `DiscordMessage` model tracks bot activity

**Score**: 9/10 - Comprehensive pattern usage

### 4. Database Schema Design

**Schema Analysis** (10 models in [prisma/schema.prisma](prisma/schema.prisma)):

**Core Models:**

1. `User` - Admin users (Google OAuth)
2. `Project` - Client projects
3. `Quote` - Quote requests from website
4. `Proposal` - Generated proposals (PDF)
5. `TimeEntry` - Time tracking entries

**Monitoring Models:** 6. `MonitoringEvent` - System events 7. `MonitoringAlert` - Alerts (with acknowledgment tracking) 8. `ServiceHealthCheck` - External service health

**Infrastructure Models:** 9. `DiscordMessage` - Message audit log 10. `ApiKey` - Bot API authentication 11. `Webhook` - Webhook configurations 12. `SystemConfig` - Bot settings

**Legacy Models:** 13. `QuoteRequest` - Legacy quote form (backwards compatibility) 14. `ContactMessage` - Legacy contact form (backwards compatibility)

**Schema Strengths:**

- ✅ **Proper Indexing** - Foreign keys, email, status, timestamps indexed
- ✅ **Enum Types** - ProjectStatus, QuoteStatus, EventType, Severity, AlertType
- ✅ **Relationships** - Foreign keys with cascade/set null behavior
- ✅ **Soft Deletes** - `deletedAt` on Projects and Quotes
- ✅ **Audit Trail** - `createdAt`, `updatedAt` timestamps on all models
- ✅ **Flexible Metadata** - JSON fields for extensibility

**Schema Concerns:**

- ⚠️ **No connection pooling config** in schema (handled by database URL)
- ⚠️ **Large text fields** - `@db.Text` for descriptions (potential size issues)

**Score**: 9/10 - Well-designed normalized schema

### 5. API Design Principles

**Current API Routes:**

- `POST /api/send-quote` - Submit quote request
- `GET /api/admin/health` - System health check

**API Design Assessment:**

- ✅ **RESTful naming** - Resource-based URLs
- ✅ **Proper HTTP methods** - POST for creation, GET for retrieval
- ✅ **Error responses** - Structured error objects with status codes
- ✅ **Input validation** - `lib/quote-validation.ts` sanitization
- ⚠️ **Limited endpoints** - Many admin features likely need API routes
- ⚠️ **No versioning** - `/api/v1/` pattern not used
- ⚠️ **No rate limiting** - Vulnerable to abuse
- ❌ **No OpenAPI spec** - API documentation missing

**Bot-to-API Authentication:**

- ✅ **API key header** - `BOT_API_KEY` for authentication
- ✅ **Separate endpoint** - Bot calls same Vercel API as website

**Score**: 6/10 - Good foundation, needs expansion

### 6. Security Architecture

**Security Layers:**

1. **Application Security**
   - ✅ CSP headers (XSS protection)
   - ✅ Input sanitization ([lib/quote-validation.ts](lib/quote-validation.ts))
   - ✅ Google OAuth (admin dashboard)
   - ✅ API key authentication (bot-to-API)
   - ✅ Environment variable separation

2. **Network Security**
   - ✅ HTTPS enforced (Vercel platform)
   - ⚠️ PostgreSQL port 5432 exposed (intentional for Vercel access)
   - ⚠️ No WAF/firewall rules documented
   - ⚠️ No IP whitelisting for database

3. **Container Security**
   - ✅ Non-root user (uid 1001) in Docker
   - ✅ `no-new-privileges` security opt
   - ✅ Resource limits (CPU/memory)
   - ✅ Minimal base image (alpine)

4. **Secret Management**
   - ✅ `.env` files gitignored
   - ✅ GitHub Secrets for CI/CD
   - ⚠️ No secrets rotation policy
   - ⚠️ No vault solution

**Score**: 7/10 - Good security posture, needs hardening

### 7. Scalability Design

**Horizontal Scalability:**

- ✅ **Website/API** - Vercel auto-scales serverless functions
- ❌ **Database** - Single PostgreSQL instance (SPOF)
- ❌ **Bot** - Single Discord bot instance (stateful WebSocket)

**Vertical Scalability:**

- ✅ **Website** - Automatic (serverless)
- ⚠️ **Database** - Limited by Pi hardware (4GB RAM, 4 cores)
- ✅ **Bot** - Resource limits allow scaling within Pi capacity

**Performance Optimizations:**

- ✅ **Image Optimization** - next/image with WebP/AVIF
- ✅ **Code Splitting** - Dynamic imports for heavy components
- ✅ **Bundle Analysis** - @next/bundle-analyzer configured
- ✅ **Database Indexing** - Proper indexes on query patterns
- ⚠️ **No CDN caching strategy** beyond Vercel defaults
- ⚠️ **No database query caching** (Redis, etc.)

**Bottleneck Analysis:**

- 🔴 **Primary Bottleneck**: PostgreSQL on Pi (single instance, hardware limits)
- 🟡 **Secondary**: Discord bot (single instance, can't horizontally scale)
- 🟢 **Website/API**: Scales well (serverless)

**Score**: 6/10 - Website scales, database is bottleneck

## Strengths

1. ✅ **Clean Architecture** - Proper separation of website, API, bot, database
2. ✅ **Design Patterns** - Container/Presentational, Circuit Breaker, Repository, Factory
3. ✅ **Database Schema** - Well-normalized with proper indexing and relationships
4. ✅ **Docker Orchestration** - Production-ready docker-compose configuration
5. ✅ **Event-Driven Bot** - Discord.js event handlers for scalable bot architecture

## Gaps & Improvement Areas

1. ⚠️ **Database SPOF** - Single PostgreSQL instance limits reliability
2. ⚠️ **No Read Replicas** - Database can't scale reads
3. ⚠️ **Limited API Routes** - Admin dashboard likely needs more endpoints
4. ⚠️ **No API Versioning** - Future breaking changes will be difficult
5. ⚠️ **No Caching Layer** - Redis or similar for query caching

## Recommendations

### Immediate Actions

1. **Document API Endpoints**
   - Create OpenAPI/Swagger spec
   - Document request/response schemas
   - **Impact**: Better API understanding

2. **Add Database Connection Pooling Config**
   - Configure max connections in Prisma
   - Monitor connection usage
   - **Impact**: Better resource management

3. **Implement Rate Limiting**
   - API route protection
   - Bot command rate limiting
   - **Impact**: Prevent abuse

### Short-Term Improvements

4. **Add Database Read Replicas**
   - PostgreSQL streaming replication
   - Separate read/write connections
   - **Impact**: Scale read queries

5. **Implement Caching Layer**
   - Redis for frequently accessed data
   - Cache admin dashboard queries
   - **Impact**: Reduce database load

6. **API Versioning Strategy**
   - `/api/v1/` prefix
   - Deprecation policy
   - **Impact**: Safe API evolution

### Long-Term Enhancements

7. **Migrate Database to Managed Service**
   - Neon, Supabase, or Railway
   - Automatic backups and scaling
   - **Impact**: Eliminate SPOF

8. **Microservices Extraction**
   - Separate bot into independent service
   - Independent deployment and scaling
   - **Impact**: Better scalability

9. **Event-Driven Architecture**
   - Message queue (RabbitMQ, Redis Pub/Sub)
   - Decouple website and bot further
   - **Impact**: Resilience and scalability

## Related Documentation

- [prisma/schema.prisma](prisma/schema.prisma) - Database schema
- [docker-compose.prod.yml](docker-compose.prod.yml) - Container orchestration
- [bot/utils/circuit-breaker.ts](bot/utils/circuit-breaker.ts) - Resilience pattern
- [lib/quote-validation.ts](lib/quote-validation.ts) - Input validation
- [next.config.js](next.config.js) - Next.js configuration

## Notes

**Architectural Decisions:**

- **Why Vercel?** - Free tier, automatic scaling, global edge network
- **Why Pi for database?** - Cost savings (no cloud DB fees), learning experience
- **Why decoupled bot?** - Independent deployment, language/framework flexibility
- **Why PostgreSQL?** - Robust RDBMS, Prisma support, self-hostable

**Trade-offs Made:**

- **Cost vs Reliability** - Pi database saves money but introduces SPOF
- **Complexity vs Flexibility** - Multi-platform deployment more complex but more flexible
- **Performance vs Simplicity** - No caching layer simplifies architecture but limits scale

---

**Overall System Design: 8/10** - Well-architected with clear trade-offs and improvement path.
