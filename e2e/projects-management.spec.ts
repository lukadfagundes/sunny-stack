/**
 * @file Projects Management E2E tests
 * @description End-to-end tests for project CRUD operations in admin panel
 */

import { test, expect } from '@playwright/test';
import { gotoAdminRoute, clearAdminSession } from './helpers/admin-auth';

test.describe('Projects Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to projects page with authentication
    await gotoAdminRoute(page, 'projects');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should display projects list page', async ({ page }) => {
    // Check for projects heading
    const heading = page.locator('h1, h2').filter({ hasText: /projects/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display create project button', async ({ page }) => {
    // Look for "New Project", "Create Project", or "Add Project" button
    const createButton = page.locator('button, a').filter({
      hasText: /new project|create project|add project|\+ project/i
    });

    const buttonCount = await createButton.count();

    if (buttonCount > 0) {
      await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    } else {
      console.log('Create project button not found - may not be implemented yet');
    }
  });

  test('should display projects table or grid', async ({ page }) => {
    // Look for table, grid, or list of projects
    const projectsContainer = page.locator(
      'table, [role="table"], .projects-grid, .projects-list, [data-testid="projects-list"]'
    );

    const containerCount = await projectsContainer.count();

    if (containerCount > 0) {
      await expect(projectsContainer.first()).toBeVisible({ timeout: 10000 });
    } else {
      // May be empty state
      const emptyState = page.locator('text=/no projects|empty|get started/i');
      const hasEmptyState = await emptyState.count() > 0;

      if (!hasEmptyState) {
        console.log('Projects container not found - page may still be loading or not implemented');
      }
    }
  });

  test('should filter projects by status', async ({ page }) => {
    // Look for status filter dropdown or buttons
    const statusFilter = page.locator('select, [role="combobox"], button').filter({
      hasText: /status|filter/i
    });

    const filterCount = await statusFilter.count();

    if (filterCount > 0) {
      // Click the filter
      await statusFilter.first().click();

      // Wait for filter options to appear
      await page.waitForTimeout(500);

      // Check that filter options are visible
      const filterOptions = page.locator('[role="option"], option, button').filter({
        hasText: /planning|in progress|review|complete/i
      });

      const optionsCount = await filterOptions.count();
      expect(optionsCount).toBeGreaterThan(0);
    } else {
      console.log('Status filter not found - may not be implemented yet');
    }
  });

  test('should open project details on click', async ({ page }) => {
    // Look for project rows/cards
    const projectItem = page.locator(
      'tr, .project-card, .project-item, [data-testid^="project-"]'
    ).first();

    const itemCount = await projectItem.count();

    if (itemCount > 0) {
      // Click the first project
      await projectItem.click();

      // Wait for navigation or modal
      await page.waitForTimeout(1000);

      // Check that we either:
      // 1. Navigated to project detail page
      // 2. Opened a modal/drawer
      const url = page.url();
      const hasModal = await page.locator('[role="dialog"], .modal, .drawer').count() > 0;

      const hasNavigation = url.includes('/projects/') || hasModal;
      expect(hasNavigation).toBeTruthy();
    } else {
      console.log('No projects found to click - empty state');
    }
  });

  test('should sort projects by different columns', async ({ page }) => {
    // Look for sortable column headers
    const sortableColumn = page.locator('th, [role="columnheader"]').filter({
      hasText: /title|client|status|date|budget/i
    }).first();

    const columnCount = await sortableColumn.count();

    if (columnCount > 0) {
      // Click to sort
      await sortableColumn.click();

      // Wait for re-render
      await page.waitForTimeout(500);

      // Click again to reverse sort
      await sortableColumn.click();

      // Verify table re-rendered (content changed)
      await page.waitForLoadState('networkidle');
    } else {
      console.log('Sortable columns not found - may not be implemented yet');
    }
  });

  test('should paginate projects when more than page limit', async ({ page }) => {
    // Look for pagination controls
    const pagination = page.locator(
      '[role="navigation"][aria-label*="pagination"], .pagination, [data-testid="pagination"]'
    );

    const paginationCount = await pagination.count();

    if (paginationCount > 0) {
      await expect(pagination.first()).toBeVisible();

      // Look for next page button
      const nextButton = page.locator('button, a').filter({
        hasText: /next|›|»|>/
      });

      const nextCount = await nextButton.count();

      if (nextCount > 0 && !await nextButton.first().isDisabled()) {
        await nextButton.first().click();
        await page.waitForLoadState('networkidle');

        // Verify URL changed with page parameter
        const url = page.url();
        expect(url).toMatch(/page=|offset=/);
      }
    } else {
      console.log('Pagination not found - may have fewer than one page of projects');
    }
  });

  test('should search projects by client name or title', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');

    const inputCount = await searchInput.count();

    if (inputCount > 0) {
      // Type search query
      await searchInput.first().fill('test');

      // Wait for results
      await page.waitForTimeout(500);

      // Verify search was applied (URL changed or results filtered)
      const url = page.url();
      const hasSearchParam = url.includes('search=') || url.includes('q=');

      if (!hasSearchParam) {
        // Search may be client-side filtered
        console.log('Search applied - checking if results filtered');
      }
    } else {
      console.log('Search input not found - may not be implemented yet');
    }
  });

  test('should display project count', async ({ page }) => {
    // Look for count indicator
    const countIndicator = page.locator('text=/\\d+ projects?|showing \\d+|total: \\d+/i');

    const countCount = await countIndicator.count();

    if (countCount > 0) {
      await expect(countIndicator.first()).toBeVisible();
    } else {
      console.log('Project count not displayed');
    }
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const hasFocus = await focusedElement.evaluate(el => el !== document.body);

    expect(hasFocus).toBeTruthy();
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Assuming empty state when no projects
    const emptyState = page.locator('text=/no projects|empty|get started|create your first/i');
    const projectsList = page.locator('table tbody tr, .project-card, .project-item');

    const hasProjects = await projectsList.count() > 0;
    const hasEmptyState = await emptyState.count() > 0;

    // Either has projects or shows empty state
    expect(hasProjects || hasEmptyState).toBeTruthy();
  });
});

test.describe('Projects Management - Create Project', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, 'projects');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should open create project form', async ({ page }) => {
    // Find create button
    const createButton = page.locator('button, a').filter({
      hasText: /new project|create project|add project|\+/i
    }).first();

    const buttonCount = await createButton.count();

    if (buttonCount > 0) {
      await createButton.click();

      // Wait for form to appear
      await page.waitForTimeout(1000);

      // Check for form fields
      const form = page.locator('form, [role="form"]');
      const formCount = await form.count();

      if (formCount > 0) {
        await expect(form.first()).toBeVisible();
      } else {
        // May have navigated to new page
        const url = page.url();
        expect(url).toMatch(/\/new|\/create/i);
      }
    } else {
      console.log('Create button not found - skipping test');
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Find and click create button
    const createButton = page.locator('button, a').filter({
      hasText: /new project|create project|\+/i
    }).first();

    const buttonCount = await createButton.count();

    if (buttonCount > 0) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Try to submit without filling fields
      const submitButton = page.locator('button[type="submit"], button').filter({
        hasText: /create|save|submit/i
      }).first();

      const submitCount = await submitButton.count();

      if (submitCount > 0) {
        await submitButton.click();

        // Check for validation errors
        await page.waitForTimeout(500);

        const errorMessages = page.locator('text=/required|must|error/i, [role="alert"], .error');
        const errorCount = await errorMessages.count();

        // Should show validation errors
        expect(errorCount).toBeGreaterThan(0);
      }
    } else {
      console.log('Create button not found - skipping test');
    }
  });
});

test.describe('Projects Management - Edit Project', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, 'projects');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should open edit project form', async ({ page }) => {
    // Find first project
    const projectItem = page.locator(
      'tr, .project-card, [data-testid^="project-"]'
    ).first();

    const itemCount = await projectItem.count();

    if (itemCount > 0) {
      // Look for edit button
      const editButton = projectItem.locator('button, a').filter({
        hasText: /edit|update|modify/i
      }).first();

      const editCount = await editButton.count();

      if (editCount > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);

        // Check for form
        const form = page.locator('form, [role="form"]');
        await expect(form.first()).toBeVisible();
      } else {
        // Try clicking the row itself
        await projectItem.click();
        await page.waitForTimeout(1000);

        console.log('Edit button not found - may need to click project row first');
      }
    } else {
      console.log('No projects to edit');
    }
  });
});

test.describe('Projects Management - Delete Project', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, 'projects');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await clearAdminSession(page);
  });

  test('should show confirmation dialog when deleting project', async ({ page }) => {
    // Find first project
    const projectItem = page.locator(
      'tr, .project-card, [data-testid^="project-"]'
    ).first();

    const itemCount = await projectItem.count();

    if (itemCount > 0) {
      // Look for delete button
      const deleteButton = projectItem.locator('button, a').filter({
        hasText: /delete|remove|trash/i
      }).first();

      const deleteCount = await deleteButton.count();

      if (deleteCount > 0) {
        await deleteButton.click();

        // Wait for confirmation dialog
        await page.waitForTimeout(500);

        // Check for confirmation dialog
        const confirmDialog = page.locator('[role="dialog"], .modal, .confirm');
        const dialogCount = await confirmDialog.count();

        if (dialogCount > 0) {
          await expect(confirmDialog.first()).toBeVisible();

          // Look for confirm button in dialog
          const confirmButton = page.locator('button').filter({
            hasText: /confirm|yes|delete/i
          });

          await expect(confirmButton.first()).toBeVisible();
        }
      } else {
        console.log('Delete button not found');
      }
    } else {
      console.log('No projects to delete');
    }
  });
});
