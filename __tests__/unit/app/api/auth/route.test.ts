/**
 * @file Auth Routes Unit Tests
 * @description Tests for auth callback, session, signin, and signout routes
 */

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockGetSession = jest.fn();
const mockDestroySession = jest.fn();
const mockHandleGoogleCallback = jest.fn();
const mockCreateSession = jest.fn();
const mockIsAuthorizedAdmin = jest.fn();
const mockGetGoogleAuthUrl = jest.fn();

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
    redirect: jest.fn((url) => ({
      status: 307,
      headers: new Map(),
      url: url.toString(),
    })),
  },
}));

jest.mock("@/lib/auth/google-oauth", () => ({
  getSession: mockGetSession,
  destroySession: mockDestroySession,
  handleGoogleCallback: mockHandleGoogleCallback,
  createSession: mockCreateSession,
  isAuthorizedAdmin: mockIsAuthorizedAdmin,
  getGoogleAuthUrl: mockGetGoogleAuthUrl,
}));

// ============================================================================
// SESSION ROUTE
// ============================================================================

describe("GET /api/auth/session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return session data", async () => {
    const mockSession = {
      user: { email: "admin@example.com", name: "Admin" },
    };
    mockGetSession.mockResolvedValue(mockSession);

    const { GET } = require("@/app/api/auth/session/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual(mockSession);
  });

  it("should return null when no session exists", async () => {
    mockGetSession.mockResolvedValue(null);

    const { GET } = require("@/app/api/auth/session/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toBeNull();
  });
});

// ============================================================================
// SIGNIN ROUTE
// ============================================================================

describe("GET /api/auth/signin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect to Google OAuth URL", async () => {
    mockGetGoogleAuthUrl.mockReturnValue(
      "https://accounts.google.com/o/oauth2/auth?...",
    );

    const { GET } = require("@/app/api/auth/signin/route");
    const mockRequest = {
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    };

    const response = await GET(mockRequest as any);

    expect(response.status).toBe(307);
    expect(mockGetGoogleAuthUrl).toHaveBeenCalledWith("/admin");
  });

  it("should pass callbackUrl to getGoogleAuthUrl", async () => {
    mockGetGoogleAuthUrl.mockReturnValue("https://accounts.google.com/...");

    const { GET } = require("@/app/api/auth/signin/route");
    const mockRequest = {
      nextUrl: {
        searchParams: new URLSearchParams("callbackUrl=/admin/projects"),
      },
    };

    await GET(mockRequest as any);

    expect(mockGetGoogleAuthUrl).toHaveBeenCalledWith("/admin/projects");
  });
});

// ============================================================================
// SIGNOUT ROUTE
// ============================================================================

describe("GET /api/auth/signout", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NEXTAUTH_URL: "http://localhost:3000" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should destroy session and redirect to home", async () => {
    mockDestroySession.mockResolvedValue(undefined);

    const { GET } = require("@/app/api/auth/signout/route");
    const response = await GET();

    expect(mockDestroySession).toHaveBeenCalled();
    expect(response.status).toBe(307);
  });
});

// ============================================================================
// CALLBACK ROUTE
// ============================================================================

describe("GET /api/auth/callback/google", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect on OAuth error parameter", async () => {
    const { GET } = require("@/app/api/auth/callback/google/route");
    const mockRequest = {
      url: "http://localhost:3000/api/auth/callback/google?error=access_denied",
      nextUrl: {
        searchParams: new URLSearchParams("error=access_denied"),
      },
    };

    const response = await GET(mockRequest as any);

    expect(response.status).toBe(307);
  });

  it("should redirect on missing code", async () => {
    const { GET } = require("@/app/api/auth/callback/google/route");
    const mockRequest = {
      url: "http://localhost:3000/api/auth/callback/google",
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    };

    const response = await GET(mockRequest as any);

    expect(response.status).toBe(307);
  });

  it("should handle successful callback with authorized admin", async () => {
    mockHandleGoogleCallback.mockResolvedValue({
      email: "admin@example.com",
      name: "Admin",
    });
    mockIsAuthorizedAdmin.mockReturnValue(true);
    mockCreateSession.mockResolvedValue(undefined);

    const { GET } = require("@/app/api/auth/callback/google/route");
    const mockRequest = {
      url: "http://localhost:3000/api/auth/callback/google?code=test-code&state=/admin",
      nextUrl: {
        searchParams: new URLSearchParams("code=test-code&state=/admin"),
      },
    };

    const response = await GET(mockRequest as any);

    expect(mockHandleGoogleCallback).toHaveBeenCalledWith("test-code");
    expect(mockCreateSession).toHaveBeenCalled();
    expect(response.status).toBe(307);
  });

  it("should redirect to error on unauthorized user", async () => {
    mockHandleGoogleCallback.mockResolvedValue({
      email: "user@example.com",
      name: "Regular User",
    });
    mockIsAuthorizedAdmin.mockReturnValue(false);

    const { GET } = require("@/app/api/auth/callback/google/route");
    const mockRequest = {
      url: "http://localhost:3000/api/auth/callback/google?code=test-code",
      nextUrl: {
        searchParams: new URLSearchParams("code=test-code"),
      },
    };

    const response = await GET(mockRequest as any);

    expect(response.status).toBe(307);
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it("should redirect to error on callback failure", async () => {
    mockHandleGoogleCallback.mockRejectedValue(new Error("OAuth error"));

    const { GET } = require("@/app/api/auth/callback/google/route");
    const mockRequest = {
      url: "http://localhost:3000/api/auth/callback/google?code=bad-code",
      nextUrl: {
        searchParams: new URLSearchParams("code=bad-code"),
      },
    };

    const response = await GET(mockRequest as any);

    expect(response.status).toBe(307);
  });
});
