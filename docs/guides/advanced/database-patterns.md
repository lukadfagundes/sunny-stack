# Advanced Database Patterns

This guide covers advanced database patterns using Prisma ORM with PostgreSQL, including complex queries, transactions, soft deletes, and query optimization.

## Table of Contents

- [Complex Prisma Queries](#complex-prisma-queries)
- [Transaction Handling](#transaction-handling)
- [Soft Deletes Pattern](#soft-deletes-pattern)
- [Audit Logging](#audit-logging)
- [Query Optimization](#query-optimization)
- [N+1 Query Prevention](#n1-query-prevention)
- [Connection Management](#connection-management)

---

## Complex Prisma Queries

### Pattern: Nested Relations

```ts
// Fetch project with related data
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    quote: true, // Include related quote
    timeEntries: {
      orderBy: { startedAt: "desc" },
      take: 10, // Only last 10 time entries
    },
    proposals: {
      where: { sentAt: { not: null } }, // Only sent proposals
    },
  },
});
```

### Pattern: Filtering with Relations

```ts
// Find all projects with pending quotes
const projectsWithPendingQuotes = await prisma.project.findMany({
  where: {
    quote: {
      status: "PENDING",
    },
  },
  include: {
    quote: true,
  },
});
```

### Pattern: Aggregations

```ts
// Count projects by status
const projectCounts = await prisma.project.groupBy({
  by: ["status"],
  _count: {
    id: true,
  },
});

// Result: [{ status: 'ACTIVE', _count: { id: 5 } }, ...]
```

```ts
// Get total budget and average per project
const budgetStats = await prisma.project.aggregate({
  _sum: {
    budget: true,
  },
  _avg: {
    budget: true,
  },
  _count: {
    id: true,
  },
  where: {
    status: "COMPLETED",
  },
});
```

### Pattern: Full-Text Search

```ts
// Search projects by title or description
const searchResults = await prisma.project.findMany({
  where: {
    OR: [
      {
        title: {
          contains: searchQuery,
          mode: "insensitive", // Case-insensitive
        },
      },
      {
        description: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      {
        clientName: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
    ],
  },
});
```

### Pattern: Pagination

```ts
// Cursor-based pagination (recommended for large datasets)
async function getProjects(cursor?: string, limit = 10) {
  const projects = await prisma.project.findMany({
    take: limit + 1, // Fetch one extra to check if there's more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor
    }),
    orderBy: { createdAt: "desc" },
  });

  const hasMore = projects.length > limit;
  const items = hasMore ? projects.slice(0, -1) : projects;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
```

```ts
// Offset-based pagination (simpler but slower for large datasets)
async function getProjects(page = 1, pageSize = 10) {
  const skip = (page - 1) * pageSize;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.count(),
  ]);

  return {
    items: projects,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
```

### Pattern: Conditional Queries

```ts
// Build dynamic filters
interface ProjectFilters {
  status?: string;
  clientEmail?: string;
  minBudget?: number;
  maxBudget?: number;
}

async function getFilteredProjects(filters: ProjectFilters) {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.clientEmail) {
    where.clientEmail = {
      contains: filters.clientEmail,
      mode: "insensitive",
    };
  }

  if (filters.minBudget || filters.maxBudget) {
    where.budget = {};
    if (filters.minBudget) {
      where.budget.gte = filters.minBudget;
    }
    if (filters.maxBudget) {
      where.budget.lte = filters.maxBudget;
    }
  }

  return prisma.project.findMany({ where });
}
```

---

## Transaction Handling

### Pattern: Sequential Transaction

```ts
// Convert quote to project (atomic operation)
async function convertQuoteToProject(quoteId: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Get quote
    const quote = await tx.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new Error("Quote not found");
    }

    if (quote.status !== "PENDING") {
      throw new Error("Quote is not pending");
    }

    // 2. Create project
    const project = await tx.project.create({
      data: {
        title: `${quote.projectType} for ${quote.company}`,
        description: quote.description,
        clientName: quote.name,
        clientEmail: quote.email,
        status: "PLANNING",
      },
    });

    // 3. Update quote status
    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "CONVERTED",
        projectId: project.id,
      },
    });

    // 4. Create proposal
    await tx.proposal.create({
      data: {
        quoteId,
        projectId: project.id,
        pdfUrl: "pending",
      },
    });

    return project;
  });
}
```

### Pattern: Batch Operations in Transaction

```ts
// Update multiple projects atomically
async function bulkUpdateProjectStatus(
  projectIds: string[],
  newStatus: string,
) {
  return prisma.$transaction(
    projectIds.map((id) =>
      prisma.project.update({
        where: { id },
        data: { status: newStatus },
      }),
    ),
  );
}
```

### Pattern: Transaction with Rollback

```ts
async function createProjectWithNotification(data: any) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Create project
      const project = await tx.project.create({ data });

      // Create notification
      await tx.systemConfig.create({
        data: {
          key: `project-created-${project.id}`,
          value: new Date().toISOString(),
        },
      });

      // Validate business rules
      if (project.budget && project.budget > 1000000) {
        throw new Error("Budget exceeds maximum allowed");
      }

      return project;
    });
  } catch (error) {
    // Transaction automatically rolled back
    console.error("Transaction failed:", error);
    throw error;
  }
}
```

### Pattern: Read-After-Write Consistency

```ts
async function updateAndFetchProject(projectId: string, data: any) {
  return prisma.$transaction(async (tx) => {
    // Update
    await tx.project.update({
      where: { id: projectId },
      data,
    });

    // Fetch updated record with relations
    return tx.project.findUnique({
      where: { id: projectId },
      include: {
        quote: true,
        timeEntries: true,
      },
    });
  });
}
```

---

## Soft Deletes Pattern

### Understanding Soft Deletes

Soft deletes mark records as deleted without actually removing them from the database. This preserves data integrity and audit history.

### Pattern: Implementing Soft Deletes

```prisma
// prisma/schema.prisma
model Project {
  id          String    @id @default(cuid())
  title       String
  // ... other fields
  deletedAt   DateTime? // NULL = not deleted, Date = deleted
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Pattern: Soft Delete Query Extension

```ts
// lib/db/soft-delete.ts
import { PrismaClient } from "@prisma/client";

export function softDeleteExtension() {
  return {
    model: {
      $allModels: {
        // Soft delete method
        async softDelete<T>(this: T, where: any) {
          const context = this as any;
          return context.update({
            where,
            data: { deletedAt: new Date() },
          });
        },

        // Find excluding deleted
        async findManyActive<T>(this: T, args?: any) {
          const context = this as any;
          return context.findMany({
            ...args,
            where: {
              ...args?.where,
              deletedAt: null,
            },
          });
        },

        // Restore deleted record
        async restore<T>(this: T, where: any) {
          const context = this as any;
          return context.update({
            where,
            data: { deletedAt: null },
          });
        },
      },
    },
  };
}
```

```ts
// Usage
const project = await prisma.project.softDelete({
  where: { id: projectId },
});

const activeProjects = await prisma.project.findManyActive();

await prisma.project.restore({ where: { id: projectId } });
```

### Pattern: Global Soft Delete Middleware

```ts
// lib/db/prisma.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Middleware to automatically exclude soft-deleted records
prisma.$use(async (params, next) => {
  // Models that support soft delete
  const softDeleteModels = ["project", "quote", "timeEntry"];

  if (softDeleteModels.includes(params.model?.toLowerCase() || "")) {
    // Modify findMany queries
    if (params.action === "findMany") {
      if (!params.args) {
        params.args = {};
      }
      if (!params.args.where) {
        params.args.where = {};
      }
      // Exclude deleted records
      params.args.where.deletedAt = null;
    }

    // Modify findUnique queries
    if (params.action === "findUnique" || params.action === "findFirst") {
      if (!params.args) {
        params.args = {};
      }
      if (!params.args.where) {
        params.args.where = {};
      }
      params.args.where.deletedAt = null;
    }

    // Convert delete to update (soft delete)
    if (params.action === "delete") {
      params.action = "update";
      params.args.data = { deletedAt: new Date() };
    }

    if (params.action === "deleteMany") {
      params.action = "updateMany";
      if (!params.args) {
        params.args = {};
      }
      params.args.data = { deletedAt: new Date() };
    }
  }

  return next(params);
});
```

---

## Audit Logging

### Pattern: Audit Log Table

```prisma
// prisma/schema.prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String   // CREATE, UPDATE, DELETE
  entity      String   // project, quote, etc.
  entityId    String
  changes     Json     // Before/after values
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([entity, entityId])
  @@index([userId])
}
```

### Pattern: Audit Middleware

```ts
// lib/db/audit-middleware.ts
import { PrismaClient } from "@prisma/client";

export function createAuditMiddleware(userId?: string) {
  return async (params: any, next: any) => {
    const result = await next(params);

    // Only log mutations
    const mutations = [
      "create",
      "update",
      "delete",
      "createMany",
      "updateMany",
      "deleteMany",
    ];
    if (!mutations.includes(params.action)) {
      return result;
    }

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId,
        action: params.action.toUpperCase(),
        entity: params.model || "unknown",
        entityId: result?.id || "bulk-operation",
        changes: {
          args: params.args,
          result,
        },
      },
    });

    return result;
  };
}
```

### Pattern: Field-Level Audit Trail

```ts
// Track specific field changes
async function updateProjectWithAudit(
  projectId: string,
  updates: any,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    // Get current values
    const before = await tx.project.findUnique({
      where: { id: projectId },
    });

    if (!before) {
      throw new Error("Project not found");
    }

    // Update project
    const after = await tx.project.update({
      where: { id: projectId },
      data: updates,
    });

    // Calculate changes
    const changes: Record<string, { before: any; after: any }> = {};
    for (const key of Object.keys(updates)) {
      if (before[key] !== after[key]) {
        changes[key] = {
          before: before[key],
          after: after[key],
        };
      }
    }

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entity: "project",
        entityId: projectId,
        changes,
      },
    });

    return after;
  });
}
```

---

## Query Optimization

### Pattern: Select Only Needed Fields

```ts
// ❌ BAD: Fetches all fields (including large text fields)
const projects = await prisma.project.findMany();

// ✅ GOOD: Select only needed fields
const projects = await prisma.project.findMany({
  select: {
    id: true,
    title: true,
    status: true,
    clientName: true,
    createdAt: true,
  },
});
```

### Pattern: Use Indexes Effectively

```prisma
// prisma/schema.prisma
model Project {
  id          String   @id @default(cuid())
  status      String
  clientEmail String
  createdAt   DateTime @default(now())

  // Add indexes for frequently queried fields
  @@index([status])
  @@index([clientEmail])
  @@index([createdAt])
  @@index([status, createdAt]) // Composite index
}
```

### Pattern: Batch Loading

```ts
// ❌ BAD: N+1 query problem
const quotes = await prisma.quote.findMany();
for (const quote of quotes) {
  const project = await prisma.project.findUnique({
    where: { id: quote.projectId },
  }); // N queries!
}

// ✅ GOOD: Include relation in single query
const quotes = await prisma.quote.findMany({
  include: {
    project: true, // Single query with JOIN
  },
});
```

### Pattern: Connection Pooling

```ts
// lib/db/prisma.ts
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

// Add connection pooling parameters
const connectionString = `${databaseUrl}?connection_limit=20&pool_timeout=30`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});
```

### Pattern: Query Caching

```ts
// lib/db/query-cache.ts
const queryCache = new Map<string, { data: any; expiresAt: number }>();

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlMs = 60000,
): Promise<T> {
  // Check cache
  const cached = queryCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // Execute query
  const data = await queryFn();

  // Cache result
  queryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });

  return data;
}
```

```ts
// Usage
const projects = await cachedQuery(
  "active-projects",
  () =>
    prisma.project.findMany({
      where: { status: "ACTIVE" },
    }),
  5 * 60 * 1000, // Cache for 5 minutes
);
```

---

## N+1 Query Prevention

### Understanding N+1 Queries

N+1 queries occur when you fetch a list of records (1 query) and then fetch related data for each record (N queries).

### Pattern: Use Include for Relations

```ts
// ❌ BAD: N+1 problem
const projects = await prisma.project.findMany();
for (const project of projects) {
  const timeEntries = await prisma.timeEntry.findMany({
    where: { projectId: project.id },
  }); // N queries!
}

// ✅ GOOD: Include relation
const projects = await prisma.project.findMany({
  include: {
    timeEntries: true, // Single query with JOIN
  },
});
```

### Pattern: DataLoader Pattern (Advanced)

```ts
// lib/db/data-loaders.ts
class DataLoader<K, V> {
  private cache = new Map<K, Promise<V>>();
  private batch: K[] = [];
  private batchPromise: Promise<V[]> | null = null;

  constructor(private batchLoadFn: (keys: K[]) => Promise<V[]>) {}

  load(key: K): Promise<V> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    this.batch.push(key);

    if (!this.batchPromise) {
      this.batchPromise = new Promise((resolve) => {
        process.nextTick(() => {
          const batch = [...this.batch];
          this.batch = [];
          this.batchPromise = null;

          this.batchLoadFn(batch).then(resolve);
        });
      });
    }

    const promise = this.batchPromise.then(
      (values) => values[this.batch.indexOf(key)],
    );
    this.cache.set(key, promise);

    return promise;
  }
}

// Create loader for projects
const projectLoader = new DataLoader(async (ids: string[]) => {
  const projects = await prisma.project.findMany({
    where: { id: { in: ids } },
  });

  // Return in same order as input
  return ids.map((id) => projects.find((p) => p.id === id)!);
});
```

---

## Connection Management

### Pattern: Prisma Client Singleton

```ts
// lib/db/prisma.ts (already implemented in codebase)
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// Singleton pattern prevents multiple instances
const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV === "development") {
  global.prisma = prisma;
}

export { prisma };
```

### Pattern: Graceful Shutdown

```ts
// lib/db/shutdown.ts
import { prisma } from "./prisma";

export async function gracefulShutdown() {
  console.log("Closing database connections...");

  await prisma.$disconnect();

  console.log("Database connections closed");
  process.exit(0);
}

// Handle shutdown signals
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
```

---

## Best Practices Summary

### Query Performance

- ✅ Use `select` to fetch only needed fields
- ✅ Add indexes for frequently queried fields
- ✅ Use `include` instead of separate queries
- ✅ Implement pagination for large datasets
- ❌ Avoid N+1 queries

### Transactions

- ✅ Use transactions for multi-step operations
- ✅ Keep transactions as short as possible
- ✅ Handle errors and rollbacks properly
- ❌ Don't nest transactions unnecessarily

### Soft Deletes

- ✅ Implement for data preservation
- ✅ Use middleware for automatic filtering
- ✅ Provide restore functionality
- ❌ Don't forget to handle in queries

### Audit Logging

- ✅ Log all mutations
- ✅ Track user and timestamp
- ✅ Store before/after values
- ❌ Don't log sensitive data (passwords, tokens)

### Connection Management

- ✅ Use Prisma singleton pattern
- ✅ Configure connection pooling
- ✅ Handle graceful shutdown
- ❌ Don't create multiple Prisma instances

---

## Related Documentation

- [Prisma Documentation](https://prisma.io/docs)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
- [API Patterns](./api-patterns.md)
- [Testing Patterns](./testing-patterns.md)

**Last Updated:** 2026-01-07
