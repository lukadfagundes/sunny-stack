# E2E Test Suite Documentation

This directory contains end-to-end tests for the Sunny Stack admin platform using Playwright.

## Directory Structure

```
e2e/
├── helpers/
│   └── admin-auth.ts                    # Admin authentication utilities
├── admin-dashboard.spec.ts              # Dashboard tests (12 tests)
├── projects-management.spec.ts          # Projects CRUD tests (27 tests)
├── quotes-review.spec.ts                # Quotes management tests (15 tests)
├── proposal-generation.spec.ts          # PDF generation tests (13 tests)
└── analytics-reports.spec.ts            # Analytics tests (23 tests)
```

## E2E Tests (~90 tests)

End-to-end tests verify the complete user journey in a real browser, testing UI interactions, navigation, and workflows.

### Prerequisites

1. **Development Server**:

   ```bash
   npm run dev
   ```

2. **Environment Variables**:

   ```bash
   # Set in .env.local
   ADMIN_ROUTE_HASH="6bde736bb52aa194f1d69d140619b25cb9f9a42eb3acb1f6e7a502b375fda6ac"
   ```

3. **Playwright Installation**:
   ```bash
   npx playwright install
   ```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- admin-dashboard.spec.ts

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode (step through)
npm run test:e2e:debug

# Run on specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Run on mobile
npm run test:e2e -- --project="Mobile Chrome"
```

### Test Coverage

| Test Suite          | Test Count | Coverage                               |
| ------------------- | ---------- | -------------------------------------- |
| Admin Dashboard     | 12         | Page rendering, navigation, auth       |
| Projects Management | 27         | CRUD operations, filtering, pagination |
| Quotes Review       | 15         | Quote management, status changes       |
| Proposal Generation | 13         | PDF generation, email sending          |
| Analytics Reports   | 23         | Metrics, charts, accessibility         |

## Test Helpers

### admin-auth.ts

Provides authentication utilities for E2E tests:

```typescript
import {
  gotoAdminRoute,
  clearAdminSession,
  ADMIN_ROUTES,
} from "./helpers/admin-auth";

test("my test", async ({ page }) => {
  // Navigate with authentication
  await gotoAdminRoute(page, "dashboard");

  // Or navigate to specific route
  await gotoAdminRoute(page, "projects");

  // Clear session after test
  await clearAdminSession(page);
});
```

**Available Routes**:

- `dashboard`: `/admin-{HASH}/`
- `projects`: `/admin-{HASH}/projects`
- `quotes`: `/admin-{HASH}/quotes`
- `analytics`: `/admin-{HASH}/analytics`
- `reports`: `/admin-{HASH}/reports`

## Writing New E2E Tests

### Template

```typescript
import { test, expect } from "@playwright/test";
import { gotoAdminRoute, clearAdminSession } from "./helpers/admin-auth";

test.describe("My Feature", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, "dashboard");
    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test("should do something", async ({ page }) => {
    // Find element
    const button = page.locator("button").filter({ hasText: /click me/i });

    // Interact
    await button.click();

    // Verify
    await expect(page).toHaveURL(/\/success/);
  });
});
```

## Best Practices

### 1. Wait for Content to Load

```typescript
test("should display content", async ({ page }) => {
  // Wait for network to be idle
  await page.waitForLoadState("networkidle");

  // Wait for specific element
  await page.waitForSelector("h1", { timeout: 10000 });

  // Or use expect with timeout
  await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
});
```

### 2. Use Flexible Selectors

```typescript
// ✅ Good: Use text content or data attributes
const button = page.locator("button").filter({ hasText: /submit/i });
const card = page.locator('[data-testid="project-card"]');

// ❌ Avoid: Brittle CSS selectors
const button = page.locator(".btn.btn-primary.submit-btn");
```

### 3. Handle Optional Elements Gracefully

```typescript
test("should handle optional elements", async ({ page }) => {
  const button = page.locator("button").filter({ hasText: /create/i });

  // Check if element exists before interacting
  const buttonCount = await button.count();

  if (buttonCount > 0) {
    await button.click();
    // ... test interaction
  } else {
    console.log("Create button not found - may not be implemented yet");
  }
});
```

### 4. Test Multiple Scenarios

```typescript
test.describe("Form Validation", () => {
  test("should validate required fields", async ({ page }) => {
    // Try to submit without filling fields
    await page.click('button[type="submit"]');

    // Check for error messages
    const errors = page.locator('[role="alert"], .error');
    await expect(errors.first()).toBeVisible();
  });

  test("should submit with valid data", async ({ page }) => {
    // Fill form
    await page.fill('input[name="title"]', "Test Project");
    await page.fill('input[name="email"]', "test@example.com");

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    const success = page.locator("text=/success|created/i");
    await expect(success).toBeVisible();
  });
});
```

### 5. Test Responsiveness

```typescript
test("should work on mobile", async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  // Reload with mobile viewport
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Test mobile-specific interactions
  const mobileMenu = page.locator('[data-testid="mobile-menu"]');
  await expect(mobileMenu).toBeVisible();
});
```

### 6. Test Accessibility

```typescript
test("should be keyboard accessible", async ({ page }) => {
  // Tab through elements
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  // Check focus is visible
  const focused = await page.evaluateHandle(() => document.activeElement);
  const hasFocus = await focused.evaluate((el) => el !== document.body);

  expect(hasFocus).toBeTruthy();
});

test("should have proper ARIA labels", async ({ page }) => {
  const button = page.locator("button[aria-label]").first();
  await expect(button).toHaveAttribute("aria-label");
});
```

## Debugging Tests

### 1. Use Debug Mode

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:

- Step through test execution
- Inspect page state
- Modify selectors in real-time

### 2. Take Screenshots

```typescript
test("my test", async ({ page }) => {
  // Take screenshot at specific point
  await page.screenshot({ path: "screenshot.png" });

  // Take screenshot on failure (automatic in Playwright)
});
```

### 3. Use Console Logs

```typescript
test("my test", async ({ page }) => {
  // Log page URL
  console.log("Current URL:", page.url());

  // Log element count
  const count = await page.locator("button").count();
  console.log("Button count:", count);

  // Log element text
  const text = await page.locator("h1").textContent();
  console.log("Heading text:", text);
});
```

### 4. Pause Execution

```typescript
test("my test", async ({ page }) => {
  // Pause execution for debugging
  await page.pause();

  // Continue execution in inspector
});
```

## Common Patterns

### Clicking Elements

```typescript
// Click by text
await page.click("text=Submit");

// Click by role
await page.click('button[role="submit"]');

// Click with filter
await page
  .locator("button")
  .filter({ hasText: /submit/i })
  .click();

// Click nth element
await page.locator("button").nth(0).click();
```

### Filling Forms

```typescript
// Fill text input
await page.fill('input[name="email"]', "test@example.com");

// Select dropdown
await page.selectOption('select[name="status"]', "ACTIVE");

// Check checkbox
await page.check('input[type="checkbox"]');

// Upload file
await page.setInputFiles('input[type="file"]', "path/to/file.pdf");
```

### Waiting for Elements

```typescript
// Wait for element to be visible
await page.waitForSelector("h1", { state: "visible" });

// Wait for element to be hidden
await page.waitForSelector(".loading", { state: "hidden" });

// Wait for timeout
await page.waitForTimeout(1000);

// Wait for network idle
await page.waitForLoadState("networkidle");
```

### Assertions

```typescript
// Visibility
await expect(page.locator("h1")).toBeVisible();
await expect(page.locator(".loading")).toBeHidden();

// Text content
await expect(page.locator("h1")).toHaveText("Welcome");
await expect(page.locator("p")).toContainText("Hello");

// Attributes
await expect(page.locator("input")).toHaveAttribute("type", "email");

// URL
await expect(page).toHaveURL(/\/dashboard/);

// Count
await expect(page.locator("button")).toHaveCount(5);
```

## Troubleshooting

### "net::ERR_CONNECTION_REFUSED"

**Solution**: Ensure dev server is running:

```bash
npm run dev
```

### "Timeout waiting for selector"

**Solution**: Increase timeout or use better selector:

```typescript
await expect(element).toBeVisible({ timeout: 15000 });
```

### "Element is not clickable"

**Solution**: Wait for element to be ready:

```typescript
await page.waitForLoadState("networkidle");
await element.waitFor({ state: "visible" });
await element.click();
```

### Tests fail in CI but pass locally

**Solution**: Add wait for network idle:

```typescript
test.beforeEach(async ({ page }) => {
  await gotoAdminRoute(page, "dashboard");
  await page.waitForLoadState("networkidle");
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start dev server
        run: npm run dev &
        env:
          NODE_ENV: test

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Performance Tips

1. **Run tests in parallel**:

   ```typescript
   // playwright.config.ts
   workers: process.env.CI ? 1 : undefined; // Use all CPU cores locally
   ```

2. **Reduce test timeout**:

   ```typescript
   // playwright.config.ts
   timeout: 30000; // 30s instead of default 60s
   ```

3. **Skip unnecessary waits**:
   ```typescript
   // Don't wait for networkidle if not needed
   await page.goto("/dashboard"); // Fast
   // vs
   await page.goto("/dashboard");
   await page.waitForLoadState("networkidle"); // Slower
   ```

## Related Documentation

- [Integration Tests](../__tests__/README.md) - Jest integration test suite
- [Playwright Documentation](https://playwright.dev/) - Official Playwright docs
- [PHASE-2-GROUP-6-TESTING-COMPLETE.md](../PHASE-2-GROUP-6-TESTING-COMPLETE.md) - Implementation summary

---

**Last Updated**: 2025-10-29
**Maintained By**: Trinity Method SDK Team
**Test Coverage**: ~90 E2E tests across 5 test files
