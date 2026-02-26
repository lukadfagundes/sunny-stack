// __tests__/unit/lib/config-validate.test.ts

import {
  validateConfig,
  validateConfigOrThrow,
  printConfigSummary,
  ValidationResult,
} from "@/lib/config-validate";

// ---------------------------------------------------------------------------
// Test data: all required env vars with valid values
// ---------------------------------------------------------------------------
const validEnv: Record<string, string> = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  NEXTAUTH_URL: "http://localhost:3000",
  NEXTAUTH_SECRET: "a".repeat(32),
  NODE_ENV: "test",
  ADMIN_ROUTE_HASH: "a".repeat(64),
  ADMIN_EMAIL: "admin@example.com",
  GOOGLE_CLIENT_ID: "client-id-123",
  GOOGLE_CLIENT_SECRET: "client-secret-123",
  GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/callback",
  GOOGLE_PROJECT_ID: "my-project",
  DISCORD_BOT_TOKEN: "a".repeat(50),
  DISCORD_APPLICATION_ID: "123456789012345678",
  DISCORD_GUILD_ID: "123456789012345678",
  DISCORD_ADMIN_USER_ID: "123456789012345678",
  DISCORD_CHANNEL_ADMIN_LOGS: "123456789012345678",
  DISCORD_CHANNEL_BOT_COMMANDS: "123456789012345678",
  DISCORD_CHANNEL_ACTIVE_PROJECTS: "123456789012345678",
  DISCORD_CHANNEL_PROPOSALS: "123456789012345678",
  DISCORD_CHANNEL_TASKS: "123456789012345678",
  DISCORD_CHANNEL_TIME_TRACKING: "123456789012345678",
  DISCORD_CHANNEL_CLIENT_INQUIRIES: "123456789012345678",
  DISCORD_CHANNEL_CLIENT_UPDATES: "123456789012345678",
  DISCORD_CHANNEL_CALENDAR_SYNC: "123456789012345678",
  DISCORD_CHANNEL_EMAIL_NOTIFICATIONS: "123456789012345678",
  DISCORD_CHANNEL_ANALYTICS: "123456789012345678",
  DISCORD_CHANNEL_INVOICES: "123456789012345678",
  DISCORD_CHANNEL_PAYMENTS: "123456789012345678",
  BOT_API_KEY: "b".repeat(32),
  BOT_API_URL: "http://localhost:3001",
  RESEND_API_KEY: "re_test123456789",
  GITHUB_API_TOKEN: "ghp_" + "x".repeat(36),
  VERCEL_API_TOKEN: "v".repeat(20),
};

describe("config-validate", () => {
  // Save original process.env before each test and restore it afterwards so
  // that tests are fully isolated from one another and from the host
  // environment.
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Start from a clean copy and apply all valid vars
    process.env = { ...originalEnv };
    Object.assign(process.env, validEnv);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // =========================================================================
  // validateConfig()
  // =========================================================================
  describe("validateConfig", () => {
    test("returns valid when all required env vars are set correctly", () => {
      // ARRANGE - validEnv already applied in beforeEach

      // ACT
      const result: ValidationResult = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("returns errors when DATABASE_URL is missing", () => {
      // ARRANGE
      delete process.env.DATABASE_URL;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.errors.some((e) => e.includes("DATABASE_URL"))).toBe(true);
    });

    test("returns errors when DATABASE_URL is not a valid URL", () => {
      // ARRANGE
      process.env.DATABASE_URL = "not-a-valid-url";

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("DATABASE_URL"))).toBe(true);
    });

    test("returns errors when NEXTAUTH_SECRET is too short (< 32 chars)", () => {
      // ARRANGE
      process.env.NEXTAUTH_SECRET = "short";

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("NEXTAUTH_SECRET"))).toBe(
        true,
      );
    });

    test("returns errors when ADMIN_ROUTE_HASH is wrong length (not 64)", () => {
      // ARRANGE
      process.env.ADMIN_ROUTE_HASH = "a".repeat(10);

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("ADMIN_ROUTE_HASH"))).toBe(
        true,
      );
    });

    test("returns errors when ADMIN_EMAIL is invalid email format", () => {
      // ARRANGE
      process.env.ADMIN_EMAIL = "not-an-email";

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("ADMIN_EMAIL"))).toBe(true);
    });

    test('returns errors when RESEND_API_KEY does not start with "re_"', () => {
      // ARRANGE
      process.env.RESEND_API_KEY = "invalid_key_no_prefix";

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("RESEND_API_KEY"))).toBe(
        true,
      );
    });

    test("returns warnings for missing optional vars (FLY_API_TOKEN etc.)", () => {
      // ARRANGE - optional vars are not set (not in validEnv)
      // They should already be absent, but make sure by deleting them explicitly
      delete process.env.FLY_API_TOKEN;
      delete process.env.FLY_ORG_SLUG;
      delete process.env.CLOUDFLARE_API_TOKEN;
      delete process.env.CLOUDFLARE_ZONE_ID;
      delete process.env.CRONJOB_API_KEY;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(5);
      expect(result.warnings.some((w) => w.includes("FLY_API_TOKEN"))).toBe(
        true,
      );
      expect(result.warnings.some((w) => w.includes("FLY_ORG_SLUG"))).toBe(
        true,
      );
      expect(
        result.warnings.some((w) => w.includes("CLOUDFLARE_API_TOKEN")),
      ).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("CLOUDFLARE_ZONE_ID")),
      ).toBe(true);
      expect(result.warnings.some((w) => w.includes("CRONJOB_API_KEY"))).toBe(
        true,
      );
    });

    test("returns correct summary counts (total, configured, missing, optional)", () => {
      // ARRANGE - all required vars set, explicitly remove optional vars
      delete process.env.FLY_API_TOKEN;
      delete process.env.FLY_ORG_SLUG;
      delete process.env.CLOUDFLARE_API_TOKEN;
      delete process.env.CLOUDFLARE_ZONE_ID;
      delete process.env.CRONJOB_API_KEY;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.summary.total).toBeGreaterThan(0);
      expect(result.summary.configured).toBeGreaterThan(0);
      // All required vars are set; only optional vars are missing
      expect(result.summary.missing).toBe(
        result.summary.total - result.summary.configured,
      );
      // 5 optional vars are not set
      expect(result.summary.optional).toBe(5);
    });

    test("returns errors for multiple missing fields", () => {
      // ARRANGE
      delete process.env.DATABASE_URL;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.ADMIN_EMAIL;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors.some((e) => e.includes("DATABASE_URL"))).toBe(true);
      expect(result.errors.some((e) => e.includes("NEXTAUTH_SECRET"))).toBe(
        true,
      );
      expect(result.errors.some((e) => e.includes("ADMIN_EMAIL"))).toBe(true);
    });
  });

  // =========================================================================
  // validateConfigOrThrow()
  // =========================================================================
  describe("validateConfigOrThrow", () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    test("does NOT throw when config is valid", () => {
      // ARRANGE - validEnv already applied

      // ACT & ASSERT
      expect(() => validateConfigOrThrow()).not.toThrow();
    });

    test("throws Error with formatted message when config is invalid", () => {
      // ARRANGE
      delete process.env.DATABASE_URL;

      // ACT & ASSERT
      expect(() => validateConfigOrThrow()).toThrow(Error);

      try {
        validateConfigOrThrow();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        expect(message).toContain("Configuration validation failed");
        expect(message).toContain("DATABASE_URL");
        expect(message).toContain("Errors:");
      }
    });

    test("logs warnings to console.warn when config has warnings but is valid", () => {
      // ARRANGE - optional vars not set produces warnings
      delete process.env.FLY_API_TOKEN;

      // ACT
      validateConfigOrThrow();

      // ASSERT
      expect(consoleWarnSpy).toHaveBeenCalled();
      const warnCalls = consoleWarnSpy.mock.calls.flat().join(" ");
      expect(warnCalls).toContain("Configuration warnings");
    });

    test("logs success message to console.log when valid", () => {
      // ARRANGE - validEnv already applied

      // ACT
      validateConfigOrThrow();

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalled();
      const logCalls = consoleLogSpy.mock.calls.flat().join(" ");
      expect(logCalls).toContain("Configuration validation passed");
    });
  });

  // =========================================================================
  // printConfigSummary()
  // =========================================================================
  describe("printConfigSummary", () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    test("prints all categories to console.log", () => {
      // ARRANGE - validEnv already applied

      // ACT
      printConfigSummary();

      // ASSERT
      const output = consoleLogSpy.mock.calls.flat().join(" ");
      expect(output).toContain("Database:");
      expect(output).toContain("Authentication:");
      expect(output).toContain("Google OAuth:");
      expect(output).toContain("Discord Bot:");
      expect(output).toContain("Discord Channels");
      expect(output).toContain("Deployment");
      expect(output).toContain("Infrastructure Monitoring");
    });

    test('shows "Set" for configured vars and "Missing" for unconfigured', () => {
      // ARRANGE
      delete process.env.GITHUB_API_TOKEN;

      // ACT
      printConfigSummary();

      // ASSERT
      const output = consoleLogSpy.mock.calls.flat().join(" ");
      // DATABASE_URL is set
      expect(output).toContain("DATABASE_URL");
      expect(output).toMatch(/DATABASE_URL.*Set/);
      // GITHUB_API_TOKEN is missing
      expect(output).toContain("GITHUB_API_TOKEN");
      expect(output).toMatch(/GITHUB_API_TOKEN.*Missing/);
    });

    test("shows channel count", () => {
      // ARRANGE - all 13 channels configured via validEnv

      // ACT
      printConfigSummary();

      // ASSERT
      const output = consoleLogSpy.mock.calls.flat().join(" ");
      expect(output).toContain("13/13 channels configured");
    });
  });
});
