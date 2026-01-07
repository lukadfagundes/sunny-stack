# Testing Guide

Comprehensive guide for writing and running tests in Sunny Stack Portfolio.

---

## Testing Philosophy

### Trinity Method Testing Principles

**Investigation-First Testing:**

1. Investigate component behavior before writing tests
2. Identify edge cases and failure modes
3. Document expected behavior
4. Write tests that capture requirements

**Test-Driven Development (TDD):**

- **RED:** Write failing test first
- **GREEN:** Implement minimal code to pass
- **REFACTOR:** Improve code while keeping tests green

**Coverage Goals:**

- **Unit Tests:** ≥80% coverage (Trinity BAS requirement)
- **Integration Tests:** Critical paths covered
- **E2E Tests:** Core user journeys tested

---

## Testing Stack

### Frameworks

| Framework                 | Version         | Purpose                      |
| ------------------------- | --------------- | ---------------------------- |
| **Jest**                  | 30.1.3          | Unit and integration testing |
| **Playwright**            | 1.55.0          | End-to-end testing           |
| **React Testing Library** | Included        | Component testing            |
| **Supertest**             | For API testing | API route testing            |

### Test Organization

```
__tests__/
├── helpers/               # Test utilities
│   ├── test-db.ts        # Database setup/teardown
│   └── test-factories.ts # Test data factories
├── unit/                 # Unit tests (~241 tests)
│   ├── components/       # React component tests
│   ├── lib/              # Library/utility tests
│   └── api/              # API route unit tests
├── integration/          # Integration tests (~160 tests)
│   ├── admin-auth.integration.test.ts       # 15 tests
│   ├── projects-workflow.integration.test.ts # 47 tests
│   ├── quotes-workflow.integration.test.ts   # 38 tests
│   ├── proposal-generation.integration.test.ts # 28 tests
│   └── analytics.integration.test.ts         # 32 tests
└── README.md

e2e/                      # E2E tests (Playwright)
├── admin.spec.ts         # Admin dashboard E2E
├── mobile.spec.ts        # Mobile responsiveness
├── performance.spec.ts   # Performance tests
└── accessibility.spec.ts # Accessibility tests
```

---

## Running Tests

### Quick Reference

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run specific test file
npm test -- path/to/test.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="ProjectCard"

# Update snapshots
npm test -- --updateSnapshot
```

### Continuous Integration

Tests run automatically on:

- Every commit to `main` or `develop`
- Every pull request
- Manual workflow dispatch

See [GITHUB-ACTIONS-SETUP.md](../deployment/GITHUB-ACTIONS-SETUP.md) for CI/CD configuration.

---

## Writing Unit Tests

### Test Structure (AAA Pattern)

**Arrange-Act-Assert:**

```typescript
describe("Component or Function", () => {
  it("should do expected behavior", () => {
    // Arrange: Set up test data and dependencies
    const input = "test input";
    const expected = "expected output";

    // Act: Execute the code being tested
    const result = functionUnderTest(input);

    // Assert: Verify the result
    expect(result).toBe(expected);
  });
});
```

### Testing React Components

```typescript
// __tests__/unit/components/ProjectCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProjectCard } from '@/components/admin/ProjectCard';

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    title: 'Test Project',
    status: 'ACTIVE',
    clientName: 'Test Client',
    budget: 5000,
    deadline: '2026-12-31',
  };

  it('renders project information correctly', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<ProjectCard project={mockProject} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('article'));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockProject);
  });

  it('applies correct status styling', () => {
    render(<ProjectCard project={mockProject} />);

    const statusBadge = screen.getByText('ACTIVE');
    expect(statusBadge).toHaveClass('status-active');
  });

  it('handles missing optional fields gracefully', () => {
    const projectWithoutBudget = { ...mockProject, budget: null };
    render(<ProjectCard project={projectWithoutBudget} />);

    expect(screen.queryByText('$')).not.toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<ProjectCard project={mockProject} loading={true} />);

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });
});
```

### Testing Utility Functions

```typescript
// __tests__/unit/lib/formatters.test.ts
import { formatCurrency, formatDate, truncateText } from "@/lib/formatters";

describe("formatters", () => {
  describe("formatCurrency", () => {
    it("formats positive amounts with USD symbol", () => {
      expect(formatCurrency(1000)).toBe("$1,000.00");
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("handles zero correctly", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("handles negative amounts", () => {
      expect(formatCurrency(-500)).toBe("-$500.00");
    });

    it("rounds to 2 decimal places", () => {
      expect(formatCurrency(123.456)).toBe("$123.46");
      expect(formatCurrency(123.454)).toBe("$123.45");
    });

    it("adds thousand separators", () => {
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
    });
  });

  describe("formatDate", () => {
    it("formats date in YYYY-MM-DD format", () => {
      const date = new Date("2026-01-15T12:00:00Z");
      expect(formatDate(date)).toBe("2026-01-15");
    });

    it("handles different timezones consistently", () => {
      const date = new Date("2026-01-15");
      expect(formatDate(date)).toBe("2026-01-15");
    });

    it("throws error for invalid dates", () => {
      expect(() => formatDate(new Date("invalid"))).toThrow();
    });
  });

  describe("truncateText", () => {
    it("truncates text longer than limit", () => {
      const text = "This is a very long text that should be truncated";
      expect(truncateText(text, 20)).toBe("This is a very long...");
    });

    it("returns original text if shorter than limit", () => {
      const text = "Short text";
      expect(truncateText(text, 20)).toBe("Short text");
    });

    it("handles exact length correctly", () => {
      const text = "Exactly 20 chars!!!"; // 19 chars
      expect(truncateText(text, 20)).toBe("Exactly 20 chars!!!");
    });

    it("uses custom suffix if provided", () => {
      const text = "Long text here";
      expect(truncateText(text, 8, "…")).toBe("Long te…");
    });
  });
});
```

### Testing API Routes (Next.js)

```typescript
// __tests__/unit/api/projects.test.ts
import { GET, POST } from "@/app/api/admin/projects/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Mock Prisma
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("GET /api/admin/projects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns list of projects", async () => {
    const mockProjects = [
      { id: "1", title: "Project 1", status: "ACTIVE" },
      { id: "2", title: "Project 2", status: "PLANNING" },
    ];

    (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

    const request = new NextRequest("http://localhost:3000/api/admin/projects");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].title).toBe("Project 1");
    expect(prisma.project.findMany).toHaveBeenCalledTimes(1);
  });

  it("filters projects by status", async () => {
    const mockProjects = [
      { id: "1", title: "Active Project", status: "ACTIVE" },
    ];

    (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

    const request = new NextRequest(
      "http://localhost:3000/api/admin/projects?status=ACTIVE",
    );
    const response = await GET(request);

    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  });

  it("handles database errors gracefully", async () => {
    (prisma.project.findMany as jest.Mock).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const request = new NextRequest("http://localhost:3000/api/admin/projects");
    const response = await GET(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toHaveProperty("error");
  });
});

describe("POST /api/admin/projects", () => {
  it("creates project with valid data", async () => {
    const validProject = {
      title: "New Project",
      clientName: "Client Name",
      clientEmail: "client@example.com",
      status: "PLANNING",
      budget: 10000,
    };

    (prisma.project.create as jest.Mock).mockResolvedValue({
      id: "1",
      ...validProject,
      createdAt: new Date(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/projects",
      {
        method: "POST",
        body: JSON.stringify(validProject),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe("1");
    expect(data.title).toBe("New Project");
    expect(prisma.project.create).toHaveBeenCalledWith({
      data: validProject,
    });
  });

  it("validates required fields", async () => {
    const invalidProject = {
      title: "New Project",
      // Missing clientName and clientEmail
    };

    const request = new NextRequest(
      "http://localhost:3000/api/admin/projects",
      {
        method: "POST",
        body: JSON.stringify(invalidProject),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("error");
  });
});
```

---

## Integration Tests

### Database Integration Tests

```typescript
// __tests__/integration/projects-workflow.integration.test.ts
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  testPrisma,
} from "../helpers/test-db";
import { createTestProject, createTestQuote } from "../helpers/test-factories";

describe("Projects Workflow Integration", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Project CRUD Operations", () => {
    it("creates project with all fields", async () => {
      const projectData = {
        title: "Integration Test Project",
        clientName: "Test Client",
        clientEmail: "client@example.com",
        description: "Test description",
        status: "PLANNING",
        budget: 50000,
      };

      const project = await testPrisma.project.create({
        data: projectData,
      });

      expect(project.id).toBeDefined();
      expect(project.title).toBe("Integration Test Project");
      expect(project.status).toBe("PLANNING");
      expect(project.budget).toEqual(50000);
    });

    it("retrieves projects with filters", async () => {
      // Create multiple projects
      await createTestProject({ status: "ACTIVE" });
      await createTestProject({ status: "ACTIVE" });
      await createTestProject({ status: "COMPLETE" });

      const activeProjects = await testPrisma.project.findMany({
        where: { status: "ACTIVE", deletedAt: null },
      });

      expect(activeProjects).toHaveLength(2);
    });

    it("updates project status", async () => {
      const project = await createTestProject({ status: "PLANNING" });

      const updated = await testPrisma.project.update({
        where: { id: project.id },
        data: { status: "IN_PROGRESS" },
      });

      expect(updated.status).toBe("IN_PROGRESS");
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        project.updatedAt.getTime(),
      );
    });

    it("soft deletes projects", async () => {
      const project = await createTestProject();

      await testPrisma.project.update({
        where: { id: project.id },
        data: { deletedAt: new Date() },
      });

      const deletedProject = await testPrisma.project.findUnique({
        where: { id: project.id },
      });

      expect(deletedProject?.deletedAt).not.toBeNull();

      // Verify soft delete excludes from findMany
      const activeProjects = await testPrisma.project.findMany({
        where: { deletedAt: null },
      });

      expect(activeProjects.find((p) => p.id === project.id)).toBeUndefined();
    });
  });

  describe("Quote Conversion Workflow", () => {
    it("converts quote to project atomically", async () => {
      const quote = await createTestQuote({
        name: "Client Name",
        email: "client@example.com",
        description: "Need a website",
        status: "PENDING",
      });

      // Transaction: Create project + Update quote
      const result = await testPrisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            title: `Project: ${quote.name}`,
            clientName: quote.name,
            clientEmail: quote.email,
            description: quote.description,
            status: "PLANNING",
          },
        });

        await tx.quote.update({
          where: { id: quote.id },
          data: {
            status: "CONVERTED",
            projectId: project.id,
          },
        });

        return project;
      });

      const updatedQuote = await testPrisma.quote.findUnique({
        where: { id: quote.id },
      });

      expect(updatedQuote?.status).toBe("CONVERTED");
      expect(updatedQuote?.projectId).toBe(result.id);
    });

    it("rolls back on error", async () => {
      const quote = await createTestQuote();

      await expect(
        testPrisma.$transaction(async (tx) => {
          await tx.project.create({
            data: {
              title: "Test",
              clientName: "Test",
              clientEmail: "test@example.com",
              status: "PLANNING",
            },
          });

          // Simulate error
          throw new Error("Transaction error");
        }),
      ).rejects.toThrow("Transaction error");

      // Verify no project was created
      const projectCount = await testPrisma.project.count();
      expect(projectCount).toBe(0);
    });
  });
});
```

### Test Database Helpers

```typescript
// __tests__/helpers/test-db.ts
import { PrismaClient } from "@prisma/client";

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export async function setupTestDatabase() {
  await testPrisma.$connect();
  await cleanDatabase();
}

export async function teardownTestDatabase() {
  await cleanDatabase();
  await testPrisma.$disconnect();
}

export async function cleanDatabase() {
  // Delete in reverse dependency order
  const tablenames = [
    "Proposal",
    "TimeEntry",
    "DiscordMessage",
    "Quote",
    "Project",
    "MonitoringEvent",
    "MonitoringAlert",
    "ServiceHealthCheck",
    "User",
    "ApiKey",
    "Webhook",
    "SystemConfig",
    "QuoteRequest",
    "ContactMessage",
  ];

  for (const tablename of tablenames) {
    await testPrisma.$executeRawUnsafe(
      `TRUNCATE TABLE "${tablename}" CASCADE;`,
    );
  }
}
```

### Test Factories

```typescript
// __tests__/helpers/test-factories.ts
import { testPrisma } from "./test-db";
import type { ProjectStatus, QuoteStatus } from "@prisma/client";

export async function createTestProject(overrides: Partial<any> = {}) {
  return testPrisma.project.create({
    data: {
      title: "Test Project",
      clientName: "Test Client",
      clientEmail: "client@example.com",
      status: "PLANNING" as ProjectStatus,
      ...overrides,
    },
  });
}

export async function createTestQuote(overrides: Partial<any> = {}) {
  return testPrisma.quote.create({
    data: {
      name: "Test Client",
      email: "client@example.com",
      projectType: "web-app",
      description: "Test quote description",
      status: "PENDING" as QuoteStatus,
      ...overrides,
    },
  });
}

export async function createTestUser(overrides: Partial<any> = {}) {
  return testPrisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      ...overrides,
    },
  });
}

export async function createTestTimeEntry(
  projectId: string,
  overrides: Partial<any> = {},
) {
  return testPrisma.timeEntry.create({
    data: {
      projectId,
      startedAt: new Date(),
      durationMinutes: 60,
      loggedVia: "manual",
      ...overrides,
    },
  });
}
```

---

## End-to-End Tests (Playwright)

### Page Object Model

```typescript
// e2e/pages/admin-dashboard.ts
import { Page, expect } from "@playwright/test";

export class AdminDashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/admin");
  }

  async login(email: string) {
    // Mock Google OAuth for E2E tests
    await this.page.evaluate((email) => {
      localStorage.setItem("mock-user", JSON.stringify({ email }));
    }, email);

    await this.page.goto("/admin");
    await expect(this.page).toHaveURL("/admin");
  }

  async navigateToProjects() {
    await this.page.click('nav a:has-text("Projects")');
    await expect(this.page).toHaveURL("/admin/projects");
  }

  async createProject(data: {
    title: string;
    clientName: string;
    clientEmail: string;
  }) {
    await this.page.click('button:has-text("New Project")');
    await this.page.fill('[name="title"]', data.title);
    await this.page.fill('[name="clientName"]', data.clientName);
    await this.page.fill('[name="clientEmail"]', data.clientEmail);
    await this.page.click('button:has-text("Create")');

    await expect(this.page.locator(`text=${data.title}`)).toBeVisible();
  }

  async getProjectCount(): Promise<number> {
    const projects = await this.page
      .locator('[data-testid="project-card"]')
      .count();
    return projects;
  }

  async searchProjects(query: string) {
    await this.page.fill('[data-testid="search-input"]', query);
    await this.page.keyboard.press("Enter");
  }

  async filterByStatus(status: string) {
    await this.page.selectOption('[name="status"]', status);
    await this.page.waitForLoadState("networkidle");
  }
}
```

### E2E Test Suite

```typescript
// e2e/admin.spec.ts
import { test, expect } from "@playwright/test";
import { AdminDashboardPage } from "./pages/admin-dashboard";

test.describe("Admin Dashboard", () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.login(process.env.ADMIN_EMAIL!);
  });

  test("displays dashboard with analytics", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Dashboard");
    await expect(page.locator('[data-testid="analytics-card"]')).toBeVisible();
  });

  test("creates a new project", async () => {
    await dashboardPage.navigateToProjects();
    await dashboardPage.createProject({
      title: "E2E Test Project",
      clientName: "E2E Client",
      clientEmail: "e2e@example.com",
    });

    const count = await dashboardPage.getProjectCount();
    expect(count).toBeGreaterThan(0);
  });

  test("filters projects by status", async ({ page }) => {
    await dashboardPage.navigateToProjects();
    await dashboardPage.filterByStatus("ACTIVE");

    const projects = page.locator('[data-testid="project-card"]');
    const count = await projects.count();

    for (let i = 0; i < count; i++) {
      const status = await projects.nth(i).locator(".status").textContent();
      expect(status).toBe("ACTIVE");
    }
  });

  test("searches for projects", async ({ page }) => {
    await dashboardPage.navigateToProjects();
    await dashboardPage.searchProjects("Test Project");

    await expect(page.locator('[data-testid="project-card"]')).toBeVisible();
  });
});
```

### Performance Testing

```typescript
// e2e/performance.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Performance", () => {
  test("homepage loads within 2 seconds", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test("API response time under 500ms", async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get("/api/health");
    const responseTime = Date.now() - startTime;

    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(500);
  });

  test("initial JavaScript bundle size", async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType("resource");
      const jsResources = resources.filter((r) => r.name.endsWith(".js"));
      return jsResources.reduce((sum, r: any) => sum + r.transferSize, 0);
    });

    // Target: < 500KB first load JS
    expect(metrics).toBeLessThan(500 * 1024);
  });
});
```

### Accessibility Testing

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y } from "axe-playwright";

test.describe("Accessibility", () => {
  test("homepage is accessible", async ({ page }) => {
    await page.goto("/");
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test("admin dashboard is accessible", async ({ page }) => {
    await page.goto("/admin");
    await injectAxe(page);
    await checkA11y(page);
  });

  test("keyboard navigation works", async ({ page }) => {
    await page.goto("/");

    // Tab through navigation
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();

    // Enter to activate link
    await page.keyboard.press("Enter");
    await expect(page).not.toHaveURL("/");
  });

  test("screen reader landmarks", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });
});
```

---

## Mocking Strategies

### Mocking Prisma

```typescript
// __tests__/mocks/prisma.ts
export const mockPrisma = {
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  quote: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

jest.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));
```

### Mocking External APIs

```typescript
// __tests__/mocks/fetch.ts
global.fetch = jest.fn((url: string) => {
  if (url.includes("/api/projects")) {
    return Promise.resolve({
      ok: true,
      json: async () => [{ id: "1", title: "Mock Project" }],
    } as Response);
  }

  if (url.includes("/api/health")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({ status: "ok" }),
    } as Response);
  }

  return Promise.reject(new Error("Unknown URL"));
});
```

### Mocking Discord.js

```typescript
// __tests__/mocks/discord.ts
export const mockInteraction = {
  commandName: "test-command",
  user: { id: "123", username: "testuser", tag: "testuser#0001" },
  guild: { id: "456" },
  channel: { id: "789" },
  deferReply: jest.fn(),
  reply: jest.fn(),
  editReply: jest.fn(),
  followUp: jest.fn(),
  options: {
    getString: jest.fn(),
    getInteger: jest.fn(),
    getBoolean: jest.fn(),
  },
  replied: false,
  deferred: false,
};

export function createMockInteraction(overrides = {}) {
  return {
    ...mockInteraction,
    ...overrides,
  };
}
```

---

## Best Practices

### 1. Test Isolation

```typescript
// ✅ Good: Each test is independent
describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cleanDatabase();
  });

  it("test 1", () => {
    // Test-specific setup
  });

  it("test 2", () => {
    // Test-specific setup
  });
});

// ❌ Bad: Tests depend on each other
describe("UserService", () => {
  let user;

  it("creates user", () => {
    user = createUser(); // Other tests depend on this
  });

  it("updates user", () => {
    updateUser(user); // Fails if first test fails
  });
});
```

### 2. Descriptive Test Names

```typescript
// ✅ Good: Clear what is being tested
it("returns 404 when project does not exist", () => {});
it("throws validation error when email is invalid", () => {});

// ❌ Bad: Vague test names
it("works correctly", () => {});
it("test 1", () => {});
```

### 3. Test One Thing at a Time

```typescript
// ✅ Good: Single responsibility
it("validates email format", () => {
  expect(validateEmail("invalid")).toBe(false);
});

it("validates email length", () => {
  expect(validateEmail("a".repeat(300) + "@example.com")).toBe(false);
});

// ❌ Bad: Testing multiple things
it("validates email", () => {
  expect(validateEmail("invalid")).toBe(false);
  expect(validateEmail("a".repeat(300) + "@example.com")).toBe(false);
  expect(validateEmail("")).toBe(false);
  expect(validateEmail("valid@example.com")).toBe(true);
});
```

### 4. Avoid Test Code Duplication

```typescript
// ✅ Good: Use beforeEach or test factories
beforeEach(() => {
  mockData = createMockProject();
});

// ✅ Good: Extract common setup
function setupProjectTest() {
  const project = createTestProject();
  const quote = createTestQuote({ projectId: project.id });
  return { project, quote };
}
```

### 5. Test Edge Cases

```typescript
describe("divide", () => {
  it("divides positive numbers", () => {
    expect(divide(10, 2)).toBe(5);
  });

  it("divides negative numbers", () => {
    expect(divide(-10, 2)).toBe(-5);
  });

  it("throws error when dividing by zero", () => {
    expect(() => divide(10, 0)).toThrow("Division by zero");
  });

  it("handles decimal results", () => {
    expect(divide(10, 3)).toBeCloseTo(3.33, 2);
  });
});
```

---

## Continuous Integration

Tests run automatically on every push and pull request via GitHub Actions.

**See:** [GITHUB-ACTIONS-SETUP.md](../deployment/GITHUB-ACTIONS-SETUP.md)

---

## Related Documentation

- **[Testing Principles](../../trinity/knowledge-base/TESTING-PRINCIPLES.md)** - Trinity testing philosophy
- **[Testing CLAUDE.md](../../__tests__/CLAUDE.md)** - Test-specific rules
- **[GitHub Actions](../deployment/GITHUB-ACTIONS-SETUP.md)** - CI/CD setup

---

**Last Updated:** 2026-01-07
**Jest Version:** 30.1.3
**Playwright Version:** 1.55.0
**Test Coverage Target:** ≥80%
**Maintained by:** Sunny Stack Development Team
