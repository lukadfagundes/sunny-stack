/**
 * @file Admin Time Reports API
 * @description Provides time tracking reports with aggregation and grouping
 * @route GET /api/admin/reports/time - Generate time tracking reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { withBotAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { AppError, ValidationError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';

/**
 * GET /api/admin/reports/time
 * Generate time tracking reports with optional filtering and grouping
 *
 * Query params:
 * - projectId: string (optional filter by project)
 * - startDate: YYYY-MM-DD (optional filter - start date)
 * - endDate: YYYY-MM-DD (optional filter - end date)
 * - groupBy: 'project' | 'day' | 'week' | 'month' (default: 'project')
 *
 * Response:
 * - summary: { totalTime, totalEntries, activeEntries }
 * - breakdown: Array of aggregated data by groupBy dimension
 */
export const GET = withBotAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'project';

    // Validate groupBy
    const validGroupBy = ['project', 'day', 'week', 'month'];
    if (!validGroupBy.includes(groupBy)) {
      throw new ValidationError(
        `Invalid groupBy. Must be one of: ${validGroupBy.join(', ')}`,
        'groupBy'
      );
    }

    // Validate dates
    if (startDate && isNaN(Date.parse(startDate))) {
      throw new ValidationError('Invalid startDate format. Use YYYY-MM-DD', 'startDate');
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      throw new ValidationError('Invalid endDate format. Use YYYY-MM-DD', 'endDate');
    }

    // Build where clause for filtering
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    // Date range filter (use startedAt for date filtering)
    if (startDate || endDate) {
      where.startedAt = {};

      if (startDate) {
        where.startedAt.gte = new Date(startDate);
      }

      if (endDate) {
        // Set to end of day (23:59:59.999)
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.startedAt.lte = endDateTime;
      }
    }

    // Fetch summary data
    const [totalEntries, activeEntries, completedEntries] = await Promise.all([
      prisma.timeEntry.count({ where }),
      prisma.timeEntry.count({ where: { ...where, endedAt: null } }),
      prisma.timeEntry.findMany({
        where: { ...where, endedAt: { not: null } },
        select: { durationMinutes: true },
      }),
    ]);

    // Calculate total time (only from completed entries)
    const totalTime = completedEntries.reduce(
      (sum, entry) => sum + (entry.durationMinutes || 0),
      0
    );

    // Generate breakdown based on groupBy
    let breakdown: Array<{
      key: string;
      label: string;
      totalTime: number;
      entryCount: number;
    }> = [];

    if (groupBy === 'project') {
      // Group by project
      const projectBreakdown = await prisma.timeEntry.groupBy({
        by: ['projectId'],
        where: { ...where, endedAt: { not: null } },
        _sum: {
          durationMinutes: true,
        },
        _count: {
          id: true,
        },
      });

      // Fetch project names
      const projectIds = projectBreakdown.map((item) => item.projectId);
      const projects = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, title: true },
      });

      const projectMap = new Map(projects.map((p) => [p.id, p.title]));

      breakdown = projectBreakdown.map((item) => ({
        key: item.projectId,
        label: projectMap.get(item.projectId) || 'Unknown Project',
        totalTime: item._sum.durationMinutes || 0,
        entryCount: item._count.id,
      }));
    } else {
      // Group by date (day, week, or month)
      const entries = await prisma.timeEntry.findMany({
        where: { ...where, endedAt: { not: null } },
        select: {
          startedAt: true,
          durationMinutes: true,
        },
        orderBy: { startedAt: 'asc' },
      });

      // Group entries by date dimension
      const grouped = new Map<string, { totalTime: number; entryCount: number }>();

      entries.forEach((entry) => {
        let key: string;
        let label: string;
        const date = new Date(entry.startedAt);

        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          label = date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        } else if (groupBy === 'week') {
          // Get ISO week number
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const weekNum = Math.ceil(
            ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
          );
          key = `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
          label = `Week ${weekNum}, ${date.getFullYear()}`;
        } else {
          // month
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          label = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          });
        }

        const current = grouped.get(key) || { totalTime: 0, entryCount: 0 };
        grouped.set(key, {
          totalTime: current.totalTime + (entry.durationMinutes || 0),
          entryCount: current.entryCount + 1,
        });
      });

      // Convert map to array
      breakdown = Array.from(grouped.entries()).map(([key, data]) => {
        // For label, we need to reconstruct from key
        let label = key;

        if (groupBy === 'day') {
          const date = new Date(key);
          label = date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        } else if (groupBy === 'week') {
          const [year, week] = key.split('-W');
          label = `Week ${week}, ${year}`;
        } else {
          // month
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
          label = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          });
        }

        return {
          key,
          label,
          totalTime: data.totalTime,
          entryCount: data.entryCount,
        };
      });

      // Sort by key (chronological order)
      breakdown.sort((a, b) => a.key.localeCompare(b.key));
    }

    // Log success
    logger.info('Time report generated', {
      projectId,
      startDate,
      endDate,
      groupBy,
      totalEntries,
      totalTime,
    });

    // Return report
    return NextResponse.json({
      summary: {
        totalTime, // Total minutes
        totalEntries,
        activeEntries,
      },
      breakdown,
    });
  } catch (error) {
    logger.error('Failed to generate time report', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate time report' },
      { status: 500 }
    );
  }
});
