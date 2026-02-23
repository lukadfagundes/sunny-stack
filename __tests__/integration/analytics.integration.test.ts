/**
 * @file Analytics integration tests
 * @description Tests analytics aggregations and dashboard metrics
 * @jest-environment node
 */

// IMPORTANT: Unmock Prisma for integration tests - we need real DB access
jest.unmock("@prisma/client");

import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  testPrisma,
} from "../helpers/test-db";
import {
  createTestProject,
  createTestQuote,
  createTestTimeEntry,
} from "../helpers/test-factories";
import { ProjectStatus, QuoteStatus } from "@prisma/client";

// Mock logger
jest.mock("@/lib/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Analytics Integration", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean all data before each test (handles FK ordering correctly)
    await cleanDatabase();
  });

  describe("Active Projects Count", () => {
    it("should count PLANNING projects as active", async () => {
      // ARRANGE
      await createTestProject({ status: ProjectStatus.PLANNING });
      await createTestProject({ status: ProjectStatus.PLANNING });

      // ACT
      const count = await testPrisma.project.count({
        where: {
          status: { notIn: [ProjectStatus.COMPLETE, ProjectStatus.ARCHIVED] },
          deletedAt: null,
        },
      });

      // ASSERT
      expect(count).toBe(2);
    });

    it("should count IN_PROGRESS projects as active", async () => {
      // ARRANGE
      await createTestProject({ status: ProjectStatus.IN_PROGRESS });
      await createTestProject({ status: ProjectStatus.IN_PROGRESS });
      await createTestProject({ status: ProjectStatus.IN_PROGRESS });

      // ACT
      const count = await testPrisma.project.count({
        where: {
          status: { notIn: [ProjectStatus.COMPLETE, ProjectStatus.ARCHIVED] },
          deletedAt: null,
        },
      });

      // ASSERT
      expect(count).toBe(3);
    });

    it("should count REVIEW projects as active", async () => {
      // ARRANGE
      await createTestProject({ status: ProjectStatus.REVIEW });

      // ACT
      const count = await testPrisma.project.count({
        where: {
          status: { notIn: [ProjectStatus.COMPLETE, ProjectStatus.ARCHIVED] },
          deletedAt: null,
        },
      });

      // ASSERT
      expect(count).toBe(1);
    });

    it("should NOT count COMPLETE projects as active", async () => {
      // ARRANGE
      await createTestProject({ status: ProjectStatus.COMPLETE });
      await createTestProject({ status: ProjectStatus.IN_PROGRESS });

      // ACT
      const count = await testPrisma.project.count({
        where: {
          status: { notIn: [ProjectStatus.COMPLETE, ProjectStatus.ARCHIVED] },
          deletedAt: null,
        },
      });

      // ASSERT
      expect(count).toBe(1);
    });

    it("should NOT count ARCHIVED projects as active", async () => {
      // ARRANGE
      await createTestProject({ status: ProjectStatus.ARCHIVED });
      await createTestProject({ status: ProjectStatus.PLANNING });

      // ACT
      const count = await testPrisma.project.count({
        where: {
          status: { notIn: [ProjectStatus.COMPLETE, ProjectStatus.ARCHIVED] },
          deletedAt: null,
        },
      });

      // ASSERT
      expect(count).toBe(1);
    });

    it("should NOT count soft-deleted projects as active", async () => {
      // ARRANGE
      const project = await createTestProject({
        status: ProjectStatus.IN_PROGRESS,
      });
      await testPrisma.project.update({
        where: { id: project.id },
        data: { deletedAt: new Date() },
      });

      // ACT
      const count = await testPrisma.project.count({
        where: {
          status: { notIn: [ProjectStatus.COMPLETE, ProjectStatus.ARCHIVED] },
          deletedAt: null,
        },
      });

      // ASSERT
      expect(count).toBe(0);
    });
  });

  describe("Pending Quotes Count", () => {
    it("should count PENDING quotes", async () => {
      // ARRANGE
      await createTestQuote({ status: QuoteStatus.PENDING });
      await createTestQuote({ status: QuoteStatus.PENDING });
      await createTestQuote({ status: QuoteStatus.PENDING });

      // ACT
      const count = await testPrisma.quote.count({
        where: { status: QuoteStatus.PENDING },
      });

      // ASSERT
      expect(count).toBe(3);
    });

    it("should NOT count APPROVED quotes", async () => {
      // ARRANGE
      await createTestQuote({ status: QuoteStatus.PENDING });
      await createTestQuote({ status: QuoteStatus.APPROVED });

      // ACT
      const count = await testPrisma.quote.count({
        where: { status: QuoteStatus.PENDING },
      });

      // ASSERT
      expect(count).toBe(1);
    });

    it("should NOT count DECLINED quotes", async () => {
      // ARRANGE
      await createTestQuote({ status: QuoteStatus.PENDING });
      await createTestQuote({ status: QuoteStatus.DECLINED });

      // ACT
      const count = await testPrisma.quote.count({
        where: { status: QuoteStatus.PENDING },
      });

      // ASSERT
      expect(count).toBe(1);
    });

    it("should NOT count CONVERTED quotes", async () => {
      // ARRANGE
      const project = await createTestProject();
      await createTestQuote({ status: QuoteStatus.PENDING });
      await createTestQuote({
        status: QuoteStatus.CONVERTED,
        projectId: project.id,
      });

      // ACT
      const count = await testPrisma.quote.count({
        where: { status: QuoteStatus.PENDING },
      });

      // ASSERT
      expect(count).toBe(1);
    });
  });

  describe("Total Revenue Calculation", () => {
    it("should sum all project budgets", async () => {
      // ARRANGE
      await createTestProject({ budget: 10000 });
      await createTestProject({ budget: 25000 });
      await createTestProject({ budget: 15000 });

      // ACT
      const result = await testPrisma.project.aggregate({
        _sum: { budget: true },
        where: { deletedAt: null },
      });

      // ASSERT
      expect(result._sum.budget?.toString()).toBe("50000");
    });

    it("should handle projects with null budgets", async () => {
      // ARRANGE
      await createTestProject({ budget: 10000 });
      await createTestProject({ budget: null });
      await createTestProject({ budget: 5000 });

      // ACT
      const result = await testPrisma.project.aggregate({
        _sum: { budget: true },
        where: { deletedAt: null },
      });

      // ASSERT
      expect(result._sum.budget?.toString()).toBe("15000");
    });

    it("should return null for zero projects", async () => {
      // ACT
      const result = await testPrisma.project.aggregate({
        _sum: { budget: true },
        where: { deletedAt: null },
      });

      // ASSERT
      expect(result._sum.budget).toBeNull();
    });

    it("should exclude soft-deleted projects from revenue", async () => {
      // ARRANGE
      await createTestProject({ budget: 10000 });
      const deletedProject = await createTestProject({ budget: 20000 });
      await testPrisma.project.update({
        where: { id: deletedProject.id },
        data: { deletedAt: new Date() },
      });

      // ACT
      const result = await testPrisma.project.aggregate({
        _sum: { budget: true },
        where: { deletedAt: null },
      });

      // ASSERT
      expect(result._sum.budget?.toString()).toBe("10000");
    });

    it("should handle large budget amounts", async () => {
      // ARRANGE
      await createTestProject({ budget: 100000 });
      await createTestProject({ budget: 250000 });

      // ACT
      const result = await testPrisma.project.aggregate({
        _sum: { budget: true },
        where: { deletedAt: null },
      });

      // ASSERT
      expect(result._sum.budget?.toString()).toBe("350000");
    });
  });

  describe("Hours Tracked Calculation", () => {
    it("should sum time entries for current week", async () => {
      // ARRANGE
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const project = await createTestProject();
      await createTestTimeEntry({
        projectId: project.id,
        startedAt: startOfWeek,
        durationMinutes: 120, // 2 hours
      });
      await createTestTimeEntry({
        projectId: project.id,
        startedAt: new Date(startOfWeek.getTime() + 24 * 60 * 60 * 1000), // Next day
        durationMinutes: 180, // 3 hours
      });

      // ACT
      const result = await testPrisma.timeEntry.aggregate({
        _sum: { durationMinutes: true },
        where: { startedAt: { gte: startOfWeek } },
      });

      // ASSERT
      expect(result._sum.durationMinutes).toBe(300); // 5 hours = 300 minutes
    });

    it("should NOT include time entries from previous week", async () => {
      // ARRANGE
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const lastWeek = new Date(startOfWeek);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const project = await createTestProject();
      await createTestTimeEntry({
        projectId: project.id,
        startedAt: lastWeek,
        durationMinutes: 240,
      });
      await createTestTimeEntry({
        projectId: project.id,
        startedAt: startOfWeek,
        durationMinutes: 120,
      });

      // ACT
      const result = await testPrisma.timeEntry.aggregate({
        _sum: { durationMinutes: true },
        where: { startedAt: { gte: startOfWeek } },
      });

      // ASSERT
      expect(result._sum.durationMinutes).toBe(120);
    });

    it("should return 0 for no time entries", async () => {
      // ARRANGE
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // ACT
      const result = await testPrisma.timeEntry.aggregate({
        _sum: { durationMinutes: true },
        where: { startedAt: { gte: startOfWeek } },
      });

      // ASSERT
      expect(result._sum.durationMinutes).toBeNull();
    });

    it("should handle multiple projects", async () => {
      // ARRANGE
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const project1 = await createTestProject();
      const project2 = await createTestProject();
      await createTestTimeEntry({
        projectId: project1.id,
        startedAt: startOfWeek,
        durationMinutes: 60,
      });
      await createTestTimeEntry({
        projectId: project2.id,
        startedAt: startOfWeek,
        durationMinutes: 90,
      });

      // ACT
      const result = await testPrisma.timeEntry.aggregate({
        _sum: { durationMinutes: true },
        where: { startedAt: { gte: startOfWeek } },
      });

      // ASSERT
      expect(result._sum.durationMinutes).toBe(150);
    });
  });

  describe("Recent Activity", () => {
    it("should fetch recent projects", async () => {
      // ARRANGE
      await createTestProject({ title: "Project 1" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await createTestProject({ title: "Project 2" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await createTestProject({ title: "Project 3" });

      // ACT
      const recentProjects = await testPrisma.project.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      // ASSERT
      expect(recentProjects).toHaveLength(3);
      expect(recentProjects[0].title).toBe("Project 3");
      expect(recentProjects[1].title).toBe("Project 2");
      expect(recentProjects[2].title).toBe("Project 1");
    });

    it("should fetch recent quotes", async () => {
      // ARRANGE
      await createTestQuote({ name: "Client 1" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await createTestQuote({ name: "Client 2" });

      // ACT
      const recentQuotes = await testPrisma.quote.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      // ASSERT
      expect(recentQuotes).toHaveLength(2);
      expect(recentQuotes[0].name).toBe("Client 2");
      expect(recentQuotes[1].name).toBe("Client 1");
    });

    it("should limit results to specified count", async () => {
      // ARRANGE
      for (let i = 1; i <= 10; i++) {
        await createTestProject({ title: `Project ${i}` });
      }

      // ACT
      const recentProjects = await testPrisma.project.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      // ASSERT
      expect(recentProjects).toHaveLength(5);
    });
  });

  describe("Dashboard Metrics Combined", () => {
    it("should calculate all metrics simultaneously", async () => {
      // ARRANGE
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Create active projects
      const project1 = await createTestProject({
        status: ProjectStatus.IN_PROGRESS,
        budget: 25000,
      });
      await createTestProject({
        status: ProjectStatus.PLANNING,
        budget: 15000,
      });
      await createTestProject({
        status: ProjectStatus.COMPLETE,
        budget: 30000,
      });

      // Create pending quotes
      await createTestQuote({ status: QuoteStatus.PENDING });
      await createTestQuote({ status: QuoteStatus.PENDING });
      await createTestQuote({ status: QuoteStatus.APPROVED });

      // Create time entries
      await createTestTimeEntry({
        projectId: project1.id,
        startedAt: startOfWeek,
        durationMinutes: 120,
      });

      // ACT
      const [activeProjects, pendingQuotes, totalRevenue, hoursTracked] =
        await Promise.all([
          testPrisma.project.count({
            where: {
              status: {
                notIn: [ProjectStatus.COMPLETE, ProjectStatus.ARCHIVED],
              },
              deletedAt: null,
            },
          }),
          testPrisma.quote.count({
            where: { status: QuoteStatus.PENDING },
          }),
          testPrisma.project.aggregate({
            _sum: { budget: true },
            where: { deletedAt: null },
          }),
          testPrisma.timeEntry.aggregate({
            _sum: { durationMinutes: true },
            where: { startedAt: { gte: startOfWeek } },
          }),
        ]);

      // ASSERT
      expect(activeProjects).toBe(2);
      expect(pendingQuotes).toBe(2);
      expect(totalRevenue._sum.budget?.toString()).toBe("70000");
      expect(hoursTracked._sum.durationMinutes).toBe(120);
    });
  });

  describe("Performance and Optimization", () => {
    it("should handle large datasets efficiently", async () => {
      // ARRANGE - Create 100 projects
      const promises = [];
      for (let i = 1; i <= 100; i++) {
        promises.push(
          createTestProject({
            title: `Project ${i}`,
            status:
              i % 2 === 0 ? ProjectStatus.IN_PROGRESS : ProjectStatus.COMPLETE,
            budget: 10000 + i * 100,
          }),
        );
      }
      await Promise.all(promises);

      // ACT - Measure query performance
      const startTime = Date.now();
      const count = await testPrisma.project.count({
        where: {
          status: { notIn: [ProjectStatus.COMPLETE, ProjectStatus.ARCHIVED] },
          deletedAt: null,
        },
      });
      const duration = Date.now() - startTime;

      // ASSERT
      expect(count).toBe(50);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
