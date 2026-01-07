# Database Management Guide

Complete guide for managing the PostgreSQL database and Prisma ORM in Sunny Stack Portfolio.

---

## Database Architecture

### Technology Stack

- **Database:** PostgreSQL 15 (Alpine Docker image)
- **ORM:** Prisma 6.18.0
- **Hosting:** Raspberry Pi (Docker container)
- **Connection:** Via DATABASE_URL environment variable

### Database Diagram

```
┌─────────────────────────────────────────────────┐
│      PostgreSQL 15 (Raspberry Pi Docker)        │
├─────────────────────────────────────────────────┤
│ Core Models:                                     │
│  • User (admin authentication)                   │
│  • Project (client projects, 12 models total)    │
│  • Quote (quote requests)                        │
│  • Proposal (generated PDFs)                     │
│  • TimeEntry (time tracking)                     │
│  • DiscordMessage (audit log)                    │
│                                                   │
│ Monitoring:                                      │
│  • MonitoringEvent                               │
│  • MonitoringAlert                               │
│  • ServiceHealthCheck                            │
│                                                   │
│ Configuration:                                   │
│  • ApiKey                                        │
│  • Webhook                                       │
│  • SystemConfig                                  │
│                                                   │
│ Legacy (backward compatibility):                 │
│  • QuoteRequest                                  │
│  • ContactMessage                                │
└─────────────────────────────────────────────────┘
```

---

## Schema Overview

### Core Models

#### User

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  googleId  String?  @unique
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}
```

**Purpose:** Admin users authenticated via Google OAuth

#### Project

```prisma
model Project {
  id                  String        @id @default(cuid())
  title               String
  description         String?       @db.Text
  clientName          String
  clientEmail         String
  status              ProjectStatus @default(PLANNING)
  budget              Decimal?      @db.Decimal(10, 2)
  deadline            DateTime?
  googleDriveFolderId String?
  deletedAt           DateTime?     // Soft delete
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  // Relationships
  quotes          Quote[]
  timeEntries     TimeEntry[]
  discordMessages DiscordMessage[]

  @@index([status])
  @@index([deadline])
  @@index([clientEmail])
  @@index([deletedAt])
}

enum ProjectStatus {
  PLANNING
  IN_PROGRESS
  REVIEW
  COMPLETE
  ARCHIVED
}
```

**Purpose:** Client projects with status tracking and relationships

#### Quote

```prisma
model Quote {
  id           String      @id @default(cuid())
  name         String
  email        String
  phone        String?
  company      String?
  projectType  String
  budgetRange  String?
  timeline     String?
  description  String      @db.Text
  requirements String?     @db.Text
  status       QuoteStatus @default(PENDING)
  projectId    String?     // Relationship to Project
  project      Project?    @relation(fields: [projectId], references: [id], onDelete: SetNull)
  deletedAt    DateTime?   // Soft delete
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  reviewedAt   DateTime?

  proposals Proposal[]

  @@index([status])
  @@index([email])
  @@index([createdAt])
  @@index([projectId])
  @@index([deletedAt])
}

enum QuoteStatus {
  PENDING
  APPROVED
  DECLINED
  CONVERTED  // Converted to project
}
```

**Purpose:** Quote requests from public website, can be converted to projects

---

## Prisma Workflow

### Development Workflow

```bash
# 1. Create migration (development)
npx prisma migrate dev --name add_feature_xyz

# 2. Generate Prisma Client
npx prisma generate

# 3. Test migration locally
npm run dev

# 4. Commit migration files
git add prisma/migrations
git commit -m "feat: add feature XYZ schema"
git push
```

### Production Workflow

```bash
# 1. SSH to Raspberry Pi
ssh pi@raspberrypi.local

# 2. Navigate to project
cd ~/projects/sunny-stack

# 3. Backup database (CRITICAL)
docker compose exec postgres pg_dump -U sunnystack sunnystack > backup-$(date +%Y%m%d-%H%M%S).sql

# 4. Pull migration
git pull origin main

# 5. Apply migration
npx prisma migrate deploy

# 6. Generate Prisma Client
npx prisma generate

# 7. Restart services
docker compose restart
```

---

## Creating Migrations

### Schema Changes

**Example 1: Add new column**

```prisma
// prisma/schema.prisma
model Project {
  // ... existing fields ...
  priority String @default("MEDIUM")  // New field
}
```

```bash
# Create migration
npx prisma migrate dev --name add_project_priority

# Migration file created:
# prisma/migrations/20260107120000_add_project_priority/migration.sql
```

**Generated SQL:**

```sql
-- AlterTable
ALTER TABLE "projects" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'MEDIUM';
```

**Example 2: Add new model**

```prisma
model Task {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@index([completed])
}

// Add to Project model:
model Project {
  // ... existing fields ...
  tasks Task[]  // Add relationship
}
```

```bash
# Create migration
npx prisma migrate dev --name add_task_model
```

**Example 3: Add index**

```prisma
model Project {
  // ... existing fields ...

  @@index([status, createdAt])  // Compound index for filtered queries
}
```

```bash
npx prisma migrate dev --name add_status_createdat_index
```

### Migration Naming Conventions

```bash
# Feature addition
npx prisma migrate dev --name add_user_role

# Field modification
npx prisma migrate dev --name update_project_budget_precision

# Index creation
npx prisma migrate dev --name add_performance_indexes

# Relationship changes
npx prisma migrate dev --name add_project_task_relation

# Data migration
npx prisma migrate dev --name migrate_old_quotes_to_new_format
```

### Custom Migrations (SQL)

Sometimes Prisma can't auto-generate the perfect migration. Edit manually:

```bash
# Generate migration
npx prisma migrate dev --name custom_migration --create-only

# Edit generated migration.sql
nano prisma/migrations/[timestamp]_custom_migration/migration.sql
```

**Example: Data migration**

```sql
-- Migration generated: Add status field with default
ALTER TABLE "projects" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'MEDIUM';

-- Custom addition: Migrate existing data based on logic
UPDATE "projects"
SET "priority" = CASE
  WHEN "budget" > 50000 THEN 'HIGH'
  WHEN "budget" > 20000 THEN 'MEDIUM'
  ELSE 'LOW'
END
WHERE "priority" = 'MEDIUM';  -- Only update defaults
```

```bash
# Apply migration
npx prisma migrate dev
```

---

## Database Seeding

### Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@sunny-stack.com" },
    update: {},
    create: {
      email: "admin@sunny-stack.com",
      name: "Admin User",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create sample projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        title: "Portfolio Website Redesign",
        clientName: "Acme Corp",
        clientEmail: "contact@acme.com",
        description: "Complete redesign of company portfolio website",
        status: "IN_PROGRESS",
        budget: 15000,
        deadline: new Date("2026-03-01"),
      },
    }),
    prisma.project.create({
      data: {
        title: "E-commerce Platform",
        clientName: "Shop Inc",
        clientEmail: "info@shopinc.com",
        description: "Build custom e-commerce platform with Stripe integration",
        status: "PLANNING",
        budget: 50000,
        deadline: new Date("2026-06-01"),
      },
    }),
  ]);

  console.log("Created projects:", projects.length);

  // Create sample quotes
  const quotes = await Promise.all([
    prisma.quote.create({
      data: {
        name: "John Doe",
        email: "john@example.com",
        projectType: "web-app",
        description: "Need a web application for my business",
        status: "PENDING",
      },
    }),
    prisma.quote.create({
      data: {
        name: "Jane Smith",
        email: "jane@example.com",
        projectType: "mobile-app",
        description: "Mobile app for iOS and Android",
        status: "PENDING",
      },
    }),
  ]);

  console.log("Created quotes:", quotes.length);

  // Create time entries
  const timeEntries = await Promise.all(
    projects.map((project) =>
      prisma.timeEntry.create({
        data: {
          projectId: project.id,
          description: "Initial planning and requirements gathering",
          startedAt: new Date(),
          durationMinutes: 120,
          loggedVia: "manual",
        },
      }),
    ),
  );

  console.log("Created time entries:", timeEntries.length);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Running Seed Script

```bash
# Configure package.json
# Add to package.json:
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}

# Run seed
npx prisma db seed

# Or manually
npx ts-node prisma/seed.ts
```

### Seed Data for Testing

```typescript
// __tests__/helpers/seed-test-data.ts
import { testPrisma } from "./test-db";

export async function seedTestData() {
  // Create predictable test data
  const user = await testPrisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
    },
  });

  const project = await testPrisma.project.create({
    data: {
      title: "Test Project",
      clientName: "Test Client",
      clientEmail: "client@test.com",
      status: "PLANNING",
    },
  });

  return { user, project };
}
```

---

## Common Database Operations

### Query Patterns

**1. Find with filters**

```typescript
import { prisma } from "@/lib/db/prisma";

// Find active projects
const activeProjects = await prisma.project.findMany({
  where: {
    status: "IN_PROGRESS",
    deletedAt: null, // Exclude soft-deleted
  },
  orderBy: {
    createdAt: "desc",
  },
});

// Find with multiple conditions
const urgentProjects = await prisma.project.findMany({
  where: {
    AND: [
      { status: "IN_PROGRESS" },
      { deadline: { lte: new Date("2026-02-01") } },
      { deletedAt: null },
    ],
  },
});

// Find with OR condition
const projectsNeedingAttention = await prisma.project.findMany({
  where: {
    OR: [{ status: "IN_PROGRESS" }, { status: "REVIEW" }],
    deletedAt: null,
  },
});
```

**2. Include relations**

```typescript
// Include quotes
const projectWithQuotes = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    quotes: true,
    timeEntries: true,
  },
});

// Select specific fields
const projectSummary = await prisma.project.findMany({
  where: { deletedAt: null },
  select: {
    id: true,
    title: true,
    status: true,
    clientName: true,
    budget: true,
  },
});

// Nested includes
const projectWithAllData = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    quotes: {
      include: {
        proposals: true,
      },
    },
    timeEntries: {
      orderBy: { startedAt: "desc" },
      take: 10,
    },
  },
});
```

**3. Aggregations**

```typescript
// Count projects by status
const projectCounts = await prisma.project.groupBy({
  by: ["status"],
  _count: {
    id: true,
  },
  where: {
    deletedAt: null,
  },
});

// Sum time entries
const totalHours = await prisma.timeEntry.aggregate({
  _sum: {
    durationMinutes: true,
  },
  where: {
    projectId: projectId,
  },
});

// Average budget
const avgBudget = await prisma.project.aggregate({
  _avg: {
    budget: true,
  },
  where: {
    status: "COMPLETE",
    deletedAt: null,
  },
});
```

**4. Transactions**

```typescript
// Convert quote to project (atomic)
const result = await prisma.$transaction(async (tx) => {
  // Create project
  const project = await tx.project.create({
    data: {
      title: `Project: ${quote.name}`,
      clientName: quote.name,
      clientEmail: quote.email,
      description: quote.description,
      status: "PLANNING",
    },
  });

  // Update quote
  await tx.quote.update({
    where: { id: quote.id },
    data: {
      status: "CONVERTED",
      projectId: project.id,
    },
  });

  // Create initial time entry
  await tx.timeEntry.create({
    data: {
      projectId: project.id,
      description: "Project setup",
      startedAt: new Date(),
      durationMinutes: 30,
      loggedVia: "admin",
    },
  });

  return project;
});

// If any step fails, entire transaction rolls back
```

**5. Soft Delete Pattern**

```typescript
// Soft delete (set deletedAt)
const deleted = await prisma.project.update({
  where: { id: projectId },
  data: { deletedAt: new Date() },
});

// Find excluding soft-deleted
const activeProjects = await prisma.project.findMany({
  where: { deletedAt: null },
});

// Restore soft-deleted
const restored = await prisma.project.update({
  where: { id: projectId },
  data: { deletedAt: null },
});

// Hard delete (permanent)
const permanentlyDeleted = await prisma.project.delete({
  where: { id: projectId },
});
```

---

## Performance Optimization

### Indexes

**When to add indexes:**

- Frequently filtered fields (WHERE clauses)
- Fields used in ORDER BY
- Foreign keys (automatic in Prisma)
- Compound queries

**Example:**

```prisma
model Project {
  // ... fields ...

  @@index([status])                    // Single field index
  @@index([clientEmail])               // For email lookups
  @@index([deletedAt])                 // For soft delete queries
  @@index([status, createdAt])         // Compound index for filtered sorting
  @@index([deadline, status])          // For urgent project queries
}
```

### Query Optimization

**1. Use select instead of include when possible**

```typescript
// ❌ Slow: Fetches all fields + all relations
const project = await prisma.project.findUnique({
  where: { id },
  include: { quotes: true, timeEntries: true, discordMessages: true },
});

// ✅ Fast: Only fetch needed fields
const project = await prisma.project.findUnique({
  where: { id },
  select: {
    id: true,
    title: true,
    status: true,
    quotes: {
      select: {
        id: true,
        status: true,
      },
    },
  },
});
```

**2. Pagination**

```typescript
// ❌ Slow: Fetch all records
const allProjects = await prisma.project.findMany();

// ✅ Fast: Paginate results
const projects = await prisma.project.findMany({
  take: 50, // Limit
  skip: page * 50, // Offset
  where: { deletedAt: null },
});
```

**3. Cursor-based pagination (better for large datasets)**

```typescript
const projects = await prisma.project.findMany({
  take: 50,
  cursor: lastProjectId ? { id: lastProjectId } : undefined,
  skip: lastProjectId ? 1 : 0, // Skip cursor itself
  where: { deletedAt: null },
});
```

**4. Avoid N+1 queries**

```typescript
// ❌ N+1 query: One query per project
const projects = await prisma.project.findMany();
for (const project of projects) {
  const quotes = await prisma.quote.findMany({
    where: { projectId: project.id },
  });
  // Process quotes...
}

// ✅ Single query with include
const projects = await prisma.project.findMany({
  include: { quotes: true },
});
```

### Connection Pooling

```bash
# DATABASE_URL with connection pooling
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30"
```

**Prisma Client Singleton:**

```typescript
// lib/db/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## Backup & Restore

### Automated Backups (Raspberry Pi)

```bash
# Backup script (already configured)
# Location: ~/backups/backup-postgres.sh

# View recent backups
ls -lth ~/backups/postgres/ | head -10

# Backup log
tail -20 ~/backups/postgres/backup.log
```

### Manual Backup

```bash
# Full database backup
docker compose exec postgres pg_dump -U sunnystack sunnystack > backup-$(date +%Y%m%d-%H%M%S).sql

# Compressed backup
docker compose exec postgres pg_dump -U sunnystack sunnystack | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Schema only (no data)
docker compose exec postgres pg_dump -U sunnystack sunnystack --schema-only > schema-backup.sql

# Data only (no schema)
docker compose exec postgres pg_dump -U sunnystack sunnystack --data-only > data-backup.sql

# Specific table
docker compose exec postgres pg_dump -U sunnystack sunnystack -t projects > projects-backup.sql
```

### Restore from Backup

```bash
# Stop services writing to database
docker compose stop discord-bot

# Restore full backup
cat backup-20260107-143000.sql | docker compose exec -T postgres psql -U sunnystack sunnystack

# Or for compressed backup
gunzip -c backup-20260107-143000.sql.gz | docker compose exec -T postgres psql -U sunnystack sunnystack

# Verify restoration
docker compose exec postgres psql -U sunnystack sunnystack -c "SELECT COUNT(*) FROM projects;"

# Restart services
docker compose start discord-bot
```

### Point-in-Time Recovery

```bash
# If you need to restore to specific point in time:

# 1. Find backup closest to desired time
ls -lh ~/backups/postgres/

# 2. Restore that backup
cat backup-20260107-020000.sql.gz | gunzip | docker compose exec -T postgres psql -U sunnystack sunnystack

# 3. Manually revert recent changes if needed
docker compose exec postgres psql -U sunnystack sunnystack
DELETE FROM projects WHERE created_at > '2026-01-07 02:00:00';
```

---

## Database Monitoring

### Check Database Size

```bash
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT pg_size_pretty(pg_database_size('sunnystack')) AS database_size;
"
```

### Table Sizes

```bash
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Active Connections

```bash
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE state = 'active';
"
```

### Slow Queries

```bash
# Enable slow query logging (if not already enabled)
docker compose exec postgres psql -U sunnystack sunnystack -c "
  ALTER SYSTEM SET log_min_duration_statement = 100;  -- Log queries > 100ms
  SELECT pg_reload_conf();
"

# View slow queries (requires pg_stat_statements extension)
docker compose exec postgres psql -U sunnystack sunnystack -c "
  SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"
```

---

## Troubleshooting

### Issue: Migration Fails

```bash
# Check migration status
npx prisma migrate status

# Mark migration as applied (if manually applied)
npx prisma migrate resolve --applied [migration-name]

# Mark as rolled back (if partially applied)
npx prisma migrate resolve --rolled-back [migration-name]

# Reset database (DEVELOPMENT ONLY)
npx prisma migrate reset
```

### Issue: Prisma Client Out of Sync

```bash
# Regenerate Prisma Client
npx prisma generate

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### Issue: Database Connection Errors

```bash
# Test connection
docker compose exec postgres pg_isready -U sunnystack

# Check DATABASE_URL
echo $DATABASE_URL

# Restart database
docker compose restart postgres
```

For more troubleshooting, see [TROUBLESHOOTING.md](../deployment/TROUBLESHOOTING.md).

---

## Best Practices

### 1. Always Backup Before Migrations

```bash
# Before any schema change
docker compose exec postgres pg_dump -U sunnystack sunnystack > backup-pre-migration.sql
```

### 2. Use Transactions for Multi-Step Operations

```typescript
await prisma.$transaction(async (tx) => {
  // All or nothing
});
```

### 3. Implement Soft Deletes

```typescript
// Soft delete (reversible)
await prisma.project.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Always filter deleted
where: {
  deletedAt: null;
}
```

### 4. Add Indexes for Filtered Fields

```prisma
@@index([status])
@@index([createdAt])
```

### 5. Use Select to Minimize Data Transfer

```typescript
select: {
  id: true,
  title: true,
  // Only needed fields
}
```

---

## Related Documentation

- **[Schema Reference](../../prisma/schema.prisma)** - Complete database schema
- **[Pi Deployment](../deployment/PI-DEPLOYMENT.md)** - Database deployment procedures
- **[Troubleshooting](../deployment/TROUBLESHOOTING.md)** - Database issues

---

**Last Updated:** 2026-01-07
**PostgreSQL Version:** 15
**Prisma Version:** 6.18.0
**Database Models:** 14 (12 core + 2 legacy)
**Maintained by:** Sunny Stack Development Team
