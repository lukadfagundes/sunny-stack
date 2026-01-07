# Advanced Testing Patterns

This guide covers advanced testing patterns used in sunny-stack, including integration testing strategies, mocking complex scenarios, authentication testing, and performance testing.

## Table of Contents

- [Integration Testing Strategies](#integration-testing-strategies)
- [Mocking Complex Scenarios](#mocking-complex-scenarios)
- [Testing Authentication Flows](#testing-authentication-flows)
- [Testing External API Integrations](#testing-external-api-integrations)
- [Performance Testing](#performance-testing)
- [Visual Regression Testing](#visual-regression-testing)

---

## Integration Testing Strategies

### Understanding Integration Tests

Integration tests verify that multiple components work together correctly. They test real database interactions, API routes, and business logic.

### Pattern: Test Database Setup

```ts
// __tests__/helpers/test-db.ts (exists in codebase)
import { PrismaClient } from "@prisma/client";

// Separate Prisma instance for tests
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
    },
  },
});

/**
 * Clean database before each test
 */
export async function clearDatabase() {
  const tables = [
    "TimeEntry",
    "Proposal",
    "Quote",
    "Project",
    "User",
    "ApiKey",
  ];

  for (const table of tables) {
    await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
}

/**
 * Disconnect after all tests
 */
export async function disconnectDatabase() {
  await testPrisma.$disconnect();
}
```

```ts
// Usage in test file
import {
  testPrisma,
  clearDatabase,
  disconnectDatabase,
} from "../helpers/test-db";

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});
```

### Pattern: Test Data Factories

```ts
// __tests__/helpers/test-factories.ts (exists in codebase)
import { ProjectStatus, QuoteStatus } from "@prisma/client";
import { testPrisma } from "./test-db";

export async function createTestProject(overrides = {}) {
  return testPrisma.project.create({
    data: {
      title: "Test Project",
      description: "Test project description",
      clientName: "Test Client",
      clientEmail: "client@example.com",
      status: ProjectStatus.PLANNING,
      ...overrides,
    },
  });
}

export async function createTestQuote(overrides = {}) {
  return testPrisma.quote.create({
    data: {
      name: "Test Client",
      email: "client@example.com",
      company: "Test Company",
      projectType: "Web Application",
      budgetRange: "10k-25k",
      timeline: "3 months",
      description: "Test quote description",
      requirements: "Test requirements",
      status: QuoteStatus.PENDING,
      ...overrides,
    },
  });
}

export async function createTestUser(overrides = {}) {
  const uniqueGoogleId = `google_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  return testPrisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      googleId: uniqueGoogleId,
      ...overrides,
    },
  });
}
```

### Pattern: Integration Test Example

```ts
// __tests__/integration/quote-to-project.test.ts
import { testPrisma, clearDatabase } from "../helpers/test-db";
import { createTestQuote } from "../helpers/test-factories";
import { convertQuoteToProject } from "@/lib/services/quote-service";

describe("Quote to Project Conversion", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("should convert pending quote to project", async () => {
    // Arrange
    const quote = await createTestQuote({
      status: "PENDING",
    });

    // Act
    const project = await convertQuoteToProject(quote.id);

    // Assert
    expect(project).toBeDefined();
    expect(project.title).toContain(quote.company);
    expect(project.clientEmail).toBe(quote.email);

    // Verify quote was updated
    const updatedQuote = await testPrisma.quote.findUnique({
      where: { id: quote.id },
    });
    expect(updatedQuote?.status).toBe("CONVERTED");
    expect(updatedQuote?.projectId).toBe(project.id);

    // Verify proposal was created
    const proposal = await testPrisma.proposal.findFirst({
      where: { quoteId: quote.id },
    });
    expect(proposal).toBeDefined();
    expect(proposal?.projectId).toBe(project.id);
  });

  it("should throw error if quote is not pending", async () => {
    const quote = await createTestQuote({
      status: "CONVERTED",
    });

    await expect(convertQuoteToProject(quote.id)).rejects.toThrow(
      "Quote is not pending",
    );
  });

  it("should rollback transaction on error", async () => {
    const quote = await createTestQuote();

    // Mock error during project creation
    jest
      .spyOn(testPrisma.project, "create")
      .mockRejectedValueOnce(new Error("Database error"));

    await expect(convertQuoteToProject(quote.id)).rejects.toThrow();

    // Verify quote was not updated (transaction rolled back)
    const unchangedQuote = await testPrisma.quote.findUnique({
      where: { id: quote.id },
    });
    expect(unchangedQuote?.status).toBe("PENDING");
  });
});
```

---

## Mocking Complex Scenarios

### Pattern: Mocking Prisma Client

```ts
// __tests__/unit/project-service.test.ts
import { prismaMock } from "../helpers/prisma-mock";
import { getProjectById } from "@/lib/services/project-service";

jest.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

describe("Project Service", () => {
  it("should return project by id", async () => {
    const mockProject = {
      id: "1",
      title: "Test Project",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.project.findUnique.mockResolvedValue(mockProject);

    const result = await getProjectById("1");

    expect(result).toEqual(mockProject);
    expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });

  it("should throw error if project not found", async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);

    await expect(getProjectById("999")).rejects.toThrow("Project not found");
  });
});
```

### Pattern: Mocking External APIs

```ts
// __tests__/unit/email-service.test.ts
import { sendQuoteConfirmationEmail } from "@/lib/services/email-service";

// Mock Resend
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: "email-123" }),
    },
  })),
}));

describe("Email Service", () => {
  it("should send quote confirmation email", async () => {
    const result = await sendQuoteConfirmationEmail({
      to: "client@example.com",
      quoteName: "John Doe",
      projectType: "Web Application",
    });

    expect(result.id).toBe("email-123");
  });
});
```

### Pattern: Mocking Discord.js Client

```ts
// __tests__/unit/discord-bot/commands/ping.test.ts
import { ChatInputCommandInteraction } from "discord.js";
import { PingCommand } from "@/bot/commands/ping";

describe("Ping Command", () => {
  it("should reply with pong", async () => {
    // Create mock interaction
    const mockInteraction = {
      followUp: jest.fn().mockResolvedValue(undefined),
      user: { id: "user123" },
      commandName: "ping",
    } as unknown as ChatInputCommandInteraction;

    const command = new PingCommand();
    await command.run(mockInteraction);

    expect(mockInteraction.followUp).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("Pong!"),
      }),
    );
  });
});
```

### Pattern: Mocking File System

```ts
// __tests__/unit/pdf-generator.test.ts
import { generateProposalPDF } from "@/lib/services/pdf-generator";

jest.mock("fs/promises", () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue("mock-pdf-content"),
}));

describe("PDF Generator", () => {
  it("should generate proposal PDF", async () => {
    const result = await generateProposalPDF({
      title: "Test Proposal",
      client: "Test Client",
    });

    expect(result).toBeDefined();
    expect(result.path).toContain(".pdf");
  });
});
```

---

## Testing Authentication Flows

### Pattern: Testing Protected Routes

```ts
// __tests__/integration/api/protected-routes.test.ts
import { NextRequest } from "next/server";
import { GET as getProjects } from "@/app/api/admin/projects/route";

// Mock NextAuth session
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from "next-auth";

describe("Protected API Routes", () => {
  it("should return 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/admin/projects");
    const response = await getProjects(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toContain("Unauthorized");
  });

  it("should return projects when authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        email: "admin@example.com",
        name: "Admin",
      },
    });

    const request = new NextRequest("http://localhost:3000/api/admin/projects");
    const response = await getProjects(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json)).toBe(true);
  });

  it("should return 403 for non-admin users", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        email: "user@example.com", // Not in ADMIN_EMAIL allowlist
        name: "User",
      },
    });

    const request = new NextRequest("http://localhost:3000/api/admin/projects");
    const response = await getProjects(request);

    expect(response.status).toBe(403);
  });
});
```

### Pattern: E2E Authentication Testing (Playwright)

```ts
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect to login when accessing admin page", async ({
    page,
  }) => {
    await page.goto("/admin");

    // Should redirect to sign-in page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("should allow admin to access admin dashboard", async ({ page }) => {
    // Login as admin (using test account)
    await page.goto("/auth/signin");

    // Click Google OAuth button
    await page.click('button:has-text("Sign in with Google")');

    // Mock OAuth flow or use test credentials
    // (This depends on your OAuth setup - you may need a test OAuth provider)

    // Verify redirect to admin dashboard
    await expect(page).toHaveURL("/admin");
    await expect(page.locator("h1")).toContainText("Admin Dashboard");
  });

  test("should sign out successfully", async ({ page }) => {
    // Assume already logged in
    await page.goto("/admin");

    // Click sign out
    await page.click('button:has-text("Sign Out")');

    // Should redirect to home page
    await expect(page).toHaveURL("/");
  });
});
```

---

## Testing External API Integrations

### Pattern: Mocking Fetch Requests

```ts
// __tests__/unit/github-service.test.ts
import { checkGitHubStatus } from "@/lib/services/github-service";

global.fetch = jest.fn();

describe("GitHub Service", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return operational status", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "operational" }),
    });

    const result = await checkGitHubStatus();

    expect(result.status).toBe("operational");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://www.githubstatus.com/api/v2/status.json",
    );
  });

  it("should handle API errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    await expect(checkGitHubStatus()).rejects.toThrow("Network error");
  });

  it("should handle non-200 responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(checkGitHubStatus()).rejects.toThrow();
  });
});
```

### Pattern: Using MSW (Mock Service Worker)

```ts
// __tests__/helpers/msw-handlers.ts
import { rest } from "msw";

export const handlers = [
  // Mock GitHub API
  rest.get("https://api.github.com/repos/:owner/:repo", (req, res, ctx) => {
    return res(
      ctx.json({
        name: "sunny-stack",
        stargazers_count: 100,
        forks_count: 10,
      }),
    );
  }),

  // Mock Vercel API
  rest.get("https://api.vercel.com/v1/deployments", (req, res, ctx) => {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return res(ctx.status(401), ctx.json({ error: "Unauthorized" }));
    }

    return res(
      ctx.json({
        deployments: [
          {
            uid: "dep_123",
            state: "READY",
            url: "sunny-stack.vercel.app",
          },
        ],
      }),
    );
  }),
];
```

```ts
// __tests__/helpers/msw-server.ts
import { setupServer } from "msw/node";
import { handlers } from "./msw-handlers";

export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

```ts
// Usage in test
import { server } from "../helpers/msw-server";
import { fetchGitHubRepoStats } from "@/lib/services/github-service";

describe("GitHub Integration", () => {
  it("should fetch repo stats", async () => {
    const stats = await fetchGitHubRepoStats("owner", "sunny-stack");

    expect(stats.stargazers_count).toBe(100);
    expect(stats.forks_count).toBe(10);
  });

  it("should handle API errors", async () => {
    // Override handler for this test
    server.use(
      rest.get("https://api.github.com/repos/:owner/:repo", (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: "Server error" }));
      }),
    );

    await expect(
      fetchGitHubRepoStats("owner", "sunny-stack"),
    ).rejects.toThrow();
  });
});
```

---

## Performance Testing

### Pattern: Load Testing with Artillery

```yaml
# artillery/load-test.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10 # 10 users per second
      name: "Warm up"
    - duration: 120
      arrivalRate: 50 # 50 users per second
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100 # 100 users per second
      name: "Peak load"

scenarios:
  - name: "Browse projects"
    flow:
      - get:
          url: "/api/projects"
      - think: 2 # Wait 2 seconds
      - get:
          url: "/api/projects/{{ $randomString() }}"
```

```bash
# Run load test
artillery run artillery/load-test.yml
```

### Pattern: Database Query Performance Testing

```ts
// __tests__/performance/database-queries.test.ts
import { testPrisma } from "../helpers/test-db";
import { createTestProject } from "../helpers/test-factories";

describe("Database Query Performance", () => {
  beforeAll(async () => {
    // Create 1000 test projects
    const projects = Array.from({ length: 1000 }, (_, i) => ({
      title: `Project ${i}`,
      description: `Description ${i}`,
      clientName: `Client ${i}`,
      clientEmail: `client${i}@example.com`,
      status: "ACTIVE",
    }));

    await testPrisma.project.createMany({ data: projects });
  });

  it("should fetch projects in under 100ms", async () => {
    const startTime = Date.now();

    const projects = await testPrisma.project.findMany({
      select: { id: true, title: true, status: true },
      take: 20,
    });

    const duration = Date.now() - startTime;

    expect(projects.length).toBe(20);
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it("should efficiently query with filters", async () => {
    const startTime = Date.now();

    const projects = await testPrisma.project.findMany({
      where: {
        status: "ACTIVE",
        title: { contains: "Project" },
      },
      take: 20,
    });

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(150);
  });
});
```

### Pattern: API Response Time Testing

```ts
// __tests__/performance/api-response.test.ts
import { NextRequest } from "next/server";
import { GET as getProjects } from "@/app/api/projects/route";

describe("API Response Performance", () => {
  it("should respond in under 500ms", async () => {
    const request = new NextRequest("http://localhost:3000/api/projects");

    const startTime = Date.now();
    const response = await getProjects(request);
    const duration = Date.now() - startTime;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  it("should handle concurrent requests efficiently", async () => {
    const requests = Array.from({ length: 10 }, () =>
      getProjects(new NextRequest("http://localhost:3000/api/projects")),
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;

    expect(responses.every((r) => r.status === 200)).toBe(true);
    expect(duration).toBeLessThan(1000); // All 10 requests in under 1 second
  });
});
```

---

## Visual Regression Testing

### Pattern: Playwright Visual Testing

```ts
// e2e/visual/homepage.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Visual Regression", () => {
  test("homepage should match screenshot", async ({ page }) => {
    await page.goto("/");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Take screenshot and compare
    await expect(page).toHaveScreenshot("homepage.png", {
      fullPage: true,
      threshold: 0.2, // 20% difference tolerance
    });
  });

  test("admin dashboard should match screenshot", async ({ page }) => {
    // Login first
    await page.goto("/auth/signin");
    // ... authenticate

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("admin-dashboard.png");
  });

  test("project details page should match screenshot", async ({ page }) => {
    await page.goto("/admin/projects/test-project-id");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("project-details.png");
  });
});
```

### Pattern: Component Visual Testing (Storybook)

```ts
// stories/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/Button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: "Click me",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Click me",
    variant: "secondary",
  },
};

export const Disabled: Story = {
  args: {
    children: "Click me",
    disabled: true,
  },
};
```

```ts
// .storybook/test-runner.ts
import type { TestRunnerConfig } from "@storybook/test-runner";
import { toMatchImageSnapshot } from "jest-image-snapshot";

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },
  async postRender(page, context) {
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot({
      customSnapshotIdentifier: context.id,
    });
  },
};

export default config;
```

---

## Best Practices Summary

### Integration Tests

- ✅ Use separate test database
- ✅ Clean database before each test
- ✅ Use test factories for data creation
- ✅ Test database transactions
- ❌ Don't share state between tests

### Mocking

- ✅ Mock external dependencies (APIs, file system)
- ✅ Use jest.mock for module mocks
- ✅ Use MSW for HTTP request mocking
- ✅ Reset mocks after each test
- ❌ Don't over-mock (test real code when possible)

### Authentication Testing

- ✅ Test both authenticated and unauthenticated states
- ✅ Test different permission levels
- ✅ Mock session for unit tests
- ✅ Use real auth flow in E2E tests
- ❌ Don't hardcode credentials in tests

### Performance Testing

- ✅ Set performance budgets
- ✅ Test database query performance
- ✅ Test API response times
- ✅ Test concurrent requests
- ❌ Don't run performance tests in CI without limits

### Visual Testing

- ✅ Use Playwright screenshot comparison
- ✅ Set reasonable thresholds (e.g., 0.2)
- ✅ Test across different viewports
- ✅ Wait for full page load before screenshots
- ❌ Don't test dynamic content (dates, random IDs)

---

## Related Documentation

- [Testing Principles](../../../trinity/knowledge-base/TESTING-PRINCIPLES.md)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Artillery Documentation](https://www.artillery.io/docs)

**Last Updated:** 2026-01-07
