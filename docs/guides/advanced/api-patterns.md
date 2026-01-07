# Advanced API Patterns

This guide covers advanced API patterns used in sunny-stack, including middleware composition, error handling, rate limiting, and caching strategies.

## Table of Contents

- [API Architecture Overview](#api-architecture-overview)
- [Middleware Composition](#middleware-composition)
- [Custom Error Handling](#custom-error-handling)
- [Rate Limiting Implementation](#rate-limiting-implementation)
- [Caching Strategies](#caching-strategies)
- [Request Validation](#request-validation)
- [Background Jobs](#background-jobs)

---

## API Architecture Overview

### Next.js API Routes Structure

```
app/api/
├── quotes/
│   └── route.ts          # GET /api/quotes, POST /api/quotes
├── quotes/[id]/
│   └── route.ts          # GET /api/quotes/:id, PATCH /api/quotes/:id
├── projects/
│   └── route.ts
├── time-entries/
│   └── route.ts
└── health/
    └── route.ts
```

### Route Handler Pattern

```ts
// app/api/quotes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Failed to fetch quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const quote = await prisma.quote.create({
      data: body,
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error("Failed to create quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 },
    );
  }
}
```

---

## Middleware Composition

### Pattern: Composable Middleware Functions

```ts
// lib/api/middleware.ts
import type { NextRequest } from "next/server";

export type ApiMiddleware = (
  request: NextRequest,
  context: Record<string, any>,
) => Promise<Response | null>;

/**
 * Compose multiple middleware functions
 * If any middleware returns a Response, the chain stops and that response is returned
 */
export function composeMiddleware(...middlewares: ApiMiddleware[]) {
  return async (request: NextRequest) => {
    const context: Record<string, any> = {};

    for (const middleware of middlewares) {
      const response = await middleware(request, context);
      if (response) {
        return response; // Short-circuit on error response
      }
    }

    return context; // Return context if all middleware passed
  };
}
```

### Pattern: Authentication Middleware

```ts
// lib/api/middleware/auth.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function authMiddleware(
  request: NextRequest,
  context: Record<string, any>,
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized - Please sign in" },
      { status: 401 },
    );
  }

  // Add user to context for downstream middleware/handlers
  context.user = session.user;

  return null; // Continue to next middleware
}
```

### Pattern: Validation Middleware

```ts
// lib/api/middleware/validation.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema } from "zod";

export function validationMiddleware(schema: ZodSchema) {
  return async (request: NextRequest, context: Record<string, any>) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);

      // Add validated data to context
      context.validatedData = validatedData;

      return null; // Continue
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            issues: error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
  };
}
```

### Pattern: Rate Limiting Middleware

```ts
// lib/api/middleware/rate-limit.ts
import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(maxRequests = 100, windowMs = 60000) {
  return async (request: NextRequest, context: Record<string, any>) => {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();

    const record = rateLimitMap.get(ip);

    // Reset if window expired
    if (!record || now > record.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return null; // Continue
    }

    // Increment count
    record.count++;

    // Check limit
    if (record.count > maxRequests) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)),
          },
        },
      );
    }

    return null; // Continue
  };
}
```

### Pattern: Using Composed Middleware

```ts
// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { composeMiddleware } from "@/lib/api/middleware";
import { authMiddleware } from "@/lib/api/middleware/auth";
import { validationMiddleware } from "@/lib/api/middleware/validation";
import { rateLimitMiddleware } from "@/lib/api/middleware/rate-limit";
import { prisma } from "@/lib/db/prisma";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email format"),
  budget: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  // Compose middleware: auth → rate limit → validation
  const middleware = composeMiddleware(
    authMiddleware,
    rateLimitMiddleware(50, 60000), // 50 requests per minute
    validationMiddleware(projectSchema),
  );

  const result = await middleware(request);

  // If result is a Response, middleware failed
  if (result instanceof Response) {
    return result;
  }

  // Extract validated data from context
  const { validatedData, user } = result;

  try {
    const project = await prisma.project.create({
      data: {
        ...validatedData,
        status: "PLANNING",
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
```

---

## Custom Error Handling

### Pattern: Typed Error Classes

```ts
// lib/errors/app-error.ts (already exists in codebase)
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 400);
    this.name = "ValidationError";
    this.field = field;
  }
}

export class AuthError extends AppError {
  constructor(message: string, statusCode = 401) {
    super(message, statusCode);
    this.name = "AuthError";
  }
}

export class NotFoundError extends AppError {
  public readonly resource: string;
  public readonly id: string;

  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 404);
    this.name = "NotFoundError";
    this.resource = resource;
    this.id = id;
  }
}
```

### Pattern: Error Handler Middleware

```ts
// lib/api/middleware/error-handler.ts
import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors/app-error";
import { Prisma } from "@prisma/client";

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  // Handle custom AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.field && { field: error.field }),
      },
      { status: error.statusCode },
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A record with this value already exists" },
        { status: 409 },
      );
    }

    // Record not found
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
  }

  // Handle validation errors (Zod)
  if (error && typeof error === "object" && "issues" in error) {
    return NextResponse.json(
      { error: "Validation failed", issues: error.issues },
      { status: 400 },
    );
  }

  // Default error response
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 },
  );
}
```

### Pattern: Try-Catch Wrapper

```ts
// lib/api/async-handler.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "./middleware/error-handler";

type ApiHandler = (
  request: NextRequest,
  context?: any,
) => Promise<NextResponse>;

export function asyncHandler(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
```

```ts
// Usage in route
import { asyncHandler } from "@/lib/api/async-handler";
import { NotFoundError } from "@/lib/errors/app-error";

export const GET = asyncHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    throw new NotFoundError("Project", id);
  }

  return NextResponse.json(project);
});
```

---

## Rate Limiting Implementation

### Pattern: In-Memory Rate Limiter

```ts
// lib/api/rate-limiter.ts
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  check(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = this.store.get(identifier);

    // No record or window expired - allow
    if (!record || now > record.resetAt) {
      this.store.set(identifier, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
      return { allowed: true };
    }

    // Increment count
    record.count++;

    // Check if exceeded
    if (record.count > this.config.maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      };
    }

    return { allowed: true };
  }

  reset(identifier: string) {
    this.store.delete(identifier);
  }

  // Cleanup expired entries (call periodically)
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
      }
    }
  }
}
```

### Pattern: Per-Endpoint Rate Limiting

```ts
// lib/api/rate-limiters.ts
import { RateLimiter } from "./rate-limiter";

// Different limits for different endpoints
export const rateLimiters = {
  quotes: new RateLimiter({ maxRequests: 10, windowMs: 60000 }), // 10/min
  projects: new RateLimiter({ maxRequests: 50, windowMs: 60000 }), // 50/min
  auth: new RateLimiter({ maxRequests: 5, windowMs: 60000 }), // 5/min
};

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    Object.values(rateLimiters).forEach((limiter) => limiter.cleanup());
  },
  5 * 60 * 1000,
);
```

```ts
// Usage in route
import { rateLimiters } from "@/lib/api/rate-limiters";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  const rateLimit = rateLimiters.quotes.check(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    );
  }

  // ... handle request
}
```

---

## Caching Strategies

### Pattern: Next.js Built-In Caching

```ts
// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const projects = await prisma.project.findMany();

  return NextResponse.json(projects, {
    headers: {
      // Cache for 60 seconds in browser and CDN
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

// Force dynamic (no caching)
export const dynamic = "force-dynamic";

// Revalidate every 60 seconds
export const revalidate = 60;
```

### Pattern: Manual Cache with Map

```ts
// lib/api/cache.ts
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class ApiCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  set(key: string, data: T, ttlMs: number) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}
```

```ts
// Usage
import { ApiCache } from "@/lib/api/cache";
import type { Project } from "@prisma/client";

const projectsCache = new ApiCache<Project[]>();

export async function GET(request: NextRequest) {
  const cacheKey = "all-projects";

  // Check cache first
  const cached = projectsCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  // Cache miss - fetch from database
  const projects = await prisma.project.findMany();

  // Cache for 5 minutes
  projectsCache.set(cacheKey, projects, 5 * 60 * 1000);

  return NextResponse.json(projects, {
    headers: { "X-Cache": "MISS" },
  });
}

// Invalidate cache on mutations
export async function POST(request: NextRequest) {
  const project = await prisma.project.create({ data: await request.json() });

  // Invalidate cache
  projectsCache.invalidate("all-projects");

  return NextResponse.json(project, { status: 201 });
}
```

### Pattern: Revalidation with Server Actions

```ts
// app/actions/projects.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export async function createProject(data: any) {
  const project = await prisma.project.create({ data });

  // Revalidate specific paths
  revalidatePath("/admin/projects");
  revalidatePath("/");

  // Or revalidate by tag
  revalidateTag("projects");

  return project;
}
```

---

## Request Validation

### Pattern: Zod Schema Validation

```ts
// lib/api/schemas/project.ts
import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email format"),
  budget: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  status: z
    .enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD"])
    .default("PLANNING"),
});

export const updateProjectSchema = createProjectSchema.partial();
```

```ts
// Usage in route
import { createProjectSchema } from "@/lib/api/schemas/project";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: validatedData,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    throw error; // Let error handler catch it
  }
}
```

---

## Background Jobs

### Pattern: Simple Background Tasks

```ts
// lib/jobs/email-queue.ts
interface EmailJob {
  to: string;
  subject: string;
  html: string;
}

class EmailQueue {
  private queue: EmailJob[] = [];
  private processing = false;

  add(job: EmailJob) {
    this.queue.push(job);
    this.process(); // Start processing if not already
  }

  private async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;

      try {
        await this.sendEmail(job);
      } catch (error) {
        console.error("Failed to send email:", error);
        // Optionally retry or move to dead letter queue
      }
    }

    this.processing = false;
  }

  private async sendEmail(job: EmailJob) {
    // Use email service (Resend)
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "noreply@sunny-stack.com",
      ...job,
    });
  }
}

export const emailQueue = new EmailQueue();
```

```ts
// Usage in route
import { emailQueue } from "@/lib/jobs/email-queue";

export async function POST(request: NextRequest) {
  const quote = await prisma.quote.create({ data: await request.json() });

  // Queue email (non-blocking)
  emailQueue.add({
    to: quote.email,
    subject: "Quote Received",
    html: `<p>Thank you for your quote request!</p>`,
  });

  // Respond immediately (don't wait for email)
  return NextResponse.json(quote, { status: 201 });
}
```

### Pattern: Vercel Cron Jobs

```ts
// app/api/cron/health-checks/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run health checks
  const results = await runHealthChecks();

  return NextResponse.json({ success: true, results });
}
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/health-checks",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## Best Practices Summary

### Middleware

- ✅ Use composable middleware for reusability
- ✅ Fail fast (auth before validation before business logic)
- ✅ Pass context between middleware
- ❌ Don't duplicate logic across routes

### Error Handling

- ✅ Use typed error classes
- ✅ Provide meaningful error messages
- ✅ Log errors with context
- ✅ Return appropriate HTTP status codes
- ❌ Don't expose internal error details to clients

### Rate Limiting

- ✅ Implement per-IP rate limiting
- ✅ Use different limits for different endpoints
- ✅ Return `Retry-After` header
- ✅ Clean up expired entries periodically

### Caching

- ✅ Cache expensive queries
- ✅ Set appropriate TTL values
- ✅ Invalidate on mutations
- ✅ Use `Cache-Control` headers
- ❌ Don't cache user-specific data globally

### Validation

- ✅ Validate all inputs with Zod
- ✅ Return detailed validation errors
- ✅ Sanitize inputs before database operations
- ❌ Don't trust client-side validation alone

---

## Related Documentation

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Error Handling](./error-handling.md)
- [Database Patterns](./database-patterns.md)
- [Security Best Practices](../../deployment/SECURITY.md)

**Last Updated:** 2026-01-07
