/**
 * @file Rollbar Unit Tests
 * @description Tests for Rollbar error tracking helpers and environment-aware behavior
 */

// We need to mock rollbar before importing the module under test
const mockRollbarInstance = {
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};

jest.mock("rollbar", () => {
  return jest.fn().mockImplementation(() => mockRollbarInstance);
});

describe("Rollbar", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  describe("rollbar instance", () => {
    it("should export a rollbar instance", () => {
      const { rollbar } = require("@/lib/monitoring/rollbar");
      expect(rollbar).toBeDefined();
    });

    it("should configure rollbar with correct environment", () => {
      const Rollbar = require("rollbar");
      require("@/lib/monitoring/rollbar");
      expect(Rollbar).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: expect.any(String),
        }),
      );
    });

    it("should configure captureUncaught and captureUnhandledRejections", () => {
      const Rollbar = require("rollbar");
      require("@/lib/monitoring/rollbar");
      expect(Rollbar).toHaveBeenCalledWith(
        expect.objectContaining({
          captureUncaught: true,
          captureUnhandledRejections: true,
        }),
      );
    });
  });

  describe("logError", () => {
    it("should call rollbar.error in production", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { logError } = require("@/lib/monitoring/rollbar");
      const error = new Error("test error");
      const context = { userId: "123" };

      logError(error, context);

      expect(mockRollbarInstance.error).toHaveBeenCalledWith(error, context);
    });

    it("should log to console.error in development", () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const { logError } = require("@/lib/monitoring/rollbar");
      const error = new Error("test error");

      logError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Rollbar Mock]",
        error,
        undefined,
      );
      consoleSpy.mockRestore();
    });

    it("should do nothing in test environment", () => {
      process.env.NODE_ENV = "test";
      jest.resetModules();
      mockRollbarInstance.error.mockClear();
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const { logError } = require("@/lib/monitoring/rollbar");

      logError(new Error("test"));

      expect(mockRollbarInstance.error).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should pass context to rollbar.error in production", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { logError } = require("@/lib/monitoring/rollbar");
      const error = new Error("context error");
      const context = { action: "save", resourceId: "456" };

      logError(error, context);

      expect(mockRollbarInstance.error).toHaveBeenCalledWith(error, context);
    });
  });

  describe("logWarning", () => {
    it("should call rollbar.warning in production", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { logWarning } = require("@/lib/monitoring/rollbar");

      logWarning("slow query detected", { query: "SELECT *" });

      expect(mockRollbarInstance.warning).toHaveBeenCalledWith(
        "slow query detected",
        { query: "SELECT *" },
      );
    });

    it("should log to console.warn in development", () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const { logWarning } = require("@/lib/monitoring/rollbar");

      logWarning("slow query");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Rollbar Mock]",
        "slow query",
        undefined,
      );
      consoleSpy.mockRestore();
    });

    it("should do nothing in test environment", () => {
      process.env.NODE_ENV = "test";
      jest.resetModules();
      mockRollbarInstance.warning.mockClear();
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const { logWarning } = require("@/lib/monitoring/rollbar");

      logWarning("test warning");

      expect(mockRollbarInstance.warning).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("logInfo", () => {
    it("should call rollbar.info in production", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { logInfo } = require("@/lib/monitoring/rollbar");

      logInfo("deployment complete", { version: "1.0.0" });

      expect(mockRollbarInstance.info).toHaveBeenCalledWith(
        "deployment complete",
        { version: "1.0.0" },
      );
    });

    it("should log to console.info in development", () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();
      const { logInfo } = require("@/lib/monitoring/rollbar");

      logInfo("deploy complete");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Rollbar Mock]",
        "deploy complete",
        undefined,
      );
      consoleSpy.mockRestore();
    });

    it("should do nothing in test environment", () => {
      process.env.NODE_ENV = "test";
      jest.resetModules();
      mockRollbarInstance.info.mockClear();
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();
      const { logInfo } = require("@/lib/monitoring/rollbar");

      logInfo("test info");

      expect(mockRollbarInstance.info).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Configuration", () => {
    it("should use ROLLBAR_ACCESS_TOKEN from env or fallback", () => {
      const Rollbar = require("rollbar");
      require("@/lib/monitoring/rollbar");
      const callArgs = Rollbar.mock.calls[0][0];
      expect(callArgs.accessToken).toBeDefined();
    });

    it("should include code_version in payload", () => {
      const Rollbar = require("rollbar");
      require("@/lib/monitoring/rollbar");
      const callArgs = Rollbar.mock.calls[0][0];
      expect(callArgs.payload).toBeDefined();
      expect(callArgs.payload.code_version).toBeDefined();
    });

    it("should configure source map settings for client", () => {
      const Rollbar = require("rollbar");
      require("@/lib/monitoring/rollbar");
      const callArgs = Rollbar.mock.calls[0][0];
      expect(callArgs.payload.client.javascript.source_map_enabled).toBe(true);
    });
  });
});
