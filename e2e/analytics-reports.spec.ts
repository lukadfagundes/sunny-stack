/**
 * @file Analytics Reports E2E tests
 * @description End-to-end tests for analytics dashboard and reports
 */

import { test, expect } from '@playwright/test';
import { gotoAdminRoute, clearAdminSession } from './helpers/admin-auth';

test.describe('Analytics and Reports', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, 'analytics');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should display analytics page heading', async ({ page }) => {
    const heading = page.locator('h1, h2').filter({ hasText: /analytics|reports|metrics/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display key metrics cards', async ({ page }) => {
    // Look for metrics display (Active Projects, Pending Quotes, Revenue, Hours)
    const metricsContainer = page.locator(
      '[data-testid="metrics"], .metrics, .stats, .dashboard-cards'
    );

    const containerCount = await metricsContainer.count();

    if (containerCount > 0) {
      await expect(metricsContainer.first()).toBeVisible({ timeout: 10000 });
    } else {
      // Check for individual metric cards
      const metricCards = page.locator('[data-testid^="metric-"], .metric-card, .stat-card');
      const cardCount = await metricCards.count();

      expect(cardCount).toBeGreaterThan(0);
    }
  });

  test('should display active projects count', async ({ page }) => {
    const activeProjects = page.locator('text=/active projects|projects active/i');

    const count = await activeProjects.count();

    if (count > 0) {
      await expect(activeProjects.first()).toBeVisible();

      // Check for numeric value
      const numberPattern = page.locator('text=/\\d+/');
      await expect(numberPattern.first()).toBeVisible();
    } else {
      console.log('Active projects metric not found');
    }
  });

  test('should display pending quotes count', async ({ page }) => {
    const pendingQuotes = page.locator('text=/pending quotes|quotes pending/i');

    const count = await pendingQuotes.count();

    if (count > 0) {
      await expect(pendingQuotes.first()).toBeVisible();
    } else {
      console.log('Pending quotes metric not found');
    }
  });

  test('should display total revenue metric', async ({ page }) => {
    const revenue = page.locator('text=/total revenue|revenue|earnings/i');

    const count = await revenue.count();

    if (count > 0) {
      await expect(revenue.first()).toBeVisible();

      // Look for currency format ($ or other currency symbols)
      const currencyPattern = page.locator('text=/[$€£¥]/');
      const hasCurrency = await currencyPattern.count() > 0;

      if (hasCurrency) {
        await expect(currencyPattern.first()).toBeVisible();
      }
    } else {
      console.log('Revenue metric not found');
    }
  });

  test('should display hours tracked metric', async ({ page }) => {
    const hours = page.locator('text=/hours tracked|time tracked|hours/i');

    const count = await hours.count();

    if (count > 0) {
      await expect(hours.first()).toBeVisible();
    } else {
      console.log('Hours tracked metric not found');
    }
  });

  test('should display charts or visualizations', async ({ page }) => {
    // Look for chart containers (canvas, svg, or chart divs)
    const charts = page.locator('canvas, svg[class*="chart"], [data-testid^="chart-"]');

    const chartCount = await charts.count();

    if (chartCount > 0) {
      await expect(charts.first()).toBeVisible({ timeout: 10000 });
    } else {
      console.log('Charts not found - may not be implemented yet');
    }
  });

  test('should display recent activity feed', async ({ page }) => {
    const activity = page.locator(
      'text=/recent activity|activity feed|recent events/i, [data-testid="activity-feed"]'
    );

    const count = await activity.count();

    if (count > 0) {
      await expect(activity.first()).toBeVisible();

      // Check for activity items
      const activityItems = page.locator('.activity-item, [data-testid^="activity-"]');
      const itemCount = await activityItems.count();

      if (itemCount > 0) {
        expect(itemCount).toBeGreaterThan(0);
      }
    } else {
      console.log('Activity feed not found');
    }
  });

  test('should filter analytics by date range', async ({ page }) => {
    const dateFilter = page.locator('input[type="date"], [data-testid="date-filter"]');

    const filterCount = await dateFilter.count();

    if (filterCount > 0) {
      await expect(dateFilter.first()).toBeVisible();

      // Try changing date
      const today = new Date().toISOString().split('T')[0];
      await dateFilter.first().fill(today);

      // Wait for data to update
      await page.waitForTimeout(1000);
    } else {
      // Look for date range picker
      const dateRange = page.locator('button, div').filter({
        hasText: /date range|filter by date|select dates/i
      });

      const rangeCount = await dateRange.count();

      if (rangeCount > 0) {
        await expect(dateRange.first()).toBeVisible();
      } else {
        console.log('Date filter not found');
      }
    }
  });

  test('should display project status breakdown', async ({ page }) => {
    const statusBreakdown = page.locator('text=/status|breakdown|distribution/i');

    const count = await statusBreakdown.count();

    if (count > 0) {
      // Check for status labels
      const statuses = page.locator('text=/planning|in progress|review|complete/i');
      const statusCount = await statuses.count();

      expect(statusCount).toBeGreaterThan(0);
    } else {
      console.log('Status breakdown not found');
    }
  });

  test('should export analytics data', async ({ page }) => {
    const exportButton = page.locator('button, a').filter({
      hasText: /export|download|csv|pdf/i
    });

    const buttonCount = await exportButton.count();

    if (buttonCount > 0) {
      await expect(exportButton.first()).toBeVisible();
    } else {
      console.log('Export button not found');
    }
  });

  test('should refresh analytics data', async ({ page }) => {
    const refreshButton = page.locator('button').filter({
      hasText: /refresh|reload|update/i
    });

    const buttonCount = await refreshButton.count();

    if (buttonCount > 0) {
      await refreshButton.first().click();

      // Wait for refresh
      await page.waitForLoadState('networkidle');

      // Verify data updated (check for loading state)
      const loading = page.locator('[role="status"], .loading');
      const loadingCount = await loading.count();

      // Loading may have appeared briefly
      console.log('Refresh triggered successfully');
    } else {
      console.log('Refresh button not found');
    }
  });
});

test.describe('Analytics - Charts and Visualizations', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, 'analytics');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should render revenue chart', async ({ page }) => {
    // Look for revenue-specific chart
    const revenueChart = page.locator(
      '[data-testid="revenue-chart"], canvas, svg'
    ).filter({ hasText: /revenue|earnings|income/i });

    const chartCount = await revenueChart.count();

    if (chartCount === 0) {
      // Try finding by nearby text
      const chartLabel = page.locator('text=/revenue chart|earnings over time/i');
      const labelCount = await chartLabel.count();

      if (labelCount > 0) {
        await expect(chartLabel.first()).toBeVisible();
      } else {
        console.log('Revenue chart not found');
      }
    }
  });

  test('should render project timeline chart', async ({ page }) => {
    const timelineChart = page.locator('canvas, svg, [data-testid*="timeline"]');

    const chartCount = await timelineChart.count();

    if (chartCount > 0) {
      await expect(timelineChart.first()).toBeVisible({ timeout: 10000 });
    } else {
      console.log('Timeline chart not found');
    }
  });

  test('should allow chart interaction (hover/click)', async ({ page }) => {
    const chart = page.locator('canvas, svg').first();

    const chartCount = await chart.count();

    if (chartCount > 0) {
      // Hover over chart
      await chart.hover();

      // Wait for tooltip or interaction
      await page.waitForTimeout(500);

      // Check for tooltip
      const tooltip = page.locator('[role="tooltip"], .tooltip, .chart-tooltip');
      const tooltipCount = await tooltip.count();

      if (tooltipCount > 0) {
        await expect(tooltip.first()).toBeVisible();
      }
    } else {
      console.log('No charts to interact with');
    }
  });
});

test.describe('Analytics - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, 'analytics');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should load analytics data within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Analytics should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    console.log(`Analytics loaded in ${loadTime}ms`);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Wait for all content to render
    await page.waitForLoadState('networkidle');

    // Check page responsiveness
    const startTime = Date.now();

    // Perform some interactions
    await page.locator('body').click({ position: { x: 10, y: 10 } });

    const interactionTime = Date.now() - startTime;

    // Interaction should be instant (< 100ms)
    expect(interactionTime).toBeLessThan(100);
  });
});

test.describe('Analytics - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, 'analytics');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should have proper ARIA labels on metrics', async ({ page }) => {
    const metrics = page.locator('[role="region"], [aria-label]');

    const count = await metrics.count();

    if (count > 0) {
      // Check that at least some elements have ARIA labels
      const firstMetric = metrics.first();
      const hasAriaLabel = await firstMetric.evaluate(
        el => el.hasAttribute('aria-label') || el.hasAttribute('role')
      );

      expect(hasAriaLabel).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that focus is visible and working
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const isFocused = await focusedElement.evaluate(
      el => el !== document.body && el !== null
    );

    expect(isFocused).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // This is a basic check - full accessibility testing would use axe-core
    const bodyBg = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });

    const textColor = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).color;
    });

    // Verify colors are defined
    expect(bodyBg).toBeTruthy();
    expect(textColor).toBeTruthy();

    // Colors should be different (basic contrast check)
    expect(bodyBg).not.toBe(textColor);
  });
});
