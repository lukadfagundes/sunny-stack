/**
 * @file Admin authentication helpers for E2E tests
 * @description Utilities for simulating admin authentication in E2E tests
 */

import { Page } from '@playwright/test';

/**
 * Admin route hash (from .env.example)
 * In production, this would be loaded from environment variables
 */
export const ADMIN_ROUTE_HASH = '6bde736bb52aa194f1d69d140619b25cb9f9a42eb3acb1f6e7a502b375fda6ac';

/**
 * Admin route URL paths
 */
export const ADMIN_ROUTES = {
  dashboard: `/admin-${ADMIN_ROUTE_HASH}/`,
  projects: `/admin-${ADMIN_ROUTE_HASH}/projects`,
  quotes: `/admin-${ADMIN_ROUTE_HASH}/quotes`,
  analytics: `/admin-${ADMIN_ROUTE_HASH}/analytics`,
  reports: `/admin-${ADMIN_ROUTE_HASH}/reports`,
};

/**
 * Mock admin session for E2E tests
 * This simulates a logged-in admin user without requiring actual Google OAuth
 */
export async function mockAdminSession(page: Page) {
  // Set localStorage with mock session data
  await page.addInitScript(() => {
    localStorage.setItem('admin_authenticated', 'true');
    localStorage.setItem('admin_email', 'admin@sunny-stack.com');
  });

  // Optionally set cookies for NextAuth session
  // Note: In real implementation, you'd need to generate valid session tokens
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: 'mock_session_token_for_testing',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Navigate to admin route with authentication
 */
export async function gotoAdminRoute(page: Page, route: keyof typeof ADMIN_ROUTES) {
  await mockAdminSession(page);
  await page.goto(ADMIN_ROUTES[route]);
}

/**
 * Clear admin session (logout)
 */
export async function clearAdminSession(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_email');
  });

  await page.context().clearCookies();
}
