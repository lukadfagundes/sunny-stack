/**
 * @file Monitoring System Configuration
 * @description Centralized configuration for external service monitoring
 *
 * This module defines all monitored services, health check intervals,
 * and performance thresholds used across the monitoring system.
 */

/**
 * External services monitored by the health checker
 *
 * Each service has a status page API endpoint that returns JSON
 * indicating current operational status.
 */
export const MONITORED_SERVICES = [
  {
    name: 'Fly.io',
    endpoint: 'https://status.flyio.net/api/v2/status.json',
  },
  {
    name: 'Cloudflare',
    endpoint: 'https://www.cloudflarestatus.com/api/v2/status.json',
  },
  {
    name: 'cron-job.org',
    endpoint: 'https://status.cron-job.org/api/v2/status.json',
  },
  {
    name: 'Vercel',
    endpoint: 'https://www.vercel-status.com/api/v2/status.json',
  },
] as const;

/**
 * Health check interval (5 minutes)
 *
 * Background health checker runs every 5 minutes to monitor
 * external service status and create alerts on status changes.
 */
export const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Cache TTL for service health checks (5 minutes)
 *
 * API endpoints serve cached health check results if they are
 * less than 5 minutes old to prevent rate-limiting and reduce latency.
 */
export const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * HTTP timeout for service health checks (10 seconds)
 *
 * Requests to external status page APIs are aborted after 10 seconds
 * to prevent hanging. Services that timeout are marked as 'down'.
 */
export const SERVICE_TIMEOUT_MS = 10 * 1000;

/**
 * Response time threshold for degraded status (2 seconds)
 *
 * Services that respond in < 2 seconds are 'operational'.
 * Services that respond in >= 2 seconds are 'degraded'.
 * Services that error or timeout are 'down'.
 */
export const RESPONSE_TIME_THRESHOLD_MS = 2000;

/**
 * Type definition for monitored service configuration
 */
export type MonitoredService = typeof MONITORED_SERVICES[number];
