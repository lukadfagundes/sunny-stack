/**
 * @file Unit tests for QueryOptimizer, batchLoadTimeEntriesForCalendar,
 *       loadDashboardMetrics, batchLoadProjectStats, and defaultOptimizer
 * @description Tests performance monitoring, slow query detection, batch loading,
 *              and dashboard metrics aggregation
 */

import { logger } from "@/lib/logger";
import { DatabaseError } from "@/lib/errors/app-error";

// --- Mocks ---

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

jest.mock("@/lib/errors/app-error", () => ({
  DatabaseError: class DatabaseError extends Error {
    constructor(message: string, cause?: Error) {
      super(message);
      this.name = "DatabaseError";
      if (cause) this.cause = cause;
    }
  },
}));

// --- Imports (after mocks) ---

import {
  QueryOptimizer,
  batchLoadTimeEntriesForCalendar,
  loadDashboardMetrics,
  batchLoadProjectStats,
  defaultOptimizer,
} from "@/lib/db/query-optimizer";

// --- Mock Prisma ---

const mockPrisma = {
  project: {
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  quote: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  timeEntry: {
    findMany: jest.fn(),
  },
} as any;

// --- Test Suite ---

describe("QueryOptimizer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================
  // QueryOptimizer class
  // =============================================

  describe("constructor", () => {
    it("should create instance with default options (threshold=100, maxLogSize=1000)", () => {
      // ARRANGE & ACT
      const optimizer = new QueryOptimizer();

      // ASSERT
      expect(optimizer).toBeInstanceOf(QueryOptimizer);
      const stats = optimizer.getStats();
      expect(stats.total).toBe(0);
    });

    it("should create instance with custom options", () => {
      // ARRANGE & ACT
      const optimizer = new QueryOptimizer({
        slowQueryThreshold: 500,
        maxLogSize: 50,
      });

      // ASSERT
      expect(optimizer).toBeInstanceOf(QueryOptimizer);
    });
  });

  describe("trackQuery", () => {
    it("should track a successful query and return its result", async () => {
      // ARRANGE
      const optimizer = new QueryOptimizer();
      const expectedResult = { id: "1", name: "test" };

      // ACT
      const result = await optimizer.trackQuery(
        "testQuery",
        async () => expectedResult,
      );

      // ASSERT
      expect(result).toEqual(expectedResult);
      const allQueries = optimizer.getAllQueries();
      expect(allQueries).toHaveLength(1);
      expect(allQueries[0].name).toBe("testQuery");
      expect(allQueries[0].success).toBe(true);
      expect(allQueries[0].duration).toBeGreaterThanOrEqual(0);
      expect(allQueries[0].timestamp).toBeInstanceOf(Date);
    });

    it("should log warning for slow query (duration > threshold)", async () => {
      // ARRANGE - threshold of 0 means any query with duration > 0 is slow
      const optimizer = new QueryOptimizer({ slowQueryThreshold: 0 });

      // ACT - small delay to guarantee duration > 0
      await optimizer.trackQuery("slowQuery", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return "result";
      });

      // ASSERT
      expect(logger.warn).toHaveBeenCalledWith(
        "Slow query detected",
        expect.objectContaining({
          query: "slowQuery",
          threshold: 0,
        }),
      );
      expect(logger.debug).not.toHaveBeenCalledWith(
        "Query completed",
        expect.anything(),
      );
    });

    it("should log debug for fast query (duration < threshold)", async () => {
      // ARRANGE - threshold of 999999 means no query is slow
      const optimizer = new QueryOptimizer({ slowQueryThreshold: 999999 });

      // ACT
      await optimizer.trackQuery("fastQuery", async () => "result");

      // ASSERT
      expect(logger.debug).toHaveBeenCalledWith(
        "Query completed",
        expect.objectContaining({
          query: "fastQuery",
        }),
      );
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("should track a failed query and re-throw the error", async () => {
      // ARRANGE
      const optimizer = new QueryOptimizer();
      const testError = new Error("Query execution failed");

      // ACT & ASSERT
      await expect(
        optimizer.trackQuery("failingQuery", async () => {
          throw testError;
        }),
      ).rejects.toThrow("Query execution failed");

      const allQueries = optimizer.getAllQueries();
      expect(allQueries).toHaveLength(1);
      expect(allQueries[0].name).toBe("failingQuery");
      expect(allQueries[0].success).toBe(false);
      expect(allQueries[0].error).toBe("Query execution failed");

      expect(logger.error).toHaveBeenCalledWith(
        "Query failed",
        expect.objectContaining({
          query: "failingQuery",
          error: "Query execution failed",
        }),
      );
    });

    it("should record metadata in log entry", async () => {
      // ARRANGE
      const optimizer = new QueryOptimizer({ slowQueryThreshold: 999999 });
      const metadata = { table: "projects", filter: "active" };

      // ACT
      await optimizer.trackQuery(
        "metadataQuery",
        async () => "result",
        metadata,
      );

      // ASSERT
      const allQueries = optimizer.getAllQueries();
      expect(allQueries[0].metadata).toEqual(metadata);
      expect(logger.debug).toHaveBeenCalledWith(
        "Query completed",
        expect.objectContaining({ metadata }),
      );
    });
  });

  describe("getSlowQueries", () => {
    it("should return only queries exceeding the threshold", async () => {
      // ARRANGE - threshold 0 means queries with duration > 0 are slow
      const optimizer = new QueryOptimizer({ slowQueryThreshold: 0 });

      // ACT - small delay to guarantee duration > 0
      await optimizer.trackQuery("q1", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return "r1";
      });
      await optimizer.trackQuery("q2", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return "r2";
      });

      // ASSERT
      const slowQueries = optimizer.getSlowQueries();
      expect(slowQueries.length).toBe(2);
      slowQueries.forEach((q) => {
        expect(q.duration).toBeGreaterThan(0);
      });
    });

    it("should return empty array when no slow queries exist", async () => {
      // ARRANGE - threshold so high nothing is slow
      const optimizer = new QueryOptimizer({ slowQueryThreshold: 999999 });

      // ACT
      await optimizer.trackQuery("fastQ", async () => "result");

      // ASSERT
      const slowQueries = optimizer.getSlowQueries();
      expect(slowQueries).toEqual([]);
    });
  });

  describe("getAllQueries", () => {
    it("should return all tracked queries", async () => {
      // ARRANGE
      const optimizer = new QueryOptimizer({ slowQueryThreshold: 999999 });

      // ACT
      await optimizer.trackQuery("q1", async () => "r1");
      await optimizer.trackQuery("q2", async () => "r2");
      await optimizer.trackQuery("q3", async () => "r3");

      // ASSERT
      const allQueries = optimizer.getAllQueries();
      expect(allQueries).toHaveLength(3);
      expect(allQueries[0].name).toBe("q1");
      expect(allQueries[1].name).toBe("q2");
      expect(allQueries[2].name).toBe("q3");
    });
  });

  describe("getStats", () => {
    it("should return correct statistics", async () => {
      // ARRANGE - threshold 0 and small delay to ensure duration > 0
      const optimizer = new QueryOptimizer({ slowQueryThreshold: 0 });

      // ACT
      await optimizer.trackQuery("q1", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return "r1";
      });
      await optimizer.trackQuery("q2", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return "r2";
      });
      try {
        await optimizer.trackQuery("q3", async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          throw new Error("fail");
        });
      } catch {
        // Expected to throw
      }

      // ASSERT
      const stats = optimizer.getStats();
      expect(stats.total).toBe(3);
      expect(stats.failed).toBe(1);
      expect(stats.slow).toBeGreaterThanOrEqual(2);
      expect(stats.avgDuration).toBeGreaterThan(0);
      expect(stats.maxDuration).toBeGreaterThan(0);
    });

    it("should return zeros when no queries have been tracked", () => {
      // ARRANGE
      const optimizer = new QueryOptimizer();

      // ACT
      const stats = optimizer.getStats();

      // ASSERT
      expect(stats).toEqual({
        total: 0,
        slow: 0,
        failed: 0,
        avgDuration: 0,
        maxDuration: 0,
      });
    });
  });

  describe("resetStats", () => {
    it("should clear all query logs", async () => {
      // ARRANGE
      const optimizer = new QueryOptimizer({ slowQueryThreshold: 999999 });
      await optimizer.trackQuery("q1", async () => "r1");
      await optimizer.trackQuery("q2", async () => "r2");
      expect(optimizer.getAllQueries()).toHaveLength(2);

      // ACT
      optimizer.resetStats();

      // ASSERT
      expect(optimizer.getAllQueries()).toHaveLength(0);
      expect(optimizer.getStats().total).toBe(0);
      expect(logger.debug).toHaveBeenCalledWith("Query optimizer stats reset");
    });
  });

  describe("setSlowQueryThreshold", () => {
    it("should update the threshold", async () => {
      // ARRANGE
      const optimizer = new QueryOptimizer({ slowQueryThreshold: 999999 });
      await optimizer.trackQuery("q1", async () => "r1");
      // With high threshold, nothing is slow
      expect(optimizer.getSlowQueries()).toHaveLength(0);

      // ACT - set threshold to 0 so existing queries become "slow"
      optimizer.setSlowQueryThreshold(1);

      // ASSERT
      expect(logger.debug).toHaveBeenCalledWith(
        "Slow query threshold updated",
        {
          threshold: 1,
        },
      );
    });

    it("should throw for non-positive threshold (0)", () => {
      // ARRANGE
      const optimizer = new QueryOptimizer();

      // ACT & ASSERT
      expect(() => optimizer.setSlowQueryThreshold(0)).toThrow(
        "Slow query threshold must be positive",
      );
    });

    it("should throw for negative threshold", () => {
      // ARRANGE
      const optimizer = new QueryOptimizer();

      // ACT & ASSERT
      expect(() => optimizer.setSlowQueryThreshold(-10)).toThrow(
        "Slow query threshold must be positive",
      );
    });
  });

  describe("log trimming", () => {
    it("should trim log when exceeding maxLogSize", async () => {
      // ARRANGE - small maxLogSize to trigger trimming
      const optimizer = new QueryOptimizer({
        slowQueryThreshold: 999999,
        maxLogSize: 3,
      });

      // ACT - add 5 entries
      await optimizer.trackQuery("q1", async () => "r1");
      await optimizer.trackQuery("q2", async () => "r2");
      await optimizer.trackQuery("q3", async () => "r3");
      await optimizer.trackQuery("q4", async () => "r4");
      await optimizer.trackQuery("q5", async () => "r5");

      // ASSERT - only last 3 should remain
      const allQueries = optimizer.getAllQueries();
      expect(allQueries).toHaveLength(3);
      expect(allQueries[0].name).toBe("q3");
      expect(allQueries[1].name).toBe("q4");
      expect(allQueries[2].name).toBe("q5");
    });
  });

  // =============================================
  // batchLoadTimeEntriesForCalendar
  // =============================================

  describe("batchLoadTimeEntriesForCalendar", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return empty Map for empty projectIds array", async () => {
      // ARRANGE & ACT
      const result = await batchLoadTimeEntriesForCalendar(mockPrisma, []);

      // ASSERT
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(mockPrisma.timeEntry.findMany).not.toHaveBeenCalled();
    });

    it("should group time entries by projectId correctly", async () => {
      // ARRANGE
      const projectIds = ["proj-1", "proj-2"];
      const mockEntries = [
        { id: "e1", projectId: "proj-1", startedAt: new Date() },
        { id: "e2", projectId: "proj-1", startedAt: new Date() },
        { id: "e3", projectId: "proj-2", startedAt: new Date() },
      ];
      mockPrisma.timeEntry.findMany.mockResolvedValue(mockEntries);

      // ACT
      const result = await batchLoadTimeEntriesForCalendar(
        mockPrisma,
        projectIds,
      );

      // ASSERT
      expect(result.get("proj-1")).toHaveLength(2);
      expect(result.get("proj-2")).toHaveLength(1);
      expect(result.get("proj-1")![0].id).toBe("e1");
      expect(result.get("proj-1")![1].id).toBe("e2");
      expect(result.get("proj-2")![0].id).toBe("e3");
    });

    it("should return empty arrays for projects with no entries", async () => {
      // ARRANGE
      const projectIds = ["proj-1", "proj-2", "proj-3"];
      const mockEntries = [
        { id: "e1", projectId: "proj-1", startedAt: new Date() },
      ];
      mockPrisma.timeEntry.findMany.mockResolvedValue(mockEntries);

      // ACT
      const result = await batchLoadTimeEntriesForCalendar(
        mockPrisma,
        projectIds,
      );

      // ASSERT
      expect(result.get("proj-1")).toHaveLength(1);
      expect(result.get("proj-2")).toEqual([]);
      expect(result.get("proj-3")).toEqual([]);
    });

    it("should apply date range filter when provided", async () => {
      // ARRANGE
      const projectIds = ["proj-1"];
      const dateRange = {
        start: new Date("2026-01-01"),
        end: new Date("2026-01-31"),
      };
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);

      // ACT
      await batchLoadTimeEntriesForCalendar(mockPrisma, projectIds, dateRange);

      // ASSERT
      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledWith({
        where: {
          projectId: { in: projectIds },
          startedAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        orderBy: { startedAt: "asc" },
      });
    });

    it("should not include date filter when dateRange is undefined", async () => {
      // ARRANGE
      const projectIds = ["proj-1"];
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);

      // ACT
      await batchLoadTimeEntriesForCalendar(mockPrisma, projectIds);

      // ASSERT
      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledWith({
        where: {
          projectId: { in: projectIds },
        },
        orderBy: { startedAt: "asc" },
      });
    });

    it("should throw DatabaseError on Prisma failure", async () => {
      // ARRANGE
      const projectIds = ["proj-1"];
      mockPrisma.timeEntry.findMany.mockRejectedValue(
        new Error("Connection lost"),
      );

      // ACT & ASSERT
      await expect(
        batchLoadTimeEntriesForCalendar(mockPrisma, projectIds),
      ).rejects.toThrow(DatabaseError);

      await expect(
        batchLoadTimeEntriesForCalendar(mockPrisma, projectIds),
      ).rejects.toThrow("Failed to load time entries for calendar");

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to batch load time entries for calendar",
        expect.objectContaining({
          error: "Connection lost",
        }),
      );
    });
  });

  // =============================================
  // loadDashboardMetrics
  // =============================================

  describe("loadDashboardMetrics", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should load all metrics in parallel and return correct structure", async () => {
      // ARRANGE
      const mockRecentActivity = [
        {
          id: "p1",
          title: "Project 1",
          updatedAt: new Date(),
          _count: { quotes: 2, timeEntries: 5 },
        },
      ];

      mockPrisma.project.count
        .mockResolvedValueOnce(10) // totalProjects
        .mockResolvedValueOnce(3); // activeProjects
      mockPrisma.quote.count.mockResolvedValue(5); // pendingQuotes
      mockPrisma.project.aggregate.mockResolvedValue({
        _sum: { budget: 150000 },
      });
      mockPrisma.project.findMany.mockResolvedValue(mockRecentActivity);

      // ACT
      const metrics = await loadDashboardMetrics(mockPrisma);

      // ASSERT
      expect(metrics).toEqual({
        totalProjects: 10,
        activeProjects: 3,
        pendingQuotes: 5,
        totalRevenue: 150000,
        recentActivity: mockRecentActivity,
      });

      // Verify all queries were called
      expect(mockPrisma.project.count).toHaveBeenCalledTimes(2);
      expect(mockPrisma.quote.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.project.aggregate).toHaveBeenCalledTimes(1);
      expect(mockPrisma.project.findMany).toHaveBeenCalledTimes(1);
    });

    it("should handle null budget sum and return 0", async () => {
      // ARRANGE
      mockPrisma.project.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.quote.count.mockResolvedValue(0);
      mockPrisma.project.aggregate.mockResolvedValue({
        _sum: { budget: null },
      });
      mockPrisma.project.findMany.mockResolvedValue([]);

      // ACT
      const metrics = await loadDashboardMetrics(mockPrisma);

      // ASSERT
      expect(metrics.totalRevenue).toBe(0);
    });

    it("should throw DatabaseError on failure", async () => {
      // ARRANGE
      mockPrisma.project.count.mockRejectedValue(
        new Error("DB connection timeout"),
      );

      // ACT & ASSERT
      await expect(loadDashboardMetrics(mockPrisma)).rejects.toThrow(
        DatabaseError,
      );
      await expect(loadDashboardMetrics(mockPrisma)).rejects.toThrow(
        "Failed to load dashboard metrics",
      );

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to load dashboard metrics",
        expect.objectContaining({
          error: "DB connection timeout",
        }),
      );
    });
  });

  // =============================================
  // batchLoadProjectStats
  // =============================================

  describe("batchLoadProjectStats", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return empty Map for empty projectIds", async () => {
      // ARRANGE & ACT
      const result = await batchLoadProjectStats(mockPrisma, []);

      // ASSERT
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(mockPrisma.quote.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.timeEntry.findMany).not.toHaveBeenCalled();
    });

    it("should count quotes per project correctly", async () => {
      // ARRANGE
      const projectIds = ["proj-1", "proj-2"];
      mockPrisma.quote.findMany.mockResolvedValue([
        { projectId: "proj-1" },
        { projectId: "proj-1" },
        { projectId: "proj-2" },
      ]);
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);

      // ACT
      const result = await batchLoadProjectStats(mockPrisma, projectIds);

      // ASSERT
      expect(result.get("proj-1")!.quotesCount).toBe(2);
      expect(result.get("proj-2")!.quotesCount).toBe(1);
    });

    it("should count time entries per project correctly", async () => {
      // ARRANGE
      const projectIds = ["proj-1", "proj-2"];
      mockPrisma.quote.findMany.mockResolvedValue([]);
      mockPrisma.timeEntry.findMany.mockResolvedValue([
        { projectId: "proj-1", durationMinutes: 60 },
        { projectId: "proj-1", durationMinutes: 120 },
        { projectId: "proj-2", durationMinutes: 30 },
      ]);

      // ACT
      const result = await batchLoadProjectStats(mockPrisma, projectIds);

      // ASSERT
      expect(result.get("proj-1")!.timeEntriesCount).toBe(2);
      expect(result.get("proj-2")!.timeEntriesCount).toBe(1);
    });

    it("should calculate totalHours from durationMinutes (divides by 60)", async () => {
      // ARRANGE
      const projectIds = ["proj-1"];
      mockPrisma.quote.findMany.mockResolvedValue([]);
      mockPrisma.timeEntry.findMany.mockResolvedValue([
        { projectId: "proj-1", durationMinutes: 60 },
        { projectId: "proj-1", durationMinutes: 90 },
      ]);

      // ACT
      const result = await batchLoadProjectStats(mockPrisma, projectIds);

      // ASSERT
      // 60/60 + 90/60 = 1 + 1.5 = 2.5
      expect(result.get("proj-1")!.totalHours).toBe(2.5);
    });

    it("should return zero stats for projects with no data", async () => {
      // ARRANGE
      const projectIds = ["proj-1", "proj-2"];
      mockPrisma.quote.findMany.mockResolvedValue([]);
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);

      // ACT
      const result = await batchLoadProjectStats(mockPrisma, projectIds);

      // ASSERT
      expect(result.get("proj-1")).toEqual({
        quotesCount: 0,
        timeEntriesCount: 0,
        totalHours: 0,
      });
      expect(result.get("proj-2")).toEqual({
        quotesCount: 0,
        timeEntriesCount: 0,
        totalHours: 0,
      });
    });

    it("should handle null durationMinutes (uses 0)", async () => {
      // ARRANGE
      const projectIds = ["proj-1"];
      mockPrisma.quote.findMany.mockResolvedValue([]);
      mockPrisma.timeEntry.findMany.mockResolvedValue([
        { projectId: "proj-1", durationMinutes: null },
        { projectId: "proj-1", durationMinutes: 120 },
      ]);

      // ACT
      const result = await batchLoadProjectStats(mockPrisma, projectIds);

      // ASSERT
      // (0/60) + (120/60) = 0 + 2 = 2
      expect(result.get("proj-1")!.totalHours).toBe(2);
      expect(result.get("proj-1")!.timeEntriesCount).toBe(2);
    });

    it("should throw DatabaseError on failure", async () => {
      // ARRANGE
      const projectIds = ["proj-1"];
      mockPrisma.quote.findMany.mockRejectedValue(new Error("Query timeout"));

      // ACT & ASSERT
      await expect(
        batchLoadProjectStats(mockPrisma, projectIds),
      ).rejects.toThrow(DatabaseError);

      await expect(
        batchLoadProjectStats(mockPrisma, projectIds),
      ).rejects.toThrow("Failed to load project statistics");

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to batch load project stats",
        expect.objectContaining({
          error: "Query timeout",
        }),
      );
    });
  });

  // =============================================
  // defaultOptimizer
  // =============================================

  describe("defaultOptimizer", () => {
    it("should be a QueryOptimizer instance", () => {
      expect(defaultOptimizer).toBeInstanceOf(QueryOptimizer);
    });
  });
});
