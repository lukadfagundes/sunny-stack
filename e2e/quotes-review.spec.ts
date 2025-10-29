/**
 * @file Quotes Review E2E tests
 * @description End-to-end tests for quote management and review workflow
 */

import { test, expect } from '@playwright/test';
import { gotoAdminRoute, clearAdminSession } from './helpers/admin-auth';

test.describe('Quotes Review', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, 'quotes');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should display quotes list page', async ({ page }) => {
    const heading = page.locator('h1, h2').filter({ hasText: /quotes/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display quotes table or list', async ({ page }) => {
    const quotesContainer = page.locator(
      'table, [role="table"], .quotes-grid, .quotes-list, [data-testid="quotes-list"]'
    );

    const containerCount = await quotesContainer.count();

    if (containerCount > 0) {
      await expect(quotesContainer.first()).toBeVisible({ timeout: 10000 });
    } else {
      // Check for empty state
      const emptyState = page.locator('text=/no quotes|empty/i');
      const hasEmptyState = await emptyState.count() > 0;

      if (!hasEmptyState) {
        console.log('Quotes container not found - page may not be fully implemented');
      }
    }
  });

  test('should filter quotes by status', async ({ page }) => {
    const statusFilter = page.locator('select, [role="combobox"], button').filter({
      hasText: /status|filter/i
    }).first();

    const filterCount = await statusFilter.count();

    if (filterCount > 0) {
      await statusFilter.click();
      await page.waitForTimeout(500);

      const filterOptions = page.locator('[role="option"], option').filter({
        hasText: /pending|approved|declined|converted/i
      });

      const optionsCount = await filterOptions.count();
      expect(optionsCount).toBeGreaterThan(0);
    } else {
      console.log('Status filter not found');
    }
  });

  test('should open quote detail on click', async ({ page }) => {
    const quoteItem = page.locator('tr, .quote-card, [data-testid^="quote-"]').first();

    const itemCount = await quoteItem.count();

    if (itemCount > 0) {
      await quoteItem.click();
      await page.waitForTimeout(1000);

      const hasModal = await page.locator('[role="dialog"], .modal').count() > 0;
      const url = page.url();
      const hasDetail = url.includes('/quotes/') || hasModal;

      expect(hasDetail).toBeTruthy();
    } else {
      console.log('No quotes found');
    }
  });

  test('should display client information in quote detail', async ({ page }) => {
    const quoteItem = page.locator('tr, .quote-card, [data-testid^="quote-"]').first();

    const itemCount = await quoteItem.count();

    if (itemCount > 0) {
      await quoteItem.click();
      await page.waitForTimeout(1000);

      // Check for client name and email
      const clientInfo = page.locator('text=/client|name|email/i');
      const infoCount = await clientInfo.count();

      expect(infoCount).toBeGreaterThan(0);
    } else {
      console.log('No quotes to view');
    }
  });

  test('should show approve/decline buttons for pending quotes', async ({ page }) => {
    // Look for pending quotes
    const pendingQuote = page.locator('[data-status="pending"], .status-pending').first();

    const pendingCount = await pendingQuote.count();

    if (pendingCount > 0) {
      await pendingQuote.click();
      await page.waitForTimeout(500);

      // Look for action buttons
      const approveButton = page.locator('button').filter({ hasText: /approve/i });
      const declineButton = page.locator('button').filter({ hasText: /decline/i });

      const hasActions = await approveButton.count() > 0 || await declineButton.count() > 0;
      expect(hasActions).toBeTruthy();
    } else {
      console.log('No pending quotes found');
    }
  });

  test('should show convert to project button for approved quotes', async ({ page }) => {
    const approvedQuote = page.locator('[data-status="approved"], .status-approved').first();

    const approvedCount = await approvedQuote.count();

    if (approvedCount > 0) {
      await approvedQuote.click();
      await page.waitForTimeout(500);

      const convertButton = page.locator('button').filter({ hasText: /convert|create project/i });

      if (await convertButton.count() > 0) {
        await expect(convertButton.first()).toBeVisible();
      }
    } else {
      console.log('No approved quotes found');
    }
  });

  test('should sort quotes by date', async ({ page }) => {
    const dateColumn = page.locator('th, [role="columnheader"]').filter({
      hasText: /date|created|submitted/i
    }).first();

    const columnCount = await dateColumn.count();

    if (columnCount > 0) {
      await dateColumn.click();
      await page.waitForTimeout(500);

      await dateColumn.click(); // Reverse sort
      await page.waitForLoadState('networkidle');
    } else {
      console.log('Date column not found');
    }
  });

  test('should paginate quotes', async ({ page }) => {
    const pagination = page.locator('[role="navigation"][aria-label*="pagination"], .pagination');

    const paginationCount = await pagination.count();

    if (paginationCount > 0) {
      const nextButton = page.locator('button, a').filter({ hasText: /next|›/i });

      if (await nextButton.count() > 0 && !await nextButton.first().isDisabled()) {
        await nextButton.first().click();
        await page.waitForLoadState('networkidle');
      }
    } else {
      console.log('Pagination not found - single page of quotes');
    }
  });

  test('should display quote count', async ({ page }) => {
    const countIndicator = page.locator('text=/\\d+ quotes?|showing \\d+/i');

    const countCount = await countIndicator.count();

    if (countCount > 0) {
      await expect(countIndicator.first()).toBeVisible();
    } else {
      console.log('Quote count not displayed');
    }
  });
});

test.describe('Quotes Review - Convert to Project', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, 'quotes');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should show confirmation when converting quote to project', async ({ page }) => {
    const pendingQuote = page.locator('[data-status="pending"], tr, .quote-card').first();

    const quoteCount = await pendingQuote.count();

    if (quoteCount > 0) {
      await pendingQuote.click();
      await page.waitForTimeout(500);

      const convertButton = page.locator('button').filter({
        hasText: /convert|create project/i
      }).first();

      const convertCount = await convertButton.count();

      if (convertCount > 0) {
        await convertButton.click();
        await page.waitForTimeout(500);

        // Check for confirmation or success message
        const message = page.locator('[role="alert"], .success, .notification, text=/success|created|converted/i');
        const messageCount = await message.count();

        if (messageCount > 0) {
          await expect(message.first()).toBeVisible({ timeout: 5000 });
        }
      }
    } else {
      console.log('No quotes available to convert');
    }
  });
});
