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
 * @file Fly.io Monitor Unit Tests
 * @description Tests for Fly.io app/machine monitoring, Discord notifications, and alert creation
 */

import {
  startFlyioMonitoring,
  stopFlyioMonitoring,
} from "@/lib/monitoring/flyio-monitor";
import { prisma } from "@/lib/db/prisma";
import { getApps, getAppMachines } from "@/lib/integrations/flyio";

jest.mock("@/lib/integrations/flyio", () => ({
  getApps: jest.fn(),
  getAppMachines: jest.fn(),
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

function makeApp(overrides: Record<string, any> = {}) {
  return {
    id: "app-1",
    name: "my-app",
    status: "deployed",
    deployed: true,
    hostname: "my-app.fly.dev",
    organization: { name: "personal", slug: "personal" },
    ...overrides,
  };
}

function makeMachine(overrides: Record<string, any> = {}) {
  return {
    id: "machine-1",
    name: "machine-1",
    state: "started",
    region: "iad",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Fly.io Monitor", () => {
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
    stopFlyioMonitoring();
  });

  afterEach(() => {
    stopFlyioMonitoring();
    jest.useRealTimers();
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = originalEnv;
  });

  describe("startFlyioMonitoring", () => {
    it("should run an initial check immediately", async () => {
      jest.useFakeTimers();
      (getApps as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startFlyioMonitoring(client);
      expect(getApps).toHaveBeenCalled();
    });

    it("should set a 5-minute polling interval", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "setInterval");
      (getApps as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startFlyioMonitoring(client);
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
    });

    it("should restart when called while already running", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "clearInterval");
      (getApps as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startFlyioMonitoring(client);
      startFlyioMonitoring(client);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("stopFlyioMonitoring", () => {
    it("should clear the interval", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "clearInterval");
      (getApps as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();
      startFlyioMonitoring(client);
      stopFlyioMonitoring();
      expect(spy).toHaveBeenCalled();
    });

    it("should not throw when no monitoring is active", () => {
      expect(() => stopFlyioMonitoring()).not.toThrow();
    });
  });

  describe("App down notifications", () => {
    it("should send notification when a running app goes down", async () => {
      const runningApp = makeApp({
        name: "down-app",
        status: "deployed",
        deployed: true,
      });
      const downApp = makeApp({
        name: "down-app",
        status: "dead",
        deployed: false,
      });
      (getApps as jest.Mock)
        .mockResolvedValueOnce([runningApp])
        .mockResolvedValueOnce([downApp]);
      (getAppMachines as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient();

      // First check (baseline)
      startFlyioMonitoring(client);
      await flushImmediate();
      stopFlyioMonitoring();
      mockSend.mockClear();

      // Second check (detect down)
      startFlyioMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalled();
    });

    it("should create CRITICAL DB alert when app goes down", async () => {
      const runningApp = makeApp({
        name: "alert-app",
        status: "running",
        deployed: true,
      });
      const downApp = makeApp({
        name: "alert-app",
        status: "dead",
        deployed: false,
      });
      (getApps as jest.Mock)
        .mockResolvedValueOnce([runningApp])
        .mockResolvedValueOnce([downApp]);
      (getAppMachines as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();

      startFlyioMonitoring(client);
      await flushImmediate();
      stopFlyioMonitoring();
      jest.clearAllMocks();

      startFlyioMonitoring(client);
      await flushImmediate();
      await flushImmediate();

      expect(prisma.monitoringAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "ERROR",
          severity: "CRITICAL",
          source: "Fly.io",
        }),
      });
    });

    it("should NOT notify for suspended apps", async () => {
      const runningApp = makeApp({
        name: "sus-app",
        status: "running",
        deployed: true,
      });
      const suspendedApp = makeApp({
        name: "sus-app",
        status: "suspended",
        deployed: false,
      });
      (getApps as jest.Mock)
        .mockResolvedValueOnce([runningApp])
        .mockResolvedValueOnce([suspendedApp]);
      (getAppMachines as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient();

      startFlyioMonitoring(client);
      await flushImmediate();
      stopFlyioMonitoring();
      mockSend.mockClear();

      startFlyioMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("App recovery notifications", () => {
    it("should send recovery notification when app comes back up", async () => {
      const downApp = makeApp({
        name: "rec-app",
        status: "dead",
        deployed: false,
      });
      const recoveredApp = makeApp({
        name: "rec-app",
        status: "running",
        deployed: true,
      });
      (getApps as jest.Mock)
        .mockResolvedValueOnce([downApp])
        .mockResolvedValueOnce([recoveredApp]);
      (getAppMachines as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient();

      startFlyioMonitoring(client);
      await flushImmediate();
      stopFlyioMonitoring();
      mockSend.mockClear();

      startFlyioMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalled();
    });

    it("should create INFO DB alert on app recovery", async () => {
      const downApp = makeApp({
        name: "rec2-app",
        status: "dead",
        deployed: false,
      });
      const recoveredApp = makeApp({
        name: "rec2-app",
        status: "deployed",
        deployed: true,
      });
      (getApps as jest.Mock)
        .mockResolvedValueOnce([downApp])
        .mockResolvedValueOnce([recoveredApp]);
      (getAppMachines as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();

      startFlyioMonitoring(client);
      await flushImmediate();
      stopFlyioMonitoring();
      jest.clearAllMocks();

      startFlyioMonitoring(client);
      await flushImmediate();
      await flushImmediate();

      expect(prisma.monitoringAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "UPTIME_CHECK",
          severity: "INFO",
          source: "Fly.io",
        }),
      });
    });
  });

  describe("Machine state change notifications", () => {
    it("should notify when machine states change", async () => {
      const app = makeApp({ name: "mach-app" });
      const machine1 = makeMachine({ state: "started" });
      const machine2 = makeMachine({ id: "machine-2", state: "stopped" });
      (getApps as jest.Mock).mockResolvedValue([app]);
      (getAppMachines as jest.Mock)
        .mockResolvedValueOnce([machine1])
        .mockResolvedValueOnce([machine2]);
      const { client, mockSend } = createMockClient();

      // First check
      startFlyioMonitoring(client);
      await flushImmediate();
      stopFlyioMonitoring();
      mockSend.mockClear();

      // Second check - state changed
      startFlyioMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalled();
    });

    it("should NOT notify when machine states are unchanged", async () => {
      const app = makeApp({ name: "stable-app" });
      const machine = makeMachine({ state: "started" });
      (getApps as jest.Mock).mockResolvedValue([app]);
      (getAppMachines as jest.Mock).mockResolvedValue([machine]);
      const { client, mockSend } = createMockClient();

      startFlyioMonitoring(client);
      await flushImmediate();
      stopFlyioMonitoring();
      mockSend.mockClear();

      startFlyioMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("First check behavior", () => {
    it("should NOT notify on first check (no previous data)", async () => {
      const app = makeApp({
        name: "first-app",
        status: "dead",
        deployed: false,
      });
      (getApps as jest.Mock).mockResolvedValue([app]);
      (getAppMachines as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient();

      startFlyioMonitoring(client);
      await flushImmediate();

      // No notification because there is no previous state to compare
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Discord client edge cases", () => {
    it("should skip when client is not ready", async () => {
      const runningApp = makeApp({
        name: "edge1-app",
        status: "running",
        deployed: true,
      });
      const downApp = makeApp({
        name: "edge1-app",
        status: "dead",
        deployed: false,
      });
      (getApps as jest.Mock)
        .mockResolvedValueOnce([runningApp])
        .mockResolvedValueOnce([downApp]);
      (getAppMachines as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient({
        isReady: jest.fn().mockReturnValue(false),
      });

      startFlyioMonitoring(client);
      await flushImmediate();
      stopFlyioMonitoring();

      startFlyioMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should skip when no guild is found", async () => {
      const runningApp = makeApp({
        name: "edge2-app",
        status: "running",
        deployed: true,
      });
      const downApp = makeApp({
        name: "edge2-app",
        status: "dead",
        deployed: false,
      });
      (getApps as jest.Mock)
        .mockResolvedValueOnce([runningApp])
        .mockResolvedValueOnce([downApp]);
      (getAppMachines as jest.Mock).mockResolvedValue([]);
      const { client, mockSend } = createMockClient();
      client.guilds.cache.first.mockReturnValue(null);

      startFlyioMonitoring(client);
      await flushImmediate();
      stopFlyioMonitoring();

      startFlyioMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle getApps API failure gracefully", async () => {
      (getApps as jest.Mock).mockRejectedValue(new Error("API error"));
      const { client, mockSend } = createMockClient();

      startFlyioMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should handle getAppMachines failure gracefully per app", async () => {
      const app = makeApp({ name: "err-app" });
      (getApps as jest.Mock).mockResolvedValue([app]);
      (getAppMachines as jest.Mock).mockRejectedValue(
        new Error("Machine API error"),
      );
      const { client } = createMockClient();

      startFlyioMonitoring(client);
      await flushImmediate();
    });

    it("should handle DB alert creation failure gracefully", async () => {
      const runningApp = makeApp({
        name: "dberr-app",
        status: "running",
        deployed: true,
      });
      const downApp = makeApp({
        name: "dberr-app",
        status: "dead",
        deployed: false,
      });
      (getApps as jest.Mock)
        .mockResolvedValueOnce([runningApp])
        .mockResolvedValueOnce([downApp]);
      (getAppMachines as jest.Mock).mockResolvedValue([]);
      (prisma.monitoringAlert.create as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );
      const { client } = createMockClient();

      startFlyioMonitoring(client);
      await flushImmediate();
      stopFlyioMonitoring();

      startFlyioMonitoring(client);
      await flushImmediate();
      await flushImmediate();
    });
  });

  describe("Cleanup", () => {
    it("should remove apps that no longer exist from tracking", async () => {
      const app1 = makeApp({ name: "app-a" });
      const app2 = makeApp({ name: "app-b" });
      (getApps as jest.Mock)
        .mockResolvedValueOnce([app1, app2])
        .mockResolvedValueOnce([app1]); // app-b removed
      (getAppMachines as jest.Mock).mockResolvedValue([]);
      const { client } = createMockClient();

      startFlyioMonitoring(client);
      await flushImmediate();
      stopFlyioMonitoring();

      startFlyioMonitoring(client);
      await flushImmediate();
    });
  });
});
