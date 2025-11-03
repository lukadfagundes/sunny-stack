/**
 * @file Admin Monitor Services API
 * @description Returns external service health status
 * @route GET /api/admin/monitor/services - Get service health
 */

import { NextResponse } from 'next/server';
import { withBotAuth, withRateLimit } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';
import {
  MONITORED_SERVICES,
  CACHE_TTL_MS,
} from '@/lib/monitoring/config';

/**
 * Fetch latest health checks from database
 *
 * Gets the most recent health check for each monitored service.
 * Returns one result per service (or null if no checks exist yet).
 */
async function getLatestHealthChecks() {
  return Promise.all(
    MONITORED_SERVICES.map((service) =>
      prisma.serviceHealthCheck.findFirst({
        where: { serviceName: service.name },
        orderBy: { lastChecked: 'desc' },
      })
    )
  );
}

/**
 * Check if health checks are recent (within cache TTL)
 *
 * @param checks - Array of health check results (may contain nulls)
 * @returns true if all services have checks < 5 minutes old
 */
function areChecksRecent(checks: Array<any>) {
  const validChecks = checks.filter((check) => check !== null);

  if (validChecks.length !== MONITORED_SERVICES.length) {
    return false; // Not all services have been checked yet
  }

  const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);
  return validChecks.every((check) => check.lastChecked > cacheExpiry);
}

/**
 * Format health check for API response
 */
function formatHealthCheck(check: any) {
  return {
    name: check.serviceName,
    status: check.status,
    responseTime: check.responseTime,
    lastChecked: check.lastChecked.toISOString(),
    endpoint: check.endpoint,
  };
}

/**
 * Calculate summary statistics for service health
 */
function calculateSummary(services: Array<{ status: string }>) {
  return {
    total: services.length,
    operational: services.filter((s) => s.status === 'operational').length,
    degraded: services.filter((s) => s.status === 'degraded').length,
    down: services.filter((s) => s.status === 'down').length,
  };
}

/**
 * GET /api/admin/monitor/services
 * Returns health status of external services
 *
 * This endpoint serves cached health check data from the database.
 * The background health checker updates this data every 5 minutes.
 * Cache TTL is 5 minutes - if data is stale, the response will indicate
 * that checks are outdated (but still returns last known status).
 */
async function handler() {
  try {
    const latestChecks = await getLatestHealthChecks();
    const validChecks = latestChecks.filter((check) => check !== null);

    // If no health checks exist yet, return empty state
    if (validChecks.length === 0) {
      return NextResponse.json({
        services: [],
        summary: { total: 0, operational: 0, degraded: 0, down: 0 },
        message: 'No health checks available yet. Background monitoring will start shortly.',
      });
    }

    const services = validChecks.map(formatHealthCheck);
    const summary = calculateSummary(services);

    // Include cache status in response
    const response: any = { services, summary };
    if (!areChecksRecent(latestChecks)) {
      response.cacheStatus = 'stale';
      response.message = 'Health check data is older than 5 minutes. Background update in progress.';
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Monitor services error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service status' },
      { status: 500 }
    );
  }
}

// Apply rate limiting (30 req/min) and bot authentication
export const GET = withRateLimit(withBotAuth(handler), { limit: 30, windowMs: 60000 });
