/**
 * @file Admin Analytics API
 * @description Provides dashboard metrics and aggregated data
 * @route GET /api/admin/analytics - Get dashboard analytics
 * @auth Supports both NextAuth v5 session and Bot API key authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';
import { ProjectStatus, QuoteStatus } from '@prisma/client';

// Force dynamic rendering (no static optimization)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/analytics
 * Get dashboard metrics and analytics
 *
 * Returns:
 * - activeProjects: number (status != COMPLETE && deletedAt == null)
 * - pendingQuotes: number (status == PENDING)
 * - totalRevenue: number (sum of project budgets)
 * - hoursTracked: number (sum of timeEntry durations this week)
 * - recentActivity: array of recent events (projects and quotes)
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    // Calculate start of current week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Execute all analytics queries in parallel for performance
    const [
      activeProjects,
      pendingQuotes,
      totalRevenueResult,
      hoursTrackedResult,
      recentProjects,
      recentQuotes,
    ] = await Promise.all([
      // Count active projects (not complete, not archived, not deleted)
      prisma.project.count({
        where: {
          status: {
            notIn: [ProjectStatus.COMPLETE, ProjectStatus.ARCHIVED],
          },
          deletedAt: null,
        },
      }),

      // Count pending quotes
      prisma.quote.count({
        where: {
          status: QuoteStatus.PENDING,
        },
      }),

      // Sum of all project budgets (total revenue)
      prisma.project.aggregate({
        _sum: {
          budget: true,
        },
        where: {
          deletedAt: null,
        },
      }),

      // Sum of time entries this week (in minutes)
      prisma.timeEntry.aggregate({
        _sum: {
          durationMinutes: true,
        },
        where: {
          startedAt: {
            gte: startOfWeek,
          },
        },
      }),

      // Recent projects (last 5)
      prisma.project.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),

      // Recent quotes (last 5)
      prisma.quote.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          projectType: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate total revenue (convert Decimal to number)
    const totalRevenue = totalRevenueResult._sum.budget
      ? parseFloat(totalRevenueResult._sum.budget.toString())
      : 0;

    // Calculate hours tracked this week (convert minutes to hours)
    const minutesTracked = hoursTrackedResult._sum.durationMinutes || 0;
    const hoursTracked = Math.round((minutesTracked / 60) * 10) / 10; // Round to 1 decimal

    // Combine and format recent activity
    const recentActivity = [
      ...recentProjects.map((project) => ({
        type: 'project' as const,
        id: project.id,
        title: project.title,
        status: project.status,
        timestamp: project.createdAt,
      })),
      ...recentQuotes.map((quote) => ({
        type: 'quote' as const,
        id: quote.id,
        title: quote.projectType,
        status: quote.status,
        timestamp: quote.createdAt,
      })),
    ]
      // Sort by timestamp descending
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      // Take only 10 most recent
      .slice(0, 10);

    // Build analytics response
    const analytics = {
      activeProjects,
      pendingQuotes,
      totalRevenue,
      hoursTracked,
      recentActivity,
    };

    // Log success
    logger.info('Analytics retrieved', {
      activeProjects,
      pendingQuotes,
      totalRevenue,
      hoursTracked,
    });

    return NextResponse.json(analytics);
  } catch (error) {
    logger.error('Failed to retrieve analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
});
