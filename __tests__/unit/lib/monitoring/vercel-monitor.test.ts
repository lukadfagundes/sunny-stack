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
 * @file Vercel Monitor Unit Tests
 * @description Tests for Vercel deployment monitoring, Discord notifications, and alert creation
 */

import {
  startVercelMonitoring,
  stopVercelMonitoring,
} from "@/lib/monitoring/vercel-monitor";
import { prisma } from "@/lib/db/prisma";
import { getRecentDeployments } from "@/lib/integrations/vercel";

jest.mock("@/lib/integrations/vercel", () => ({
  getRecentDeployments: jest.fn(),
  getFailedDeployments: jest.fn(),
  getVercelHealth: jest.fn(),
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

const { TextChannel: MockTextChannel } = require("discord.js");

const flushImmediate = () => new Promise((resolve) => setImmediate(resolve));

function createMockClient(overrides: Record<string, any> = {}) {
  const mockSend = jest.fn().mockResolvedValue({});
  const mockChannel = Object.create(MockTextChannel.prototype);
  mockChannel.isTextBased = jest.fn().mockReturnValue(true);
  mockChannel.send = mockSend;
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

// Future timestamp so deployments pass the monitoringStartTime check
const futureTimestamp = Date.now() + 60000;

function makeDeployment(overrides: Record<string, any> = {}) {
  return {
    uid: "dpl_abc123",
    name: "sunny-stack",
    url: "sunny-stack-abc123.vercel.app",
    state: "READY",
    target: "production",
    created: futureTimestamp,
    meta: {
      githubCommitMessage: "fix: update styles",
      githubCommitAuthorName: "dev",
      githubCommitSha: "abc1234567890",
    },
    ...overrides,
  };
}

describe("Vercel Monitor", () => {
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
    stopVercelMonitoring();
  });

  afterEach(() => {
    stopVercelMonitoring();
    jest.useRealTimers();
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = originalEnv;
  });

  describe("startVercelMonitoring", () => {
    it("should run an initial check immediately", async () => {
      jest.useFakeTimers();
      (getRecentDeployments as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startVercelMonitoring(client);
      expect(getRecentDeployments).toHaveBeenCalled();
    });

    it("should set a 5-minute polling interval", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "setInterval");
      (getRecentDeployments as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startVercelMonitoring(client);
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
    });

    it("should restart when called while already running", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "clearInterval");
      (getRecentDeployments as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startVercelMonitoring(client);
      startVercelMonitoring(client);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("stopVercelMonitoring", () => {
    it("should clear the interval", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "clearInterval");
      (getRecentDeployments as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startVercelMonitoring(client);
      stopVercelMonitoring();
      expect(spy).toHaveBeenCalled();
    });

    it("should not throw when no monitoring is active", () => {
      expect(() => stopVercelMonitoring()).not.toThrow();
    });
  });

  describe("Deployment failure notifications", () => {
    it("should send notification for new failed deployment", async () => {
      const failedDeploy = makeDeployment({ uid: "dpl_fail1", state: "ERROR" });
      (getRecentDeployments as jest.Mock).mockResolvedValue([failedDeploy]);
      const { client, mockSend } = createMockClient();

      startVercelMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
    });

    it("should create CRITICAL DB alert for failed deployment", async () => {
      const failedDeploy = makeDeployment({ uid: "dpl_fail2", state: "ERROR" });
      (getRecentDeployments as jest.Mock).mockResolvedValue([failedDeploy]);
      const { client } = createMockClient();

      startVercelMonitoring(client);
      await flushImmediate();
      await flushImmediate();

      expect(prisma.monitoringAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "ERROR",
          severity: "CRITICAL",
          source: "Vercel",
        }),
      });
    });

    it("should NOT re-notify for already-tracked failed deployment", async () => {
      const failedDeploy = makeDeployment({ uid: "dpl_fail3", state: "ERROR" });
      (getRecentDeployments as jest.Mock).mockResolvedValue([failedDeploy]);
      const { client, mockSend } = createMockClient();

      // First check
      startVercelMonitoring(client);
      await flushImmediate();
      stopVercelMonitoring();
      const firstCount = mockSend.mock.calls.length;

      // Second check - same deployment
      startVercelMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalledTimes(firstCount);
    });
  });

  describe("Production deployment notifications", () => {
    it("should send notification for new production deployment", async () => {
      const prodDeploy = makeDeployment({
        uid: "dpl_prod1",
        state: "READY",
        target: "production",
      });
      (getRecentDeployments as jest.Mock).mockResolvedValue([prodDeploy]);
      const { client, mockSend } = createMockClient();

      startVercelMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
    });

    it("should create INFO DB alert for production deployment", async () => {
      const prodDeploy = makeDeployment({
        uid: "dpl_prod2",
        state: "READY",
        target: "production",
      });
      (getRecentDeployments as jest.Mock).mockResolvedValue([prodDeploy]);
      const { client } = createMockClient();

      startVercelMonitoring(client);
      await flushImmediate();
      await flushImmediate();

      expect(prisma.monitoringAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "DEPLOYMENT",
          severity: "INFO",
          source: "Vercel",
        }),
      });
    });

    it("should NOT notify for preview deployments", async () => {
      const previewDeploy = makeDeployment({
        uid: "dpl_prev1",
        state: "READY",
        target: "preview",
      });
      (getRecentDeployments as jest.Mock).mockResolvedValue([previewDeploy]);
      const { client, mockSend } = createMockClient();

      startVercelMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Deployment recovery notifications", () => {
    it("should send recovery notification when deployment goes from ERROR to READY", async () => {
      const failedDeploy = makeDeployment({ uid: "dpl_rec1", state: "ERROR" });
      const recoveredDeploy = makeDeployment({
        uid: "dpl_rec1",
        state: "READY",
        target: null,
      });
      (getRecentDeployments as jest.Mock)
        .mockResolvedValueOnce([failedDeploy])
        .mockResolvedValueOnce([recoveredDeploy]);
      const { client, mockSend } = createMockClient();

      // First check - failure
      startVercelMonitoring(client);
      await flushImmediate();
      stopVercelMonitoring();
      mockSend.mockClear();

      // Second check - recovery
      startVercelMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("Old deployment filtering", () => {
    it("should NOT notify for deployments created before monitoring started", async () => {
      const oldDeploy = makeDeployment({
        uid: "dpl_old1",
        state: "ERROR",
        created: Date.now() - 60 * 60 * 1000, // 1 hour ago (before monitoring started)
      });
      (getRecentDeployments as jest.Mock).mockResolvedValue([oldDeploy]);
      const { client, mockSend } = createMockClient();

      startVercelMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Discord client edge cases", () => {
    it("should skip when client is not ready", async () => {
      const failedDeploy = makeDeployment({ uid: "dpl_edge1", state: "ERROR" });
      (getRecentDeployments as jest.Mock).mockResolvedValue([failedDeploy]);
      const { client, mockSend } = createMockClient({
        isReady: jest.fn().mockReturnValue(false),
      });

      startVercelMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should skip when no guild is found", async () => {
      const failedDeploy = makeDeployment({ uid: "dpl_edge2", state: "ERROR" });
      (getRecentDeployments as jest.Mock).mockResolvedValue([failedDeploy]);
      const { client, mockSend } = createMockClient();
      client.guilds.cache.first.mockReturnValue(null);

      startVercelMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should skip when channel is not text-based", async () => {
      const failedDeploy = makeDeployment({ uid: "dpl_edge3", state: "ERROR" });
      (getRecentDeployments as jest.Mock).mockResolvedValue([failedDeploy]);
      const { client, mockSend, mockChannel } = createMockClient();
      mockChannel.isTextBased.mockReturnValue(false);

      startVercelMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle getRecentDeployments API failure gracefully", async () => {
      (getRecentDeployments as jest.Mock).mockRejectedValue(
        new Error("API error"),
      );
      const { client, mockSend } = createMockClient();

      startVercelMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should handle Discord send failure gracefully", async () => {
      const failedDeploy = makeDeployment({ uid: "dpl_err1", state: "ERROR" });
      (getRecentDeployments as jest.Mock).mockResolvedValue([failedDeploy]);
      const { client, mockSend } = createMockClient();
      mockSend.mockRejectedValue(new Error("Discord error"));

      startVercelMonitoring(client);
      await flushImmediate();
    });

    it("should handle DB alert creation failure gracefully", async () => {
      const failedDeploy = makeDeployment({ uid: "dpl_err2", state: "ERROR" });
      (getRecentDeployments as jest.Mock).mockResolvedValue([failedDeploy]);
      (prisma.monitoringAlert.create as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );
      const { client } = createMockClient();

      startVercelMonitoring(client);
      await flushImmediate();
      await flushImmediate();
    });
  });

  describe("Map cleanup", () => {
    it("should handle large numbers of deployments without error", async () => {
      const deployments = Array.from({ length: 110 }, (_, i) =>
        makeDeployment({
          uid: `dpl_bulk_${i}`,
          state: "READY",
          target: "preview",
        }),
      );
      (getRecentDeployments as jest.Mock).mockResolvedValue(deployments);
      const { client } = createMockClient();

      startVercelMonitoring(client);
      await flushImmediate();
    });
  });
});
