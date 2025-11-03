/**
 * @file Integration tests for DataLoader with Prisma
 * @description Tests N+1 query prevention with real Prisma client
 */

import { PrismaClient } from '@prisma/client';
import {
  createProjectLoader,
  createQuotesByProjectLoader,
  createTimeEntriesByProjectLoader,
  createLoaderContext,
} from '@/lib/db/loaders';
import { loadDashboardMetrics, batchLoadProjectStats } from '@/lib/db/query-optimizer';

// Mock Prisma client for testing
const mockPrisma = {
  project: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  quote: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  timeEntry: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('DataLoader Integration with Prisma', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProjectLoader', () => {
    it('should batch multiple project loads into single query', async () => {
      // ARRANGE: Mock projects data
      const projects = [
        { id: 'proj-1', title: 'Project 1', deletedAt: null },
        { id: 'proj-2', title: 'Project 2', deletedAt: null },
        { id: 'proj-3', title: 'Project 3', deletedAt: null },
      ];

      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(projects);

      const loader = createProjectLoader(mockPrisma);

      // ACT: Load 3 projects in parallel (should batch)
      const [p1, p2, p3] = await Promise.all([
        loader.load('proj-1'),
        loader.load('proj-2'),
        loader.load('proj-3'),
      ]);

      // ASSERT: Only 1 database query executed
      expect(mockPrisma.project.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['proj-1', 'proj-2', 'proj-3'] },
          deletedAt: null,
        },
      });

      // Results match input order
      expect(p1).toEqual(projects[0]);
      expect(p2).toEqual(projects[1]);
      expect(p3).toEqual(projects[2]);
    });

    it('should exclude soft-deleted projects', async () => {
      // ARRANGE: Mock with soft-deleted project
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue([
        { id: 'proj-1', title: 'Project 1', deletedAt: null },
      ]);

      const loader = createProjectLoader(mockPrisma);

      // ACT: Load project
      await loader.load('proj-1');

      // ASSERT: deletedAt filter applied
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['proj-1'] },
          deletedAt: null,
        },
      });
    });

    it('should return null for non-existent projects', async () => {
      // ARRANGE: No projects found
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue([]);

      const loader = createProjectLoader(mockPrisma);

      // ACT: Load non-existent project
      const result = await loader.load('non-existent');

      // ASSERT: Returns null
      expect(result).toBeNull();
    });

    it('should cache loaded projects', async () => {
      // ARRANGE
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue([
        { id: 'proj-1', title: 'Project 1', deletedAt: null },
      ]);

      const loader = createProjectLoader(mockPrisma);

      // ACT: Load same project twice
      const p1 = await loader.load('proj-1');
      const p2 = await loader.load('proj-1');

      // ASSERT: Only 1 query (second load from cache)
      expect(mockPrisma.project.findMany).toHaveBeenCalledTimes(1);
      expect(p1).toEqual(p2);
    });
  });

  describe('createQuotesByProjectLoader', () => {
    it('should batch-load quotes by project ID', async () => {
      // ARRANGE
      const quotes = [
        { id: 'q1', projectId: 'proj-1', status: 'PENDING', deletedAt: null },
        { id: 'q2', projectId: 'proj-1', status: 'APPROVED', deletedAt: null },
        { id: 'q3', projectId: 'proj-2', status: 'PENDING', deletedAt: null },
      ];

      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue(quotes);

      const loader = createQuotesByProjectLoader(mockPrisma);

      // ACT: Load quotes for 2 projects
      const [quotes1, quotes2] = await Promise.all([
        loader.load('proj-1'),
        loader.load('proj-2'),
      ]);

      // ASSERT: Only 1 query
      expect(mockPrisma.quote.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.quote.findMany).toHaveBeenCalledWith({
        where: {
          projectId: { in: ['proj-1', 'proj-2'] },
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Quotes grouped correctly
      expect(quotes1).toHaveLength(2);
      expect(quotes1).toEqual([quotes[0], quotes[1]]);
      expect(quotes2).toHaveLength(1);
      expect(quotes2).toEqual([quotes[2]]);
    });

    it('should return empty array for projects with no quotes', async () => {
      // ARRANGE
      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue([]);

      const loader = createQuotesByProjectLoader(mockPrisma);

      // ACT
      const quotes = await loader.load('proj-no-quotes');

      // ASSERT
      expect(quotes).toEqual([]);
    });
  });

  describe('createTimeEntriesByProjectLoader', () => {
    it('should batch-load time entries by project ID', async () => {
      // ARRANGE
      const entries = [
        { id: 'e1', projectId: 'proj-1', durationMinutes: 60 },
        { id: 'e2', projectId: 'proj-1', durationMinutes: 120 },
        { id: 'e3', projectId: 'proj-2', durationMinutes: 90 },
      ];

      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue(entries);

      const loader = createTimeEntriesByProjectLoader(mockPrisma);

      // ACT
      const [entries1, entries2] = await Promise.all([
        loader.load('proj-1'),
        loader.load('proj-2'),
      ]);

      // ASSERT: Only 1 query
      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledTimes(1);

      // Entries grouped correctly
      expect(entries1).toHaveLength(2);
      expect(entries2).toHaveLength(1);
    });
  });

  describe('createLoaderContext', () => {
    it('should create all loaders in a single context', () => {
      // ACT
      const context = createLoaderContext(mockPrisma);

      // ASSERT: All loaders created
      expect(context.projectLoader).toBeDefined();
      expect(context.quoteLoader).toBeDefined();
      expect(context.quotesByProjectLoader).toBeDefined();
      expect(context.timeEntriesByProjectLoader).toBeDefined();
      expect(context.activeTimeEntryLoader).toBeDefined();
      expect(context.userLoader).toBeDefined();
      expect(context.proposalsByQuoteLoader).toBeDefined();
      expect(context.discordMessagesByProjectLoader).toBeDefined();
      expect(context.monitoringEventsBySourceLoader).toBeDefined();
    });

    it('should prevent N+1 queries in dashboard scenario', async () => {
      // ARRANGE: Dashboard loads projects with quotes and time entries
      const projects = [
        { id: 'proj-1', title: 'Project 1', deletedAt: null },
        { id: 'proj-2', title: 'Project 2', deletedAt: null },
        { id: 'proj-3', title: 'Project 3', deletedAt: null },
      ];

      const quotes = [
        { id: 'q1', projectId: 'proj-1', deletedAt: null },
        { id: 'q2', projectId: 'proj-2', deletedAt: null },
      ];

      const timeEntries = [
        { id: 'e1', projectId: 'proj-1', durationMinutes: 60 },
        { id: 'e2', projectId: 'proj-2', durationMinutes: 90 },
        { id: 'e3', projectId: 'proj-3', durationMinutes: 120 },
      ];

      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(projects);
      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue(quotes);
      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue(timeEntries);

      const loaders = createLoaderContext(mockPrisma);

      // ACT: Load projects, then load related data
      const loadedProjects = await Promise.all(
        projects.map((p) => loaders.projectLoader.load(p.id))
      );

      const projectsWithData = await Promise.all(
        loadedProjects.map(async (project) => {
          if (!project) return null;

          const [quotes, timeEntries] = await Promise.all([
            loaders.quotesByProjectLoader.load(project.id),
            loaders.timeEntriesByProjectLoader.load(project.id),
          ]);

          return {
            ...project,
            quotes,
            timeEntries,
          };
        })
      );

      // ASSERT: Queries batched efficiently
      // 1 query for projects
      expect(mockPrisma.project.findMany).toHaveBeenCalledTimes(1);

      // 1 query for all quotes (batched)
      expect(mockPrisma.quote.findMany).toHaveBeenCalledTimes(1);

      // 1 query for all time entries (batched)
      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledTimes(1);

      // Total: 3 queries instead of 1 + 3 + 3 = 7 (N+1 scenario)
      const totalQueries =
        (mockPrisma.project.findMany as jest.Mock).mock.calls.length +
        (mockPrisma.quote.findMany as jest.Mock).mock.calls.length +
        (mockPrisma.timeEntry.findMany as jest.Mock).mock.calls.length;

      expect(totalQueries).toBe(3);

      // Data loaded correctly
      expect(projectsWithData).toHaveLength(3);
      expect(projectsWithData[0]?.quotes).toHaveLength(1);
      expect(projectsWithData[1]?.quotes).toHaveLength(1);
      expect(projectsWithData[2]?.quotes).toHaveLength(0);
    });
  });

  describe('loadDashboardMetrics', () => {
    it('should load all dashboard metrics in parallel', async () => {
      // ARRANGE
      (mockPrisma.project.count as jest.Mock).mockResolvedValueOnce(10); // total
      (mockPrisma.project.count as jest.Mock).mockResolvedValueOnce(5); // active
      (mockPrisma.quote.count as jest.Mock).mockResolvedValue(3); // pending
      (mockPrisma.project.aggregate as jest.Mock).mockResolvedValue({
        _sum: { budget: 50000 },
      });
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'proj-1',
          title: 'Recent Project',
          deletedAt: null,
          _count: { quotes: 2, timeEntries: 5 },
        },
      ]);

      // ACT
      const metrics = await loadDashboardMetrics(mockPrisma);

      // ASSERT: All metrics loaded
      expect(metrics).toEqual({
        totalProjects: 10,
        activeProjects: 5,
        pendingQuotes: 3,
        totalRevenue: 50000,
        recentActivity: expect.arrayContaining([
          expect.objectContaining({
            id: 'proj-1',
            title: 'Recent Project',
          }),
        ]),
      });

      // Queries executed in parallel (not sequentially)
      expect(mockPrisma.project.count).toHaveBeenCalledTimes(2);
      expect(mockPrisma.quote.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.project.aggregate).toHaveBeenCalledTimes(1);
      expect(mockPrisma.project.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('batchLoadProjectStats', () => {
    it('should load project statistics in 2 queries instead of N+1', async () => {
      // ARRANGE
      const projectIds = ['proj-1', 'proj-2', 'proj-3'];

      const quotes = [
        { projectId: 'proj-1' },
        { projectId: 'proj-1' },
        { projectId: 'proj-2' },
      ];

      const timeEntries = [
        { projectId: 'proj-1', durationMinutes: 60 },
        { projectId: 'proj-1', durationMinutes: 120 },
        { projectId: 'proj-2', durationMinutes: 90 },
        { projectId: 'proj-3', durationMinutes: 180 },
      ];

      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue(quotes);
      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue(timeEntries);

      // ACT
      const stats = await batchLoadProjectStats(mockPrisma, projectIds);

      // ASSERT: Only 2 queries (1 for quotes, 1 for time entries)
      expect(mockPrisma.quote.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledTimes(1);

      // Stats calculated correctly
      const proj1Stats = stats.get('proj-1');
      expect(proj1Stats).toEqual({
        quotesCount: 2,
        timeEntriesCount: 2,
        totalHours: 3, // (60 + 120) / 60 = 3
      });

      const proj2Stats = stats.get('proj-2');
      expect(proj2Stats).toEqual({
        quotesCount: 1,
        timeEntriesCount: 1,
        totalHours: 1.5, // 90 / 60 = 1.5
      });

      const proj3Stats = stats.get('proj-3');
      expect(proj3Stats).toEqual({
        quotesCount: 0,
        timeEntriesCount: 1,
        totalHours: 3, // 180 / 60 = 3
      });
    });

    it('should handle empty project list', async () => {
      // ACT
      const stats = await batchLoadProjectStats(mockPrisma, []);

      // ASSERT: No queries executed
      expect(mockPrisma.quote.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.timeEntry.findMany).not.toHaveBeenCalled();
      expect(stats.size).toBe(0);
    });
  });
});
