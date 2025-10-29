// lib/db/neon-client.ts

/**
 * Neon PostgreSQL Client
 *
 * Provides connection pooling, retry logic, and health checks
 * Supports all 5 Neon connection string types
 */

import { Pool, PoolConfig } from 'pg';
import {
  ConnectionType,
  getConnectionString,
  validateConnectionString,
  parseConnectionString,
  getConnectionConfig,
  isValidConnectionType,
  type ConnectionConfig,
} from './connection-config';

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  connected: boolean;
  latency?: number;
  error?: string;
  database?: string;
  host?: string;
  timestamp: Date;
}

/**
 * Re-export types for convenience
 */
export type { ConnectionConfig, ConnectionType };

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 1000,
};

/**
 * Non-retryable error patterns
 */
const NON_RETRYABLE_ERRORS = [
  'syntax error',
  'column',
  'relation',
  'does not exist',
  'permission denied',
];

/**
 * Check if database error is retryable
 *
 * Determines whether a query should be retried based on error type.
 * Syntax errors, missing columns/relations, and permission issues are not retryable.
 *
 * @param error - The error object from the database query
 * @returns True if the error should trigger a retry, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   await pool.query('SELECT * FROM users');
 * } catch (error) {
 *   if (isRetryableError(error)) {
 *     // Retry the query
 *   }
 * }
 * ```
 */
function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  return !NON_RETRYABLE_ERRORS.some((pattern) =>
    errorMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Sleep for specified milliseconds
 *
 * Utility function for implementing retry delays and exponential backoff.
 *
 * @param ms - Number of milliseconds to sleep
 * @returns Promise that resolves after the specified delay
 *
 * @example
 * ```typescript
 * await sleep(1000); // Wait 1 second
 * ```
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 *
 * Computes retry delay using exponential backoff algorithm.
 * Delay doubles with each attempt, capped at maxDelayMs.
 *
 * @param attempt - Current retry attempt number (0-indexed)
 * @returns Delay in milliseconds
 *
 * @example
 * ```typescript
 * const delay0 = getBackoffDelay(0); // 100ms (baseDelay * 2^0)
 * const delay1 = getBackoffDelay(1); // 200ms (baseDelay * 2^1)
 * const delay2 = getBackoffDelay(2); // 400ms (baseDelay * 2^2)
 * ```
 */
function getBackoffDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * Create Neon PostgreSQL connection pool
 *
 * Creates a configured connection pool for the specified connection type.
 * Supports all 5 Neon connection string types with appropriate pooling settings.
 *
 * @param type - Connection type ('pooled' | 'unpooled' | 'vercel' | 'prisma' | 'non-pooling')
 * @returns Configured PostgreSQL connection pool
 * @throws {Error} If connection type is invalid or connection string is missing
 *
 * @example
 * ```typescript
 * // Create pooled connection (recommended for most use cases)
 * const pool = await createNeonConnection('pooled');
 *
 * // Create unpooled connection (for migrations)
 * const migrationPool = await createNeonConnection('unpooled');
 * ```
 */
export async function createNeonConnection(
  type: ConnectionType
): Promise<Pool> {
  // Validate connection type
  if (!isValidConnectionType(type)) {
    throw new Error('Invalid connection type');
  }

  // Get connection string
  const connectionString = getConnectionString(type);

  // Validate connection string format
  validateConnectionString(connectionString);

  // Get connection configuration
  const config = getConnectionConfig(type);

  // Create pool configuration
  const poolConfig: PoolConfig = {
    connectionString,
    max: config.maxConnections,
    idleTimeoutMillis: config.idleTimeout,
    connectionTimeoutMillis: config.connectionTimeout,
  };

  // Add SSL configuration if present
  if (config.ssl) {
    poolConfig.ssl = config.ssl;
  }

  // Create and return pool
  const pool = new Pool(poolConfig);

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

/**
 * Create pooled connection (default)
 *
 * Convenience function to create a pooled connection using DATABASE_URL.
 * This is the recommended connection method for application queries.
 *
 * @returns Configured connection pool with max 20 connections
 *
 * @example
 * ```typescript
 * const pool = await createPooledConnection();
 * const result = await pool.query('SELECT * FROM users');
 * ```
 */
export async function createPooledConnection(): Promise<Pool> {
  return createNeonConnection('pooled');
}

/**
 * Create unpooled connection (for migrations)
 *
 * Creates a single-connection pool using DATABASE_URL_UNPOOLED.
 * Use this for schema migrations and maintenance operations.
 *
 * @returns Connection pool limited to 1 connection
 *
 * @example
 * ```typescript
 * const migrationPool = await createUnpooledConnection();
 * await migrationPool.query('ALTER TABLE users ADD COLUMN...');
 * await migrationPool.end();
 * ```
 */
export async function createUnpooledConnection(): Promise<Pool> {
  return createNeonConnection('unpooled');
}

/**
 * Execute query with automatic retry logic
 *
 * Executes a database query with exponential backoff retry for transient errors.
 * Non-retryable errors (syntax, permissions) fail immediately.
 *
 * @param pool - PostgreSQL connection pool
 * @param sql - SQL query string
 * @param params - Optional query parameters
 * @returns Query result
 * @throws {Error} After max retries (3 attempts) or on non-retryable errors
 *
 * @example
 * ```typescript
 * const pool = await createPooledConnection();
 *
 * // Query with automatic retry
 * const users = await executeWithRetry(
 *   pool,
 *   'SELECT * FROM users WHERE id = $1',
 *   [userId]
 * );
 * ```
 */
export async function executeWithRetry<T = any>(
  pool: Pool,
  sql: string,
  params?: any[]
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      // Execute query
      const result = await pool.query(sql, params);
      return result as T;
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      // If this was the last attempt, throw
      if (attempt === RETRY_CONFIG.maxAttempts - 1) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = getBackoffDelay(attempt);
      await sleep(delay);
    }
  }

  // All retries exhausted
  throw new Error(
    `Max retries (${RETRY_CONFIG.maxAttempts}) exceeded: ${lastError?.message}`
  );
}

/**
 * Check database connection health
 *
 * Performs a health check query to verify database connectivity and measure latency.
 * Creates a temporary connection pool that is closed after the check.
 *
 * @returns Health check result with status, latency, and connection details
 *
 * @example
 * ```typescript
 * // Check database health
 * const health = await checkHealth();
 *
 * if (health.status === 'healthy') {
 *   console.log(`Database connected: ${health.database}`);
 *   console.log(`Latency: ${health.latency}ms`);
 * } else {
 *   console.error(`Database unhealthy: ${health.error}`);
 * }
 * ```
 */
export async function checkHealth(): Promise<HealthCheckResult> {
  const timestamp = new Date();
  let pool: Pool | null = null;

  try {
    // Get connection string
    const connectionString = getConnectionString('pooled');

    // Parse connection details
    const parsed = parseConnectionString(connectionString);

    // Create temporary pool for health check
    pool = new Pool({
      connectionString,
      max: 1,
    });

    // Measure query latency
    const startTime = Date.now();
    await pool.query('SELECT 1 as result');
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      connected: true,
      latency,
      database: parsed.database,
      host: parsed.host,
      timestamp,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: (error as Error).message,
      timestamp,
    };
  } finally {
    // Close pool after health check
    if (pool) {
      await pool.end();
    }
  }
}

/**
 * Default export: Create pooled connection
 */
export default createPooledConnection;
