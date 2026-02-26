/**
 * @jest-environment node
 */

// __tests__/unit/lib/admin/auth-wrapper.test.ts

// Mock getSession before importing the module under test
jest.mock("@/lib/auth/google-oauth", () => ({
  getSession: jest.fn(),
}));

import { withAdminAuth } from "@/lib/admin/auth-wrapper";
import { getSession } from "@/lib/auth/google-oauth";
import { NextRequest, NextResponse } from "next/server";

const mockGetSession = getSession as jest.Mock;

describe("auth-wrapper", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, ADMIN_EMAIL: "admin@example.com" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function makeRequest(
    url = "http://localhost:3000/api/admin/test",
  ): NextRequest {
    return new NextRequest(url);
  }

  const successHandler = jest.fn().mockImplementation(async () => {
    return NextResponse.json({ data: "protected" });
  });

  // =====================================================================
  // Successful authentication
  // =====================================================================
  describe("when user is authenticated admin", () => {
    test("calls the wrapped handler and returns its response", async () => {
      mockGetSession.mockResolvedValue({
        user: { email: "admin@example.com", name: "Admin", image: "" },
        expires: Date.now() + 86400000,
      });

      const protectedHandler = withAdminAuth(successHandler);
      const request = makeRequest();
      const response = await protectedHandler(request);
      const body = await response.json();

      expect(successHandler).toHaveBeenCalledWith(request);
      expect(body).toEqual({ data: "protected" });
    });

    test("works with custom adminEmails config", async () => {
      mockGetSession.mockResolvedValue({
        user: { email: "custom@example.com", name: "Custom", image: "" },
        expires: Date.now() + 86400000,
      });

      const protectedHandler = withAdminAuth(successHandler, {
        adminEmails: ["custom@example.com"],
      });
      const response = await protectedHandler(makeRequest());
      const body = await response.json();

      expect(body).toEqual({ data: "protected" });
    });
  });

  // =====================================================================
  // No session (401)
  // =====================================================================
  describe("when no session exists", () => {
    test("returns 401 Unauthorized", async () => {
      mockGetSession.mockResolvedValue(null);

      const protectedHandler = withAdminAuth(successHandler);
      const response = await protectedHandler(makeRequest());
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toContain("Unauthorized");
      expect(successHandler).not.toHaveBeenCalled();
    });

    test("returns 401 when session has no user", async () => {
      mockGetSession.mockResolvedValue({
        user: null,
        expires: Date.now() + 86400000,
      });

      const protectedHandler = withAdminAuth(successHandler);
      const response = await protectedHandler(makeRequest());

      expect(response.status).toBe(401);
    });
  });

  // =====================================================================
  // Non-admin user (403)
  // =====================================================================
  describe("when user is not admin", () => {
    test("returns 403 Forbidden", async () => {
      mockGetSession.mockResolvedValue({
        user: { email: "regular@example.com", name: "Regular", image: "" },
        expires: Date.now() + 86400000,
      });

      const protectedHandler = withAdminAuth(successHandler);
      const response = await protectedHandler(makeRequest());
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toContain("Forbidden");
      expect(successHandler).not.toHaveBeenCalled();
    });

    test("returns 403 when user email is empty", async () => {
      mockGetSession.mockResolvedValue({
        user: { email: "", name: "NoEmail", image: "" },
        expires: Date.now() + 86400000,
      });

      const protectedHandler = withAdminAuth(successHandler);
      const response = await protectedHandler(makeRequest());

      expect(response.status).toBe(403);
    });
  });

  // =====================================================================
  // Missing ADMIN_EMAIL env var
  // =====================================================================
  describe("when ADMIN_EMAIL is not configured", () => {
    test("throws Error about ADMIN_EMAIL", async () => {
      delete process.env.ADMIN_EMAIL;
      mockGetSession.mockResolvedValue({
        user: { email: "admin@example.com", name: "Admin", image: "" },
        expires: Date.now() + 86400000,
      });

      const protectedHandler = withAdminAuth(successHandler);
      await expect(protectedHandler(makeRequest())).rejects.toThrow(
        "ADMIN_EMAIL",
      );
    });
  });

  // =====================================================================
  // Error handling
  // =====================================================================
  describe("error handling", () => {
    test("returns 401 when getSession throws a non-config error", async () => {
      mockGetSession.mockRejectedValue(new Error("Database connection failed"));

      const protectedHandler = withAdminAuth(successHandler);
      const response = await protectedHandler(makeRequest());
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toContain("Authentication failed");
      expect(body.error).toContain("Database connection failed");
    });
  });
});
