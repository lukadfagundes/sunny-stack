/**
 * @jest-environment node
 */

// __tests__/unit/db/neon-client.test.ts

/**
 * Unit Tests for Neon PostgreSQL Client
 *
 * Tests connection creation, pooling, retry logic, and health checks
 * Follows TDD RED-GREEN-REFACTOR methodology
 */

import { Pool } from 'pg';

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  })),
}));

// Import functions to test (these don't exist yet - RED phase)
import {
  createNeonConnection,
  createPooledConnection,
  createUnpooledConnection,
  executeWithRetry,
  checkHealth,
  type ConnectionConfig,
  type HealthCheckResult,
} from '@/lib/db/neon-client';

describe('Neon Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_UNPOOLED;
    delete process.env.POSTGRES_URL;
    delete process.env.POSTGRES_PRISMA_URL;
    delete process.env.POSTGRES_URL_NON_POOLING;
  });

  describe('createNeonConnection', () => {
    test('should create connection with DATABASE_URL (pooled)', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db?sslmode=require';

      // ACT
      const connection = await createNeonConnection('pooled');

      // ASSERT
      expect(connection).toBeDefined();
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: process.env.DATABASE_URL,
          max: 20, // Pool size limit
        })
      );
    });

    test('should create connection with DATABASE_URL_UNPOOLED', async () => {
      // ARRANGE
      process.env.DATABASE_URL_UNPOOLED = 'postgresql://user:pass@host:5432/db';

      // ACT
      const connection = await createNeonConnection('unpooled');

      // ASSERT
      expect(connection).toBeDefined();
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: process.env.DATABASE_URL_UNPOOLED,
          max: 1, // Unpooled = single connection
        })
      );
    });

    test('should create connection with POSTGRES_URL (Vercel-compatible)', async () => {
      // ARRANGE
      process.env.POSTGRES_URL = 'postgresql://user:pass@host:5432/db';

      // ACT
      const connection = await createNeonConnection('vercel');

      // ASSERT
      expect(connection).toBeDefined();
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: process.env.POSTGRES_URL,
        })
      );
    });

    test('should create connection with POSTGRES_PRISMA_URL', async () => {
      // ARRANGE
      process.env.POSTGRES_PRISMA_URL = 'postgresql://user:pass@host:5432/db?pgbouncer=true';

      // ACT
      const connection = await createNeonConnection('prisma');

      // ASSERT
      expect(connection).toBeDefined();
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: process.env.POSTGRES_PRISMA_URL,
        })
      );
    });

    test('should create connection with POSTGRES_URL_NON_POOLING', async () => {
      // ARRANGE
      process.env.POSTGRES_URL_NON_POOLING = 'postgresql://user:pass@host:5432/db';

      // ACT
      const connection = await createNeonConnection('non-pooling');

      // ASSERT
      expect(connection).toBeDefined();
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: process.env.POSTGRES_URL_NON_POOLING,
          max: 1,
        })
      );
    });

    test('should throw error when connection URL is missing', async () => {
      // ARRANGE
      // No environment variables set

      // ACT & ASSERT
      await expect(createNeonConnection('pooled')).rejects.toThrow(
        'DATABASE_URL environment variable is not defined'
      );
    });

    test('should throw error for invalid connection type', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';

      // ACT & ASSERT
      await expect(
        createNeonConnection('invalid' as any)
      ).rejects.toThrow('Invalid connection type');
    });
  });

  describe('Connection Pooling', () => {
    test('should limit pool size to 20 connections', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';

      // ACT
      await createPooledConnection();

      // ASSERT
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          max: 20,
        })
      );
    });

    test('should set idle timeout for pooled connections', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';

      // ACT
      await createPooledConnection();

      // ASSERT
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          idleTimeoutMillis: 30000, // 30 seconds
        })
      );
    });

    test('should set connection timeout', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';

      // ACT
      await createPooledConnection();

      // ASSERT
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionTimeoutMillis: 10000, // 10 seconds
        })
      );
    });

    test('should enable SSL for production', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db?sslmode=require';
      process.env.NODE_ENV = 'production';

      // ACT
      await createPooledConnection();

      // ASSERT
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: { rejectUnauthorized: false },
        })
      );
    });
  });

  describe('Retry Logic', () => {
    test('should retry failed queries up to 3 times', async () => {
      // ARRANGE
      const mockQuery = jest.fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const mockPool = {
        query: mockQuery,
      } as any;

      // ACT
      const result = await executeWithRetry(mockPool, 'SELECT * FROM users');

      // ASSERT
      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ rows: [{ id: 1 }] });
    });

    test('should use exponential backoff between retries', async () => {
      // ARRANGE
      const mockQuery = jest.fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ rows: [] });

      const mockPool = { query: mockQuery } as any;
      const startTime = Date.now();

      // ACT
      await executeWithRetry(mockPool, 'SELECT 1');

      // ASSERT
      const elapsed = Date.now() - startTime;
      // First retry: ~100ms, Second retry: ~200ms, Total: ~300ms minimum
      expect(elapsed).toBeGreaterThanOrEqual(300);
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    test('should throw error after 3 failed attempts', async () => {
      // ARRANGE
      const mockQuery = jest.fn().mockRejectedValue(new Error('Connection failed'));
      const mockPool = { query: mockQuery } as any;

      // ACT & ASSERT
      await expect(
        executeWithRetry(mockPool, 'SELECT * FROM users')
      ).rejects.toThrow('Max retries (3) exceeded: Connection failed');

      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    test('should not retry on non-retryable errors', async () => {
      // ARRANGE
      const mockQuery = jest.fn().mockRejectedValue(new Error('Syntax error'));
      const mockPool = { query: mockQuery } as any;

      // ACT & ASSERT
      await expect(
        executeWithRetry(mockPool, 'SELECT * FORM users') // Typo: FORM
      ).rejects.toThrow('Syntax error');

      // Should fail immediately, no retries
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    test('should retry with query parameters', async () => {
      // ARRANGE
      const mockQuery = jest.fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'John' }] });

      const mockPool = { query: mockQuery } as any;
      const sql = 'SELECT * FROM users WHERE id = $1';
      const params = [1];

      // ACT
      const result = await executeWithRetry(mockPool, sql, params);

      // ASSERT
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenCalledWith(sql, params);
      expect(result).toEqual({ rows: [{ id: 1, name: 'John' }] });
    });
  });

  describe('Health Check', () => {
    test('should return healthy status when connection succeeds', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      const mockQuery = jest.fn().mockResolvedValue({ rows: [{ result: 1 }] });
      (Pool as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
        end: jest.fn(),
        on: jest.fn(),
      }));

      // ACT
      const health = await checkHealth();

      // ASSERT
      expect(health.status).toBe('healthy');
      expect(health.connected).toBe(true);
      expect(health.latency).toBeDefined();
      expect(typeof health.latency).toBe('number');
      expect(health.latency).toBeGreaterThanOrEqual(0);
      expect(mockQuery).toHaveBeenCalledWith('SELECT 1 as result');
    });

    test('should return unhealthy status when connection fails', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      const mockQuery = jest.fn().mockRejectedValue(new Error('Connection refused'));
      (Pool as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
        end: jest.fn(),
      }));

      // ACT
      const health = await checkHealth();

      // ASSERT
      expect(health.status).toBe('unhealthy');
      expect(health.connected).toBe(false);
      expect(health.error).toBe('Connection refused');
      expect(health.latency).toBeUndefined();
    });

    test('should measure query latency accurately', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      const mockQuery = jest.fn().mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ rows: [{ result: 1 }] }), 50)
        )
      );
      (Pool as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
        end: jest.fn(),
      }));

      // ACT
      const health = await checkHealth();

      // ASSERT
      expect(health.status).toBe('healthy');
      expect(health.latency).toBeGreaterThanOrEqual(50);
      expect(health.latency).toBeLessThan(100); // Should be ~50ms
    });

    test('should include database name in health check result', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/my_database?sslmode=require';
      const mockQuery = jest.fn().mockResolvedValue({ rows: [{ result: 1 }] });
      (Pool as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
        end: jest.fn(),
      }));

      // ACT
      const health = await checkHealth();

      // ASSERT
      expect(health.status).toBe('healthy');
      expect(health.database).toBe('my_database');
    });

    test('should close connection after health check', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      const mockEnd = jest.fn();
      const mockQuery = jest.fn().mockResolvedValue({ rows: [{ result: 1 }] });
      (Pool as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
        end: mockEnd,
      }));

      // ACT
      await checkHealth();

      // ASSERT
      expect(mockEnd).toHaveBeenCalled();
    });
  });

  describe('Connection Configuration', () => {
    test('should validate connection string format', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'invalid-url';

      // ACT & ASSERT
      await expect(createNeonConnection('pooled')).rejects.toThrow(
        'Invalid DATABASE_URL format'
      );
    });

    test('should extract host from connection string', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@neon.tech:5432/db';
      const mockQuery = jest.fn().mockResolvedValue({ rows: [{ result: 1 }] });
      (Pool as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
        end: jest.fn(),
      }));

      // ACT
      const health = await checkHealth();

      // ASSERT
      expect(health.host).toBe('neon.tech');
    });

    test('should support connection string with query parameters', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db?sslmode=require&connect_timeout=10';
      (Pool as jest.Mock).mockImplementation(() => ({
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn(), // Add on method to mock
      }));

      // ACT
      const connection = await createNeonConnection('pooled');

      // ASSERT
      expect(connection).toBeDefined();
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: process.env.DATABASE_URL,
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should provide descriptive error messages', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      const mockQuery = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      (Pool as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
        end: jest.fn(),
      }));

      // ACT
      const health = await checkHealth();

      // ASSERT
      expect(health.status).toBe('unhealthy');
      expect(health.error).toContain('ECONNREFUSED');
    });

    test('should handle missing environment variables gracefully', async () => {
      // ARRANGE
      // No DATABASE_URL set

      // ACT & ASSERT
      await expect(createNeonConnection('pooled')).rejects.toThrow(
        'DATABASE_URL environment variable is not defined'
      );
    });

    test('should handle pool exhaustion', async () => {
      // ARRANGE
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      const mockQuery = jest.fn().mockRejectedValue(new Error('Pool exhausted'));
      (Pool as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
        end: jest.fn(),
      }));

      // ACT & ASSERT
      await expect(
        executeWithRetry({ query: mockQuery } as any, 'SELECT 1')
      ).rejects.toThrow('Pool exhausted');
    });
  });

  describe('TypeScript Type Safety', () => {
    test('should enforce ConnectionConfig type', () => {
      // ARRANGE
      const config: ConnectionConfig = {
        type: 'pooled',
        maxConnections: 20,
        idleTimeout: 30000,
        connectionTimeout: 10000,
      };

      // ASSERT - TypeScript compilation will enforce this
      expect(config.type).toBe('pooled');
      expect(config.maxConnections).toBe(20);
    });

    test('should enforce HealthCheckResult type', () => {
      // ARRANGE
      const healthResult: HealthCheckResult = {
        status: 'healthy',
        connected: true,
        latency: 50,
        database: 'test_db',
        host: 'localhost',
        timestamp: new Date(),
      };

      // ASSERT - TypeScript compilation will enforce this
      expect(healthResult.status).toBe('healthy');
      expect(healthResult.connected).toBe(true);
    });
  });
});
