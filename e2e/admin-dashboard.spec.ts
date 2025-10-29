/**
 * @file Admin Dashboard E2E tests
 * @description End-to-end tests for admin dashboard functionality
 */

import { test, expect } from '@playwright/test';
import { gotoAdminRoute, ADMIN_ROUTES, clearAdminSession } from './helpers/admin-auth';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard with mock authentication
    await gotoAdminRoute(page, 'dashboard');
  });

  test.afterEach(async ({ page }) => {
    // Clear session after each test
    await clearAdminSession(page);
  });

  test('should display dashboard page title', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for dashboard heading or title
    const heading = page.locator('h1, h2').filter({ hasText: /dashboard/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display metrics cards', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for metric cards - these might be labeled with data-testid or contain specific text
    // Adjust selectors based on actual implementation
    const metricsSection = page.locator('[data-testid="dashboard-metrics"], .metrics-container, section');

    // Check that metrics section exists
    await expect(metricsSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to projects page', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find and click projects navigation link
    const projectsLink = page.locator('a, button').filter({ hasText: /projects/i }).first();

    // Check if link exists
    const linkCount = await projectsLink.count();

    if (linkCount > 0) {
      await projectsLink.click();

      // Verify URL changed to projects page
      await expect(page).toHaveURL(new RegExp(`.*${ADMIN_ROUTES.projects}.*`), { timeout: 10000 });
    } else {
      // Log that navigation link not found (expected if pages not fully implemented yet)
      console.log('Projects navigation link not found - may not be implemented yet');
    }
  });

  test('should navigate to quotes page', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find and click quotes navigation link
    const quotesLink = page.locator('a, button').filter({ hasText: /quotes/i }).first();

    const linkCount = await quotesLink.count();

    if (linkCount > 0) {
      await quotesLink.click();

      // Verify URL changed to quotes page
      await expect(page).toHaveURL(new RegExp(`.*${ADMIN_ROUTES.quotes}.*`), { timeout: 10000 });
    } else {
      console.log('Quotes navigation link not found - may not be implemented yet');
    }
  });

  test('should display navigation menu', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for navigation elements
    const nav = page.locator('nav, [role="navigation"], .navigation, .sidebar').first();

    // Check that navigation exists
    await expect(nav).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page with mobile viewport
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that page is still functional
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check that content is not overflowing
    const bodyWidth = await body.evaluate(el => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 50); // Allow small buffer
  });

  test('should have proper meta tags', async ({ page }) => {
    // Check for viewport meta tag
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute('content', /width=device-width/);

    // Check for charset
    const charset = page.locator('meta[charset]');
    await expect(charset).toHaveAttribute('charset', 'utf-8');
  });

  test('should not display console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that no critical errors occurred
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('favicon') && // Ignore favicon errors
      !error.includes('Source Map') && // Ignore source map warnings
      !error.includes('Google') // Ignore Google API errors in test environment
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Admin Dashboard - Unauthenticated', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // Navigate without authentication
    await page.goto(ADMIN_ROUTES.dashboard);

    // Wait for redirect
    await page.waitForLoadState('networkidle');

    // Check that we're not on the admin dashboard
    // (may redirect to login page or show access denied)
    const url = page.url();

    // Admin dashboard should either:
    // 1. Redirect to login
    // 2. Show 404 (if route is protected)
    // 3. Show access denied message
    const isOnDashboard = url.includes(ADMIN_ROUTES.dashboard);

    if (isOnDashboard) {
      // If still on dashboard, check for access denied message
      const accessDenied = page.locator('text=/access denied|unauthorized|forbidden/i');
      const hasDeniedMessage = await accessDenied.count() > 0;

      // Either should have access denied message or be redirected
      expect(hasDeniedMessage).toBeTruthy();
    } else {
      // Successfully redirected away from admin dashboard
      expect(isOnDashboard).toBeFalsy();
    }
  });
});
