import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors/app-error';
import { Severity } from '@prisma/client';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const severityParam = searchParams.get('severity');
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);

    // Validate parameters
    if (limitParam < 1 || limitParam > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }
    if (pageParam < 1) {
      throw new ValidationError('Page must be >= 1');
    }

    // Build where clause
    const where: any = {};
    if (severityParam) {
      const validSeverities = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];
      if (!validSeverities.includes(severityParam.toUpperCase())) {
        throw new ValidationError('Invalid severity level');
      }
      where.severity = severityParam.toUpperCase() as Severity;
    }

    // Execute queries in parallel
    const [alerts, total] = await Promise.all([
      prisma.monitoringEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (pageParam - 1) * limitParam,
        take: limitParam,
      }),
      prisma.monitoringEvent.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitParam);

    const response = {
      alerts: alerts.map((alert) => ({
        id: alert.id,
        type: alert.type.toLowerCase(),
        severity: alert.severity.toLowerCase(),
        message: alert.message,
        source: alert.source,
        metadata: alert.metadata,
        timestamp: alert.timestamp.toISOString(),
        acknowledged: alert.acknowledged,
      })),
      pagination: {
        page: pageParam,
        limit: limitParam,
        total,
        totalPages,
      },
    };

    logger.info('Monitoring alerts retrieved', {
      count: alerts.length,
      page: pageParam,
      severity: severityParam,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    logger.error('Failed to retrieve monitoring alerts', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new AppError('Failed to retrieve monitoring alerts', 500);
  }
});
