/**
 * Tests for Admin Route Protection Middleware
 *
 * Tests the admin route wrapper that:
 * - Uses existing withAuth middleware
 * - Validates ADMIN_ROUTE_HASH from env
 * - Generates dynamic admin route paths
 *
 * @jest-environment node
 */

import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterAll,
} from "@jest/globals";

// Mock withAuth before importing the module under test
jest.mock("@/lib/middleware/auth", () => ({
  withAuth: jest.fn((handler) => handler),
}));

jest.mock("@/lib/webhooks/verify", () => ({
  verifyGitHubWebhook: jest.fn(),
  verifyVercelWebhook: jest.fn(),
}));

import {
  adminRouteProtection,
  getAdminRoutePath,
} from "@/lib/middleware/admin-auth";

describe("Admin Route Protection", () => {
  describe("getAdminRoutePath", () => {
    const originalEnv = process.env.ADMIN_ROUTE_HASH;

    beforeEach(() => {
      // Reset environment
      delete process.env.ADMIN_ROUTE_HASH;
    });

    afterAll(() => {
      // Restore original environment
      if (originalEnv) {
        process.env.ADMIN_ROUTE_HASH = originalEnv;
      }
    });

    test("should throw error when ADMIN_ROUTE_HASH is not defined", () => {
      // ARRANGE: No environment variable set
      delete process.env.ADMIN_ROUTE_HASH;

      // ACT & ASSERT: Function should throw
      expect(() => getAdminRoutePath()).toThrow(
        "ADMIN_ROUTE_HASH environment variable is not defined",
      );
    });

    test("should return correct admin path with hash", () => {
      // ARRANGE: Set environment variable
      process.env.ADMIN_ROUTE_HASH = "abc123";

      // ACT: Get admin route path
      const path = getAdminRoutePath();

      // ASSERT: Should return path with hash
      expect(path).toBe("/admin-abc123");
    });

    test("should append subpath correctly", () => {
      // ARRANGE: Set environment variable
      process.env.ADMIN_ROUTE_HASH = "xyz789";

      // ACT: Get admin route path with subpath
      const path = getAdminRoutePath("/projects");

      // ASSERT: Should append subpath to hashed route
      expect(path).toBe("/admin-xyz789/projects");
    });

    test("should handle subpath with leading slash", () => {
      // ARRANGE: Set environment variable
      process.env.ADMIN_ROUTE_HASH = "test";

      // ACT: Get admin route path with leading slash
      const path = getAdminRoutePath("/dashboard");

      // ASSERT: Should not double slash
      expect(path).toBe("/admin-test/dashboard");
    });

    test("should handle subpath without leading slash", () => {
      // ARRANGE: Set environment variable
      process.env.ADMIN_ROUTE_HASH = "test";

      // ACT: Get admin route path without leading slash
      const path = getAdminRoutePath("settings");

      // ASSERT: Should add slash correctly
      expect(path).toBe("/admin-test/settings");
    });
  });

  describe("adminRouteProtection", () => {
    test("should exist as function", () => {
      // ASSERT: Function should be defined
      expect(adminRouteProtection).toBeDefined();
      expect(typeof adminRouteProtection).toBe("function");
    });

    test("should wrap withAuth middleware", () => {
      // ARRANGE: Create mock handler
      const mockHandler = jest.fn();

      // ACT: Wrap handler with admin protection
      const protectedHandler = adminRouteProtection(mockHandler);

      // ASSERT: Should return a function (wrapped handler)
      expect(typeof protectedHandler).toBe("function");
    });
  });
});
