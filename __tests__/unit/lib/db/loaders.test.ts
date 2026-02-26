/**
 * @file Unit tests for lib/db/loaders.ts
 * @description Tests all DataLoader factory functions and createLoaderContext.
 *
 * Strategy:
 * - Mock DataLoader class to capture batch functions and options
 * - Mock Prisma client with jest.fn() methods
 * - Extract and invoke batch functions to verify Prisma queries and result ordering
 * - Test one-to-one loaders (by ID) return null for missing keys
 * - Test one-to-many loaders (by foreign key) return [] for missing keys
 * - Test createLoaderContext returns all 9 loaders
 */

import {
  createProjectLoader,
  createQuoteLoader,
  createQuotesByProjectLoader,
  createTimeEntriesByProjectLoader,
  createActiveTimeEntryLoader,
  createUserLoader,
  createProposalsByQuoteLoader,
  createDiscordMessagesByProjectLoader,
  createMonitoringEventsBySourceLoader,
  createLoaderContext,
} from "@/lib/db/loaders";
import { DataLoader } from "@/lib/db/batch-loader";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/lib/db/batch-loader", () => {
  return {
    __esModule: true,
    DataLoader: jest
      .fn()
      .mockImplementation((batchFn: unknown, options: unknown) => ({
        _batchFn: batchFn,
        _options: options,
        load: jest.fn(),
        loadMany: jest.fn(),
        clear: jest.fn(),
        clearAll: jest.fn(),
        prime: jest.fn(),
      })),
    default: jest
      .fn()
      .mockImplementation((batchFn: unknown, options: unknown) => ({
        _batchFn: batchFn,
        _options: options,
        load: jest.fn(),
        loadMany: jest.fn(),
        clear: jest.fn(),
        clearAll: jest.fn(),
        prime: jest.fn(),
      })),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the batch function from the most recent DataLoader constructor call.
 */
function getLatestBatchFn(): (keys: readonly string[]) => Promise<unknown[]> {
  const calls = (DataLoader as unknown as jest.Mock).mock.calls;
  return calls[calls.length - 1][0];
}

/**
 * Extract the options from the most recent DataLoader constructor call.
 */
function getLatestOptions(): { name?: string; maxBatchSize?: number } {
  const calls = (DataLoader as unknown as jest.Mock).mock.calls;
  return calls[calls.length - 1][1];
}

function createMockPrisma() {
  return {
    project: { findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    quote: { findMany: jest.fn(), count: jest.fn() },
    timeEntry: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
    proposal: { findMany: jest.fn() },
    discordMessage: { findMany: jest.fn() },
    monitoringEvent: { findMany: jest.fn() },
  } as any;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("lib/db/loaders", () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
  });

  // -------------------------------------------------------------------------
  // 1. createProjectLoader
  // -------------------------------------------------------------------------
  describe("createProjectLoader", () => {
    it("should create a DataLoader with correct name and maxBatchSize", () => {
      createProjectLoader(mockPrisma);

      expect(DataLoader).toHaveBeenCalledTimes(1);
      const options = getLatestOptions();
      expect(options.name).toBe("ProjectLoader");
      expect(options.maxBatchSize).toBe(100);
    });

    it("should query projects by ID and filter soft-deleted", async () => {
      // ARRANGE
      createProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.project.findMany.mockResolvedValue([]);

      // ACT
      await batchFn(["p1", "p2"]);

      // ASSERT
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["p1", "p2"] },
          deletedAt: null,
        },
      });
    });

    it("should return results in the same order as input keys", async () => {
      // ARRANGE
      createProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.project.findMany.mockResolvedValue([
        { id: "p2", name: "Project 2" },
        { id: "p1", name: "Project 1" },
      ]);

      // ACT
      const results = await batchFn(["p1", "p2", "p3"]);

      // ASSERT
      expect(results[0]).toEqual({ id: "p1", name: "Project 1" });
      expect(results[1]).toEqual({ id: "p2", name: "Project 2" });
      expect(results[2]).toBeNull();
    });

    it("should return null for all keys when no projects found", async () => {
      // ARRANGE
      createProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.project.findMany.mockResolvedValue([]);

      // ACT
      const results = await batchFn(["p1", "p2"]);

      // ASSERT
      expect(results).toEqual([null, null]);
    });

    it("should handle a single key", async () => {
      // ARRANGE
      createProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.project.findMany.mockResolvedValue([
        { id: "p1", name: "Project 1" },
      ]);

      // ACT
      const results = await batchFn(["p1"]);

      // ASSERT
      expect(results).toEqual([{ id: "p1", name: "Project 1" }]);
    });
  });

  // -------------------------------------------------------------------------
  // 2. createQuoteLoader
  // -------------------------------------------------------------------------
  describe("createQuoteLoader", () => {
    it("should create a DataLoader with correct name and maxBatchSize", () => {
      createQuoteLoader(mockPrisma);

      expect(DataLoader).toHaveBeenCalledTimes(1);
      const options = getLatestOptions();
      expect(options.name).toBe("QuoteLoader");
      expect(options.maxBatchSize).toBe(100);
    });

    it("should query quotes by ID and filter soft-deleted", async () => {
      // ARRANGE
      createQuoteLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.quote.findMany.mockResolvedValue([]);

      // ACT
      await batchFn(["q1", "q2"]);

      // ASSERT
      expect(mockPrisma.quote.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["q1", "q2"] },
          deletedAt: null,
        },
      });
    });

    it("should return results in same order as input keys", async () => {
      // ARRANGE
      createQuoteLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.quote.findMany.mockResolvedValue([
        { id: "q3", name: "Quote 3" },
        { id: "q1", name: "Quote 1" },
      ]);

      // ACT
      const results = await batchFn(["q1", "q2", "q3"]);

      // ASSERT
      expect(results[0]).toEqual({ id: "q1", name: "Quote 1" });
      expect(results[1]).toBeNull();
      expect(results[2]).toEqual({ id: "q3", name: "Quote 3" });
    });

    it("should return null for all keys when no quotes found", async () => {
      // ARRANGE
      createQuoteLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.quote.findMany.mockResolvedValue([]);

      // ACT
      const results = await batchFn(["q1"]);

      // ASSERT
      expect(results).toEqual([null]);
    });
  });

  // -------------------------------------------------------------------------
  // 3. createQuotesByProjectLoader
  // -------------------------------------------------------------------------
  describe("createQuotesByProjectLoader", () => {
    it("should create a DataLoader with correct name and maxBatchSize", () => {
      createQuotesByProjectLoader(mockPrisma);

      expect(DataLoader).toHaveBeenCalledTimes(1);
      const options = getLatestOptions();
      expect(options.name).toBe("QuotesByProjectLoader");
      expect(options.maxBatchSize).toBe(100);
    });

    it("should query quotes by projectId with soft-delete filter and ordering", async () => {
      // ARRANGE
      createQuotesByProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.quote.findMany.mockResolvedValue([]);

      // ACT
      await batchFn(["proj1", "proj2"]);

      // ASSERT
      expect(mockPrisma.quote.findMany).toHaveBeenCalledWith({
        where: {
          projectId: { in: ["proj1", "proj2"] },
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should group quotes by project ID", async () => {
      // ARRANGE
      createQuotesByProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.quote.findMany.mockResolvedValue([
        { id: "q1", projectId: "proj1", name: "Quote 1" },
        { id: "q2", projectId: "proj2", name: "Quote 2" },
        { id: "q3", projectId: "proj1", name: "Quote 3" },
      ]);

      // ACT
      const results = await batchFn(["proj1", "proj2", "proj3"]);

      // ASSERT
      expect(results[0]).toEqual([
        { id: "q1", projectId: "proj1", name: "Quote 1" },
        { id: "q3", projectId: "proj1", name: "Quote 3" },
      ]);
      expect(results[1]).toEqual([
        { id: "q2", projectId: "proj2", name: "Quote 2" },
      ]);
      expect(results[2]).toEqual([]);
    });

    it("should return empty arrays for all keys when no quotes found", async () => {
      // ARRANGE
      createQuotesByProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.quote.findMany.mockResolvedValue([]);

      // ACT
      const results = await batchFn(["proj1", "proj2"]);

      // ASSERT
      expect(results).toEqual([[], []]);
    });

    it("should skip quotes with null projectId", async () => {
      // ARRANGE
      createQuotesByProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.quote.findMany.mockResolvedValue([
        { id: "q1", projectId: null, name: "Orphan Quote" },
        { id: "q2", projectId: "proj1", name: "Good Quote" },
      ]);

      // ACT
      const results = await batchFn(["proj1"]);

      // ASSERT
      expect(results[0]).toEqual([
        { id: "q2", projectId: "proj1", name: "Good Quote" },
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // 4. createTimeEntriesByProjectLoader
  // -------------------------------------------------------------------------
  describe("createTimeEntriesByProjectLoader", () => {
    it("should create a DataLoader with correct name and maxBatchSize", () => {
      createTimeEntriesByProjectLoader(mockPrisma);

      expect(DataLoader).toHaveBeenCalledTimes(1);
      const options = getLatestOptions();
      expect(options.name).toBe("TimeEntriesByProjectLoader");
      expect(options.maxBatchSize).toBe(100);
    });

    it("should query time entries by projectId with ordering", async () => {
      // ARRANGE
      createTimeEntriesByProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);

      // ACT
      await batchFn(["proj1", "proj2"]);

      // ASSERT
      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledWith({
        where: {
          projectId: { in: ["proj1", "proj2"] },
        },
        orderBy: { startedAt: "desc" },
      });
    });

    it("should group time entries by project ID", async () => {
      // ARRANGE
      createTimeEntriesByProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.timeEntry.findMany.mockResolvedValue([
        { id: "te1", projectId: "proj1", hours: 2 },
        { id: "te2", projectId: "proj2", hours: 3 },
        { id: "te3", projectId: "proj1", hours: 1 },
      ]);

      // ACT
      const results = await batchFn(["proj1", "proj2", "proj3"]);

      // ASSERT
      expect(results[0]).toEqual([
        { id: "te1", projectId: "proj1", hours: 2 },
        { id: "te3", projectId: "proj1", hours: 1 },
      ]);
      expect(results[1]).toEqual([{ id: "te2", projectId: "proj2", hours: 3 }]);
      expect(results[2]).toEqual([]);
    });

    it("should return empty arrays when no time entries found", async () => {
      // ARRANGE
      createTimeEntriesByProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);

      // ACT
      const results = await batchFn(["proj1"]);

      // ASSERT
      expect(results).toEqual([[]]);
    });
  });

  // -------------------------------------------------------------------------
  // 5. createActiveTimeEntryLoader
  // -------------------------------------------------------------------------
  describe("createActiveTimeEntryLoader", () => {
    it("should create a DataLoader with correct name and maxBatchSize", () => {
      createActiveTimeEntryLoader(mockPrisma);

      expect(DataLoader).toHaveBeenCalledTimes(1);
      const options = getLatestOptions();
      expect(options.name).toBe("ActiveTimeEntryLoader");
      expect(options.maxBatchSize).toBe(100);
    });

    it("should query time entries with endedAt: null filter", async () => {
      // ARRANGE
      createActiveTimeEntryLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);

      // ACT
      await batchFn(["proj1"]);

      // ASSERT
      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledWith({
        where: {
          projectId: { in: ["proj1"] },
          endedAt: null,
        },
        orderBy: { startedAt: "desc" },
      });
    });

    it("should return the most recent active entry per project", async () => {
      // ARRANGE
      createActiveTimeEntryLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      // Entries are ordered by startedAt desc, so first entry per project is most recent
      mockPrisma.timeEntry.findMany.mockResolvedValue([
        {
          id: "te1",
          projectId: "proj1",
          startedAt: new Date("2026-02-01"),
          endedAt: null,
        },
        {
          id: "te2",
          projectId: "proj1",
          startedAt: new Date("2026-01-01"),
          endedAt: null,
        },
        {
          id: "te3",
          projectId: "proj2",
          startedAt: new Date("2026-02-15"),
          endedAt: null,
        },
      ]);

      // ACT
      const results = await batchFn(["proj1", "proj2", "proj3"]);

      // ASSERT - te1 is first for proj1 (most recent), te2 is ignored
      expect(results[0]).toEqual({
        id: "te1",
        projectId: "proj1",
        startedAt: new Date("2026-02-01"),
        endedAt: null,
      });
      expect(results[1]).toEqual({
        id: "te3",
        projectId: "proj2",
        startedAt: new Date("2026-02-15"),
        endedAt: null,
      });
      expect(results[2]).toBeNull();
    });

    it("should return null for projects with no active entry", async () => {
      // ARRANGE
      createActiveTimeEntryLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);

      // ACT
      const results = await batchFn(["proj1", "proj2"]);

      // ASSERT
      expect(results).toEqual([null, null]);
    });

    it("should only set the first entry per project (most recent due to ordering)", async () => {
      // ARRANGE
      createActiveTimeEntryLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.timeEntry.findMany.mockResolvedValue([
        { id: "te-new", projectId: "proj1" },
        { id: "te-old", projectId: "proj1" },
      ]);

      // ACT
      const results = await batchFn(["proj1"]);

      // ASSERT - only the first (most recent) is returned
      expect(results[0]).toEqual({ id: "te-new", projectId: "proj1" });
    });
  });

  // -------------------------------------------------------------------------
  // 6. createUserLoader
  // -------------------------------------------------------------------------
  describe("createUserLoader", () => {
    it("should create a DataLoader with correct name and maxBatchSize", () => {
      createUserLoader(mockPrisma);

      expect(DataLoader).toHaveBeenCalledTimes(1);
      const options = getLatestOptions();
      expect(options.name).toBe("UserLoader");
      expect(options.maxBatchSize).toBe(100);
    });

    it("should query users by ID without soft-delete filter", async () => {
      // ARRANGE
      createUserLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.user.findMany.mockResolvedValue([]);

      // ACT
      await batchFn(["u1", "u2"]);

      // ASSERT - no deletedAt filter for users
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["u1", "u2"] },
        },
      });
    });

    it("should return results in same order as input keys", async () => {
      // ARRANGE
      createUserLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.user.findMany.mockResolvedValue([
        { id: "u2", name: "User 2" },
        { id: "u1", name: "User 1" },
      ]);

      // ACT
      const results = await batchFn(["u1", "u2", "u3"]);

      // ASSERT
      expect(results[0]).toEqual({ id: "u1", name: "User 1" });
      expect(results[1]).toEqual({ id: "u2", name: "User 2" });
      expect(results[2]).toBeNull();
    });

    it("should return null for all keys when no users found", async () => {
      // ARRANGE
      createUserLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.user.findMany.mockResolvedValue([]);

      // ACT
      const results = await batchFn(["u1"]);

      // ASSERT
      expect(results).toEqual([null]);
    });
  });

  // -------------------------------------------------------------------------
  // 7. createProposalsByQuoteLoader
  // -------------------------------------------------------------------------
  describe("createProposalsByQuoteLoader", () => {
    it("should create a DataLoader with correct name and maxBatchSize", () => {
      createProposalsByQuoteLoader(mockPrisma);

      expect(DataLoader).toHaveBeenCalledTimes(1);
      const options = getLatestOptions();
      expect(options.name).toBe("ProposalsByQuoteLoader");
      expect(options.maxBatchSize).toBe(100);
    });

    it("should query proposals by quoteId with ordering", async () => {
      // ARRANGE
      createProposalsByQuoteLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.proposal.findMany.mockResolvedValue([]);

      // ACT
      await batchFn(["q1", "q2"]);

      // ASSERT
      expect(mockPrisma.proposal.findMany).toHaveBeenCalledWith({
        where: {
          quoteId: { in: ["q1", "q2"] },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should group proposals by quote ID", async () => {
      // ARRANGE
      createProposalsByQuoteLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.proposal.findMany.mockResolvedValue([
        { id: "prop1", quoteId: "q1", title: "Proposal 1" },
        { id: "prop2", quoteId: "q1", title: "Proposal 2" },
        { id: "prop3", quoteId: "q2", title: "Proposal 3" },
      ]);

      // ACT
      const results = await batchFn(["q1", "q2", "q3"]);

      // ASSERT
      expect(results[0]).toEqual([
        { id: "prop1", quoteId: "q1", title: "Proposal 1" },
        { id: "prop2", quoteId: "q1", title: "Proposal 2" },
      ]);
      expect(results[1]).toEqual([
        { id: "prop3", quoteId: "q2", title: "Proposal 3" },
      ]);
      expect(results[2]).toEqual([]);
    });

    it("should return empty arrays when no proposals found", async () => {
      // ARRANGE
      createProposalsByQuoteLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.proposal.findMany.mockResolvedValue([]);

      // ACT
      const results = await batchFn(["q1", "q2"]);

      // ASSERT
      expect(results).toEqual([[], []]);
    });
  });

  // -------------------------------------------------------------------------
  // 8. createDiscordMessagesByProjectLoader
  // -------------------------------------------------------------------------
  describe("createDiscordMessagesByProjectLoader", () => {
    it("should create a DataLoader with correct name and maxBatchSize", () => {
      createDiscordMessagesByProjectLoader(mockPrisma);

      expect(DataLoader).toHaveBeenCalledTimes(1);
      const options = getLatestOptions();
      expect(options.name).toBe("DiscordMessagesByProjectLoader");
      expect(options.maxBatchSize).toBe(100);
    });

    it("should query discord messages by projectId with ordering and take limit", async () => {
      // ARRANGE
      createDiscordMessagesByProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.discordMessage.findMany.mockResolvedValue([]);

      // ACT
      await batchFn(["proj1"]);

      // ASSERT
      expect(mockPrisma.discordMessage.findMany).toHaveBeenCalledWith({
        where: {
          projectId: { in: ["proj1"] },
        },
        orderBy: { timestamp: "desc" },
        take: 50,
      });
    });

    it("should group messages by project ID", async () => {
      // ARRANGE
      createDiscordMessagesByProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.discordMessage.findMany.mockResolvedValue([
        { id: "msg1", projectId: "proj1", content: "Hello" },
        { id: "msg2", projectId: "proj2", content: "World" },
        { id: "msg3", projectId: "proj1", content: "Test" },
      ]);

      // ACT
      const results = await batchFn(["proj1", "proj2", "proj3"]);

      // ASSERT
      expect(results[0]).toEqual([
        { id: "msg1", projectId: "proj1", content: "Hello" },
        { id: "msg3", projectId: "proj1", content: "Test" },
      ]);
      expect(results[1]).toEqual([
        { id: "msg2", projectId: "proj2", content: "World" },
      ]);
      expect(results[2]).toEqual([]);
    });

    it("should return empty arrays when no messages found", async () => {
      // ARRANGE
      createDiscordMessagesByProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.discordMessage.findMany.mockResolvedValue([]);

      // ACT
      const results = await batchFn(["proj1"]);

      // ASSERT
      expect(results).toEqual([[]]);
    });

    it("should skip messages with null projectId", async () => {
      // ARRANGE
      createDiscordMessagesByProjectLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.discordMessage.findMany.mockResolvedValue([
        { id: "msg1", projectId: null, content: "Orphan" },
        { id: "msg2", projectId: "proj1", content: "Valid" },
      ]);

      // ACT
      const results = await batchFn(["proj1"]);

      // ASSERT
      expect(results[0]).toEqual([
        { id: "msg2", projectId: "proj1", content: "Valid" },
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // 9. createMonitoringEventsBySourceLoader
  // -------------------------------------------------------------------------
  describe("createMonitoringEventsBySourceLoader", () => {
    it("should create a DataLoader with correct name and maxBatchSize", () => {
      createMonitoringEventsBySourceLoader(mockPrisma);

      expect(DataLoader).toHaveBeenCalledTimes(1);
      const options = getLatestOptions();
      expect(options.name).toBe("MonitoringEventsBySourceLoader");
      expect(options.maxBatchSize).toBe(50);
    });

    it("should query monitoring events by source with default limit of 20", async () => {
      // ARRANGE
      createMonitoringEventsBySourceLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.monitoringEvent.findMany.mockResolvedValue([]);

      // ACT
      await batchFn(["Fly.io", "Vercel"]);

      // ASSERT
      expect(mockPrisma.monitoringEvent.findMany).toHaveBeenCalledWith({
        where: {
          source: { in: ["Fly.io", "Vercel"] },
        },
        orderBy: { timestamp: "desc" },
        take: 2 * 20, // sources.length * default limit
      });
    });

    it("should respect custom limit parameter", async () => {
      // ARRANGE
      createMonitoringEventsBySourceLoader(mockPrisma, 5);
      const batchFn = getLatestBatchFn();
      mockPrisma.monitoringEvent.findMany.mockResolvedValue([]);

      // ACT
      await batchFn(["Fly.io", "Vercel", "Cloudflare"]);

      // ASSERT
      expect(mockPrisma.monitoringEvent.findMany).toHaveBeenCalledWith({
        where: {
          source: { in: ["Fly.io", "Vercel", "Cloudflare"] },
        },
        orderBy: { timestamp: "desc" },
        take: 3 * 5, // sources.length * custom limit
      });
    });

    it("should group events by source", async () => {
      // ARRANGE
      createMonitoringEventsBySourceLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.monitoringEvent.findMany.mockResolvedValue([
        { id: "e1", source: "Fly.io", status: "healthy" },
        { id: "e2", source: "Vercel", status: "degraded" },
        { id: "e3", source: "Fly.io", status: "down" },
      ]);

      // ACT
      const results = await batchFn(["Fly.io", "Vercel", "Cloudflare"]);

      // ASSERT
      expect(results[0]).toEqual([
        { id: "e1", source: "Fly.io", status: "healthy" },
        { id: "e3", source: "Fly.io", status: "down" },
      ]);
      expect(results[1]).toEqual([
        { id: "e2", source: "Vercel", status: "degraded" },
      ]);
      expect(results[2]).toEqual([]);
    });

    it("should enforce per-source limit", async () => {
      // ARRANGE
      createMonitoringEventsBySourceLoader(mockPrisma, 2);
      const batchFn = getLatestBatchFn();
      mockPrisma.monitoringEvent.findMany.mockResolvedValue([
        { id: "e1", source: "Fly.io", status: "healthy" },
        { id: "e2", source: "Fly.io", status: "degraded" },
        { id: "e3", source: "Fly.io", status: "down" },
      ]);

      // ACT
      const results = await batchFn(["Fly.io"]);

      // ASSERT - only 2 events should be returned despite 3 being available
      expect(results[0]).toHaveLength(2);
      expect(results[0]).toEqual([
        { id: "e1", source: "Fly.io", status: "healthy" },
        { id: "e2", source: "Fly.io", status: "degraded" },
      ]);
    });

    it("should return empty arrays when no events found", async () => {
      // ARRANGE
      createMonitoringEventsBySourceLoader(mockPrisma);
      const batchFn = getLatestBatchFn();
      mockPrisma.monitoringEvent.findMany.mockResolvedValue([]);

      // ACT
      const results = await batchFn(["Fly.io"]);

      // ASSERT
      expect(results).toEqual([[]]);
    });

    it("should handle limit of 1 correctly", async () => {
      // ARRANGE
      createMonitoringEventsBySourceLoader(mockPrisma, 1);
      const batchFn = getLatestBatchFn();
      mockPrisma.monitoringEvent.findMany.mockResolvedValue([
        { id: "e1", source: "Fly.io" },
        { id: "e2", source: "Fly.io" },
        { id: "e3", source: "Vercel" },
        { id: "e4", source: "Vercel" },
      ]);

      // ACT
      const results = await batchFn(["Fly.io", "Vercel"]);

      // ASSERT - only 1 event per source
      expect(results[0]).toHaveLength(1);
      expect(results[0]).toEqual([{ id: "e1", source: "Fly.io" }]);
      expect(results[1]).toHaveLength(1);
      expect(results[1]).toEqual([{ id: "e3", source: "Vercel" }]);
    });
  });

  // -------------------------------------------------------------------------
  // 10. createLoaderContext
  // -------------------------------------------------------------------------
  describe("createLoaderContext", () => {
    it("should return a LoaderContext with all 9 loaders", () => {
      // ACT
      const context = createLoaderContext(mockPrisma);

      // ASSERT - all 9 loader properties should be present
      expect(context).toHaveProperty("projectLoader");
      expect(context).toHaveProperty("quoteLoader");
      expect(context).toHaveProperty("quotesByProjectLoader");
      expect(context).toHaveProperty("timeEntriesByProjectLoader");
      expect(context).toHaveProperty("activeTimeEntryLoader");
      expect(context).toHaveProperty("userLoader");
      expect(context).toHaveProperty("proposalsByQuoteLoader");
      expect(context).toHaveProperty("discordMessagesByProjectLoader");
      expect(context).toHaveProperty("monitoringEventsBySourceLoader");
    });

    it("should create exactly 9 DataLoader instances", () => {
      // ACT
      createLoaderContext(mockPrisma);

      // ASSERT
      expect(DataLoader).toHaveBeenCalledTimes(9);
    });

    it("should create loaders with correct names", () => {
      // ACT
      createLoaderContext(mockPrisma);

      // ASSERT
      const calls = (DataLoader as unknown as jest.Mock).mock.calls;
      const loaderNames = calls.map(
        (call: unknown[]) => (call[1] as { name: string }).name,
      );

      expect(loaderNames).toContain("ProjectLoader");
      expect(loaderNames).toContain("QuoteLoader");
      expect(loaderNames).toContain("QuotesByProjectLoader");
      expect(loaderNames).toContain("TimeEntriesByProjectLoader");
      expect(loaderNames).toContain("ActiveTimeEntryLoader");
      expect(loaderNames).toContain("UserLoader");
      expect(loaderNames).toContain("ProposalsByQuoteLoader");
      expect(loaderNames).toContain("DiscordMessagesByProjectLoader");
      expect(loaderNames).toContain("MonitoringEventsBySourceLoader");
    });

    it("should not return null or undefined for any loader", () => {
      // ACT
      const context = createLoaderContext(mockPrisma);

      // ASSERT
      const loaderKeys = Object.keys(context);
      expect(loaderKeys).toHaveLength(9);

      for (const key of loaderKeys) {
        expect((context as Record<string, unknown>)[key]).toBeDefined();
        expect((context as Record<string, unknown>)[key]).not.toBeNull();
      }
    });

    it("should create fresh loaders on each call", () => {
      // ACT
      const context1 = createLoaderContext(mockPrisma);
      const context2 = createLoaderContext(mockPrisma);

      // ASSERT - each call creates new loader instances
      expect(context1.projectLoader).not.toBe(context2.projectLoader);
      expect(DataLoader).toHaveBeenCalledTimes(18); // 9 + 9
    });
  });
});
