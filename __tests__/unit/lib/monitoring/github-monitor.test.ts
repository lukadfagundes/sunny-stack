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
 * @file GitHub Monitor Unit Tests
 * @description Tests for GitHub workflow/PR monitoring, Discord notifications, and alert creation
 */

import {
  startGitHubMonitoring,
  stopGitHubMonitoring,
} from "@/lib/monitoring/github-monitor";
import { prisma } from "@/lib/db/prisma";
import {
  getRecentWorkflowRuns,
  getOpenPullRequests,
  getGitHubHealth,
} from "@/lib/integrations/github";

jest.mock("@/lib/integrations/github", () => ({
  getFailedWorkflows: jest.fn(),
  getOpenPullRequests: jest.fn(),
  getRecentWorkflowRuns: jest.fn(),
  getGitHubHealth: jest.fn(),
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

// Future timestamp so items pass monitoringStartTime check
const futureISO = new Date(Date.now() + 60000).toISOString();

function makeWorkflow(overrides: Record<string, any> = {}) {
  return {
    id: 1001,
    name: "CI",
    status: "completed",
    conclusion: "success",
    html_url: "https://github.com/owner/repo/actions/runs/1001",
    created_at: futureISO,
    updated_at: futureISO,
    repository: { full_name: "owner/repo" },
    head_branch: "main",
    event: "push",
    ...overrides,
  };
}

function makePR(overrides: Record<string, any> = {}) {
  return {
    id: 2001,
    number: 42,
    title: "Add feature",
    state: "open",
    html_url: "https://github.com/owner/repo/pull/42",
    created_at: futureISO,
    updated_at: futureISO,
    user: { login: "developer" },
    head: { ref: "feature-branch" },
    base: { ref: "main" },
    draft: false,
    ...overrides,
  };
}

describe("GitHub Monitor", () => {
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
    stopGitHubMonitoring();
  });

  afterEach(() => {
    stopGitHubMonitoring();
    jest.useRealTimers();
    process.env.DISCORD_CHANNEL_ADMIN_LOGS = originalEnv;
  });

  describe("startGitHubMonitoring", () => {
    it("should run an initial check immediately", async () => {
      jest.useFakeTimers();
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client } = createMockClient();

      startGitHubMonitoring(client);

      expect(getRecentWorkflowRuns).toHaveBeenCalled();
    });

    it("should set a 5-minute polling interval", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "setInterval");
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client } = createMockClient();

      startGitHubMonitoring(client);

      expect(spy).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
    });

    it("should restart when called while already running", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "clearInterval");
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client } = createMockClient();

      startGitHubMonitoring(client);
      startGitHubMonitoring(client);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe("stopGitHubMonitoring", () => {
    it("should clear the interval", () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, "clearInterval");
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client } = createMockClient();
      startGitHubMonitoring(client);
      stopGitHubMonitoring();
      expect(spy).toHaveBeenCalled();
    });

    it("should not throw when no monitoring is active", () => {
      expect(() => stopGitHubMonitoring()).not.toThrow();
    });
  });

  describe("Workflow failure notifications", () => {
    it("should send notification for new failed workflow", async () => {
      const failedWf = makeWorkflow({ id: 3001, conclusion: "failure" });
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([failedWf]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client, mockSend } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalled();
    });

    it("should create ERROR DB alert for failed workflow", async () => {
      const failedWf = makeWorkflow({ id: 3002, conclusion: "failure" });
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([failedWf]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();
      await flushImmediate();

      expect(prisma.monitoringAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "ERROR",
          severity: "ERROR",
          source: "GitHub",
        }),
      });
    });

    it("should NOT re-notify for already-tracked failed workflow", async () => {
      const failedWf = makeWorkflow({ id: 3003, conclusion: "failure" });
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([failedWf]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client, mockSend } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();
      stopGitHubMonitoring();
      const firstCount = mockSend.mock.calls.length;

      startGitHubMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalledTimes(firstCount);
    });
  });

  describe("Workflow recovery notifications", () => {
    it("should notify when workflow recovers from failure to success", async () => {
      const failedWf = makeWorkflow({ id: 4001, conclusion: "failure" });
      const recoveredWf = makeWorkflow({ id: 4001, conclusion: "success" });
      (getRecentWorkflowRuns as jest.Mock)
        .mockResolvedValueOnce([failedWf])
        .mockResolvedValueOnce([recoveredWf]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client, mockSend } = createMockClient();

      // First check - failure
      startGitHubMonitoring(client);
      await flushImmediate();
      stopGitHubMonitoring();
      mockSend.mockClear();

      // Second check - recovery
      startGitHubMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("Pull request notifications", () => {
    it("should send notification for new pull request", async () => {
      const pr = makePR({ id: 5001 });
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([pr]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client, mockSend } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalled();
    });

    it("should NOT re-notify for already-tracked PR", async () => {
      const pr = makePR({ id: 5002 });
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([pr]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client, mockSend } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();
      stopGitHubMonitoring();
      const firstCount = mockSend.mock.calls.length;

      startGitHubMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalledTimes(firstCount);
    });

    it("should create DB alert for new PR", async () => {
      const pr = makePR({ id: 5003 });
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([pr]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();
      await flushImmediate();

      expect(prisma.monitoringAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "NOTIFICATION",
          severity: "INFO",
          source: "GitHub",
        }),
      });
    });
  });

  describe("Rate limit warnings", () => {
    it("should warn when rate limit is below 20%", async () => {
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 500, limit: 5000, reset: new Date() },
      });
      const { client, mockSend } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();

      expect(mockSend).toHaveBeenCalled();
    });

    it("should NOT warn when rate limit is above 20%", async () => {
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 4000, limit: 5000, reset: new Date() },
      });
      const { client, mockSend } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Old item filtering", () => {
    it("should NOT notify for workflows created before monitoring started", async () => {
      const oldWf = makeWorkflow({
        id: 6001,
        conclusion: "failure",
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      });
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([oldWf]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client, mockSend } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Discord client edge cases", () => {
    it("should skip when client is not ready", async () => {
      const failedWf = makeWorkflow({ id: 7001, conclusion: "failure" });
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([failedWf]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client, mockSend } = createMockClient({
        isReady: jest.fn().mockReturnValue(false),
      });

      startGitHubMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should skip when no guild is found", async () => {
      const failedWf = makeWorkflow({ id: 7002, conclusion: "failure" });
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([failedWf]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client, mockSend } = createMockClient();
      client.guilds.cache.first.mockReturnValue(null);

      startGitHubMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle getRecentWorkflowRuns failure gracefully", async () => {
      (getRecentWorkflowRuns as jest.Mock).mockRejectedValue(
        new Error("API error"),
      );
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client, mockSend } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should handle getOpenPullRequests failure gracefully", async () => {
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([]);
      (getOpenPullRequests as jest.Mock).mockRejectedValue(
        new Error("API error"),
      );
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      const { client } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();
    });

    it("should handle getGitHubHealth failure gracefully", async () => {
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockRejectedValue(new Error("API error"));
      const { client } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();
    });

    it("should handle DB alert creation failure gracefully", async () => {
      const failedWf = makeWorkflow({ id: 8001, conclusion: "failure" });
      (getRecentWorkflowRuns as jest.Mock).mockResolvedValue([failedWf]);
      (getOpenPullRequests as jest.Mock).mockResolvedValue([]);
      (getGitHubHealth as jest.Mock).mockResolvedValue({
        rateLimit: { remaining: 5000, limit: 5000, reset: new Date() },
      });
      (prisma.monitoringAlert.create as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );
      const { client } = createMockClient();

      startGitHubMonitoring(client);
      await flushImmediate();
      await flushImmediate();
    });
  });
});
