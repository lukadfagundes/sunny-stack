# Contributing Guide

Welcome to the Sunny Stack contributing guide! This document covers everything you need to know about contributing code, creating pull requests, and following project standards.

## Table of Contents

- [Development Workflow](#development-workflow)
- [Git Branching Strategy](#git-branching-strategy)
- [Commit Message Conventions](#commit-message-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Development Environment](#development-environment)
- [Common Contribution Patterns](#common-contribution-patterns)

---

## Development Workflow

### Quick Start

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/sunny-stack.git
cd sunny-stack

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Start development server
npm run dev

# 5. Create a feature branch
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

### Development Cycle

```
┌──────────────────────────────────────────┐
│ 1. Create feature branch from dev        │
└────────────┬─────────────────────────────┘
             ↓
┌──────────────────────────────────────────┐
│ 2. Make changes and commit frequently    │
└────────────┬─────────────────────────────┘
             ↓
┌──────────────────────────────────────────┐
│ 3. Write tests for new functionality     │
└────────────┬─────────────────────────────┘
             ↓
┌──────────────────────────────────────────┐
│ 4. Run tests and linting locally         │
└────────────┬─────────────────────────────┘
             ↓
┌──────────────────────────────────────────┐
│ 5. Push branch and create PR             │
└────────────┬─────────────────────────────┘
             ↓
┌──────────────────────────────────────────┐
│ 6. Address review feedback               │
└────────────┬─────────────────────────────┘
             ↓
┌──────────────────────────────────────────┐
│ 7. PR approved and merged to dev         │
└──────────────────────────────────────────┘
```

---

## Git Branching Strategy

This project uses a **Git Flow** branching strategy with two main branches:

### Main Branches

- **`main`** - Production-ready code, deployed to Vercel
- **`dev`** - Integration branch for features, deployed to staging

### Feature Branches

All development happens in feature branches created from `dev`:

```bash
# Branch naming conventions
feature/add-analytics-dashboard    # New features
fix/quote-submission-error        # Bug fixes
refactor/prisma-query-optimization # Code refactoring
docs/update-api-documentation     # Documentation updates
test/add-e2e-time-tracking       # Test additions
chore/update-dependencies        # Maintenance tasks
```

### Branch Naming Rules

✅ **DO:**

- Use descriptive names: `feature/add-time-tracking-export`
- Use kebab-case: `fix/discord-bot-timeout`
- Start with type prefix: `feature/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`

❌ **DON'T:**

- Use vague names: `feature/new-stuff`
- Use underscores: `feature_new_api`
- Skip type prefix: `analytics-dashboard`

### Creating a Feature Branch

```bash
# Always start from latest dev
git checkout dev
git pull origin dev

# Create and switch to new branch
git checkout -b feature/your-feature-name

# Push branch to remote
git push -u origin feature/your-feature-name
```

---

## Commit Message Conventions

This project follows **Conventional Commits** specification for clear, structured commit history.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **refactor:** Code refactoring (no functional changes)
- **docs:** Documentation changes
- **test:** Adding or updating tests
- **chore:** Maintenance tasks (dependencies, config)
- **style:** Code style changes (formatting, no logic changes)
- **perf:** Performance improvements

### Examples

**Feature Addition:**

```bash
git commit -m "feat(api): add time tracking export endpoint

Implement CSV and JSON export for time entries with date filtering.

Closes #42"
```

**Bug Fix:**

```bash
git commit -m "fix(discord): prevent bot timeout on long database queries

Add connection pooling limit and query timeout configuration.

Fixes #89"
```

**Refactoring:**

```bash
git commit -m "refactor(auth): simplify Google OAuth callback logic

Extract token validation into separate utility function."
```

**Documentation:**

```bash
git commit -m "docs(api): add examples for quote submission endpoint"
```

**Breaking Changes:**

```bash
git commit -m "feat(api)!: change quote API response format

BREAKING CHANGE: Quote API now returns { data: {...} } instead of flat object.
Migration guide: docs/migrations/quote-api-v2.md"
```

### Commit Message Rules

✅ **DO:**

- Use imperative mood: "add feature" not "added feature"
- Keep subject line under 72 characters
- Capitalize first letter of subject
- No period at end of subject
- Include issue number in footer: `Closes #42` or `Fixes #89`

❌ **DON'T:**

- Use past tense: "Added feature"
- Write vague messages: "fix stuff"
- Include multiple unrelated changes in one commit

### Scopes

Common scopes in this project:

- `api` - API routes and endpoints
- `discord` - Discord bot code
- `auth` - Authentication logic
- `db` - Database models and migrations
- `ui` - React components
- `admin` - Admin dashboard
- `monitoring` - Service monitoring
- `test` - Testing code
- `docs` - Documentation

---

## Pull Request Process

### Before Creating a PR

**Checklist:**

- [ ] All tests pass locally (`npm test` and `npm run test:e2e`)
- [ ] Code follows project conventions
- [ ] New functionality has tests (≥80% coverage)
- [ ] Documentation updated (if needed)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Branch is up-to-date with `dev`

### Creating a Pull Request

1. **Push your branch:**

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open PR on GitHub:**
   - Navigate to repository on GitHub
   - Click "Compare & pull request"
   - Set base branch to `dev` (NOT `main`)
   - Fill out PR template

3. **PR Title Format:**

   ```
   [TYPE] Brief description (closes #issue)
   ```

   Examples:
   - `[FEAT] Add time tracking export functionality (closes #42)`
   - `[FIX] Resolve Discord bot timeout issue (fixes #89)`
   - `[DOCS] Update API documentation with examples`

4. **PR Description Template:**

   ```markdown
   ## What does this PR do?

   Brief description of changes (1-2 sentences).

   ## Type of Change

   - [ ] 🎉 New feature (non-breaking change which adds functionality)
   - [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
   - [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
   - [ ] 📝 Documentation update
   - [ ] 🔧 Refactoring (no functional changes)
   - [ ] ✅ Test additions or improvements

   ## Changes Made

   - Added X functionality
   - Updated Y component
   - Fixed Z bug

   ## Testing

   - [ ] Unit tests added/updated
   - [ ] E2E tests added/updated
   - [ ] Manual testing completed
   - [ ] All tests passing

   ## Screenshots (if applicable)

   Before: [screenshot]
   After: [screenshot]

   ## Related Issues

   Closes #42
   Related to #38

   ## Checklist

   - [ ] Code follows project conventions
   - [ ] Tests pass locally
   - [ ] Documentation updated
   - [ ] No console errors or warnings
   - [ ] Reviewed my own code
   ```

### Draft Pull Requests

Use draft PRs for work-in-progress:

```bash
# Create draft PR on GitHub
# Select "Create draft pull request" option
```

When ready for review:

- Click "Ready for review" on GitHub
- Request reviews from team members

---

## Code Review Guidelines

### For Authors (Creating PRs)

**Before Requesting Review:**

1. Review your own code first (GitHub "Files changed" tab)
2. Add comments explaining complex logic
3. Run all tests locally
4. Ensure CI passes (GitHub Actions)
5. Keep PRs focused (1 feature/fix per PR)
6. Link related issues

**Responding to Feedback:**

- Address all comments (resolve or respond)
- Make requested changes promptly
- Push commits to same branch (auto-updates PR)
- Re-request review after changes
- Thank reviewers for their time

### For Reviewers

**What to Look For:**

1. **Functionality**
   - Does code work as intended?
   - Are edge cases handled?
   - Any potential bugs?

2. **Code Quality**
   - Follows project conventions?
   - Clear variable/function names?
   - Proper error handling?
   - No code duplication?

3. **Testing**
   - Tests cover new functionality?
   - Tests are meaningful (not just coverage)?
   - E2E tests for user-facing features?

4. **Documentation**
   - Public APIs documented (JSDoc)?
   - Complex logic explained?
   - README updated (if needed)?

5. **Security**
   - No exposed secrets?
   - Input validation present?
   - SQL injection prevention?

6. **Performance**
   - No obvious performance issues?
   - Database queries optimized?
   - Proper caching implemented?

**Review Etiquette:**

- Be respectful and constructive
- Explain the "why" behind suggestions
- Praise good code
- Offer specific alternatives
- Distinguish between "must fix" and "nice to have"

**Comment Examples:**

✅ **Good Comments:**

```markdown
Consider extracting this logic into a separate function for reusability.

This query might cause N+1 problem. Try using Prisma's `include` instead.

Great error handling! This will make debugging much easier.
```

❌ **Poor Comments:**

```markdown
This is wrong.

Change this.

I don't like this.
```

### Approval Process

**Required Approvals:** 1 reviewer approval minimum

**Merge Requirements:**

- [ ] All CI checks passing (tests, linting)
- [ ] At least 1 approval from reviewer
- [ ] No unresolved conversations
- [ ] Branch up-to-date with `dev`

### Merging Strategy

**Squash and Merge (Preferred):**

- Combines all commits into one
- Keeps `dev` history clean
- Edit commit message to follow conventions

```bash
# GitHub will automatically squash on merge
# Ensure final commit message follows format:
feat(api): add time tracking export endpoint (#42)
```

**When to Use Regular Merge:**

- Large features with meaningful commit history
- Multiple contributors on same branch

---

## Code Standards

### TypeScript Best Practices

**Type Annotations:**

```typescript
// ✅ DO: Explicit types for function parameters
function calculateTotal(amount: number, tax: number): number {
  return amount * (1 + tax);
}

// ❌ DON'T: Implicit 'any' types
function calculateTotal(amount, tax) {
  return amount * (1 + tax);
}
```

**Interfaces vs Types:**

```typescript
// ✅ DO: Use interfaces for object shapes
interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
}

// ✅ DO: Use types for unions and complex types
type Status = "active" | "archived" | "deleted";
type ApiResponse<T> = { data: T } | { error: string };
```

**Avoid 'any':**

```typescript
// ❌ DON'T: Use 'any' unless absolutely necessary
function processData(data: any) {}

// ✅ DO: Use generic types
function processData<T>(data: T): T {}

// ✅ DO: Use 'unknown' for truly unknown types
function processData(data: unknown) {
  if (typeof data === "string") {
    // Type narrowing
  }
}
```

### React Component Patterns

**Server Components (Default):**

```typescript
// app/projects/page.tsx
// No 'use client' needed - this is a Server Component
export default async function ProjectsPage() {
  // Fetch data directly in Server Component
  const projects = await prisma.project.findMany();

  return <ProjectList projects={projects} />;
}
```

**Client Components (When Needed):**

```typescript
// components/ProjectFilter.tsx
'use client'; // Only when using hooks, interactivity, or browser APIs

import { useState } from 'react';

export default function ProjectFilter({ onFilter }) {
  const [status, setStatus] = useState('all');

  return (
    <select value={status} onChange={(e) => onFilter(e.target.value)}>
      {/* ... */}
    </select>
  );
}
```

**Component Structure:**

```typescript
// components/ProjectCard.tsx
interface ProjectCardProps {
  project: Project;
  onEdit?: (id: string) => void;
}

export default function ProjectCard({ project, onEdit }: ProjectCardProps) {
  // 1. Hooks
  const [isExpanded, setIsExpanded] = useState(false);

  // 2. Derived state
  const isOverdue = new Date(project.deadline) < new Date();

  // 3. Event handlers
  const handleEdit = () => {
    onEdit?.(project.id);
  };

  // 4. Render
  return (
    <div className="project-card">
      <h3>{project.title}</h3>
      {isOverdue && <Badge>Overdue</Badge>}
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
}
```

### API Route Patterns

**Standard Structure:**

```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// Input validation schema
const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  clientEmail: z.string().email(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Input validation
    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    // 3. Business logic
    const project = await prisma.project.create({
      data: validated,
    });

    // 4. Success response
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    // 5. Error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Project creation failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### Error Handling

**Custom Error Classes:**

```typescript
// lib/errors/app-error.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, true);
  }
}
```

**Using Errors:**

```typescript
// Throw specific errors
if (!project) {
  throw new NotFoundError("Project not found");
}

if (!email) {
  throw new ValidationError("Email is required");
}

// Catch and handle
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof AppError && error.isOperational) {
    // Handle operational error
  } else {
    // Programming error - log and alert
    console.error("Unexpected error:", error);
    throw error;
  }
}
```

### Database Best Practices

**Prisma Query Patterns:**

```typescript
// ✅ DO: Use Prisma Client singleton
import { prisma } from "@/lib/db/prisma";

// ✅ DO: Select only needed fields
const projects = await prisma.project.findMany({
  select: {
    id: true,
    title: true,
    status: true,
  },
});

// ✅ DO: Use transactions for multiple operations
await prisma.$transaction([
  prisma.quote.update({
    where: { id: quoteId },
    data: { status: "CONVERTED" },
  }),
  prisma.project.create({
    data: projectData,
  }),
]);

// ✅ DO: Implement soft deletes
await prisma.project.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Filter out soft-deleted records
const activeProjects = await prisma.project.findMany({
  where: { deletedAt: null },
});

// ❌ DON'T: Create new Prisma Client instances
const prisma = new PrismaClient(); // DON'T DO THIS
```

**Query Optimization:**

```typescript
// ✅ DO: Use 'include' to avoid N+1 queries
const project = await prisma.project.findUnique({
  where: { id },
  include: {
    quotes: true,
    timeEntries: {
      orderBy: { startedAt: "desc" },
    },
  },
});

// ❌ DON'T: Make separate queries for related data (N+1)
const project = await prisma.project.findUnique({ where: { id } });
const quotes = await prisma.quote.findMany({ where: { projectId: id } });
const timeEntries = await prisma.timeEntry.findMany({
  where: { projectId: id },
});
```

---

## Testing Requirements

### Test Coverage

**Minimum Coverage:** 80% (enforced by CI)

**What to Test:**

- ✅ All API endpoints
- ✅ Business logic functions
- ✅ React components (user interactions)
- ✅ Database models (queries, validations)
- ✅ Utility functions
- ✅ Error handling paths

**What NOT to Test:**

- ❌ Third-party libraries
- ❌ Next.js framework code
- ❌ Prisma generated code
- ❌ Type definitions

### Unit Tests

**Location:** `__tests__/unit/`

**Example:**

```typescript
// __tests__/unit/api/projects.test.ts
import { POST } from "@/app/api/projects/route";

describe("POST /api/projects", () => {
  it("creates project with valid data", async () => {
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({
        title: "New Project",
        clientEmail: "client@example.com",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toHaveProperty("id");
  });

  it("returns 400 for invalid email", async () => {
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({
        title: "New Project",
        clientEmail: "invalid-email",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

### E2E Tests

**Location:** `e2e/`

**Example:**

```typescript
// e2e/projects.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Project Management", () => {
  test("admin can create new project", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.click('button[type="submit"]');

    // Navigate to projects
    await page.goto("/admin/projects");
    await page.click('button:has-text("New Project")');

    // Fill form
    await page.fill('input[name="title"]', "Test Project");
    await page.fill('input[name="clientEmail"]', "client@example.com");
    await page.click('button[type="submit"]');

    // Verify creation
    await expect(page.locator("text=Test Project")).toBeVisible();
  });
});
```

### Running Tests

```bash
# Unit tests
npm test                     # Run all unit tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage report

# E2E tests
npm run test:e2e            # Run all E2E tests
npm run test:e2e:ui         # Playwright UI mode
npm run test:e2e:debug      # Debug mode
```

---

## Development Environment

### Recommended IDE: VS Code

**Required Extensions:**

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- Prisma (`Prisma.prisma`)

**Optional but Helpful:**

- Error Lens (`usernamehw.errorlens`)
- GitLens (`eamodio.gitlens`)
- Auto Rename Tag (`formulahendry.auto-rename-tag`)
- Path Intellisense (`christian-kohler.path-intellisense`)

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Debugging Setup

**Next.js Server:**

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

**Discord Bot:**

```json
{
  "name": "Debug Discord Bot",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "bot:dev"],
  "skipFiles": ["<node_internals>/**"]
}
```

---

## Common Contribution Patterns

### Pattern 1: Adding a New API Endpoint

**Steps:**

1. **Create route file:**

   ```typescript
   // app/api/reports/route.ts
   import { NextRequest, NextResponse } from "next/server";

   export async function GET(request: NextRequest) {
     // Implementation
   }
   ```

2. **Add input validation (if needed):**

   ```typescript
   import { z } from "zod";

   const reportSchema = z.object({
     startDate: z.string().datetime(),
     endDate: z.string().datetime(),
   });
   ```

3. **Add authentication:**

   ```typescript
   const session = await getServerSession(authOptions);
   if (!session?.user?.isAdmin) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```

4. **Write unit tests:**

   ```typescript
   // __tests__/unit/api/reports.test.ts
   describe("GET /api/reports", () => {
     it("returns reports for valid date range", async () => {
       // Test implementation
     });
   });
   ```

5. **Update API documentation:**

   ```markdown
   <!-- docs/api/README.md -->

   ### GET /api/reports

   Generate reports for given date range.
   ```

6. **Create PR:**
   ```bash
   git checkout -b feature/add-reports-endpoint
   git add .
   git commit -m "feat(api): add reports generation endpoint"
   git push origin feature/add-reports-endpoint
   ```

### Pattern 2: Creating a New Page

**Steps:**

1. **Create page file:**

   ```typescript
   // app/reports/page.tsx
   export default async function ReportsPage() {
     const reports = await fetchReports();
     return <div>Reports</div>;
   }
   ```

2. **Add layout (if needed):**

   ```typescript
   // app/reports/layout.tsx
   export default function ReportsLayout({ children }) {
     return (
       <div className="reports-layout">
         <nav>...</nav>
         {children}
       </div>
     );
   }
   ```

3. **Create components:**

   ```typescript
   // components/reports/ReportCard.tsx
   export default function ReportCard({ report }) {
     return <div>{report.title}</div>;
   }
   ```

4. **Add E2E tests:**

   ```typescript
   // e2e/reports.spec.ts
   test("user can view reports page", async ({ page }) => {
     await page.goto("/reports");
     await expect(page.locator("h1")).toContainText("Reports");
   });
   ```

5. **Update documentation:**

   ```markdown
   <!-- docs/architecture/overview.md -->

   - `/reports` - Reports dashboard
   ```

### Pattern 3: Adding a Discord Bot Command

**Steps:**

1. **Create command file:**

   ```typescript
   // bot/commands/report.ts
   import { BaseCommand } from "./base-command";

   export class ReportCommand extends BaseCommand {
     constructor() {
       super({
         name: "report",
         description: "Generate time tracking report",
       });
     }

     async execute(interaction) {
       // Implementation
     }
   }
   ```

2. **Register command:**

   ```typescript
   // bot/commands/registry.ts
   import { ReportCommand } from "./report";

   export const commands = [
     // ...
     new ReportCommand(),
   ];
   ```

3. **Test command:**

   ```bash
   npm run bot:deploy  # Deploy to Discord
   npm run bot:test    # Test locally
   ```

4. **Add documentation:**

   ```markdown
   <!-- docs/guides/discord-bot-development.md -->

   ### /report

   Generate time tracking report.
   ```

5. **Create PR:**
   ```bash
   git checkout -b feature/add-report-command
   git commit -m "feat(discord): add /report command for time tracking"
   git push
   ```

### Pattern 4: Adding a Database Model

**Steps:**

1. **Update Prisma schema:**

   ```prisma
   // prisma/schema.prisma
   model Report {
     id        String   @id @default(cuid())
     title     String
     createdAt DateTime @default(now())
     @@map("reports")
   }
   ```

2. **Create migration:**

   ```bash
   npx prisma migrate dev --name add-report-model
   ```

3. **Generate Prisma Client:**

   ```bash
   npx prisma generate
   ```

4. **Add seed data (optional):**

   ```typescript
   // prisma/seed.ts
   await prisma.report.create({
     data: {
       title: "Sample Report",
     },
   });
   ```

5. **Update database documentation:**

   ```markdown
   <!-- docs/guides/database-management.md -->

   ### Report Model

   Stores generated reports.
   ```

6. **Write tests:**
   ```typescript
   // __tests__/unit/db/report.test.ts
   describe("Report Model", () => {
     it("creates report with valid data", async () => {
       // Test implementation
     });
   });
   ```

### Pattern 5: Writing Tests for New Features

**Unit Test Template:**

```typescript
// __tests__/unit/features/my-feature.test.ts
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { mockPrisma } from "../../helpers/mock-prisma";

describe("My Feature", () => {
  beforeEach(() => {
    // Setup test data
  });

  afterEach(() => {
    // Cleanup
  });

  it("should handle success case", () => {
    // Arrange
    const input = {
      /* test data */
    };

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe(expected);
  });

  it("should handle error case", () => {
    // Test error handling
    expect(() => myFunction(invalid)).toThrow();
  });
});
```

**E2E Test Template:**

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from "@playwright/test";

test.describe("My Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Setup (login, navigate, etc.)
  });

  test("user can complete workflow", async ({ page }) => {
    // 1. Navigate to page
    await page.goto("/feature");

    // 2. Interact with UI
    await page.click('button:has-text("Action")');

    // 3. Verify result
    await expect(page.locator(".success-message")).toBeVisible();
  });

  test("shows error for invalid input", async ({ page }) => {
    // Test error states
  });
});
```

---

## Getting Help

### Documentation Resources

- **Setup Issues:** [Getting Started Guide](getting-started.md)
- **Testing Help:** [Testing Guide](testing.md)
- **Database Help:** [Database Management Guide](database-management.md)
- **Bot Development:** [Discord Bot Guide](discord-bot-development.md)
- **Security:** [Security Best Practices](security.md)

### Asking Questions

1. **Check documentation first** - Most answers are already documented
2. **Search existing issues** - Your question may already be answered
3. **Create an issue** - Use issue templates on GitHub
4. **Discord community** - Join the development server

### Common Issues

**Build Errors:**

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Regenerate Prisma Client
npx prisma generate
```

**Test Failures:**

```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests in verbose mode
npm test -- --verbose
```

**Environment Issues:**

```bash
# Validate environment variables
npm run validate:env

# Check prerequisites
npm run validate:prerequisites
```

---

## Useful Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Run linter
npm run type-check       # Type checking

# Testing
npm test                 # Unit tests
npm run test:e2e         # E2E tests
npm run test:coverage    # Coverage report

# Database
npx prisma migrate dev   # Create migration
npx prisma studio        # Open database GUI
npx prisma generate      # Generate client

# Discord Bot
npm run bot:dev          # Run bot locally
npm run bot:deploy       # Deploy commands

# Git
git checkout dev         # Switch to dev branch
git pull origin dev      # Update dev branch
git checkout -b feature/name  # Create feature branch
git add .                # Stage changes
git commit -m "message"  # Commit changes
git push origin feature/name  # Push branch
```

---

**Last Updated:** 2026-01-07
**Maintained by:** Sunny Stack Development Team

**Questions?** Open an issue or ask in the Discord community!
