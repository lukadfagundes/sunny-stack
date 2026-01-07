# Architecture Documentation

Technical documentation about the system architecture, design decisions, and implementation patterns.

## Available Documents

### [Architecture Overview](overview.md)

Comprehensive system architecture documentation covering all aspects of the Sunny Stack Portfolio application.

**Topics covered:**

- System architecture diagram
- Technology stack
- Deployment architecture
- Application structure
- Data architecture
- API architecture
- Discord bot architecture
- Security architecture
- Performance architecture
- Scalability architecture
- Testing architecture
- Technical decisions

---

## Related Trinity Documentation

For Trinity Method-specific architecture documentation, see:

- **[Trinity Architecture](../../trinity/knowledge-base/ARCHITECTURE.md)** - Detailed technical architecture with Trinity Method integration

---

## Architecture Diagrams

### High-Level System Architecture

```
┌─────────────────────────────────────┐
│         Vercel (Serverless)         │
│  ┌──────────────────────────────┐   │
│  │   Next.js Website + API      │   │
│  └──────────┬───────────────────┘   │
└─────────────┼───────────────────────┘
              │ DATABASE_URL
              ↓
┌─────────────────────────────────────┐
│      Raspberry Pi (Self-Hosted)     │
│  ┌──────────────────────────────┐   │
│  │   PostgreSQL Container       │   │
│  └──────────┬───────────────────┘   │
│  ┌──────────↓───────────────────┐   │
│  │   Discord Bot Container      │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Data Flow

```
Frontend (React) → API Routes (Next.js) → Prisma → PostgreSQL
     ↑                                              ↓
     └──────────── JSON Response ←──────────────────┘
```

---

## Architecture Principles

### 1. Separation of Concerns

- Frontend: React components
- Backend: Next.js API routes
- Database: PostgreSQL with Prisma ORM
- Bot: Separate Discord.js application

### 2. Type Safety

- TypeScript throughout codebase
- Prisma for type-safe database access
- Zod for runtime validation

### 3. Security First

- OAuth authentication
- Input validation
- Security headers
- Soft deletes

### 4. Performance Optimization

- Caching strategies
- Code splitting
- Database indexing
- Asset optimization

### 5. Maintainability

- Clear directory structure
- Consistent naming conventions
- Comprehensive documentation
- Automated testing

---

## Quick Links

- **API Documentation:** [docs/api/README.md](../api/README.md)
- **Getting Started:** [docs/guides/getting-started.md](../guides/getting-started.md)
- **Reference:** [docs/reference/README.md](../reference/README.md)

---

**Last Updated:** 2026-01-07
