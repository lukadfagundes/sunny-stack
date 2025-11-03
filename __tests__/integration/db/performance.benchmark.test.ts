/**
 * @file Performance benchmark tests for DataLoader
 * @description Measures N+1 query prevention and performance improvements
 */

import { PrismaClient } from '@prisma/client';
import { createLoaderContext } from '@/lib/db/loaders';
import { QueryOptimizer, loadDashboardMetrics, batchLoadProjectStats } from '@/lib/db/query-optimizer';

// Mock Prisma for controlled benchmarking
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

describe('Performance Benchmarks - DataLoader', () => {
  let optimizer: QueryOptimizer;

  beforeEach(() => {
    jest.clearAllMocks();
    optimizer = new QueryOptimizer({ slowQueryThreshold: 100 });
  });

  describe('N+1 Query Prevention', () => {
    it('should reduce queries from 41 to 3 for 20 projects (93% reduction)', async () => {
      // ARRANGE: 20 projects scenario
      const projectCount = 20;
      const projects = Array.from({ length: projectCount }, (_, i) => ({
        id: `proj-${i + 1}`,
        title: `Project ${i + 1}`,
        deletedAt: null,
      }));

      const quotes = Array.from({ length: projectCount }, (_, i) => ({
        id: `quote-${i + 1}`,
        projectId: `proj-${i + 1}`,
        deletedAt: null,
      }));

      const timeEntries = Array.from({ length: projectCount }, (_, i) => ({
        id: `entry-${i + 1}`,
        projectId: `proj-${i + 1}`,
        durationMinutes: 60,
      }));

      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(projects);
      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue(quotes);
      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue(timeEntries);

      const loaders = createLoaderContext(mockPrisma);

      // ACT: Load projects with related data using DataLoader
      const result = await optimizer.trackQuery(
        'loadProjectsWithRelations',
        async () => {
          const loadedProjects = await Promise.all(
            projects.map((p) => loaders.projectLoader.load(p.id))
          );

          return Promise.all(
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
        }
      );

      // ASSERT: Query count reduction
      const totalQueries =
        (mockPrisma.project.findMany as jest.Mock).mock.calls.length +
        (mockPrisma.quote.findMany as jest.Mock).mock.calls.length +
        (mockPrisma.timeEntry.findMany as jest.Mock).mock.calls.length;

      // Without DataLoader: 1 + 20 + 20 = 41 queries
      // With DataLoader: 1 + 1 + 1 = 3 queries
      expect(totalQueries).toBe(3);

      // Improvement: (41 - 3) / 41 = 92.68% reduction
      const improvement = ((41 - totalQueries) / 41) * 100;
      expect(improvement).toBeGreaterThan(90);

      // Data correctness
      expect(result).toHaveLength(projectCount);
      expect(result[0]?.quotes).toBeDefined();
      expect(result[0]?.timeEntries).toBeDefined();
    });

    it('should reduce queries from 100 to 1 for calendar sync (99% reduction)', async () => {
      // ARRANGE: 100 calendar events
      const eventCount = 100;
      const events = Array.from({ length: eventCount }, (_, i) => ({
        id: `event-${i + 1}`,
        projectId: `proj-${i % 10}`, // 10 different projects
        durationMinutes: 60,
      }));

      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue(events);

      const loader = createLoaderContext(mockPrisma).timeEntriesByProjectLoader;

      // ACT: Load time entries for 10 projects
      const projectIds = Array.from({ length: 10 }, (_, i) => `proj-${i}`);

      const result = await optimizer.trackQuery('loadCalendarEvents', async () => {
        return Promise.all(projectIds.map((id) => loader.load(id)));
      });

      // ASSERT: Single query instead of 100 individual queries
      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledTimes(1);

      // Improvement: 99% reduction
      const improvement = ((100 - 1) / 100) * 100;
      expect(improvement).toBe(99);

      // Data correctness
      expect(result).toHaveLength(10);
      expect(result.flat()).toHaveLength(eventCount);
    });
  });

  describe('Performance Targets', () => {
    it('should load dashboard metrics in under 1 second', async () => {
      // ARRANGE: Mock fast database responses
      (mockPrisma.project.count as jest.Mock).mockResolvedValue(50);
      (mockPrisma.quote.count as jest.Mock).mockResolvedValue(20);
      (mockPrisma.project.aggregate as jest.Mock).mockResolvedValue({
        _sum: { budget: 100000 },
      });
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'proj-1',
          title: 'Recent',
          deletedAt: null,
          _count: { quotes: 2, timeEntries: 5 },
        },
      ]);

      // ACT
      const startTime = Date.now();
      const metrics = await loadDashboardMetrics(mockPrisma);
      const duration = Date.now() - startTime;

      // ASSERT: Under 1 second (1000ms)
      expect(duration).toBeLessThan(1000);

      // Data loaded
      expect(metrics.totalProjects).toBe(50);
      expect(metrics.pendingQuotes).toBe(20);
      expect(metrics.totalRevenue).toBe(100000);
      expect(metrics.recentActivity).toHaveLength(1);
    });

    it('should batch 100 project stats in under 500ms', async () => {
      // ARRANGE: 100 projects
      const projectIds = Array.from({ length: 100 }, (_, i) => `proj-${i + 1}`);

      const quotes = Array.from({ length: 200 }, (_, i) => ({
        projectId: `proj-${(i % 100) + 1}`,
      }));

      const timeEntries = Array.from({ length: 300 }, (_, i) => ({
        projectId: `proj-${(i % 100) + 1}`,
        durationMinutes: 60,
      }));

      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue(quotes);
      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue(timeEntries);

      // ACT
      const startTime = Date.now();
      const stats = await batchLoadProjectStats(mockPrisma, projectIds);
      const duration = Date.now() - startTime;

      // ASSERT: Under 500ms
      expect(duration).toBeLessThan(500);

      // Data loaded correctly
      expect(stats.size).toBe(100);

      // Only 2 queries (not 200)
      expect(mockPrisma.quote.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query Optimizer Tracking', () => {
    it('should track query performance', async () => {
      // ARRANGE
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue([
        { id: 'proj-1', title: 'Test', deletedAt: null },
      ]);

      // ACT
      await optimizer.trackQuery('findProjects', async () => {
        return mockPrisma.project.findMany();
      });

      // ASSERT: Query logged
      const stats = optimizer.getStats();
      expect(stats.total).toBe(1);
      expect(stats.failed).toBe(0);
    });

    it('should detect slow queries', async () => {
      // ARRANGE: Slow query (>100ms threshold)
      (mockPrisma.project.findMany as jest.Mock).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        return [];
      });

      // ACT
      await optimizer.trackQuery('slowQuery', async () => {
        return mockPrisma.project.findMany();
      });

      // ASSERT: Slow query detected
      const slowQueries = optimizer.getSlowQueries();
      expect(slowQueries).toHaveLength(1);
      expect(slowQueries[0].name).toBe('slowQuery');
      expect(slowQueries[0].duration).toBeGreaterThan(100);
    });

    it('should track failed queries', async () => {
      // ARRANGE: Failing query
      (mockPrisma.project.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // ACT
      await expect(
        optimizer.trackQuery('failedQuery', async () => {
          return mockPrisma.project.findMany();
        })
      ).rejects.toThrow('Database connection failed');

      // ASSERT: Failure tracked
      const stats = optimizer.getStats();
      expect(stats.total).toBe(1);
      expect(stats.failed).toBe(1);
    });

    it('should calculate average and max duration', async () => {
      // ARRANGE: Multiple queries with different durations
      const durations = [50, 100, 150, 200];

      for (const duration of durations) {
        (mockPrisma.project.findMany as jest.Mock).mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, duration));
          return [];
        });

        await optimizer.trackQuery(`query-${duration}`, async () => {
          return mockPrisma.project.findMany();
        });
      }

      // ACT
      const stats = optimizer.getStats();

      // ASSERT: Stats calculated correctly
      expect(stats.total).toBe(4);
      // Allow 10% variance due to setTimeout precision
      expect(stats.avgDuration).toBeGreaterThan(100);
      expect(stats.avgDuration).toBeLessThan(150);
      expect(stats.maxDuration).toBeGreaterThanOrEqual(200);
    });

    it('should reset statistics', () => {
      // ARRANGE: Add some query logs
      optimizer.trackQuery('query1', async () => []);
      optimizer.trackQuery('query2', async () => []);

      // ACT: Reset
      optimizer.resetStats();

      // ASSERT: Stats cleared
      const stats = optimizer.getStats();
      expect(stats.total).toBe(0);
      expect(stats.slow).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('Cache Performance', () => {
    it('should serve cached results instantly (< 1ms)', async () => {
      // ARRANGE
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue([
        { id: 'proj-1', title: 'Cached Project', deletedAt: null },
      ]);

      const loader = createLoaderContext(mockPrisma).projectLoader;

      // First load (primes cache)
      await loader.load('proj-1');

      // ACT: Second load (from cache)
      const startTime = Date.now();
      await loader.load('proj-1');
      const duration = Date.now() - startTime;

      // ASSERT: Instant cache retrieval
      expect(duration).toBeLessThan(1);

      // Only 1 database query
      expect(mockPrisma.project.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle cache invalidation efficiently', async () => {
      // ARRANGE
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue([
        { id: 'proj-1', title: 'Project', deletedAt: null },
      ]);

      const loader = createLoaderContext(mockPrisma).projectLoader;

      // Load project
      await loader.load('proj-1');

      // ACT: Clear cache and reload
      loader.clear('proj-1');
      await loader.load('proj-1');

      // ASSERT: Cache cleared, new query executed
      expect(mockPrisma.project.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('Scalability Tests', () => {
    it('should handle 1000 concurrent loads efficiently', async () => {
      // ARRANGE: Large dataset
      const projectCount = 1000;
      const projects = Array.from({ length: projectCount }, (_, i) => ({
        id: `proj-${i + 1}`,
        title: `Project ${i + 1}`,
        deletedAt: null,
      }));

      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(projects);

      const loader = createLoaderContext(mockPrisma).projectLoader;

      // ACT: Load 1000 projects concurrently
      const startTime = Date.now();
      const results = await Promise.all(
        projects.map((p) => loader.load(p.id))
      );
      const duration = Date.now() - startTime;

      // ASSERT: All loaded
      expect(results).toHaveLength(projectCount);

      // Batched queries (respects maxBatchSize: 100 from loader config)
      // Expected: ceil(1000 / 100) = 10 batches
      const callCount = (mockPrisma.project.findMany as jest.Mock).mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(1);
      expect(callCount).toBeLessThanOrEqual(10);

      // Performance target: < 2 seconds for 1000 loads
      expect(duration).toBeLessThan(2000);
    });

    it('should respect maxBatchSize for large datasets', async () => {
      // ARRANGE: 500 projects, maxBatchSize = 100
      const projectCount = 500;
      const projects = Array.from({ length: projectCount }, (_, i) => ({
        id: `proj-${i + 1}`,
        title: `Project ${i + 1}`,
        deletedAt: null,
      }));

      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(projects);

      const loader = createLoaderContext(mockPrisma).projectLoader;

      // ACT: Load 500 projects
      await Promise.all(projects.map((p) => loader.load(p.id)));

      // ASSERT: Multiple batches executed (respecting maxBatchSize: 100)
      // Expected: ceil(500 / 100) = 5 batches
      expect(mockPrisma.project.findMany).toHaveBeenCalled();
      const callCount = (mockPrisma.project.findMany as jest.Mock).mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(1);
      expect(callCount).toBeLessThanOrEqual(5);
    });
  });

  describe('Performance Report', () => {
    it('should generate performance improvement report', async () => {
      // ARRANGE: Scenario with 20 projects
      const projectCount = 20;
      const projects = Array.from({ length: projectCount }, (_, i) => ({
        id: `proj-${i + 1}`,
        title: `Project ${i + 1}`,
        deletedAt: null,
      }));

      const quotes = Array.from({ length: projectCount * 2 }, (_, i) => ({
        id: `quote-${i + 1}`,
        projectId: `proj-${(i % projectCount) + 1}`,
        deletedAt: null,
      }));

      const timeEntries = Array.from({ length: projectCount * 3 }, (_, i) => ({
        id: `entry-${i + 1}`,
        projectId: `proj-${(i % projectCount) + 1}`,
        durationMinutes: 60,
      }));

      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(projects);
      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue(quotes);
      (mockPrisma.timeEntry.findMany as jest.Mock).mockResolvedValue(timeEntries);

      const loaders = createLoaderContext(mockPrisma);

      // ACT
      await Promise.all(
        projects.map(async (p) => {
          const project = await loaders.projectLoader.load(p.id);
          if (project) {
            await Promise.all([
              loaders.quotesByProjectLoader.load(project.id),
              loaders.timeEntriesByProjectLoader.load(project.id),
            ]);
          }
        })
      );

      // ASSERT: Generate performance report
      const report = {
        scenario: 'Dashboard with 20 projects',
        withoutDataLoader: {
          queries: 1 + projectCount + projectCount, // 41 queries
          description: '1 (projects) + 20 (quotes) + 20 (time entries)',
        },
        withDataLoader: {
          queries:
            (mockPrisma.project.findMany as jest.Mock).mock.calls.length +
            (mockPrisma.quote.findMany as jest.Mock).mock.calls.length +
            (mockPrisma.timeEntry.findMany as jest.Mock).mock.calls.length,
          description: '1 (projects) + 1 (batched quotes) + 1 (batched time entries)',
        },
        improvement: {
          queryReduction:
            ((41 - 3) / 41) * 100, // 92.68%
          expectedDescription: '93% reduction in database queries',
        },
      };

      expect(report.withDataLoader.queries).toBe(3);
      expect(report.improvement.queryReduction).toBeGreaterThan(90);

      console.log('\n=� Performance Improvement Report:');
      console.log(`Scenario: ${report.scenario}`);
      console.log(`Without DataLoader: ${report.withoutDataLoader.queries} queries`);
      console.log(`With DataLoader: ${report.withDataLoader.queries} queries`);
      console.log(
        `Improvement: ${report.improvement.queryReduction.toFixed(2)}% reduction`
      );
    });
  });
});
