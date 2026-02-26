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

/**
 * @file Cron Job Monitor Unit Tests
 * @description Tests for cron-job.org monitoring, Discord notifications, and alert creation
 */

import {
  startCronJobMonitoring,
  stopCronJobMonitoring,
} from "@/lib/monitoring/cronjob-monitor";
import { prisma } from "@/lib/db/prisma";
import { getCronJobs } from "@/lib/integrations/cronjob";

jest.mock("@/lib/integrations/cronjob", () => ({
  getCronJobs: jest.fn(),
  getJobExecutions: jest.fn(),
}));

jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    monitoringAlert: { create: jest.fn().mockResolvedValue({}) },
  },
}));

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("discord.js", () => ({
  Client: jest.fn(),
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
  })),
  TextChannel: jest.fn(),
}));

const flushImmediate = () => new Promise((resolve) => setImmediate(resolve));

function createMockClient(overrides: Record<string, any> = {}) {
  const mockSend = jest.fn().mockResolvedValue({});
  const mockChannel = {
    isTextBased: jest.fn().mockReturnValue(true),
    send: mockSend,
  };
  const mockGuild = {
    channels: { cache: { get: jest.fn().mockReturnValue(mockChannel) } },
  };
  const client = {
    isReady: jest.fn().mockReturnValue(true),
    guilds: { cache: { first: jest.fn().mockReturnValue(mockGuild) } },
    channels: { fetch: jest.fn().mockResolvedValue(mockChannel) },
    ...overrides,
  } as any;
  return { client, mockSend, mockChannel, mockGuild };
}

function makeJob(overrides: Record<string, any> = {}) {
  return {
    jobId: 101,
    title: "Health Check",
    url: "https://example.com/health",
    enabled: true,
    schedule: {
      timezone: "UTC",
      hours: [-1],
      mdays: [-1],
      minutes: [0, 30],
      months: [-1],
      wdays: [-1],
    },
    lastExecution: {
      date: new Date().toISOString(),
      duration: 500,
      httpStatus: 200,
      status: "OK" as const,
    },
    nextExecution: new Date(Date.now() + 1800000).toISOString(),
    ...overrides,
  };
}

describe("Cron Job Monitor", () => {
  const originalEnv = process.env.DISCORD_CHANNEL_ADMIN_LOGS;

  beforeEach(async () => {
    await flushImmediate();
    jest.clearAllMocks();
    jest.useFakeTimers({
      doNotFake: [
        "setImmediate",
        "clearImmediate",
        "setTimeout",
        "clearTimeout",
        "queueMicrotask",
        "nextTick",
        "Date",
      ],
    });
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = "test-channel-id";
    stopCronJobMonitoring();
  });

  afterEach(() => {
    stopCronJobMonitoring();
    jest.useRealTimers();
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = originalEnv;
  });

  describe("startCronJobMonitoring", () => {
    it("should run an initial check immediately", async () => {
      jest.useFakeTimers();
      (getCronJobs as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startCronJobMonitoring(client);
      expect(getCronJobs).toHaveBeenCalled();
    });

    it("should set a 10-minute polling interval", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "setInterval");
      (getCronJobs as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startCronJobMonitoring(client);
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 10 * 60 * 1000);
    });

    it("should restart when called while already running", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "clearInterval");
      (getCronJobs as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startCronJobMonitoring(client);
      startCronJobMonitoring(client);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("stopCronJobMonitoring", () => {
    it("should clear the interval", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "clearInterval");
      (getCronJobs as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startCronJobMonitoring(client);
      stopCronJobMonitoring();
      expect(spy).toHaveBeenCalled();
    });

    it("should not throw when no monitoring is active", () => {
      expect(() => stopCronJobMonitoring()).not.toThrow();
    });
  });

  describe("Job failure notifications", () => {
    it("should send notification for newly failed job execution", async () => {
      const failedJob = makeJob({
        jobId: 201,
        lastExecution: {
          date: new Date().toISOString(),
          duration: 1000,
          httpStatus: 500,
          status: "FAILED",
        },
      });
      (getCronJobs as jest.Mock).mockResolvedValue([failedJob]);
      const { client, mockSend } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
    });

    it("should create ERROR DB alert for failed job", async () => {
      const failedJob = makeJob({
        jobId: 202,
        lastExecution: {
          date: new Date().toISOString(),
          duration: 1000,
          httpStatus: 500,
          status: "FAILED",
        },
      });
      (getCronJobs as jest.Mock).mockResolvedValue([failedJob]);
      const { client } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();
      await flushImmediate();

      expect(prisma.monitoringAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "ERROR",
          severity: "ERROR",
          source: "cron-job.org",
        }),
      });
    });

    it("should NOT re-notify for same failed execution (same date)", async () => {
      const executionDate = new Date().toISOString();
      const failedJob = makeJob({
        jobId: 203,
        lastExecution: {
          date: executionDate,
          duration: 1000,
          httpStatus: 500,
          status: "FAILED",
        },
      });
      (getCronJobs as jest.Mock).mockResolvedValue([failedJob]);
      const { client, mockSend } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();
      stopCronJobMonitoring();
      const firstCount = mockSend.mock.calls.length;

      startCronJobMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalledTimes(firstCount);
    });

    it("should notify again for new failed execution (different date)", async () => {
      const failedJob1 = makeJob({
        jobId: 204,
        lastExecution: {
          date: "2026-01-01T00:00:00Z",
          duration: 1000,
          httpStatus: 500,
          status: "FAILED",
        },
      });
      const failedJob2 = makeJob({
        jobId: 204,
        lastExecution: {
          date: "2026-01-01T01:00:00Z",
          duration: 1000,
          httpStatus: 500,
          status: "FAILED",
        },
      });
      (getCronJobs as jest.Mock)
        .mockResolvedValueOnce([failedJob1])
        .mockResolvedValueOnce([failedJob2]);
      const { client, mockSend } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();
      stopCronJobMonitoring();

      startCronJobMonitoring(client);
      await flushImmediate();

      // Should have been called at least twice (once per failure)
      expect(mockSend.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("should NOT notify for successful jobs", async () => {
      const okJob = makeJob({ jobId: 205 }); // default is status: 'OK'
      (getCronJobs as jest.Mock).mockResolvedValue([okJob]);
      const { client, mockSend } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should handle job without lastExecution", async () => {
      const newJob = makeJob({ jobId: 206, lastExecution: undefined });
      (getCronJobs as jest.Mock).mockResolvedValue([newJob]);
      const { client, mockSend } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Job disabled notifications", () => {
    it("should send notification when previously enabled job becomes disabled", async () => {
      const enabledJob = makeJob({ jobId: 301, enabled: true });
      const disabledJob = makeJob({ jobId: 301, enabled: false });
      (getCronJobs as jest.Mock)
        .mockResolvedValueOnce([enabledJob])
        .mockResolvedValueOnce([disabledJob]);
      const { client, mockSend } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();
      stopCronJobMonitoring();
      mockSend.mockClear();

      startCronJobMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
    });

    it("should create WARNING DB alert when job is disabled", async () => {
      const enabledJob = makeJob({ jobId: 302, enabled: true });
      const disabledJob = makeJob({ jobId: 302, enabled: false });
      (getCronJobs as jest.Mock)
        .mockResolvedValueOnce([enabledJob])
        .mockResolvedValueOnce([disabledJob]);
      const { client } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();
      stopCronJobMonitoring();
      jest.clearAllMocks();

      startCronJobMonitoring(client);
      await flushImmediate();
      await flushImmediate();

      expect(prisma.monitoringAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "NOTIFICATION",
          severity: "WARNING",
          source: "cron-job.org",
        }),
      });
    });

    it("should NOT notify when job was already disabled", async () => {
      const disabledJob = makeJob({ jobId: 303, enabled: false });
      (getCronJobs as jest.Mock).mockResolvedValue([disabledJob]);
      const { client, mockSend } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();
      stopCronJobMonitoring();
      mockSend.mockClear();

      startCronJobMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Discord client edge cases", () => {
    it("should skip when client is not ready", async () => {
      const failedJob = makeJob({
        jobId: 401,
        lastExecution: {
          date: new Date().toISOString(),
          duration: 1000,
          httpStatus: 500,
          status: "FAILED",
        },
      });
      (getCronJobs as jest.Mock).mockResolvedValue([failedJob]);
      const { client, mockSend } = createMockClient({
        isReady: jest.fn().mockReturnValue(false),
      });

      startCronJobMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should skip when no guild is found", async () => {
      const failedJob = makeJob({
        jobId: 402,
        lastExecution: {
          date: new Date().toISOString(),
          duration: 1000,
          httpStatus: 500,
          status: "FAILED",
        },
      });
      (getCronJobs as jest.Mock).mockResolvedValue([failedJob]);
      const { client, mockSend } = createMockClient();
      client.guilds.cache.first.mockReturnValue(null);

      startCronJobMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle getCronJobs API failure gracefully", async () => {
      (getCronJobs as jest.Mock).mockRejectedValue(new Error("API error"));
      const { client, mockSend } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should handle Discord send failure gracefully", async () => {
      const failedJob = makeJob({
        jobId: 501,
        lastExecution: {
          date: new Date().toISOString(),
          duration: 1000,
          httpStatus: 500,
          status: "FAILED",
        },
      });
      (getCronJobs as jest.Mock).mockResolvedValue([failedJob]);
      const { client, mockSend } = createMockClient();
      mockSend.mockRejectedValue(new Error("Discord error"));

      startCronJobMonitoring(client);
      await flushImmediate();
    });

    it("should handle DB alert creation failure gracefully", async () => {
      const failedJob = makeJob({
        jobId: 502,
        lastExecution: {
          date: new Date().toISOString(),
          duration: 1000,
          httpStatus: 500,
          status: "FAILED",
        },
      });
      (getCronJobs as jest.Mock).mockResolvedValue([failedJob]);
      (prisma.monitoringAlert.create as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );
      const { client } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();
      await flushImmediate();
    });
  });

  describe("Cleanup", () => {
    it("should remove jobs that no longer exist from tracking", async () => {
      const job1 = makeJob({ jobId: 601 });
      const job2 = makeJob({ jobId: 602 });
      (getCronJobs as jest.Mock)
        .mockResolvedValueOnce([job1, job2])
        .mockResolvedValueOnce([job1]); // job2 removed
      const { client } = createMockClient();

      startCronJobMonitoring(client);
      await flushImmediate();
      stopCronJobMonitoring();

      startCronJobMonitoring(client);
      await flushImmediate();
    });
  });
});
