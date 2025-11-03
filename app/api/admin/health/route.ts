/**
 * @file Admin Health Check API
 * @description Overall system health monitoring for Discord bot
 * @route GET /api/admin/health - System health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';

/**
 * Health status type
 */
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Service health check result
 */
interface ServiceHealth {
  status: HealthStatus;
  responseTime?: number;
  latency?: number | null;
  guilds?: number;
  requestsPerMinute?: number;
}

/**
 * Overall health check response
 */
interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth & {
      responseTime: number;
    };
    discord: ServiceHealth;
    api: ServiceHealth & {
      requestsPerMinute: number;
    };
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk?: {
    used: number;
    total: number;
    percentage: number;
  };
}

/**
 * Check database health
 * Measures response time and determines health status
 */
async function checkDatabaseHealth(): Promise<ServiceHealth & { responseTime: number }> {
  try {
    const startTime = Date.now();

    // Execute simple SELECT 1 query
    await prisma.$queryRaw`SELECT 1 as result`;

    const responseTime = Date.now() - startTime;

    // Determine health based on response time
    let status: HealthStatus = 'healthy';
    if (responseTime >= 200) {
      status = 'unhealthy';
    } else if (responseTime >= 50) {
      status = 'degraded';
    }

    return {
      status,
      responseTime,
    };
  } catch (error) {
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      status: 'unhealthy',
      responseTime: 0,
    };
  }
}

/**
 * Check Discord bot health
 * Returns placeholder status (will be enhanced in Phase 3)
 */
function checkDiscordHealth(): ServiceHealth {
  // Placeholder implementation
  // Will be enhanced when Discord bot integration is complete
  return {
    status: 'healthy',
    latency: null,
    guilds: 0,
  };
}

/**
 * Check API health
 * Returns placeholder status with static request count
 */
function checkApiHealth(): ServiceHealth & { requestsPerMinute: number } {
  // Placeholder implementation
  // Can be enhanced with actual request tracking
  return {
    status: 'healthy',
    requestsPerMinute: 0,
  };
}

/**
 * Get memory usage statistics
 */
function getMemoryUsage(): { used: number; total: number; percentage: number } {
  const memUsage = process.memoryUsage();

  // Use heapUsed as "used" memory
  const used = memUsage.heapUsed;

  // Use heapTotal as "total" memory (could also use system total)
  const total = memUsage.heapTotal;

  // Calculate percentage
  const percentage = Math.round((used / total) * 100);

  return {
    used,
    total,
    percentage,
  };
}

/**
 * Determine overall system health status
 * Based on individual service health checks
 */
function determineOverallHealth(services: {
  database: ServiceHealth;
  discord: ServiceHealth;
  api: ServiceHealth;
}): HealthStatus {
  // If any service is unhealthy, system is unhealthy
  if (
    services.database.status === 'unhealthy' ||
    services.discord.status === 'unhealthy' ||
    services.api.status === 'unhealthy'
  ) {
    return 'unhealthy';
  }

  // If any service is degraded, system is degraded
  if (
    services.database.status === 'degraded' ||
    services.discord.status === 'degraded' ||
    services.api.status === 'degraded'
  ) {
    return 'degraded';
  }

  // All services healthy
  return 'healthy';
}

/**
 * GET /api/admin/health
 * System health check endpoint
 *
 * Returns:
 * - Overall health status
 * - Individual service health
 * - Memory usage
 * - System uptime
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    // Perform health checks
    const [database, discord, api] = await Promise.all([
      checkDatabaseHealth(),
      Promise.resolve(checkDiscordHealth()),
      Promise.resolve(checkApiHealth()),
    ]);

    const services = {
      database,
      discord,
      api,
    };

    // Determine overall health
    const overallStatus = determineOverallHealth(services);

    // Get memory usage
    const memory = getMemoryUsage();

    // Build response
    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services,
      memory,
    };

    // Log health check
    logger.info('Health check completed', {
      status: overallStatus,
      dbResponseTime: database.responseTime,
      memoryPercentage: memory.percentage,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return unhealthy status on error
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        services: {
          database: { status: 'unhealthy', responseTime: 0 },
          discord: { status: 'unhealthy' },
          api: { status: 'unhealthy', requestsPerMinute: 0 },
        },
        memory: getMemoryUsage(),
      } as HealthCheckResponse,
      { status: 200 } // Always return 200, status in body
    );
  }
});
