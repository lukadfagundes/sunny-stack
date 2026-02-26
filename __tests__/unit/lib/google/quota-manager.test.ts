/**
 * @jest-environment node
 */

// Polyfill timer functions for jsdom environment (next/jest overrides @jest-environment)
if (typeof globalThis.setInterval === "undefined") {
  globalThis.setInterval = ((fn: Function, ms: number) =>
    setTimeout(fn, ms)) as any;
  globalThis.clearInterval = ((id: any) => clearTimeout(id)) as any;
}
if (typeof globalThis.setImmediate === "undefined") {
  globalThis.setImmediate = ((fn: Function, ...args: any[]) =>
    setTimeout(fn, 0, ...args)) as any;
  globalThis.clearImmediate = ((id: any) => clearTimeout(id)) as any;
}

// __tests__/unit/lib/google/quota-manager.test.ts

/**
 * Comprehensive test suite for GoogleQuotaManager
 * Tests quota tracking, rate limiting, warning thresholds,
 * auto-reset functionality, and timer lifecycle management.
 */

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
  default: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

import {
  GoogleQuotaManager,
  GOOGLE_QUOTA_LIMITS,
  type QuotaUsage,
  type GoogleServiceName,
} from "@/lib/google/quota-manager";
import { logger } from "@/lib/logger";

describe("GoogleQuotaManager", () => {
  let manager: GoogleQuotaManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({
      doNotFake: [
        "setImmediate",
        "clearImmediate",
        "queueMicrotask",
        "nextTick",
        "Date",
      ],
    });
    manager = new GoogleQuotaManager();
  });

  afterEach(() => {
    manager.destroy();
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // GOOGLE_QUOTA_LIMITS constant
  // ---------------------------------------------------------------------------
  describe("GOOGLE_QUOTA_LIMITS", () => {
    it("should contain all expected services", () => {
      // ARRANGE
      const expectedServices: GoogleServiceName[] = [
        "gmail",
        "drive",
        "calendar",
        "sheets",
        "docs",
        "tasks",
        "contacts",
      ];

      // ACT
      const actualServices = Object.keys(GOOGLE_QUOTA_LIMITS);

      // ASSERT
      expectedServices.forEach((service) => {
        expect(actualServices).toContain(service);
      });
      expect(actualServices).toHaveLength(expectedServices.length);
    });

    it("should have correct limits for gmail", () => {
      // ASSERT
      expect(GOOGLE_QUOTA_LIMITS.gmail.perMinute).toBe(250);
      expect(GOOGLE_QUOTA_LIMITS.gmail.perDay).toBe(1_000_000);
    });

    it("should have correct limits for drive", () => {
      expect(GOOGLE_QUOTA_LIMITS.drive.perMinute).toBe(1000);
      expect(GOOGLE_QUOTA_LIMITS.drive.perDay).toBe(10_000_000);
    });

    it("should have correct limits for calendar", () => {
      expect(GOOGLE_QUOTA_LIMITS.calendar.perMinute).toBe(600);
      expect(GOOGLE_QUOTA_LIMITS.calendar.perDay).toBe(1_000_000);
    });

    it("should have correct limits for sheets", () => {
      expect(GOOGLE_QUOTA_LIMITS.sheets.perMinute).toBe(100);
      expect(GOOGLE_QUOTA_LIMITS.sheets.perDay).toBe(500_000);
    });

    it("should have correct limits for docs", () => {
      expect(GOOGLE_QUOTA_LIMITS.docs.perMinute).toBe(100);
      expect(GOOGLE_QUOTA_LIMITS.docs.perDay).toBe(500_000);
    });

    it("should have correct limits for tasks", () => {
      expect(GOOGLE_QUOTA_LIMITS.tasks.perMinute).toBe(100);
      expect(GOOGLE_QUOTA_LIMITS.tasks.perDay).toBe(50_000);
    });

    it("should have correct limits for contacts", () => {
      expect(GOOGLE_QUOTA_LIMITS.contacts.perMinute).toBe(60);
      expect(GOOGLE_QUOTA_LIMITS.contacts.perDay).toBe(10_000);
    });
  });

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------
  describe("constructor", () => {
    it("should create instance successfully", () => {
      // ASSERT
      expect(manager).toBeInstanceOf(GoogleQuotaManager);
    });

    it("should return zero usage for all services after construction", () => {
      // ARRANGE
      const allServices: GoogleServiceName[] = [
        "gmail",
        "drive",
        "calendar",
        "sheets",
        "docs",
        "tasks",
        "contacts",
      ];

      // ACT & ASSERT
      allServices.forEach((service) => {
        const usage = manager.getUsage(service);
        expect(usage.minuteUsage).toBe(0);
        expect(usage.dayUsage).toBe(0);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // track()
  // ---------------------------------------------------------------------------
  describe("track()", () => {
    it("should track a single API call for a service", () => {
      // ACT
      manager.track("gmail", 10);

      // ASSERT
      const usage = manager.getUsage("gmail");
      expect(usage.minuteUsage).toBe(10);
      expect(usage.dayUsage).toBe(10);
    });

    it("should accumulate multiple API calls", () => {
      // ACT
      manager.track("gmail", 5);
      manager.track("gmail", 10);
      manager.track("gmail", 15);

      // ASSERT
      const usage = manager.getUsage("gmail");
      expect(usage.minuteUsage).toBe(30);
      expect(usage.dayUsage).toBe(30);
    });

    it("should throw error for unknown service name", () => {
      // ACT & ASSERT
      expect(() => {
        manager.track("invalid" as any, 1);
      }).toThrow("Unknown Google service: invalid");
    });

    it("should throw error for negative cost", () => {
      // ACT & ASSERT
      expect(() => {
        manager.track("gmail", -1);
      }).toThrow("Quota cost cannot be negative");
    });

    it("should return early (no-op) for cost = 0", () => {
      // ACT
      manager.track("gmail", 0);

      // ASSERT
      const usage = manager.getUsage("gmail");
      expect(usage.minuteUsage).toBe(0);
      expect(usage.dayUsage).toBe(0);
    });

    it("should log warning when minute usage hits 80%", () => {
      // ARRANGE
      const warningThreshold = Math.ceil(
        GOOGLE_QUOTA_LIMITS.gmail.perMinute * 0.8,
      ); // 200

      // ACT
      manager.track("gmail", warningThreshold);

      // ASSERT
      expect(logger.warn).toHaveBeenCalledWith(
        "Google API quota warning",
        expect.objectContaining({
          service: "gmail",
          type: "per-minute",
        }),
      );
    });

    it("should track different services independently", () => {
      // ACT
      manager.track("gmail", 10);
      manager.track("drive", 20);
      manager.track("calendar", 30);

      // ASSERT
      expect(manager.getUsage("gmail").minuteUsage).toBe(10);
      expect(manager.getUsage("drive").minuteUsage).toBe(20);
      expect(manager.getUsage("calendar").minuteUsage).toBe(30);
    });
  });

  // ---------------------------------------------------------------------------
  // getUsage()
  // ---------------------------------------------------------------------------
  describe("getUsage()", () => {
    it("should return zero usage for a valid service initially", () => {
      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.minuteUsage).toBe(0);
      expect(usage.dayUsage).toBe(0);
      expect(usage.minuteUsagePercent).toBe(0);
      expect(usage.dayUsagePercent).toBe(0);
    });

    it("should return updated usage after tracking", () => {
      // ARRANGE
      manager.track("gmail", 50);

      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.minuteUsage).toBe(50);
      expect(usage.dayUsage).toBe(50);
    });

    it("should calculate correct minuteUsagePercent", () => {
      // ARRANGE - track 125 of 250 = 50%
      manager.track("gmail", 125);

      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.minuteUsagePercent).toBe(50);
    });

    it("should set minuteWarning true at 80%+ usage", () => {
      // ARRANGE - 200 of 250 = 80%
      manager.track("gmail", 200);

      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.minuteWarning).toBe(true);
      expect(usage.minuteExceeded).toBe(false);
    });

    it("should set minuteExceeded true at 100%+ usage", () => {
      // ARRANGE - 250 of 250 = 100%
      manager.track("gmail", 250);

      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.minuteExceeded).toBe(true);
      expect(usage.minuteWarning).toBe(true);
    });

    it("should set dayWarning true at 80%+ usage", () => {
      // ARRANGE - 800_000 of 1_000_000 = 80%
      manager.track("gmail", 800_000);

      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.dayWarning).toBe(true);
      expect(usage.dayExceeded).toBe(false);
    });

    it("should set dayExceeded true at 100%+ usage", () => {
      // ARRANGE - 1_000_000 of 1_000_000 = 100%
      manager.track("gmail", 1_000_000);

      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.dayExceeded).toBe(true);
      expect(usage.dayWarning).toBe(true);
    });

    it("should throw error for unknown service name", () => {
      // ACT & ASSERT
      expect(() => {
        manager.getUsage("nonexistent" as any);
      }).toThrow("Unknown Google service: nonexistent");
    });

    it("should return correct limits alongside usage data", () => {
      // ACT
      const usage = manager.getUsage("sheets");

      // ASSERT
      expect(usage.perMinuteLimit).toBe(GOOGLE_QUOTA_LIMITS.sheets.perMinute);
      expect(usage.perDayLimit).toBe(GOOGLE_QUOTA_LIMITS.sheets.perDay);
    });

    it("should return a complete QuotaUsage object with all fields", () => {
      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage).toHaveProperty("minuteUsage");
      expect(usage).toHaveProperty("dayUsage");
      expect(usage).toHaveProperty("perMinuteLimit");
      expect(usage).toHaveProperty("perDayLimit");
      expect(usage).toHaveProperty("minuteWarning");
      expect(usage).toHaveProperty("minuteExceeded");
      expect(usage).toHaveProperty("dayWarning");
      expect(usage).toHaveProperty("dayExceeded");
      expect(usage).toHaveProperty("minuteUsagePercent");
      expect(usage).toHaveProperty("dayUsagePercent");
    });
  });

  // ---------------------------------------------------------------------------
  // canMakeRequest()
  // ---------------------------------------------------------------------------
  describe("canMakeRequest()", () => {
    it("should return true when under limits", () => {
      // ARRANGE
      manager.track("gmail", 100);

      // ACT
      const result = manager.canMakeRequest("gmail", 50);

      // ASSERT
      expect(result).toBe(true);
    });

    it("should return false when request would exceed minute limit", () => {
      // ARRANGE - use up 240 of 250 minute quota
      manager.track("gmail", 240);

      // ACT - try to use 20 more (240 + 20 = 260 > 250)
      const result = manager.canMakeRequest("gmail", 20);

      // ASSERT
      expect(result).toBe(false);
    });

    it("should return false when request would exceed day limit", () => {
      // ARRANGE - use up near the day limit
      manager.track("gmail", 999_990);

      // ACT - try to use 20 more (999_990 + 20 = 1_000_010 > 1_000_000)
      const result = manager.canMakeRequest("gmail", 20);

      // ASSERT
      expect(result).toBe(false);
    });

    it("should return true for service not yet tracked but still valid", () => {
      // ACT - contacts has not been tracked yet, but the manager initializes
      // all services in constructor so it will be tracked with 0 usage
      const result = manager.canMakeRequest("contacts", 1);

      // ASSERT
      expect(result).toBe(true);
    });

    it("should return true when request is exactly at the limit boundary", () => {
      // ARRANGE
      manager.track("gmail", 249);

      // ACT - 249 + 1 = 250 which equals the limit, not exceeds it
      const result = manager.canMakeRequest("gmail", 1);

      // ASSERT
      expect(result).toBe(true);
    });

    it("should return false when request would exceed limit by 1", () => {
      // ARRANGE
      manager.track("gmail", 250);

      // ACT - 250 + 1 = 251 > 250
      const result = manager.canMakeRequest("gmail", 1);

      // ASSERT
      expect(result).toBe(false);
    });

    it("should return false for very large quota requests", () => {
      // ACT
      const result = manager.canMakeRequest("gmail", 1_000_000_000);

      // ASSERT
      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // resetMinutely()
  // ---------------------------------------------------------------------------
  describe("resetMinutely()", () => {
    it("should reset minute usage to 0 for all services", () => {
      // ARRANGE
      manager.track("gmail", 50);
      manager.track("drive", 100);
      manager.track("calendar", 150);

      // ACT
      manager.resetMinutely();

      // ASSERT
      expect(manager.getUsage("gmail").minuteUsage).toBe(0);
      expect(manager.getUsage("drive").minuteUsage).toBe(0);
      expect(manager.getUsage("calendar").minuteUsage).toBe(0);
    });

    it("should preserve day usage when resetting minute usage", () => {
      // ARRANGE
      manager.track("gmail", 100);

      // ACT
      manager.resetMinutely();

      // ASSERT
      const usage = manager.getUsage("gmail");
      expect(usage.minuteUsage).toBe(0);
      expect(usage.dayUsage).toBe(100);
    });

    it("should call logger.debug for each service reset", () => {
      // ARRANGE
      manager.track("gmail", 10);

      // ACT
      manager.resetMinutely();

      // ASSERT
      expect(logger.debug).toHaveBeenCalledWith(
        "Resetting per-minute quota",
        expect.objectContaining({
          service: "gmail",
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // resetDaily()
  // ---------------------------------------------------------------------------
  describe("resetDaily()", () => {
    it("should reset day usage to 0 for all services", () => {
      // ARRANGE
      manager.track("gmail", 1000);
      manager.track("drive", 2000);

      // ACT
      manager.resetDaily();

      // ASSERT
      expect(manager.getUsage("gmail").dayUsage).toBe(0);
      expect(manager.getUsage("drive").dayUsage).toBe(0);
    });

    it("should preserve minute usage when resetting day usage", () => {
      // ARRANGE
      manager.track("gmail", 100);

      // ACT
      manager.resetDaily();

      // ASSERT
      const usage = manager.getUsage("gmail");
      expect(usage.minuteUsage).toBe(100);
      expect(usage.dayUsage).toBe(0);
    });

    it("should call logger.info for each service reset", () => {
      // ARRANGE
      manager.track("gmail", 10);

      // ACT
      manager.resetDaily();

      // ASSERT
      expect(logger.info).toHaveBeenCalledWith(
        "Resetting per-day quota",
        expect.objectContaining({
          service: "gmail",
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // destroy()
  // ---------------------------------------------------------------------------
  describe("destroy()", () => {
    it("should clear all timers without error", () => {
      // ACT & ASSERT
      expect(() => {
        manager.destroy();
      }).not.toThrow();
    });

    it("should be callable multiple times safely", () => {
      // ACT & ASSERT
      expect(() => {
        manager.destroy();
        manager.destroy();
        manager.destroy();
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Quota Usage Percentage Calculations
  // ---------------------------------------------------------------------------
  describe("Quota Usage Percentage", () => {
    it("should calculate minute usage percentage correctly", () => {
      // ARRANGE - 125 of 250 = 50%
      manager.track("gmail", 125);

      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.minuteUsagePercent).toBe(50);
    });

    it("should calculate day usage percentage correctly", () => {
      // ARRANGE - 500_000 of 1_000_000 = 50%
      manager.track("gmail", 500_000);

      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.dayUsagePercent).toBe(50);
    });

    it("should handle 0% usage", () => {
      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.minuteUsagePercent).toBe(0);
      expect(usage.dayUsagePercent).toBe(0);
    });

    it("should handle 100% minute usage", () => {
      // ARRANGE
      manager.track("gmail", 250);

      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.minuteUsagePercent).toBe(100);
    });

    it("should handle over-100% usage (exceeding limits)", () => {
      // ARRANGE - track more than the limit
      manager.track("gmail", 300);

      // ACT
      const usage = manager.getUsage("gmail");

      // ASSERT
      expect(usage.minuteUsagePercent).toBe(120); // 300/250 * 100 = 120
      expect(usage.minuteExceeded).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Warning Thresholds (logger integration)
  // ---------------------------------------------------------------------------
  describe("Warning Thresholds", () => {
    it("should not log warning below 80% minute usage", () => {
      // ARRANGE - 199 of 250 = 79.6%, rounds to 80% but let's use 79%
      // Actually 199/250 = 79.6 which Math.round gives 80 -- use 197 = 78.8 -> 79
      manager.track("gmail", 197);

      // ASSERT
      expect(logger.warn).not.toHaveBeenCalledWith(
        "Google API quota warning",
        expect.objectContaining({
          service: "gmail",
          type: "per-minute",
        }),
      );
    });

    it("should log per-minute warning at 80% threshold", () => {
      // ARRANGE - 200 of 250 = 80%
      manager.track("gmail", 200);

      // ASSERT
      expect(logger.warn).toHaveBeenCalledWith(
        "Google API quota warning",
        expect.objectContaining({
          service: "gmail",
          type: "per-minute",
          usage: 200,
          limit: 250,
          percent: 80,
        }),
      );
    });

    it("should log per-day warning at 80% threshold", () => {
      // ARRANGE - 800_000 of 1_000_000 = 80%
      manager.track("gmail", 800_000);

      // ASSERT
      expect(logger.warn).toHaveBeenCalledWith(
        "Google API quota warning",
        expect.objectContaining({
          service: "gmail",
          type: "per-day",
          usage: 800_000,
          limit: 1_000_000,
          percent: 80,
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Auto-Reset Timer Integration
  // ---------------------------------------------------------------------------
  describe("Auto-Reset Timer Integration", () => {
    it("should auto-reset minute quotas after 60 seconds", () => {
      // ARRANGE
      manager.track("gmail", 100);

      // ACT - advance time by 60 seconds
      jest.advanceTimersByTime(60_000);

      // ASSERT - minute usage should be reset
      const usage = manager.getUsage("gmail");
      expect(usage.minuteUsage).toBe(0);
      expect(usage.dayUsage).toBe(100); // day usage preserved
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe("Edge Cases", () => {
    it("should handle tracking with cost of 1", () => {
      // ACT
      manager.track("gmail", 1);

      // ASSERT
      const usage = manager.getUsage("gmail");
      expect(usage.minuteUsage).toBe(1);
      expect(usage.dayUsage).toBe(1);
    });

    it("should handle tracking with very large cost", () => {
      // ACT
      manager.track("gmail", 999_999);

      // ASSERT
      const usage = manager.getUsage("gmail");
      expect(usage.minuteUsage).toBe(999_999);
      expect(usage.dayUsage).toBe(999_999);
    });

    it("should handle all services being tracked simultaneously", () => {
      // ARRANGE & ACT
      const services: GoogleServiceName[] = [
        "gmail",
        "drive",
        "calendar",
        "sheets",
        "docs",
        "tasks",
        "contacts",
      ];

      services.forEach((service) => {
        manager.track(service, 10);
      });

      // ASSERT
      services.forEach((service) => {
        const usage = manager.getUsage(service);
        expect(usage.minuteUsage).toBe(10);
        expect(usage.dayUsage).toBe(10);
      });
    });

    it("should return correct usage after multiple resets", () => {
      // ARRANGE
      manager.track("gmail", 100);
      manager.resetMinutely();
      manager.track("gmail", 50);
      manager.resetMinutely();
      manager.track("gmail", 25);

      // ASSERT
      const usage = manager.getUsage("gmail");
      expect(usage.minuteUsage).toBe(25);
      expect(usage.dayUsage).toBe(175); // 100 + 50 + 25
    });
  });
});
