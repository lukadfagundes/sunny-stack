/**
 * Health Check Server
 *
 * Minimal HTTP server for Docker HEALTHCHECK directive.
 * Uses only Node.js built-in http module (zero dependencies).
 *
 * Design Principles:
 * - Zero Dependencies: Uses only Node.js http module
 * - Minimal Overhead: <1ms response time, <10MB memory
 * - Silent Operation: Only logs in debug mode
 * - Graceful Shutdown: Handles SIGTERM/SIGINT for container orchestration
 */

import * as http from 'http';
import { botLogger } from './core/logger.js';

/**
 * Health status response interface
 */
interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  timestamp: string;
  version: string;
}

/**
 * Health server instance
 */
let healthServer: http.Server | null = null;

/**
 * Health check port (configurable via PORT env var)
 */
const PORT = parseInt(process.env.HEALTH_PORT || '8080', 10);

/**
 * Bot version from package.json
 */
const VERSION = process.env.npm_package_version || '1.0.0';

/**
 * Handle incoming health check requests
 *
 * @param req - HTTP request
 * @param res - HTTP response
 */
function handleHealthCheck(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  // Only respond to GET /health
  if (req.method !== 'GET' || req.url !== '/health') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
    return;
  }

  // Generate health status
  const healthStatus: HealthStatus = {
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: VERSION
  };

  // Send response
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(healthStatus));

  // Log only in debug mode
  if (process.env.DEBUG === 'true') {
    botLogger.debug('Health check requested', {
      method: req.method,
      url: req.url,
      response: healthStatus
    });
  }
}

/**
 * Start the health check server
 *
 * @returns Promise that resolves when server starts
 */
export async function startHealthServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Prevent duplicate server instances
    if (healthServer && healthServer.listening) {
      botLogger.warn('Health server already running', { port: PORT });
      resolve();
      return;
    }

    try {
      // Create HTTP server
      healthServer = http.createServer(handleHealthCheck);

      // Handle server errors
      healthServer.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          botLogger.error(`Port ${PORT} already in use`, {
            port: PORT,
            error: error.message
          });
          reject(new Error(`Port ${PORT} already in use`));
        } else {
          botLogger.error('Health server error', {
            error: error.message,
            code: error.code
          });
          reject(error);
        }
      });

      // Start listening
      healthServer.listen(PORT, () => {
        botLogger.info('Health server started', {
          port: PORT,
          endpoint: `/health`,
          version: VERSION
        });
        resolve();
      });
    } catch (error) {
      botLogger.error('Failed to start health server', { error });
      reject(error);
    }
  });
}

/**
 * Stop the health check server gracefully
 *
 * @returns Promise that resolves when server stops
 */
export async function stopHealthServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!healthServer || !healthServer.listening) {
      botLogger.debug('Health server not running');
      resolve();
      return;
    }

    botLogger.info('Stopping health server...');

    healthServer.close((error) => {
      if (error) {
        botLogger.error('Error stopping health server', { error });
      } else {
        botLogger.info('Health server stopped');
      }

      healthServer = null;
      resolve();
    });

    // Force close after 5 seconds
    setTimeout(() => {
      if (healthServer && healthServer.listening) {
        botLogger.warn('Force closing health server after timeout');
        healthServer.closeAllConnections?.();
        healthServer = null;
      }
      resolve();
    }, 5000);
  });
}

/**
 * Get health server status
 *
 * @returns Boolean indicating if server is running
 */
export function isHealthServerRunning(): boolean {
  return healthServer !== null && healthServer.listening;
}
