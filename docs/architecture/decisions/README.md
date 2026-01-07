# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting significant technical decisions made during the development of sunny-stack.

---

## What is an ADR?

An **Architecture Decision Record (ADR)** is a document that captures an important architectural decision made along with its context and consequences.

**Purpose:**

- Preserve technical decision rationale for future reference
- Onboard new developers by explaining "why" decisions were made
- Track evolution of system architecture over time
- Prevent revisiting already-resolved debates

**Format:** We follow the [MADR (Markdown Architecture Decision Record)](https://adr.github.io/madr/) format with modifications for our workflow.

---

## ADR Index

### Active ADRs

| ID                                                | Title                                             | Date       | Status   | Category   |
| ------------------------------------------------- | ------------------------------------------------- | ---------- | -------- | ---------- |
| [ADR-001](./ADR-001-hybrid-cloud-architecture.md) | Hybrid Cloud Architecture (Vercel + Raspberry Pi) | 2025-11-02 | Accepted | Deployment |
| [ADR-002](./ADR-002-nextjs-app-router.md)         | Next.js App Router vs Pages Router                | 2025-11-02 | Accepted | Frontend   |
| [ADR-003](./ADR-003-prisma-orm.md)                | Prisma ORM for Database Access                    | 2025-11-02 | Accepted | Database   |
| [ADR-004](./ADR-004-discord-js-framework.md)      | Discord.js for Bot Framework                      | 2025-11-02 | Accepted | Bot        |
| [ADR-005](./ADR-005-postgresql-database.md)       | PostgreSQL vs Other Databases                     | 2025-11-02 | Accepted | Database   |
| [ADR-006](./ADR-006-rollbar-error-tracking.md)    | Rollbar for Error Tracking                        | 2025-11-02 | Accepted | Monitoring |

### Deprecated ADRs

_No deprecated ADRs yet._

### Superseded ADRs

_No superseded ADRs yet._

---

## Decision Timeline

```
2025-11-02: Initial Architecture Decisions (6 ADRs)
├── ADR-001: Hybrid Cloud Architecture
├── ADR-002: Next.js App Router
├── ADR-003: Prisma ORM
├── ADR-004: Discord.js Framework
├── ADR-005: PostgreSQL Database
└── ADR-006: Rollbar Error Tracking

2026-01-07: Documentation of historical decisions (APO)
```

---

## Category Index

### Deployment & Infrastructure

- **[ADR-001: Hybrid Cloud Architecture](./ADR-001-hybrid-cloud-architecture.md)** - Vercel + Raspberry Pi hybrid deployment
  - **Decision:** Split deployment between Vercel (frontend/API) and Raspberry Pi (database/bot)
  - **Rationale:** Cost optimization ($0/month) + serverless scalability
  - **Impact:** HIGH - Fundamental architecture decision

### Frontend

- **[ADR-002: Next.js App Router](./ADR-002-nextjs-app-router.md)** - App Router vs Pages Router
  - **Decision:** Adopt Next.js App Router for all new development
  - **Rationale:** React Server Components, better performance, future-proof
  - **Impact:** HIGH - All page components use App Router patterns

### Database

- **[ADR-003: Prisma ORM](./ADR-003-prisma-orm.md)** - Database access layer
  - **Decision:** Use Prisma ORM for type-safe database access
  - **Rationale:** Type safety, migrations, developer experience
  - **Impact:** HIGH - All database queries use Prisma

- **[ADR-005: PostgreSQL Database](./ADR-005-postgresql-database.md)** - Database technology
  - **Decision:** PostgreSQL 15 on Raspberry Pi
  - **Rationale:** Relational model, JSON support, self-hosting, open-source
  - **Impact:** HIGH - Core data persistence technology

### Discord Bot

- **[ADR-004: Discord.js Framework](./ADR-004-discord-js-framework.md)** - Bot development framework
  - **Decision:** Discord.js v14 for TypeScript bot development
  - **Rationale:** TypeScript support, slash commands, mature ecosystem
  - **Impact:** HIGH - All bot features built with Discord.js

### Monitoring

- **[ADR-006: Rollbar Error Tracking](./ADR-006-rollbar-error-tracking.md)** - Production error monitoring
  - **Decision:** Rollbar for error tracking (free tier)
  - **Rationale:** Generous free tier, Next.js integration, Discord webhooks
  - **Impact:** MEDIUM - Production error monitoring and alerting

---

## Decision Impact Levels

**HIGH Impact**: Changes require significant refactoring (ADR-001 through ADR-005)
**MEDIUM Impact**: Changes affect specific subsystems (ADR-006)
**LOW Impact**: Changes are localized to single components

---

## How to Use ADRs

### Reading ADRs

1. **Start with the Index** (this file) to find relevant decisions
2. **Read the Context section** to understand the problem
3. **Review the Decision Drivers** to see what factors influenced the decision
4. **Check Considered Options** to understand alternatives
5. **Read Decision Outcome** for the final decision and rationale

### Creating a New ADR

1. **Copy the template:**

   ```bash
   cp docs/architecture/decisions/template.md \
      docs/architecture/decisions/ADR-XXX-title.md
   ```

2. **Fill in the template:**
   - Replace `XXX` with next sequential number
   - Update title, date, status
   - Complete all sections

3. **Update this README:**
   - Add entry to "ADR Index" table
   - Add to appropriate category section
   - Update "Decision Timeline"

4. **Link from code (if applicable):**
   ```typescript
   // Example: Link decision from code comment
   /**
    * Using Prisma ORM for type-safe database access.
    * Decision rationale: See ADR-003
    * @see docs/architecture/decisions/ADR-003-prisma-orm.md
    */
   import { prisma } from "@/lib/db/prisma";
   ```

---

## ADR Workflow

### Status Lifecycle

```
Proposed → Accepted → (Deprecated | Superseded)
```

**Proposed:** Decision is under discussion
**Accepted:** Decision is active and implemented
**Deprecated:** Decision is no longer valid (but not replaced)
**Superseded:** Decision is replaced by another ADR

### Updating ADRs

**When to update:**

- Status changes (Proposed → Accepted)
- Implementation details change significantly
- New consequences discovered
- Related decisions added

**How to update:**

1. Update the ADR document
2. Update "Last Updated" date
3. If superseding, add "Superseded By" reference
4. Update README index if status changes

### Superseding ADRs

**Example:**

```markdown
# ADR-007: Migration to Neon Serverless PostgreSQL

**Status:** Accepted
**Supersedes:** ADR-005 (PostgreSQL on Raspberry Pi)

## Context

As traffic grew beyond Raspberry Pi capacity, we migrated to Neon serverless PostgreSQL...
```

**Update ADR-005:**

```markdown
**Status:** Superseded
**Superseded By:** ADR-007 (Neon Serverless PostgreSQL)
```

---

## ADR Best Practices

### Writing ADRs

✅ **DO:**

- Write in present tense ("We use..." not "We will use...")
- Document decision drivers honestly
- Include all considered alternatives
- Provide concrete examples
- Link to related ADRs and documentation
- Update when implementation changes significantly

❌ **DON'T:**

- Rewrite history (document decisions as they were made)
- Skip alternatives (show you considered options)
- Write novellas (be concise but complete)
- Include implementation details that change frequently
- Make decisions without team discussion

### When to Create an ADR

Create an ADR when:

- Making architectural decisions that impact multiple components
- Choosing between multiple viable alternatives
- Making decisions that are difficult or expensive to reverse
- Establishing patterns or conventions
- Making technology choices (frameworks, libraries, services)

**Don't create an ADR for:**

- Minor implementation details
- Obvious choices with no alternatives
- Decisions easily reversed
- Temporary workarounds

---

## ADR Template

See [template.md](./template.md) for the ADR template with all sections explained.

**Key Sections:**

1. **Context and Problem Statement** - What problem are we solving?
2. **Decision Drivers** - What factors influenced the decision?
3. **Considered Options** - What alternatives did we evaluate?
4. **Decision Outcome** - What did we choose and why?
5. **Pros and Cons** - Detailed analysis of each option
6. **Implementation Details** - How is this decision implemented?
7. **Validation** - How do we measure success?
8. **Related Decisions** - Links to related ADRs

---

## Search ADRs

### By Technology

- **Next.js:** ADR-002
- **React:** ADR-002
- **PostgreSQL:** ADR-005
- **Prisma:** ADR-003
- **Discord.js:** ADR-004
- **Rollbar:** ADR-006
- **Vercel:** ADR-001
- **Raspberry Pi:** ADR-001

### By Concern

- **Cost Optimization:** ADR-001, ADR-005, ADR-006
- **Type Safety:** ADR-002, ADR-003, ADR-004
- **Performance:** ADR-001, ADR-002, ADR-003
- **Developer Experience:** ADR-002, ADR-003, ADR-004
- **Self-Hosting:** ADR-001, ADR-005
- **Monitoring:** ADR-006

### By Date

- **2025-11-02:** All initial ADRs (ADR-001 through ADR-006)

---

## Related Documentation

- **[Architecture Overview](../overview.md)** - High-level system architecture
- **[Trinity Method ARCHITECTURE.md](../../../trinity/knowledge-base/ARCHITECTURE.md)** - Living architecture documentation
- **[Technical Decisions Log](../../../trinity/knowledge-base/ARCHITECTURE.md#technical-decisions-log)** - Quick reference for major decisions

---

## External Resources

- **ADR GitHub Organization:** https://adr.github.io/
- **MADR Template:** https://adr.github.io/madr/
- **Documenting Architecture Decisions (Michael Nygard):** https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- **When to Write an ADR:** https://github.com/joelparkerhenderson/architecture-decision-record#when-should-we-write-an-architecture-decision-record

---

**Last Updated:** 2026-01-07
**Maintained By:** Development Team (Trinity Method)
**ADR Count:** 6 active, 0 deprecated, 0 superseded
