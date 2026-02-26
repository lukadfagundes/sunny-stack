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
 * @file Cloudflare Monitor Unit Tests
 * @description Tests for Cloudflare zone/SSL monitoring, Discord notifications, and alert creation
 */

import {
  startCloudflareMonitoring,
  stopCloudflareMonitoring,
} from "@/lib/monitoring/cloudflare-monitor";
import { prisma } from "@/lib/db/prisma";
import { getZone, getSSLStatus } from "@/lib/integrations/cloudflare";

jest.mock("@/lib/integrations/cloudflare", () => ({
  getZone: jest.fn(),
  getSSLStatus: jest.fn(),
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

const activeZone = { name: "example.com", status: "active", paused: false };
const pausedZone = { name: "example.com", status: "active", paused: true };
const pendingZone = { name: "example.com", status: "pending", paused: false };

const validSSLCert = {
  type: "universal",
  status: "active",
  expires_on: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  hosts: ["example.com", "*.example.com"],
};
const expiringSSLCert = {
  type: "universal",
  status: "active",
  expires_on: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  hosts: ["example.com", "*.example.com"],
};
const inactiveSSLCert = {
  type: "universal",
  status: "pending",
  expires_on: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  hosts: ["example.com"],
};

describe("Cloudflare Monitor", () => {
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
    stopCloudflareMonitoring();
  });

  afterEach(() => {
    stopCloudflareMonitoring();
    jest.useRealTimers();
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = originalEnv;
  });

  describe("startCloudflareMonitoring", () => {
    it("should run an initial check immediately", async () => {
      jest.useFakeTimers();
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([validSSLCert]);
      const { client } = createMockClient();
      startCloudflareMonitoring(client);
      expect(getZone).toHaveBeenCalled();
    });

    it("should set a 10-minute polling interval", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "setInterval");
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startCloudflareMonitoring(client);
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 10 * 60 * 1000);
    });

    it("should restart when called while already running", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "clearInterval");
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startCloudflareMonitoring(client);
      startCloudflareMonitoring(client);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("stopCloudflareMonitoring", () => {
    it("should clear the interval", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "clearInterval");
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startCloudflareMonitoring(client);
      stopCloudflareMonitoring();
      expect(spy).toHaveBeenCalled();
    });

    it("should not throw when no monitoring is active", () => {
      expect(() => stopCloudflareMonitoring()).not.toThrow();
    });
  });

  describe("Zone status change notifications", () => {
    it("should NOT send notification when zone status is same as previous", async () => {
      // Establish baseline state first
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      stopCloudflareMonitoring();
      mockSend.mockClear();
      // Second check with same zone status — should not notify
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should send notification when zone status changes", async () => {
      (getZone as jest.Mock)
        .mockResolvedValueOnce(activeZone)
        .mockResolvedValueOnce(pendingZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      stopCloudflareMonitoring();
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
    });

    it("should NOT send notification when status is unchanged", async () => {
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      stopCloudflareMonitoring();
      mockSend.mockClear();
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should create DB alert on zone status change", async () => {
      (getZone as jest.Mock)
        .mockResolvedValueOnce(activeZone)
        .mockResolvedValueOnce(pausedZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      stopCloudflareMonitoring();
      jest.clearAllMocks();
      startCloudflareMonitoring(client);
      await flushImmediate();
      await flushImmediate();
      expect(prisma.monitoringAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "UPTIME_CHECK",
          source: "Cloudflare",
        }),
      });
    });
  });

  describe("SSL certificate monitoring", () => {
    it("should notify when SSL cert expires within 30 days", async () => {
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([expiringSSLCert]);
      const { client, mockSend } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
    });

    it("should create DB alert for expiring SSL", async () => {
      // Use a cert with unique hosts to avoid state collision with prior tests
      const uniqueExpiringCert = {
        type: "universal",
        status: "active",
        expires_on: new Date(
          Date.now() + 15 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        hosts: ["db-alert-test.com", "*.db-alert-test.com"],
      };
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([uniqueExpiringCert]);
      const { client } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      await flushImmediate();
      expect(prisma.monitoringAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "NOTIFICATION",
          severity: "WARNING",
          source: "Cloudflare",
        }),
      });
    });

    it("should NOT notify for certs with more than 30 days", async () => {
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([validSSLCert]);
      const { client, mockSend } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should skip inactive SSL certificates", async () => {
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([inactiveSSLCert]);
      const { client, mockSend } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should only notify once per expiring certificate", async () => {
      // Use unique hosts to avoid state collision
      const dedupCert = {
        type: "universal",
        status: "active",
        expires_on: new Date(
          Date.now() + 10 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        hosts: ["dedup-test.com"],
      };
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([dedupCert]);
      const { client, mockSend } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      stopCloudflareMonitoring();
      const count = mockSend.mock.calls.length;
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).toHaveBeenCalledTimes(count);
    });
  });

  describe("Discord client edge cases", () => {
    it("should skip when client is not ready", async () => {
      (getZone as jest.Mock)
        .mockResolvedValueOnce(activeZone)
        .mockResolvedValueOnce(pendingZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient({
        isReady: jest.fn().mockReturnValue(false),
      });
      startCloudflareMonitoring(client);
      await flushImmediate();
      stopCloudflareMonitoring();
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should skip when no guild is found", async () => {
      (getZone as jest.Mock)
        .mockResolvedValueOnce(activeZone)
        .mockResolvedValueOnce(pendingZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient();
      client.guilds.cache.first.mockReturnValue(null);
      startCloudflareMonitoring(client);
      await flushImmediate();
      stopCloudflareMonitoring();
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should skip when channel is not text-based", async () => {
      (getZone as jest.Mock)
        .mockResolvedValueOnce(activeZone)
        .mockResolvedValueOnce(pendingZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client, mockSend, mockChannel } = createMockClient();
      mockChannel.isTextBased.mockReturnValue(false);
      startCloudflareMonitoring(client);
      await flushImmediate();
      stopCloudflareMonitoring();
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle getZone API failure gracefully", async () => {
      (getZone as jest.Mock).mockRejectedValue(new Error("API timeout"));
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should handle getSSLStatus API failure gracefully", async () => {
      (getZone as jest.Mock).mockResolvedValue(activeZone);
      (getSSLStatus as jest.Mock).mockRejectedValue(new Error("SSL API error"));
      const { client, mockSend } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should handle Discord send failure gracefully", async () => {
      (getZone as jest.Mock)
        .mockResolvedValueOnce(activeZone)
        .mockResolvedValueOnce(pendingZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient();
      mockSend.mockRejectedValue(new Error("Discord API error"));
      startCloudflareMonitoring(client);
      await flushImmediate();
      stopCloudflareMonitoring();
      startCloudflareMonitoring(client);
      await flushImmediate();
    });

    it("should handle DB alert creation failure gracefully", async () => {
      (getZone as jest.Mock)
        .mockResolvedValueOnce(activeZone)
        .mockResolvedValueOnce(pendingZone);
      (getSSLStatus as jest.Mock).mockResolvedValue([]);
      (prisma.monitoringAlert.create as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );
      const { client } = createMockClient();
      startCloudflareMonitoring(client);
      await flushImmediate();
      stopCloudflareMonitoring();
      startCloudflareMonitoring(client);
      await flushImmediate();
      await flushImmediate();
    });
  });
});
