/**
 * @file Service Health Checker
 * @description Background task to check external service health and create alerts
 */

import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';
import { ServiceStatus, AlertType, Severity } from '@prisma/client';
import {
  MONITORED_SERVICES,
  HEALTH_CHECK_INTERVAL_MS,
  SERVICE_TIMEOUT_MS,
  RESPONSE_TIME_THRESHOLD_MS,
} from './config';

interface ServiceCheckResult {
  serviceName: string;
  endpoint: string;
  status: ServiceStatus;
  responseTime: number | null;
  statusCode: number | null;
  error?: string;
}

/**
 * Check health of a single service
 *
 * Performs an HTTP GET request to the service's status page API endpoint.
 * Includes timeout protection (10 seconds) and response time measurement.
 *
 * Status determination:
 * - operational: HTTP 2xx response + < 2 seconds response time
 * - degraded: HTTP 2xx response + >= 2 seconds response time
 * - down: Non-2xx response or request timeout/error
 *
 * @param service - Service configuration (name and endpoint)
 * @returns Health check result with status, response time, and metadata
 *
 * @example
 * const result = await checkService({
 *   name: 'Fly.io',
 *   endpoint: 'https://status.flycdn.net/api/v2/status.json'
 * });
 * // Returns: { serviceName: 'Fly.io', status: 'operational', responseTime: 150, ... }
 */
async function checkService(service: typeof MONITORED_SERVICES[0]): Promise<ServiceCheckResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TIMEOUT_MS);

    const response = await fetch(service.endpoint, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Sunny-Stack-Monitor/1.0' },
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    let status: ServiceStatus;

    if (response.ok && responseTime < RESPONSE_TIME_THRESHOLD_MS) {
      status = 'operational';
    } else if (response.ok && responseTime >= RESPONSE_TIME_THRESHOLD_MS) {
      status = 'degraded';
    } else {
      status = 'down';
    }

    return {
      serviceName: service.name,
      endpoint: service.endpoint,
      status,
      responseTime,
      statusCode: response.status,
    };
  } catch (error: any) {
    logger.error(`Service check failed for ${service.name}:`, error);

    return {
      serviceName: service.name,
      endpoint: service.endpoint,
      status: 'down',
      responseTime: null,
      statusCode: null,
      error: error.message,
    };
  }
}

/**
 * Build alert data for a status change
 *
 * Determines severity and type based on status transition.
 * Returns null if no alert should be created.
 *
 * @param serviceName - Name of the service
 * @param previousStatus - Previous service status
 * @param newStatus - New service status
 * @returns Alert data object or null
 */
function buildAlertData(
  serviceName: string,
  previousStatus: ServiceStatus,
  newStatus: ServiceStatus
): { type: AlertType; severity: Severity; source: string; message: string; metadata: object } | null {
  let severity: Severity;
  let type: AlertType;

  // Determine alert severity based on status change
  if (newStatus === 'down') {
    severity = 'CRITICAL';
    type = 'ERROR';
  } else if (newStatus === 'degraded') {
    severity = 'WARNING';
    type = 'UPTIME_CHECK';
  } else if (previousStatus === 'down' && newStatus === 'operational') {
    // Service recovered
    severity = 'INFO';
    type = 'UPTIME_CHECK';
  } else {
    // No alert needed for operational -> degraded or degraded -> operational
    return null;
  }

  const message = `${serviceName} status changed from ${previousStatus} to ${newStatus}`;

  return {
    type,
    severity,
    source: serviceName,
    message,
    metadata: {
      previousStatus,
      newStatus,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Run health checks for all monitored services
 *
 * Optimized implementation using batch database operations:
 * 1. Fetch all services' previous statuses in parallel (1 query per service)
 * 2. Save all new health checks in one batch (1 query total)
 * 3. Create all alerts in one batch (1 query total)
 *
 * This reduces 8-12 sequential queries to 4-6 queries total.
 *
 * @example
 * // Called automatically every 5 minutes
 * await runServiceHealthChecks();
 */
export async function runServiceHealthChecks(): Promise<void> {
  try {
    logger.info('Starting service health checks...');

    // Step 1: Check all services in parallel (HTTP requests)
    const results = await Promise.all(MONITORED_SERVICES.map(checkService));

    // Step 2: Batch fetch previous statuses (parallel queries, one per service)
    // This is more efficient than a single complex query with groupBy
    const previousChecks = await Promise.all(
      MONITORED_SERVICES.map((service) =>
        prisma.serviceHealthCheck.findFirst({
          where: { serviceName: service.name },
          orderBy: { lastChecked: 'desc' },
          select: { serviceName: true, status: true },
        })
      )
    );

    // Create a map of previous statuses for easy lookup
    const previousStatusMap = new Map<string, ServiceStatus>(
      previousChecks
        .filter((check) => check !== null)
        .map((check) => [check.serviceName, check.status])
    );

    // Step 3: Batch save all health checks (non-blocking)
    setImmediate(async () => {
      try {
        await prisma.serviceHealthCheck.createMany({
          data: results.map((result) => ({
            serviceName: result.serviceName,
            endpoint: result.endpoint,
            status: result.status,
            responseTime: result.responseTime,
            statusCode: result.statusCode,
            lastChecked: new Date(),
          })),
        });
        logger.info('Health checks saved to database');
      } catch (error) {
        logger.error('Failed to save health checks', error);
      }
    });

    // Step 4: Build alerts for status changes
    const alertsToCreate = results
      .map((result) => {
        const previousStatus = previousStatusMap.get(result.serviceName);

        // Skip if no previous status (first check) or status unchanged
        if (!previousStatus || previousStatus === result.status) {
          return null;
        }

        return buildAlertData(result.serviceName, previousStatus, result.status);
      })
      .filter((alert): alert is NonNullable<typeof alert> => alert !== null);

    // Step 5: Batch create alerts if any exist (non-blocking)
    if (alertsToCreate.length > 0) {
      setImmediate(async () => {
        try {
          await prisma.monitoringAlert.createMany({
            data: alertsToCreate,
          });
          logger.info(`Created ${alertsToCreate.length} alert(s) for status changes`);
        } catch (error) {
          logger.error('Failed to create monitoring alerts', error);
        }
      });
    }

    // Log individual results
    results.forEach((result) => {
      const previousStatus = previousStatusMap.get(result.serviceName);
      const statusChanged = previousStatus && previousStatus !== result.status;

      logger.info(
        `Health check: ${result.serviceName} = ${result.status}` +
        (statusChanged ? ` (was ${previousStatus})` : '')
      );
    });

    logger.info('Service health checks complete');
  } catch (error) {
    logger.error('Service health check failed:', error);
  }
}

/**
 * Interval ID for health check monitoring
 * Stored globally to enable cleanup on bot shutdown
 */
let healthCheckInterval: NodeJS.Timeout | null = null;

/**
 * Start periodic service health monitoring
 *
 * Runs health checks immediately, then every 5 minutes.
 * If already running, clears previous interval before starting new one.
 *
 * @example
 * // Start monitoring when bot launches
 * startServiceHealthMonitoring();
 */
export function startServiceHealthMonitoring(): void {
  // Clear existing interval if monitoring is already running
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    logger.warn('Service health monitoring was already running, restarting...');
  }

  // Run initial check immediately
  runServiceHealthChecks();

  // Schedule recurring checks every 5 minutes
  healthCheckInterval = setInterval(() => {
    runServiceHealthChecks();
  }, HEALTH_CHECK_INTERVAL_MS);

  logger.info('Service health monitoring started (5-minute interval)');
}

/**
 * Stop service health monitoring
 *
 * Clears the monitoring interval and prevents further health checks.
 * Called during bot shutdown for graceful cleanup.
 *
 * @example
 * // Stop monitoring on bot shutdown
 * process.on('SIGTERM', () => {
 *   stopServiceHealthMonitoring();
 * });
 */
export function stopServiceHealthMonitoring(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('Service health monitoring stopped');
  } else {
    logger.warn('Service health monitoring was not running');
  }
}
