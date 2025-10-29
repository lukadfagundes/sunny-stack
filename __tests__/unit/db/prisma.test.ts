/**
 * Unit Tests for Prisma Client Singleton
 *
 * Tests:
 * - Singleton pattern (only one instance created)
 * - HMR handling in development
 * - Type-safe client export
 * - Error handling for missing DATABASE_URL
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Prisma Client Singleton', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules before each test
    jest.resetModules();

    // Clear global prisma instance
    if ((global as any).prisma) {
      delete (global as any).prisma;
    }

    // Mock environment
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb',
      NODE_ENV: 'test',
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Singleton Instance', () => {
    it('should create a single Prisma client instance', async () => {
      // ARRANGE & ACT
      const { prisma: prisma1 } = await import('@/lib/db/prisma');
      const { prisma: prisma2 } = await import('@/lib/db/prisma');

      // ASSERT
      expect(prisma1).toBeDefined();
      expect(prisma2).toBeDefined();
      expect(prisma1).toBe(prisma2); // Same instance
    });

    it('should reuse global prisma instance if it exists', async () => {
      // ARRANGE
      const mockPrismaClient = { mock: 'prisma-client' };
      (global as any).prisma = mockPrismaClient;

      // ACT
      const { prisma } = await import('@/lib/db/prisma');

      // ASSERT
      expect(prisma).toBe(mockPrismaClient);
    });

    it('should export PrismaClient class for type safety', async () => {
      // ARRANGE & ACT
      const { PrismaClient } = await import('@/lib/db/prisma');

      // ASSERT
      expect(PrismaClient).toBeDefined();
      expect(typeof PrismaClient).toBe('function'); // Constructor
    });
  });

  describe('Development Mode Handling', () => {
    it('should attach prisma client to global in development', async () => {
      // ARRANGE
      process.env.NODE_ENV = 'development';
      jest.resetModules();

      // ACT
      const { prisma } = await import('@/lib/db/prisma');

      // ASSERT
      expect((global as any).prisma).toBe(prisma);
    });

    it('should not attach prisma client to global in production', async () => {
      // ARRANGE
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      delete (global as any).prisma;

      // ACT
      await import('@/lib/db/prisma');

      // ASSERT
      expect((global as any).prisma).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error if DATABASE_URL is missing', async () => {
      // ARRANGE
      delete process.env.DATABASE_URL;
      jest.resetModules();

      // ACT & ASSERT
      await expect(async () => {
        await import('@/lib/db/prisma');
      }).rejects.toThrow();
    });
  });

  describe('Connection Management', () => {
    it('should provide disconnect method', async () => {
      // ARRANGE
      const { prisma } = await import('@/lib/db/prisma');

      // ACT & ASSERT
      expect(prisma.$disconnect).toBeDefined();
      expect(typeof prisma.$disconnect).toBe('function');
    });

    it('should provide connect method', async () => {
      // ARRANGE
      const { prisma } = await import('@/lib/db/prisma');

      // ACT & ASSERT
      expect(prisma.$connect).toBeDefined();
      expect(typeof prisma.$connect).toBe('function');
    });
  });
});
