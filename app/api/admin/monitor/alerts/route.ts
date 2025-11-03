/**
 * @file Admin Monitor Alerts API
 * @description Returns paginated list of monitoring alerts with filtering
 * @route GET /api/admin/monitor/alerts - Get monitoring alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { withBotAuth, withRateLimit } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { Severity, Prisma } from '@prisma/client';
import logger from '@/lib/logger';

const ALERTS_PER_PAGE = 25;
const VALID_SEVERITIES: Severity[] = ['CRITICAL', 'ERROR', 'WARNING', 'INFO'];

/**
 * Parse and validate query parameters
 */
function parseQueryParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const severityFilter = searchParams.get('severity') as Severity | null;
  const sourceFilter = searchParams.get('source');

  return { page, severityFilter, sourceFilter };
}

/**
 * Build Prisma where clause from filters
 */
function buildWhereClause(
  severityFilter: Severity | null,
  sourceFilter: string | null
): Prisma.MonitoringAlertWhereInput {
  const where: Prisma.MonitoringAlertWhereInput = {};

  if (severityFilter && VALID_SEVERITIES.includes(severityFilter)) {
    where.severity = severityFilter;
  }

  if (sourceFilter) {
    where.source = sourceFilter;
  }

  return where;
}

/**
 * Format alert for API response
 */
function formatAlert(alert: any) {
  return {
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    source: alert.source,
    message: alert.message,
    timestamp: alert.timestamp.toISOString(),
    acknowledged: alert.acknowledged,
    metadata: alert.metadata,
  };
}

/**
 * GET /api/admin/monitor/alerts
 * Query params:
 * - page: number (default 1)
 * - severity: CRITICAL | ERROR | WARNING | INFO (optional)
 * - source: string (service name, optional)
 */
async function handler(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { page, severityFilter, sourceFilter } = parseQueryParams(searchParams);

    const skip = (page - 1) * ALERTS_PER_PAGE;
    const where = buildWhereClause(severityFilter, sourceFilter);

    // Fetch alerts and total count in parallel
    const [alerts, total] = await Promise.all([
      prisma.monitoringAlert.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: ALERTS_PER_PAGE,
        skip,
      }),
      prisma.monitoringAlert.count({ where }),
    ]);

    const totalPages = Math.ceil(total / ALERTS_PER_PAGE);

    return NextResponse.json({
      alerts: alerts.map(formatAlert),
      pagination: {
        page,
        limit: ALERTS_PER_PAGE,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('Monitor alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// Apply rate limiting (30 req/min) and bot authentication
export const GET = withRateLimit(withBotAuth(handler), { limit: 30, windowMs: 60000 });
