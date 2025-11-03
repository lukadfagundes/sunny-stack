/**
 * @file Query Optimizer - Performance monitoring and batch query utilities
 * @description Provides query performance tracking and optimized batch loading functions
 * @module lib/db/query-optimizer
 *
 * Usage Example:
 * ```typescript
 * import { QueryOptimizer, loadDashboardMetrics } from '@/lib/db/query-optimizer';
 *
 * const optimizer = new QueryOptimizer();
 * const metrics = await optimizer.trackQuery(
 *   'loadDashboard',
 *   () => loadDashboardMetrics(prisma)
 * );
 *
 * // Check for slow queries
 * const slowQueries = optimizer.getSlowQueries();
 * ```
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { DatabaseError } from '@/lib/errors/app-error';
import type { Project, Quote, TimeEntry } from '@prisma/client';

/**
 * Query log entry for performance tracking
 */
export interface QueryLogEntry {
  /** Name/identifier for the query */
  name: string;
  /** Query execution duration in milliseconds */
  duration: number;
  /** Timestamp when query was executed */
  timestamp: Date;
  /** Whether query completed successfully */
  success: boolean;
  /** Error message if query failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Dashboard metrics aggregated data
 */
export interface DashboardMetrics {
  /** Total number of projects (excluding soft-deleted) */
  totalProjects: number;
  /** Number of projects with status IN_PROGRESS */
  activeProjects: number;
  /** Number of quotes with status PENDING */
  pendingQuotes: number;
  /** Total revenue (sum of all project budgets) */
  totalRevenue: number;
  /** Recent project activity (last 10 updated projects) */
  recentActivity: Array<
    Project & {
      _count: {
        quotes: number;
        timeEntries: number;
      };
    }
  >;
}

/**
 * Query Optimizer - Performance monitoring and slow query detection
 *
 * Tracks query execution times and identifies slow queries for optimization.
 *
 * @example
 * const optimizer = new QueryOptimizer({ slowQueryThreshold: 200 });
 *
 * // Track a query
 * const result = await optimizer.trackQuery('findProjects', async () => {
 *   return await prisma.project.findMany();
 * });
 *
 * // Get slow queries
 * const slow = optimizer.getSlowQueries();
 * console.log(`Found ${slow.length} slow queries`);
 */
export class QueryOptimizer {
  private slowQueryThreshold: number;
  private queryLog: QueryLogEntry[];
  private maxLogSize: number;

  /**
   * Create a new QueryOptimizer instance
   *
   * @param options - Configuration options
   * @param options.slowQueryThreshold - Duration in ms to consider a query slow (default: 100)
   * @param options.maxLogSize - Maximum number of query logs to keep (default: 1000)
   */
  constructor(options: { slowQueryThreshold?: number; maxLogSize?: number } = {}) {
    this.slowQueryThreshold = options.slowQueryThreshold ?? 100;
    this.maxLogSize = options.maxLogSize ?? 1000;
    this.queryLog = [];
  }

  /**
   * Track a query's performance
   *
   * Executes the query and logs performance metrics.
   * Logs a warning if query exceeds slow threshold.
   *
   * @template T - Return type of the query
   * @param queryName - Name/identifier for the query
   * @param query - Async function that executes the query
   * @param metadata - Additional metadata to log
   * @returns Promise resolving to query result
   *
   * @example
   * const projects = await optimizer.trackQuery(
   *   'loadProjects',
   *   () => prisma.project.findMany(),
   *   { filters: { status: 'ACTIVE' } }
   * );
   */
  async trackQuery<T>(
    queryName: string,
    query: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      // Execute query
      const result = await query();
      const duration = Date.now() - startTime;

      // Log entry
      const logEntry: QueryLogEntry = {
        name: queryName,
        duration,
        timestamp,
        success: true,
        metadata,
      };

      this.addLogEntry(logEntry);

      // Warn if slow
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          query: queryName,
          duration,
          threshold: this.slowQueryThreshold,
          metadata,
        });
      } else {
        logger.debug('Query completed', {
          query: queryName,
          duration,
          metadata,
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      const logEntry: QueryLogEntry = {
        name: queryName,
        duration,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata,
      };

      this.addLogEntry(logEntry);

      logger.error('Query failed', {
        query: queryName,
        duration,
        error: error instanceof Error ? error.message : String(error),
        metadata,
      });

      throw error;
    }
  }

  /**
   * Add a log entry and maintain max log size
   */
  private addLogEntry(entry: QueryLogEntry): void {
    this.queryLog.push(entry);

    // Trim log if exceeds max size
    if (this.queryLog.length > this.maxLogSize) {
      this.queryLog = this.queryLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Get all slow queries from the log
   *
   * @returns Array of slow query log entries
   *
   * @example
   * const slowQueries = optimizer.getSlowQueries();
   * slowQueries.forEach(q => {
   *   console.log(`${q.name} took ${q.duration}ms`);
   * });
   */
  getSlowQueries(): QueryLogEntry[] {
    return this.queryLog.filter((entry) => entry.duration > this.slowQueryThreshold);
  }

  /**
   * Get all query logs
   *
   * @returns Array of all query log entries
   */
  getAllQueries(): QueryLogEntry[] {
    return [...this.queryLog];
  }

  /**
   * Get query statistics
   *
   * @returns Statistics about tracked queries
   */
  getStats(): {
    total: number;
    slow: number;
    failed: number;
    avgDuration: number;
    maxDuration: number;
  } {
    const total = this.queryLog.length;
    const slow = this.queryLog.filter((e) => e.duration > this.slowQueryThreshold).length;
    const failed = this.queryLog.filter((e) => !e.success).length;

    const durations = this.queryLog.map((e) => e.duration);
    const avgDuration = total > 0 ? durations.reduce((a, b) => a + b, 0) / total : 0;
    const maxDuration = total > 0 ? Math.max(...durations) : 0;

    return {
      total,
      slow,
      failed,
      avgDuration: Math.round(avgDuration),
      maxDuration,
    };
  }

  /**
   * Reset all query statistics
   *
   * @example
   * optimizer.resetStats();
   */
  resetStats(): void {
    this.queryLog = [];
    logger.debug('Query optimizer stats reset');
  }

  /**
   * Update slow query threshold
   *
   * @param threshold - New threshold in milliseconds
   */
  setSlowQueryThreshold(threshold: number): void {
    if (threshold <= 0) {
      throw new Error('Slow query threshold must be positive');
    }
    this.slowQueryThreshold = threshold;
    logger.debug('Slow query threshold updated', { threshold });
  }
}

/**
 * Batch load time entries for multiple projects (calendar-style data)
 *
 * Efficiently loads time entries for multiple projects in a single query.
 * Groups results by project ID for easy lookup.
 * Useful for calendar views showing project activity.
 *
 * @param prisma - Prisma client instance
 * @param projectIds - Array of project IDs to load events for
 * @param dateRange - Optional date range filter
 * @returns Map of project ID to time entries array
 *
 * @example
 * const entriesByProject = await batchLoadTimeEntriesForCalendar(
 *   prisma,
 *   ['project1', 'project2', 'project3'],
 *   { start: new Date('2025-01-01'), end: new Date('2025-01-31') }
 * );
 *
 * const project1Entries = entriesByProject.get('project1') || [];
 */
export async function batchLoadTimeEntriesForCalendar(
  prisma: PrismaClient,
  projectIds: string[],
  dateRange?: { start: Date; end: Date }
): Promise<Map<string, TimeEntry[]>> {
  if (projectIds.length === 0) {
    return new Map();
  }

  logger.debug('Batch loading time entries for calendar', {
    projectCount: projectIds.length,
    dateRange: dateRange
      ? {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        }
      : null,
  });

  try {
    // Load all time entries for multiple projects in 1 query
    const entries = await prisma.timeEntry.findMany({
      where: {
        projectId: { in: projectIds },
        ...(dateRange && {
          startedAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        }),
      },
      orderBy: { startedAt: 'asc' },
    });

    // Group by project ID
    const grouped = new Map<string, TimeEntry[]>();

    // Initialize empty arrays for all project IDs
    projectIds.forEach((id) => grouped.set(id, []));

    // Populate with entries
    entries.forEach((entry) => {
      const list = grouped.get(entry.projectId) ?? [];
      list.push(entry);
      grouped.set(entry.projectId, list);
    });

    logger.debug('Time entries loaded for calendar', {
      totalEntries: entries.length,
      projectsWithEntries: Array.from(grouped.entries()).filter(([, entries]) => entries.length > 0)
        .length,
    });

    return grouped;
  } catch (error) {
    logger.error('Failed to batch load time entries for calendar', {
      error: error instanceof Error ? error.message : String(error),
      projectCount: projectIds.length,
    });

    throw new DatabaseError(
      'Failed to load time entries for calendar',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Load aggregated dashboard metrics efficiently
 *
 * Executes all dashboard queries in parallel for optimal performance.
 * Single function call to load all dashboard data.
 *
 * Performance target: < 1 second (p95)
 *
 * @param prisma - Prisma client instance
 * @returns Dashboard metrics object
 *
 * @example
 * const metrics = await loadDashboardMetrics(prisma);
 * console.log(`Active projects: ${metrics.activeProjects}`);
 * console.log(`Pending quotes: ${metrics.pendingQuotes}`);
 * console.log(`Total revenue: $${metrics.totalRevenue}`);
 */
export async function loadDashboardMetrics(
  prisma: PrismaClient
): Promise<DashboardMetrics> {
  logger.debug('Loading dashboard metrics');

  try {
    // Execute all dashboard queries in parallel
    const [
      totalProjects,
      activeProjects,
      pendingQuotes,
      revenueAggregate,
      recentActivity,
    ] = await Promise.all([
      // Total projects (excluding soft-deleted)
      prisma.project.count({
        where: { deletedAt: null },
      }),

      // Active projects
      prisma.project.count({
        where: {
          status: 'IN_PROGRESS',
          deletedAt: null,
        },
      }),

      // Pending quotes
      prisma.quote.count({
        where: {
          status: 'PENDING',
          deletedAt: null,
        },
      }),

      // Total revenue (sum of all project budgets)
      prisma.project.aggregate({
        where: { deletedAt: null },
        _sum: { budget: true },
      }),

      // Recent activity (last 10 updated projects)
      prisma.project.findMany({
        where: { deletedAt: null },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              quotes: true,
              timeEntries: true,
            },
          },
        },
      }),
    ]);

    const totalRevenue = Number(revenueAggregate._sum.budget ?? 0);

    const metrics: DashboardMetrics = {
      totalProjects,
      activeProjects,
      pendingQuotes,
      totalRevenue,
      recentActivity,
    };

    logger.debug('Dashboard metrics loaded', {
      totalProjects,
      activeProjects,
      pendingQuotes,
      totalRevenue,
      recentActivityCount: recentActivity.length,
    });

    return metrics;
  } catch (error) {
    logger.error('Failed to load dashboard metrics', {
      error: error instanceof Error ? error.message : String(error),
    });

    throw new DatabaseError(
      'Failed to load dashboard metrics',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Batch load project statistics (quotes count, time entries count, total hours)
 *
 * Efficiently loads statistics for multiple projects in parallel.
 *
 * @param prisma - Prisma client instance
 * @param projectIds - Array of project IDs
 * @returns Map of project ID to statistics
 *
 * @example
 * const stats = await batchLoadProjectStats(prisma, ['proj1', 'proj2']);
 * const proj1Stats = stats.get('proj1');
 * console.log(`Quotes: ${proj1Stats.quotesCount}, Hours: ${proj1Stats.totalHours}`);
 */
export async function batchLoadProjectStats(
  prisma: PrismaClient,
  projectIds: string[]
): Promise<
  Map<
    string,
    {
      quotesCount: number;
      timeEntriesCount: number;
      totalHours: number;
    }
  >
> {
  if (projectIds.length === 0) {
    return new Map();
  }

  logger.debug('Batch loading project stats', { projectCount: projectIds.length });

  try {
    // Load quotes and time entries in parallel
    const [quotesByProject, timeEntriesByProject] = await Promise.all([
      // Load all quotes for these projects
      prisma.quote.findMany({
        where: {
          projectId: { in: projectIds },
          deletedAt: null,
        },
        select: { projectId: true },
      }),

      // Load all time entries for these projects
      prisma.timeEntry.findMany({
        where: {
          projectId: { in: projectIds },
        },
        select: { projectId: true, durationMinutes: true },
      }),
    ]);

    // Aggregate stats
    const statsMap = new Map<
      string,
      { quotesCount: number; timeEntriesCount: number; totalHours: number }
    >();

    // Initialize all projects
    projectIds.forEach((id) => {
      statsMap.set(id, { quotesCount: 0, timeEntriesCount: 0, totalHours: 0 });
    });

    // Count quotes
    quotesByProject.forEach((quote) => {
      if (quote.projectId) {
        const stats = statsMap.get(quote.projectId);
        if (stats) {
          stats.quotesCount++;
        }
      }
    });

    // Count time entries and sum hours
    timeEntriesByProject.forEach((entry) => {
      const stats = statsMap.get(entry.projectId);
      if (stats) {
        stats.timeEntriesCount++;
        stats.totalHours += (entry.durationMinutes ?? 0) / 60;
      }
    });

    logger.debug('Project stats loaded', {
      projectCount: projectIds.length,
      totalQuotes: quotesByProject.length,
      totalTimeEntries: timeEntriesByProject.length,
    });

    return statsMap;
  } catch (error) {
    logger.error('Failed to batch load project stats', {
      error: error instanceof Error ? error.message : String(error),
      projectCount: projectIds.length,
    });

    throw new DatabaseError(
      'Failed to load project statistics',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Default query optimizer instance
 */
export const defaultOptimizer = new QueryOptimizer();
