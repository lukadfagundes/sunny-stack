/**
 * @file Test database helpers
 * @description Utilities for setting up and tearing down test database
 * @module __tests__/helpers/test-db
 * @jest-environment node
 *
 * NOTE: This is a utility file, not a test suite.
 * Jest will not find any tests here.
 */

import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma Client for tests
 * Separate instance from main application to avoid conflicts
 */
export const testPrisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: process.env.LOG_QUERIES === 'true' ? ['query', 'error'] : ['error'],
});

/**
 * Clean all test data from database
 * Order matters due to foreign key constraints
 */
export async function cleanDatabase() {
  // Delete in reverse dependency order
  await testPrisma.discordMessage.deleteMany();
  await testPrisma.timeEntry.deleteMany();
  await testPrisma.proposal.deleteMany();
  await testPrisma.quote.deleteMany();
  await testPrisma.project.deleteMany();
  await testPrisma.monitoringEvent.deleteMany();
  await testPrisma.apiKey.deleteMany();
  await testPrisma.webhook.deleteMany();
  await testPrisma.systemConfig.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.quoteRequest.deleteMany();
  await testPrisma.contactMessage.deleteMany();
}

/**
 * Disconnect from test database
 */
export async function disconnectDatabase() {
  await testPrisma.$disconnect();
}

/**
 * Connect to test database and verify connection
 */
export async function connectDatabase() {
  try {
    await testPrisma.$connect();
    // Verify connection with a simple query
    await testPrisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Setup test database
 * Call this in beforeAll() hooks
 */
export async function setupTestDatabase() {
  await connectDatabase();
  await cleanDatabase();
}

/**
 * Teardown test database
 * Call this in afterAll() hooks
 */
export async function teardownTestDatabase() {
  await cleanDatabase();
  await disconnectDatabase();
}
