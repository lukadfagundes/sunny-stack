/**
 * @jest-environment node
 */

// __tests__/unit/lib/google/base-service.test.ts

/**
 * Test suite for GoogleServiceBase abstract class
 * Tests authentication, retry logic, caching, and error handling
 */

import { GoogleServiceBase } from "@/lib/google/base-service";
import { GoogleQuotaManager } from "@/lib/google/quota-manager";
import { AuthError, ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";

// Mock concrete implementation for testing
class TestGoogleService extends GoogleServiceBase<{ test: string }> {
  getServiceName(): "gmail" {
    return "gmail"; // Use a valid service name from GOOGLE_QUOTA_LIMITS
  }

  getQuotaLimits() {
    return { perMinute: 250, perDay: 1_000_000 }; // Gmail's actual limits
  }

  async createClient() {
    return Promise.resolve({ test: "client" });
  }

  // Expose protected methods for testing
  public async testExecuteWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    return this.executeWithRetry(fn);
  }

  public async testRefreshToken(): Promise<void> {
    return this.refreshToken();
  }

  public testGetCached<T>(key: string): T | null {
    return this.getCached<T>(key);
  }

  public testSetCached<T>(key: string, value: T, ttl?: number): void {
    return this.setCached(key, value, ttl);
  }

  public testHandleApiError(error: any): never {
    return this.handleApiError(error);
  }
}

describe("GoogleServiceBase", () => {
  let service: TestGoogleService;

  beforeEach(async () => {
    // Mock environment variables
    process.env.GOOGLE_CLIENT_ID = "test_client_id";
    process.env.GOOGLE_CLIENT_SECRET = "test_client_secret";
    process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/callback";
    process.env.GOOGLE_REFRESH_TOKEN = "test_refresh_token";

    service = new TestGoogleService();

    // Wait for client initialization
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  afterEach(() => {
    // Destroy quota manager timers to prevent open handle leaks
    if (service && service["quotaManager"]) {
      service["quotaManager"].destroy();
    }
    // Clean up environment variables
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;
    delete process.env.GOOGLE_REFRESH_TOKEN;
  });

  describe("Abstract Class Implementation", () => {
    test("should require getServiceName to be implemented", () => {
      expect(service.getServiceName()).toBe("gmail");
    });

    test("should require getQuotaLimits to be implemented", () => {
      const limits = service.getQuotaLimits();
      expect(limits.perMinute).toBe(250);
      expect(limits.perDay).toBe(1_000_000);
    });

    test("should require createClient to be implemented", async () => {
      const client = await service.createClient();
      expect(client).toEqual({ test: "client" });
    });
  });

  describe("Client Initialization", () => {
    test("should initialize client on construction", async () => {
      expect(service["client"]).toBeDefined();
      expect(service["client"]).toEqual({ test: "client" });
    });

    test("should initialize quota manager", () => {
      expect(service["quotaManager"]).toBeInstanceOf(GoogleQuotaManager);
    });

    test("should initialize cache layer", () => {
      expect(service["cacheLayer"]).toBeInstanceOf(Map);
    });

    test("should have default retry config", () => {
      expect(service["retryConfig"]).toEqual({
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 4000,
      });
    });
  });

  describe("Retry Logic with Exponential Backoff", () => {
    test("should succeed on first attempt", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");

      const result = await service.testExecuteWithRetry(mockFn);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test("should retry on transient 500 error", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ status: 500, message: "Server error" })
        .mockResolvedValue("success");

      const result = await service.testExecuteWithRetry(mockFn);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test("should retry on 502 Bad Gateway error", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ status: 502, message: "Bad Gateway" })
        .mockResolvedValue("success");

      const result = await service.testExecuteWithRetry(mockFn);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test("should retry on 503 Service Unavailable error", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ status: 503, message: "Service Unavailable" })
        .mockResolvedValue("success");

      const result = await service.testExecuteWithRetry(mockFn);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test("should retry on 429 Rate Limit error", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ status: 429, message: "Too Many Requests" })
        .mockResolvedValue("success");

      const result = await service.testExecuteWithRetry(mockFn);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test("should NOT retry on 400 Bad Request", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValue({ status: 400, message: "Bad Request" });

      await expect(service.testExecuteWithRetry(mockFn)).rejects.toThrow();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test("should NOT retry on 401 Unauthorized", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValue({ status: 401, message: "Unauthorized" });

      await expect(service.testExecuteWithRetry(mockFn)).rejects.toThrow();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test("should NOT retry on 403 Forbidden", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValue({ status: 403, message: "Forbidden" });

      await expect(service.testExecuteWithRetry(mockFn)).rejects.toThrow();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test("should NOT retry on 404 Not Found", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValue({ status: 404, message: "Not Found" });

      await expect(service.testExecuteWithRetry(mockFn)).rejects.toThrow();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test("should retry max 3 times then fail", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValue({ status: 500, message: "Server Error" });

      await expect(service.testExecuteWithRetry(mockFn)).rejects.toThrow();
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test("should use exponential backoff delays", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ status: 500, message: "Error" })
        .mockRejectedValueOnce({ status: 500, message: "Error" })
        .mockResolvedValue("success");

      const startTime = Date.now();
      await service.testExecuteWithRetry(mockFn);
      const duration = Date.now() - startTime;

      // Should have delays of ~1s and ~2s (with jitter)
      expect(duration).toBeGreaterThanOrEqual(2500); // 1s + 2s - jitter buffer
      expect(duration).toBeLessThan(4000); // Should complete before 3rd delay
    });
  });

  describe("Token Refresh", () => {
    test("should refresh access token when expired", async () => {
      // Mock fetch for token refresh
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "new_access_token",
          expires_in: 3600,
        }),
      } as Response);

      await expect(service.testRefreshToken()).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://oauth2.googleapis.com/token",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }),
      );
    });

    test("should throw AuthError if no refresh token", async () => {
      delete process.env.GOOGLE_REFRESH_TOKEN;

      await expect(service.testRefreshToken()).rejects.toThrow(AuthError);
    });

    test("should cache new access token after refresh", async () => {
      // Mock fetch for token refresh
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "new_access_token",
          expires_in: 3600,
        }),
      } as Response);

      await service.testRefreshToken();

      // Verify token is cached
      expect(service["accessToken"]).toBe("new_access_token");
      expect(service["tokenExpiresAt"]).toBeGreaterThan(Date.now());
    });
  });

  describe("Response Caching Layer", () => {
    test("should cache response with key", () => {
      const testData = { user: "John Doe", id: 123 };
      service.testSetCached("user:123", testData);

      const cached = service.testGetCached<typeof testData>("user:123");
      expect(cached).toEqual(testData);
    });

    test("should return null for non-existent cache key", () => {
      const cached = service.testGetCached("non-existent-key");
      expect(cached).toBeNull();
    });

    test("should handle cache TTL expiration", (done) => {
      const testData = { temp: "data" };
      service.testSetCached("temp-key", testData, 100); // 100ms TTL

      setTimeout(() => {
        const cached = service.testGetCached("temp-key");
        expect(cached).toBeNull();
        done();
      }, 150);
    });

    test("should cache different values under different keys", () => {
      service.testSetCached("key1", "value1");
      service.testSetCached("key2", "value2");

      expect(service.testGetCached("key1")).toBe("value1");
      expect(service.testGetCached("key2")).toBe("value2");
    });

    test("should overwrite cache on duplicate key", () => {
      service.testSetCached("key", "original");
      service.testSetCached("key", "updated");

      expect(service.testGetCached("key")).toBe("updated");
    });

    test("should use default TTL when not specified", () => {
      service.testSetCached("key", "value"); // Default 5 min
      expect(service.testGetCached("key")).toBe("value");
    });
  });

  describe("Error Handling", () => {
    test("should parse Google API 400 error", () => {
      const error = { status: 400, message: "Invalid parameter" };

      expect(() => service.testHandleApiError(error)).toThrow(ValidationError);
    });

    test("should parse Google API 401 error", () => {
      const error = { status: 401, message: "Token expired" };

      expect(() => service.testHandleApiError(error)).toThrow(AuthError);
    });

    test("should parse Google API 403 error", () => {
      const error = { status: 403, message: "Insufficient permissions" };

      expect(() => service.testHandleApiError(error)).toThrow(AuthError);
    });

    test("should parse Google API 404 error", () => {
      const error = { status: 404, message: "Resource not found" };

      expect(() => service.testHandleApiError(error)).toThrow(ValidationError);
    });

    test("should parse Google API 500 error", () => {
      const error = { status: 500, message: "Internal server error" };

      expect(() => service.testHandleApiError(error)).toThrow();
    });

    test("should include service name in error context", () => {
      const error = { status: 400, message: "Bad request" };

      try {
        service.testHandleApiError(error);
      } catch (err: any) {
        expect(err.message).toContain("gmail");
      }
    });

    test("should log all errors with structured metadata", () => {
      const loggerSpy = jest.spyOn(logger, "error").mockImplementation();
      const error = { status: 500, message: "Server error" };

      try {
        service.testHandleApiError(error);
      } catch {
        // Expected to throw
      }

      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });
  });

  describe("Quota Management Integration", () => {
    test("should track quota usage on API call", async () => {
      const trackSpy = jest.spyOn(service["quotaManager"], "track");
      const mockFn = jest.fn().mockResolvedValue("success");

      await service.testExecuteWithRetry(mockFn);

      expect(trackSpy).toHaveBeenCalledWith("gmail", 1);
    });

    test("should check quota before making request", async () => {
      const canMakeSpy = jest
        .spyOn(service["quotaManager"], "canMakeRequest")
        .mockReturnValue(false);

      const mockFn = jest.fn().mockResolvedValue("success");

      await expect(service.testExecuteWithRetry(mockFn)).rejects.toThrow(
        "Quota exceeded",
      );
      expect(mockFn).not.toHaveBeenCalled();

      canMakeSpy.mockRestore();
    });

    test("should enforce rate limits", async () => {
      // Simulate quota exhaustion
      jest
        .spyOn(service["quotaManager"], "canMakeRequest")
        .mockReturnValue(false);

      const mockFn = jest.fn().mockResolvedValue("data");

      await expect(service.testExecuteWithRetry(mockFn)).rejects.toThrow();
    });

    test("should log quota warnings at 80%", async () => {
      const warnSpy = jest.spyOn(logger, "warn").mockImplementation();

      // Mock 80% usage
      jest.spyOn(service["quotaManager"], "getUsage").mockReturnValue({
        minuteUsage: 200,
        dayUsage: 800_000,
        perMinuteLimit: 250,
        perDayLimit: 1_000_000,
        minuteWarning: true,
        minuteExceeded: false,
        dayWarning: true,
        dayExceeded: false,
        minuteUsagePercent: 80,
        dayUsagePercent: 80,
      });

      const mockFn = jest.fn().mockResolvedValue("success");
      await service.testExecuteWithRetry(mockFn);

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("Environment Variables", () => {
    test("should load OAuth credentials from environment", () => {
      process.env.GOOGLE_CLIENT_ID = "test_client_id";
      process.env.GOOGLE_CLIENT_SECRET = "test_client_secret";
      process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/callback";

      const newService = new TestGoogleService();

      expect(newService["credentials"]).toEqual({
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
        redirectUri: "http://localhost:3000/callback",
      });
    });

    test("should throw error if credentials are missing", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.GOOGLE_REDIRECT_URI;

      expect(() => new TestGoogleService()).toThrow();
    });
  });

  describe("Cache Key Generation", () => {
    test("should generate consistent cache keys", () => {
      const params1 = { userId: "123", filter: "active" };
      const params2 = { userId: "123", filter: "active" };

      const key1 = service["generateCacheKey"]("getUser", params1);
      const key2 = service["generateCacheKey"]("getUser", params2);

      expect(key1).toBe(key2);
    });

    test("should generate different keys for different params", () => {
      const params1 = { userId: "123" };
      const params2 = { userId: "456" };

      const key1 = service["generateCacheKey"]("getUser", params1);
      const key2 = service["generateCacheKey"]("getUser", params2);

      expect(key1).not.toBe(key2);
    });

    test("should include service name in cache key", () => {
      const key = service["generateCacheKey"]("getUser", { id: "123" });
      expect(key).toContain("gmail");
    });
  });
});
