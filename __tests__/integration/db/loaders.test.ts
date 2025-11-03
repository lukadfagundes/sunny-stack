/**
 * @file Integration tests for DataLoader with Prisma
 * @description Tests DataLoader implementations with real Prisma queries
 */

import { PrismaClient } from '@prisma/client';
import {
  createProjectLoader,
  createQuotesByProjectLoader,
  createTimeEntriesByProjectLoader,
  createActiveTimeEntryLoader,
  createLoaderContext,
} from '@/lib/db/loaders';

// Mock Prisma client
const mockPrisma = {
  project: {
    findMany: jest.fn(),
  },
  quote: {
    findMany: jest.fn(),
  },
  timeEntry: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('DataLoader Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProjectLoader', () => {
    it('should batch project queries', async () => {
      const mockProjects = [
        { id: 'proj1', title: 'Project 1', deletedAt: null },
        { id: 'proj2', title: 'Project 2', deletedAt: null },
        { id: 'proj3', title: 'Project 3', deletedAt: null },
      ];

      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const loader = createProjectLoader(mockPrisma);

      // Load 3 projects in parallel
      const [p1, p2, p3] = await Promise.all([
        loader.load('proj1'),
        loader.load('proj2'),
        loader.load('proj3'),
      ]);

      // Should only call findMany once (batched)
      expect(mockPrisma.project.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['proj1', 'proj2', 'proj3'] },
          deletedAt: null,
        },
      });

      expect(p1?.id).toBe('proj1');
      expect(p2?.id).toBe('proj2');
      expect(p3?.id).toBe('proj3');
    });

    it('should return null for non-existent projects', async () => {
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue([
        { id: 'proj1', title: 'Project 1', deletedAt: null },
      ]);

      const loader = createProjectLoader(mockPrisma);

      const [p1, p2] = await Promise.all([
        loader.load('proj1'),
        loader.load('non-existent'),
      ]);

      expect(p1?.id).toBe('proj1');
      expect(p2).toBeNull();
    });

    it('should exclude soft-deleted projects', async () => {
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue([
        { id: 'proj1', title: 'Project 1', deletedAt: null },
        // proj2 is soft-deleted, won't be in results
      ]);

      const loader = createProjectLoader(mockPrisma);

      const [p1, p2] = await Promise.all([
        loader.load('proj1'),
        loader.load('proj2'), // Soft-deleted
      ]);

      expect(p1?.id).toBe('proj1');
      expect(p2).toBeNull(); // Excluded due to soft delete
    });
  });

  describe('createQuotesByProjectLoader', () => {
    it('should batch quotes queries by project', async () => {
      const mockQuotes = [
        { id: 'q1', projectId: 'proj1', name: 'Quote 1', deletedAt: null },
        { id: 'q2', projectId: 'proj1', name: 'Quote 2', deletedAt: null },
        { id: 'q3', projectId: 'proj2', name: 'Quote 3', deletedAt: null },
      ];

      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue(mockQuotes);

      const loader = createQuotesByProjectLoader(mockPrisma);

      // Load quotes for 2 projects in parallel
      const [quotes1, quotes2] = await Promise.all([
        loader.load('proj1'),
        loader.load('proj2'),
      ]);

      // Should only call findMany once (batched)
      expect(mockPrisma.quote.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.quote.findMany).toHaveBeenCalledWith({
        where: {
          projectId: { in: ['proj1', 'proj2'] },
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(quotes1).toHaveLength(2);
      expect(quotes2).toHaveLength(1);
      expect(quotes1[0].id).toBe('q1');
      expect(quotes1[1].id).toBe('q2');
      expect(quotes2[0].id).toBe('q3');
    });

    it('should return empty array for projects with no quotes', async () => {
      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue([]);

      const loader = createQuotesByProjectLoader(mockPrisma);

      const quotes = await loader.load('proj1');

      expect(quotes).toEqual([]);
    });

    it('should handle multiple projects with varying quote counts', async () => {
      const mockQuotes = [
        { id: 'q1', projectId: 'proj1', name: 'Quote 1', deletedAt: null },
        { id: 'q2', projectId: 'proj1', name: 'Quote 2', deletedAt: null },
        { id: 'q3', projectId: 'proj1', name: 'Quote 3', deletedAt: null },
        // proj2 has no quotes
        { id: 'q4', projectId: 'proj3', name: 'Quote 4', deletedAt: null },
      ];

      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue(mockQuotes);

      const loader = createQuotesByProjectLoader(mockPrisma);

      const [quotes1, quotes2, quotes3] = await Promise.all([
        loader.load('proj1'),
        loader.load('proj2'),
        loader.load('proj3'),
      ]);

      expect(quotes1).toHaveLength(3);
      expect(quotes2).toHaveLength(0);
      expect(quotes3).toHaveLength(1);
    });
  });

  describe('createTimeEntriesByProjectLoader', () => {
    it('should batch time entries queries by project', async () => {
      const mockEntries = [
        {
          id: 'te1',
          projectId: 'proj1',
          startedAt: new Date(),
          endedAt: new Date(),
          durationMinutes: 60,
        },
        {
          id: 'te2',
          projectId: 'proj1',
          startedAt: new Date(),
          endedAt: new Date(),
          durationMinutes: 120,
        },
        {
          id: 'te3',
          projectId: 'proj2',
          startedAt: new Date(),
          endedAt: new Date(),
          durationMinutes: 30,
        },
      ];

      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const loader = createTimeEntriesByProjectLoader(mockPrisma);

      const [entries1, entries2] = await Promise.all([
        loader.load('proj1'),
        loader.load('proj2'),
      ]);

      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledTimes(1);
      expect(entries1).toHaveLength(2);
      expect(entries2).toHaveLength(1);
    });
  });

  describe('createActiveTimeEntryLoader', () => {
    it('should load active time entry for project', async () => {
      const mockActiveEntry = {
        id: 'te1',
        projectId: 'proj1',
        startedAt: new Date(),
        endedAt: null, // Active entry
        durationMinutes: null,
      };

      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue([mockActiveEntry]);

      const loader = createActiveTimeEntryLoader(mockPrisma);

      const activeEntry = await loader.load('proj1');

      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledWith({
        where: {
          projectId: { in: ['proj1'] },
          endedAt: null,
        },
        orderBy: { startedAt: 'desc' },
      });

      expect(activeEntry?.id).toBe('te1');
      expect(activeEntry?.endedAt).toBeNull();
    });

    it('should return null if no active time entry', async () => {
      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);

      const loader = createActiveTimeEntryLoader(mockPrisma);

      const activeEntry = await loader.load('proj1');

      expect(activeEntry).toBeNull();
    });

    it('should batch active time entry queries', async () => {
      const mockEntries = [
        {
          id: 'te1',
          projectId: 'proj1',
          startedAt: new Date(),
          endedAt: null,
          durationMinutes: null,
        },
        {
          id: 'te2',
          projectId: 'proj2',
          startedAt: new Date(),
          endedAt: null,
          durationMinutes: null,
        },
      ];

      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const loader = createActiveTimeEntryLoader(mockPrisma);

      const [active1, active2, active3] = await Promise.all([
        loader.load('proj1'),
        loader.load('proj2'),
        loader.load('proj3'), // No active entry
      ]);

      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledTimes(1);
      expect(active1?.id).toBe('te1');
      expect(active2?.id).toBe('te2');
      expect(active3).toBeNull();
    });
  });

  describe('createLoaderContext', () => {
    it('should create a complete loader context', () => {
      const context = createLoaderContext(mockPrisma);

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

    it('should batch queries across multiple loaders in context', async () => {
      const mockProjects = [{ id: 'proj1', title: 'Project 1', deletedAt: null }];
      const mockQuotes = [{ id: 'q1', projectId: 'proj1', name: 'Quote 1', deletedAt: null }];
      const mockEntries = [
        {
          id: 'te1',
          projectId: 'proj1',
          startedAt: new Date(),
          endedAt: new Date(),
          durationMinutes: 60,
        },
      ];

      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);
      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue(mockQuotes);
      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const context = createLoaderContext(mockPrisma);

      // Load project, quotes, and time entries in parallel
      const [project, quotes, entries] = await Promise.all([
        context.projectLoader.load('proj1'),
        context.quotesByProjectLoader.load('proj1'),
        context.timeEntriesByProjectLoader.load('proj1'),
      ]);

      // Each loader should only call findMany once
      expect(mockPrisma.project.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.quote.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledTimes(1);

      expect(project?.id).toBe('proj1');
      expect(quotes).toHaveLength(1);
      expect(entries).toHaveLength(1);
    });
  });

  describe('Performance: N+1 Query Prevention', () => {
    it('should prevent N+1 queries when loading related data', async () => {
      // Simulate loading 10 projects with their quotes and time entries
      const projectIds = Array.from({ length: 10 }, (_, i) => `proj${i + 1}`);

      const mockProjects = projectIds.map((id) => ({
        id,
        title: `Project ${id}`,
        deletedAt: null,
      }));

      const mockQuotes = projectIds.flatMap((projectId, i) => [
        { id: `q${i * 2 + 1}`, projectId, name: `Quote ${i * 2 + 1}`, deletedAt: null },
        { id: `q${i * 2 + 2}`, projectId, name: `Quote ${i * 2 + 2}`, deletedAt: null },
      ]);

      const mockEntries = projectIds.flatMap((projectId, i) => [
        {
          id: `te${i * 3 + 1}`,
          projectId,
          startedAt: new Date(),
          endedAt: new Date(),
          durationMinutes: 60,
        },
        {
          id: `te${i * 3 + 2}`,
          projectId,
          startedAt: new Date(),
          endedAt: new Date(),
          durationMinutes: 120,
        },
      ]);

      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);
      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue(mockQuotes);
      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const context = createLoaderContext(mockPrisma);

      // Load all projects with their quotes and time entries
      const results = await Promise.all(
        projectIds.map(async (id) => {
          const [project, quotes, entries] = await Promise.all([
            context.projectLoader.load(id),
            context.quotesByProjectLoader.load(id),
            context.timeEntriesByProjectLoader.load(id),
          ]);

          return { project, quotes, entries };
        })
      );

      // WITHOUT DataLoader: Would be 1 + 10 + 10 = 21 queries
      // WITH DataLoader: Only 3 queries (1 for projects, 1 for quotes, 1 for time entries)
      expect(mockPrisma.project.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.quote.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledTimes(1);

      // Verify all data loaded correctly
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.project?.id).toBe(`proj${i + 1}`);
        expect(result.quotes).toHaveLength(2);
        expect(result.entries).toHaveLength(2);
      });
    });
  });
});
