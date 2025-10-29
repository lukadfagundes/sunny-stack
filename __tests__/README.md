# Test Suite Documentation

This directory contains the comprehensive test suite for the Sunny Stack admin platform.

## Directory Structure

```
__tests__/
├── helpers/
│   ├── test-db.ts          # Database setup/teardown utilities
│   └── test-factories.ts   # Test data factory functions
├── integration/
│   ├── admin-auth.integration.test.ts           # Auth flow tests (15 tests)
│   ├── projects-workflow.integration.test.ts    # Project CRUD tests (47 tests)
│   ├── quotes-workflow.integration.test.ts      # Quote management tests (38 tests)
│   ├── proposal-generation.integration.test.ts  # PDF generation tests (28 tests)
│   └── analytics.integration.test.ts            # Analytics tests (32 tests)
├── unit/                   # Existing unit tests (~241 tests)
└── lib/                    # Library-specific tests
```

## Integration Tests (~160 tests)

Integration tests verify that multiple components work together correctly, testing full workflows across layers.

### Prerequisites

1. **Database Setup**:

   ```bash
   # Set DATABASE_URL in .env
   DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"

   # Run migrations
   npx prisma migrate dev
   ```

2. **Environment Variables**:
   - `DATABASE_URL`: Test database connection string
   - `NODE_ENV`: Set to "test"

### Running Integration Tests

```bash
# Run all integration tests
npm test -- __tests__/integration

# Run specific test file
npm test -- admin-auth.integration.test.ts

# Run with coverage
npm test -- __tests__/integration --coverage

# Run in watch mode
npm test -- __tests__/integration --watch
```

### Test Coverage

| Test Suite          | Test Count | Coverage                                      |
| ------------------- | ---------- | --------------------------------------------- |
| Admin Auth          | 15         | User CRUD, auth errors                        |
| Projects Workflow   | 47         | Full CRUD, pagination, filtering, aggregation |
| Quotes Workflow     | 38         | Quote management, conversion, transactions    |
| Proposal Generation | 28         | PDF creation, email tracking, cascades        |
| Analytics           | 32         | Metrics, aggregations, performance            |

## Test Helpers

### test-db.ts

Provides database utilities for integration tests:

```typescript
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
} from "../helpers/test-db";

describe("My Integration Test", () => {
  beforeAll(async () => {
    await setupTestDatabase(); // Connect and clean
  });

  afterAll(async () => {
    await teardownTestDatabase(); // Clean and disconnect
  });

  beforeEach(async () => {
    await cleanDatabase(); // Clean between tests
  });
});
```

### test-factories.ts

Factory functions for creating test data:

```typescript
import { createTestProject, createTestQuote } from "../helpers/test-factories";

test("my test", async () => {
  const project = await createTestProject({
    title: "Custom Title",
    budget: 50000,
  });

  const quote = await createTestQuote({
    projectId: project.id,
    status: QuoteStatus.PENDING,
  });
});
```

## Writing New Integration Tests

### Template

```typescript
import {
  setupTestDatabase,
  teardownTestDatabase,
  testPrisma,
} from "../helpers/test-db";
import { createTestProject } from "../helpers/test-factories";

// Mock logger
jest.mock("@/lib/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("My Feature Integration", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean relevant tables
    await testPrisma.project.deleteMany();
  });

  test("should do something", async () => {
    // ARRANGE
    const project = await createTestProject();

    // ACT
    const result = await myFunction(project.id);

    // ASSERT
    expect(result).toBeDefined();
  });
});
```

## Best Practices

### 1. Follow AAA Pattern

```typescript
test("should update project", async () => {
  // ARRANGE: Set up test data
  const project = await createTestProject();

  // ACT: Perform action
  const updated = await updateProject(project.id, { title: "New Title" });

  // ASSERT: Verify result
  expect(updated.title).toBe("New Title");
});
```

### 2. Clean Data Between Tests

```typescript
beforeEach(async () => {
  // Clean in reverse dependency order
  await testPrisma.proposal.deleteMany();
  await testPrisma.quote.deleteMany();
  await testPrisma.project.deleteMany();
});
```

### 3. Test Atomic Transactions

```typescript
test("should rollback transaction on error", async () => {
  // Mock error during transaction
  const mockTransaction = jest.fn().mockRejectedValue(new Error("DB error"));
  testPrisma.$transaction = mockTransaction;

  // Verify transaction fails
  await expect(convertQuoteToProject("id")).rejects.toThrow("DB error");

  // Verify no partial changes
  const quote = await testPrisma.quote.findUnique({ where: { id: "id" } });
  expect(quote?.status).toBe(QuoteStatus.PENDING);
});
```

### 4. Test Edge Cases

```typescript
test("should handle null values", async () => {
  const project = await createTestProject({ budget: null });
  expect(project.budget).toBeNull();
});

test("should handle empty results", async () => {
  const projects = await testPrisma.project.findMany();
  expect(projects).toHaveLength(0);
});
```

### 5. Test Performance

```typescript
test("should handle large datasets efficiently", async () => {
  // Create 100 projects
  for (let i = 0; i < 100; i++) {
    await createTestProject({ title: `Project ${i}` });
  }

  // Measure query performance
  const startTime = Date.now();
  const count = await testPrisma.project.count();
  const duration = Date.now() - startTime;

  expect(count).toBe(100);
  expect(duration).toBeLessThan(1000); // Should complete in <1s
});
```

## Troubleshooting

### "Environment variable not found: DATABASE_URL"

**Solution**: Set `DATABASE_URL` in `.env` file:

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"
```

### "Prisma schema validation error"

**Solution**: Run migrations:

```bash
npx prisma migrate dev
```

### Tests hanging or timing out

**Solution**: Ensure database connection is closed:

```typescript
afterAll(async () => {
  await teardownTestDatabase();
});
```

### Foreign key constraint errors

**Solution**: Delete in correct order (reverse dependencies):

```typescript
await testPrisma.proposal.deleteMany(); // Delete child first
await testPrisma.quote.deleteMany(); // Then parent
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        run: npx prisma migrate deploy

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        run: npm test -- __tests__/integration --coverage
```

## Related Documentation

- [E2E Tests](../e2e/README.md) - Playwright E2E test suite
- [TESTING-PRINCIPLES.md](../trinity/knowledge-base/TESTING-PRINCIPLES.md) - TDD methodology
- [PHASE-2-GROUP-6-TESTING-COMPLETE.md](../PHASE-2-GROUP-6-TESTING-COMPLETE.md) - Implementation summary

---

**Last Updated**: 2025-10-29
**Maintained By**: Trinity Method SDK Team
**Test Coverage**: ~160 integration tests + ~241 unit tests = ~401 total tests
