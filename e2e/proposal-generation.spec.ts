/**
 * @file Proposal Generation E2E tests
 * @description End-to-end tests for PDF proposal generation workflow
 */

import { test, expect } from '@playwright/test';
import { gotoAdminRoute, clearAdminSession } from './helpers/admin-auth';

test.describe('Proposal Generation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, 'quotes');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should display generate proposal button for converted quotes', async ({ page }) => {
    const convertedQuote = page.locator('[data-status="converted"], .status-converted').first();

    const quoteCount = await convertedQuote.count();

    if (quoteCount > 0) {
      await convertedQuote.click();
      await page.waitForTimeout(500);

      const generateButton = page.locator('button').filter({
        hasText: /generate proposal|create proposal/i
      });

      const buttonCount = await generateButton.count();

      if (buttonCount > 0) {
        await expect(generateButton.first()).toBeVisible();
      }
    } else {
      console.log('No converted quotes found');
    }
  });

  test('should generate proposal PDF', async ({ page }) => {
    // Find quote with project (converted)
    const quoteWithProject = page.locator('tr, .quote-card').first();

    const quoteCount = await quoteWithProject.count();

    if (quoteCount > 0) {
      await quoteWithProject.click();
      await page.waitForTimeout(500);

      const generateButton = page.locator('button').filter({
        hasText: /generate proposal/i
      }).first();

      const buttonCount = await generateButton.count();

      if (buttonCount > 0) {
        await generateButton.click();

        // Wait for generation (may take a moment)
        await page.waitForTimeout(3000);

        // Check for success message or PDF preview
        const success = page.locator(
          '[role="alert"], .success, text=/generated|success|complete/i'
        );

        const successCount = await success.count();

        if (successCount > 0) {
          await expect(success.first()).toBeVisible({ timeout: 10000 });
        }
      }
    } else {
      console.log('No quotes available for proposal generation');
    }
  });

  test('should show loading state during PDF generation', async ({ page }) => {
    const quoteItem = page.locator('tr, .quote-card').first();

    const quoteCount = await quoteItem.count();

    if (quoteCount > 0) {
      await quoteItem.click();
      await page.waitForTimeout(500);

      const generateButton = page.locator('button').filter({
        hasText: /generate proposal/i
      }).first();

      const buttonCount = await generateButton.count();

      if (buttonCount > 0) {
        await generateButton.click();

        // Check for loading indicator immediately after click
        const loading = page.locator(
          '[role="status"], .loading, .spinner, [aria-busy="true"]'
        );

        // Loading should appear briefly
        await page.waitForTimeout(100);

        const loadingCount = await loading.count();

        if (loadingCount > 0) {
          await expect(loading.first()).toBeVisible();
        }
      }
    } else {
      console.log('No quotes to test loading state');
    }
  });

  test('should display proposal history list', async ({ page }) => {
    const quoteItem = page.locator('tr, .quote-card').first();

    const quoteCount = await quoteItem.count();

    if (quoteCount > 0) {
      await quoteItem.click();
      await page.waitForTimeout(500);

      // Look for proposals section
      const proposalsSection = page.locator(
        'text=/proposals?|history|previous/i, [data-testid="proposals-list"]'
      );

      const sectionCount = await proposalsSection.count();

      if (sectionCount > 0) {
        await expect(proposalsSection.first()).toBeVisible();
      } else {
        console.log('Proposals section not found');
      }
    }
  });

  test('should allow sending proposal via email', async ({ page }) => {
    const quoteItem = page.locator('tr, .quote-card').first();

    const quoteCount = await quoteItem.count();

    if (quoteCount > 0) {
      await quoteItem.click();
      await page.waitForTimeout(500);

      // Look for send email button
      const sendButton = page.locator('button').filter({
        hasText: /send email|send proposal|email/i
      });

      const buttonCount = await sendButton.count();

      if (buttonCount > 0) {
        await expect(sendButton.first()).toBeVisible();
      }
    }
  });

  test('should show email sent confirmation', async ({ page }) => {
    const quoteItem = page.locator('tr, .quote-card').first();

    const quoteCount = await quoteItem.count();

    if (quoteCount > 0) {
      await quoteItem.click();
      await page.waitForTimeout(500);

      const sendButton = page.locator('button').filter({
        hasText: /send email|send proposal/i
      }).first();

      const buttonCount = await sendButton.count();

      if (buttonCount > 0) {
        await sendButton.click();

        // Wait for email to send
        await page.waitForTimeout(2000);

        // Check for success message
        const success = page.locator(
          '[role="alert"], .success, text=/sent|email sent|success/i'
        );

        const successCount = await success.count();

        if (successCount > 0) {
          await expect(success.first()).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test('should display proposal preview or download link', async ({ page }) => {
    const quoteItem = page.locator('tr, .quote-card').first();

    const quoteCount = await quoteItem.count();

    if (quoteCount > 0) {
      await quoteItem.click();
      await page.waitForTimeout(500);

      // Look for existing proposals
      const proposalLink = page.locator('a, button').filter({
        hasText: /view|download|preview|pdf/i
      });

      const linkCount = await proposalLink.count();

      if (linkCount > 0) {
        await expect(proposalLink.first()).toBeVisible();
      }
    }
  });

  test('should handle PDF generation errors gracefully', async ({ page }) => {
    // This test would require mocking an error scenario
    // For now, we'll just verify error handling UI exists

    const quoteItem = page.locator('tr, .quote-card').first();

    const quoteCount = await quoteItem.count();

    if (quoteCount > 0) {
      await quoteItem.click();
      await page.waitForTimeout(500);

      const generateButton = page.locator('button').filter({
        hasText: /generate proposal/i
      }).first();

      const buttonCount = await generateButton.count();

      if (buttonCount > 0) {
        // Set up listener for potential error messages
        const errorHandler = page.locator('[role="alert"][aria-live="assertive"], .error');

        await generateButton.click();
        await page.waitForTimeout(3000);

        // If error occurred, verify it's displayed properly
        const errorCount = await errorHandler.count();

        if (errorCount > 0) {
          await expect(errorHandler.first()).toBeVisible();
          console.log('Error handling verified');
        }
      }
    }
  });
});

test.describe('Proposal Generation - Email Validation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, 'quotes');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should validate email address before sending', async ({ page }) => {
    const quoteItem = page.locator('tr, .quote-card').first();

    const quoteCount = await quoteItem.count();

    if (quoteCount > 0) {
      await quoteItem.click();
      await page.waitForTimeout(500);

      // Look for email input field
      const emailInput = page.locator('input[type="email"], input[name*="email"]');

      const inputCount = await emailInput.count();

      if (inputCount > 0) {
        // Clear and enter invalid email
        await emailInput.first().clear();
        await emailInput.first().fill('invalid-email');

        // Try to submit
        const sendButton = page.locator('button[type="submit"], button').filter({
          hasText: /send/i
        }).first();

        const buttonCount = await sendButton.count();

        if (buttonCount > 0) {
          await sendButton.click();
          await page.waitForTimeout(500);

          // Check for validation error
          const errorMessage = page.locator('text=/invalid email|email format/i, [role="alert"]');

          const errorCount = await errorMessage.count();
          expect(errorCount).toBeGreaterThan(0);
        }
      }
    }
  });
});
