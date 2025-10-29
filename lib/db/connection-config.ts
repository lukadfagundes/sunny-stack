// lib/db/connection-config.ts

/**
 * Connection Configuration for Neon PostgreSQL
 *
 * Manages connection string validation, parsing, and configuration
 * Supports all 5 Neon connection string types
 */

/**
 * Connection type enum
 */
export type ConnectionType =
  | 'pooled'       // DATABASE_URL - pooled connections via Neon
  | 'unpooled'     // DATABASE_URL_UNPOOLED - direct connection
  | 'vercel'       // POSTGRES_URL - Vercel-compatible pooled
  | 'prisma'       // POSTGRES_PRISMA_URL - Prisma with pgbouncer
  | 'non-pooling'; // POSTGRES_URL_NON_POOLING - non-pooled

/**
 * Connection configuration interface
 */
export interface ConnectionConfig {
  type: ConnectionType;
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

/**
 * Parsed connection string details
 */
export interface ParsedConnectionString {
  protocol: string;
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
  query: Record<string, string>;
}

/**
 * Get connection string from environment variable
 *
 * Maps connection type to the appropriate environment variable name
 * and retrieves the connection string value.
 *
 * @param type - Connection type to get string for
 * @returns Connection string from environment variable
 * @throws {Error} If environment variable is not defined
 *
 * @example
 * ```typescript
 * const connectionString = getConnectionString('pooled');
 * // Returns value of DATABASE_URL environment variable
 * ```
 */
export function getConnectionString(type: ConnectionType): string {
  const envVarMap: Record<ConnectionType, string> = {
    pooled: 'DATABASE_URL',
    unpooled: 'DATABASE_URL_UNPOOLED',
    vercel: 'POSTGRES_URL',
    prisma: 'POSTGRES_PRISMA_URL',
    'non-pooling': 'POSTGRES_URL_NON_POOLING',
  };

  const envVarName = envVarMap[type];
  const connectionString = process.env[envVarName];

  if (!connectionString) {
    throw new Error(
      `${envVarName} environment variable is not defined`
    );
  }

  return connectionString;
}

/**
 * Validate PostgreSQL connection string format
 *
 * Checks if the connection string follows the standard PostgreSQL format:
 * postgresql://username:password@host:port/database
 *
 * @param connectionString - Connection string to validate
 * @throws {Error} If connection string format is invalid
 *
 * @example
 * ```typescript
 * validateConnectionString('postgresql://user:pass@localhost:5432/mydb');
 * // Does not throw - valid format
 *
 * validateConnectionString('invalid-url');
 * // Throws Error: Invalid DATABASE_URL format
 * ```
 */
export function validateConnectionString(connectionString: string): void {
  // Basic PostgreSQL connection string format
  const postgresUrlRegex = /^postgresql:\/\/.+:.+@.+:\d+\/.+$/;

  if (!postgresUrlRegex.test(connectionString.split('?')[0])) {
    throw new Error('Invalid DATABASE_URL format');
  }
}

/**
 * Parse connection string into components
 *
 * Extracts host, port, database, credentials, and query parameters
 * from a PostgreSQL connection string.
 *
 * @param connectionString - PostgreSQL connection string to parse
 * @returns Parsed connection string components
 * @throws {Error} If connection string cannot be parsed
 *
 * @example
 * ```typescript
 * const parsed = parseConnectionString(
 *   'postgresql://user:pass@localhost:5432/mydb?sslmode=require'
 * );
 * // {
 * //   protocol: 'postgresql',
 * //   username: 'user',
 * //   password: 'pass',
 * //   host: 'localhost',
 * //   port: 5432,
 * //   database: 'mydb',
 * //   query: { sslmode: 'require' }
 * // }
 * ```
 */
export function parseConnectionString(
  connectionString: string
): ParsedConnectionString {
  try {
    const url = new URL(connectionString);

    // Extract query parameters
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return {
      protocol: url.protocol.replace(':', ''),
      username: url.username,
      password: url.password,
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      database: url.pathname.slice(1), // Remove leading slash
      query,
    };
  } catch (error) {
    throw new Error('Invalid DATABASE_URL format');
  }
}

/**
 * Get connection configuration for connection type
 */
export function getConnectionConfig(type: ConnectionType): ConnectionConfig {
  const baseConfig: ConnectionConfig = {
    type,
    maxConnections: 20,
    idleTimeout: 30000, // 30 seconds
    connectionTimeout: 10000, // 10 seconds
  };

  // Adjust for non-pooled connections
  if (type === 'unpooled' || type === 'non-pooling') {
    baseConfig.maxConnections = 1;
  }

  // Add SSL for production
  if (process.env.NODE_ENV === 'production') {
    baseConfig.ssl = {
      rejectUnauthorized: false,
    };
  }

  return baseConfig;
}

/**
 * Check if connection type is valid
 */
export function isValidConnectionType(type: string): type is ConnectionType {
  const validTypes: ConnectionType[] = [
    'pooled',
    'unpooled',
    'vercel',
    'prisma',
    'non-pooling',
  ];
  return validTypes.includes(type as ConnectionType);
}
