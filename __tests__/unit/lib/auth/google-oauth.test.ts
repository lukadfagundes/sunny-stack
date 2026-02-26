/**
 * @jest-environment node
 */

// __tests__/unit/lib/auth/google-oauth.test.ts

// Mock jose before importing the module under test
jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    return {
      setProtectedHeader: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockResolvedValue("mock-jwt-token"),
    };
  }),
  jwtVerify: jest.fn(),
}));

// Mock next/headers
jest.mock("next/headers", () => {
  const cookieStore = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };
  return {
    cookies: jest.fn().mockResolvedValue(cookieStore),
    __mockCookieStore: cookieStore,
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  createSession,
  getSession,
  destroySession,
  isAuthorizedAdmin,
} from "@/lib/auth/google-oauth";
import { jwtVerify } from "jose";

// Retrieve the mock cookie store created inside the factory
const { __mockCookieStore: mockCookieStore } = jest.requireMock(
  "next/headers",
) as {
  __mockCookieStore: { get: jest.Mock; set: jest.Mock; delete: jest.Mock };
};

describe("google-oauth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "test-client-secret",
      NEXTAUTH_URL: "https://sunny-stack.com",
      AUTH_SECRET: "test-secret-key-at-least-32-chars-long",
      ADMIN_EMAIL: "admin@example.com",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // =====================================================================
  // getGoogleAuthUrl
  // =====================================================================
  describe("getGoogleAuthUrl", () => {
    test("returns a Google OAuth URL with correct params", () => {
      const url = getGoogleAuthUrl("/admin");

      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(url).toContain("client_id=test-client-id");
      expect(url).toContain("response_type=code");
      expect(url).toContain("scope=openid+email+profile");
      expect(url).toContain("access_type=offline");
    });

    test("includes redirect_uri based on NEXTAUTH_URL", () => {
      const url = getGoogleAuthUrl("/admin");
      expect(url).toContain(
        "redirect_uri=" +
          encodeURIComponent(
            "https://sunny-stack.com/api/auth/callback/google",
          ),
      );
    });

    test("stores callback URL in state parameter", () => {
      const url = getGoogleAuthUrl("/admin/dashboard");
      expect(url).toContain("state=" + encodeURIComponent("/admin/dashboard"));
    });

    test("falls back to AUTH_URL when NEXTAUTH_URL is not set", () => {
      delete process.env.NEXTAUTH_URL;
      process.env.AUTH_URL = "https://auth-url.com";

      const url = getGoogleAuthUrl("/callback");
      expect(url).toContain(
        "redirect_uri=" +
          encodeURIComponent("https://auth-url.com/api/auth/callback/google"),
      );
    });

    test("falls back to localhost when no URL env vars are set", () => {
      delete process.env.NEXTAUTH_URL;
      delete process.env.AUTH_URL;

      const url = getGoogleAuthUrl("/callback");
      expect(url).toContain(
        "redirect_uri=" +
          encodeURIComponent("http://localhost:3000/api/auth/callback/google"),
      );
    });
  });

  // =====================================================================
  // handleGoogleCallback
  // =====================================================================
  describe("handleGoogleCallback", () => {
    const mockGoogleUser = {
      id: "google-user-123",
      email: "user@example.com",
      verified_email: true,
      name: "Test User",
      given_name: "Test",
      family_name: "User",
      picture: "https://example.com/photo.jpg",
    };

    test("exchanges code for tokens and returns user info", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "mock-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoogleUser,
        });

      const result = await handleGoogleCallback("auth-code-123");

      expect(result).toEqual(mockGoogleUser);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test("first fetch uses token endpoint with correct params", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoogleUser,
        });

      await handleGoogleCallback("auth-code");

      const tokenCall = mockFetch.mock.calls[0];
      expect(tokenCall[0]).toBe("https://oauth2.googleapis.com/token");
      expect(tokenCall[1].method).toBe("POST");
    });

    test("second fetch uses userinfo endpoint with bearer token", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "my-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoogleUser,
        });

      await handleGoogleCallback("code");

      const userinfoCall = mockFetch.mock.calls[1];
      expect(userinfoCall[0]).toBe(
        "https://www.googleapis.com/oauth2/v2/userinfo",
      );
      expect(userinfoCall[1].headers.Authorization).toBe(
        "Bearer my-access-token",
      );
    });

    test("throws when token exchange fails", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });

      await expect(handleGoogleCallback("bad-code")).rejects.toThrow(
        "Failed to exchange code for tokens",
      );
    });

    test("throws when user info fetch fails", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "token" }),
        })
        .mockResolvedValueOnce({ ok: false, status: 401 });

      await expect(handleGoogleCallback("code")).rejects.toThrow(
        "Failed to get user info",
      );
    });
  });

  // =====================================================================
  // createSession
  // =====================================================================
  describe("createSession", () => {
    const mockUser = {
      id: "user-1",
      email: "user@example.com",
      verified_email: true,
      name: "Test User",
      given_name: "Test",
      family_name: "User",
      picture: "https://example.com/photo.jpg",
    };

    test("creates a JWT and sets an httpOnly cookie", async () => {
      await createSession(mockUser);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "sunny-stack-session",
        "mock-jwt-token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
    });

    test("sets secure flag in production", async () => {
      process.env.NODE_ENV = "production";

      await createSession(mockUser);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "sunny-stack-session",
        "mock-jwt-token",
        expect.objectContaining({ secure: true }),
      );
    });

    test("sets maxAge to 30 days", async () => {
      await createSession(mockUser);

      const options = mockCookieStore.set.mock.calls[0][2];
      expect(options.maxAge).toBe(30 * 24 * 60 * 60);
    });
  });

  // =====================================================================
  // getSession
  // =====================================================================
  describe("getSession", () => {
    test("returns null when no cookie exists", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const session = await getSession();
      expect(session).toBeNull();
    });

    test("returns session data when token is valid", async () => {
      const sessionData = {
        user: { email: "user@example.com", name: "Test", image: "pic.jpg" },
        expires: Date.now() + 86400000,
      };

      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      (jwtVerify as jest.Mock).mockResolvedValue({ payload: sessionData });

      const session = await getSession();
      expect(session).toEqual(sessionData);
    });

    test("returns null when token is expired", async () => {
      const expiredSession = {
        user: { email: "user@example.com", name: "Test", image: "pic.jpg" },
        expires: Date.now() - 1000,
      };

      mockCookieStore.get.mockReturnValue({ value: "expired-token" });
      (jwtVerify as jest.Mock).mockResolvedValue({ payload: expiredSession });

      const session = await getSession();
      expect(session).toBeNull();
    });

    test("returns null when jwtVerify throws", async () => {
      mockCookieStore.get.mockReturnValue({ value: "invalid-token" });
      (jwtVerify as jest.Mock).mockRejectedValue(new Error("Invalid token"));

      const session = await getSession();
      expect(session).toBeNull();
    });
  });

  // =====================================================================
  // destroySession
  // =====================================================================
  describe("destroySession", () => {
    test("deletes the session cookie", async () => {
      await destroySession();

      expect(mockCookieStore.delete).toHaveBeenCalledWith(
        "sunny-stack-session",
      );
    });
  });

  // =====================================================================
  // isAuthorizedAdmin
  // =====================================================================
  describe("isAuthorizedAdmin", () => {
    test("returns true for authorized admin email", () => {
      process.env.ADMIN_EMAIL = "admin@example.com";
      expect(isAuthorizedAdmin("admin@example.com")).toBe(true);
    });

    test("returns false for non-admin email", () => {
      process.env.ADMIN_EMAIL = "admin@example.com";
      expect(isAuthorizedAdmin("user@example.com")).toBe(false);
    });

    test("supports comma-separated admin emails", () => {
      process.env.ADMIN_EMAIL = "admin1@example.com, admin2@example.com";
      expect(isAuthorizedAdmin("admin1@example.com")).toBe(true);
      expect(isAuthorizedAdmin("admin2@example.com")).toBe(true);
      expect(isAuthorizedAdmin("other@example.com")).toBe(false);
    });

    test("returns false when ADMIN_EMAIL is not set", () => {
      delete process.env.ADMIN_EMAIL;
      expect(isAuthorizedAdmin("admin@example.com")).toBe(false);
    });

    test("handles whitespace in comma-separated emails", () => {
      process.env.ADMIN_EMAIL = " admin@example.com , user@example.com ";
      expect(isAuthorizedAdmin("admin@example.com")).toBe(true);
      expect(isAuthorizedAdmin("user@example.com")).toBe(true);
    });
  });
});
