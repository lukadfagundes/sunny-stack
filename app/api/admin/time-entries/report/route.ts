/**
 * @file Admin Time Entries Report API
 * @description Generates time tracking reports with aggregations
 * @route GET /api/admin/time-entries/report - Generate time report
 */

import { NextRequest, NextResponse } from 'next/server';
import { withBotAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { AppError, ValidationError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';

/**
 * Calculate date range for period filter
 */
function getDateRange(period: string): { startDate: Date; endDate: Date } | null {
  const now = new Date();

  switch (period) {
    case 'today': {
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    case 'week': {
      // Start of week (Sunday)
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      // End of week (Saturday)
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    case 'month': {
      // Start of month
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      // End of month
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    case 'all':
      return null; // No date filter

    default:
      throw new ValidationError(
        `Invalid period. Must be one of: today, week, month, all`,
        'period'
      );
  }
}

/**
 * GET /api/admin/time-entries/report
 * Generate time tracking report with aggregations
 *
 * Query params:
 * - period: 'today' | 'week' | 'month' | 'all' (default: 'all')
 * - projectId: string (optional - project CUID for exact match)
 * - projectTitle: string (optional - case-insensitive search, ignored if projectId provided)
 */
export const GET = withBotAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const period = searchParams.get('period') || 'all';
    const projectIdParam = searchParams.get('projectId');
    const projectTitle = searchParams.get('projectTitle');

    // Validate period
    const validPeriods = ['today', 'week', 'month', 'all'];
    if (!validPeriods.includes(period)) {
      throw new ValidationError(
        `Invalid period. Must be one of: ${validPeriods.join(', ')}`,
        'period'
      );
    }

    // Calculate date range
    const dateRange = getDateRange(period);

    // Build where clause
    const where: any = {
      endedAt: { not: null }, // Only completed entries
      project: {
        deletedAt: null, // Exclude soft-deleted projects
      },
    };

    // Add date range filter
    if (dateRange) {
      where.startedAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    // Handle project filter (prefer projectId over projectTitle)
    let projectId: string | undefined;
    if (projectIdParam) {
      // Direct project ID provided (from autocomplete)
      projectId = projectIdParam;
      where.projectId = projectId;
    } else if (projectTitle) {
      // Search for projects matching the title
      const projects = await prisma.project.findMany({
        where: {
          title: { contains: projectTitle, mode: 'insensitive' },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          clientName: true,
        },
      });

      if (projects.length === 0) {
        // No projects found - return empty report
        return NextResponse.json({
          totalMinutes: 0,
          entryCount: 0,
          projectBreakdown: [],
          recentEntries: [],
        });
      }

      if (projects.length > 1) {
        // Multiple projects found - ask user to be more specific
        return NextResponse.json(
          {
            error: 'Multiple projects found',
            message: `Found ${projects.length} projects matching "${projectTitle}". Please be more specific.`,
            projects: projects.map((p) => ({
              title: p.title,
              clientName: p.clientName,
            })),
          },
          { status: 400 }
        );
      }

      // Single project found - use it for filtering
      projectId = projects[0].id;
      where.projectId = projectId;
    }

    // Fetch aggregated data
    const [totalStats, projectBreakdown, recentEntries] = await Promise.all([
      // Total minutes and count
      prisma.timeEntry.aggregate({
        where,
        _sum: {
          durationMinutes: true,
        },
        _count: {
          id: true,
        },
      }),

      // Breakdown by project
      prisma.timeEntry.groupBy({
        by: ['projectId'],
        where,
        _sum: {
          durationMinutes: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            durationMinutes: 'desc',
          },
        },
      }),

      // Recent entries (last 10)
      prisma.timeEntry.findMany({
        where,
        orderBy: {
          startedAt: 'desc',
        },
        take: 10,
        select: {
          id: true,
          description: true,
          durationMinutes: true,
          startedAt: true,
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ]);

    // Fetch project titles for breakdown
    const projectIds = projectBreakdown.map((p) => p.projectId);
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const projectMap = new Map(projects.map((p) => [p.id, p.title]));

    // Format response
    const response = {
      totalMinutes: totalStats._sum.durationMinutes || 0,
      entryCount: totalStats._count.id,
      projectBreakdown: projectBreakdown.map((p) => ({
        projectId: p.projectId,
        projectTitle: projectMap.get(p.projectId) || 'Unknown Project',
        totalMinutes: p._sum.durationMinutes || 0,
        entryCount: p._count.id,
      })),
      recentEntries: recentEntries.map((e) => ({
        id: e.id,
        projectTitle: e.project.title,
        description: e.description,
        durationMinutes: e.durationMinutes || 0,
        startedAt: e.startedAt.toISOString(),
      })),
    };

    // Log success
    logger.info('Time report generated', {
      period,
      projectTitle: projectTitle || 'all',
      totalMinutes: response.totalMinutes,
      entryCount: response.entryCount,
    });

    return NextResponse.json(response);
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
