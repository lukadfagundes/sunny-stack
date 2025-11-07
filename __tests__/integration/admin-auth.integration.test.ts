/**
 * @file Admin authentication integration tests
 * @description Tests authentication flow across middleware and API routes
 * @jest-environment node
 */

// IMPORTANT: Unmock Prisma for integration tests - we need real DB access
jest.unmock('@prisma/client');

import { setupTestDatabase, teardownTestDatabase, testPrisma } from '../helpers/test-db';
import { createTestUser } from '../helpers/test-factories';
import { AuthError } from '@/lib/errors/app-error';

// Mock logger to prevent console output during tests
jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Admin Authentication Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean database before each test
    await testPrisma.user.deleteMany();
  });

  describe('User Authentication', () => {
    it('should create admin user with valid data', async () => {
      // ARRANGE & ACT
      const user = await createTestUser({
        email: 'admin@sunny-stack.com',
        name: 'Admin User',
        googleId: 'google_123',
      });

      // ASSERT
      expect(user).toBeDefined();
      expect(user.email).toBe('admin@sunny-stack.com');
      expect(user.name).toBe('Admin User');
      expect(user.googleId).toBe('google_123');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should enforce unique email constraint', async () => {
      // ARRANGE
      await createTestUser({ email: 'admin@example.com' });

      // ACT & ASSERT
      await expect(
        createTestUser({ email: 'admin@example.com' })
      ).rejects.toThrow();
    });

    it('should enforce unique googleId constraint', async () => {
      // ARRANGE
      await createTestUser({ googleId: 'google_123' });

      // ACT & ASSERT
      await expect(
        createTestUser({ googleId: 'google_123' })
      ).rejects.toThrow();
    });

    it('should allow multiple users with different emails', async () => {
      // ARRANGE & ACT
      const user1 = await createTestUser({ email: 'admin1@example.com' });
      const user2 = await createTestUser({ email: 'admin2@example.com' });

      // ASSERT
      expect(user1.id).not.toBe(user2.id);
      expect(user1.email).toBe('admin1@example.com');
      expect(user2.email).toBe('admin2@example.com');
    });
  });

  describe('User Lookup', () => {
    it('should find user by email', async () => {
      // ARRANGE
      const createdUser = await createTestUser({ email: 'test@example.com' });

      // ACT
      const foundUser = await testPrisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      // ASSERT
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe('test@example.com');
    });

    it('should find user by googleId', async () => {
      // ARRANGE
      const createdUser = await createTestUser({ googleId: 'google_456' });

      // ACT
      const foundUser = await testPrisma.user.findUnique({
        where: { googleId: 'google_456' },
      });

      // ASSERT
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.googleId).toBe('google_456');
    });

    it('should return null for non-existent user', async () => {
      // ACT
      const foundUser = await testPrisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      // ASSERT
      expect(foundUser).toBeNull();
    });
  });

  describe('User Updates', () => {
    it('should update user name', async () => {
      // ARRANGE
      const user = await createTestUser({ name: 'Old Name' });

      // ACT
      const updatedUser = await testPrisma.user.update({
        where: { id: user.id },
        data: { name: 'New Name' },
      });

      // ASSERT
      expect(updatedUser.name).toBe('New Name');
      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser.email).toBe(user.email);
    });

    it('should update user avatar', async () => {
      // ARRANGE
      const user = await createTestUser({ avatar: null });

      // ACT
      const updatedUser = await testPrisma.user.update({
        where: { id: user.id },
        data: { avatar: 'https://example.com/avatar.jpg' },
      });

      // ASSERT
      expect(updatedUser.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should track updatedAt timestamp', async () => {
      // ARRANGE
      const user = await createTestUser();
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // ACT
      const updatedUser = await testPrisma.user.update({
        where: { id: user.id },
        data: { name: 'Updated Name' },
      });

      // ASSERT
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Authentication Error Handling', () => {
    it('should create AuthError with default status 401', () => {
      // ACT
      const error = new AuthError('Unauthorized');

      // ASSERT
      expect(error).toBeInstanceOf(AuthError);
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
    });

    it('should create AuthError with custom status 403', () => {
      // ACT
      const error = new AuthError('Forbidden', 403);

      // ASSERT
      expect(error).toBeInstanceOf(AuthError);
      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(403);
    });

    it('should have proper error name', () => {
      // ACT
      const error = new AuthError('Test error');

      // ASSERT
      expect(error.name).toBe('AuthError');
    });
  });

  describe('User Deletion', () => {
    it('should delete user by id', async () => {
      // ARRANGE
      const user = await createTestUser();

      // ACT
      await testPrisma.user.delete({ where: { id: user.id } });

      // ASSERT
      const foundUser = await testPrisma.user.findUnique({
        where: { id: user.id },
      });
      expect(foundUser).toBeNull();
    });

    it('should delete user by email', async () => {
      // ARRANGE
      const user = await createTestUser({ email: 'delete@example.com' });

      // ACT
      await testPrisma.user.delete({ where: { email: 'delete@example.com' } });

      // ASSERT
      const foundUser = await testPrisma.user.findUnique({
        where: { email: 'delete@example.com' },
      });
      expect(foundUser).toBeNull();
    });
  });
});
