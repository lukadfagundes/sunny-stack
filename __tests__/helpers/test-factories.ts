/**
 * @file Test data factories
 * @description Factory functions for creating test data
 * @module __tests__/helpers/test-factories
 */

import { ProjectStatus, QuoteStatus } from '@prisma/client';
import { testPrisma } from './test-db';

/**
 * Create a test project
 */
export async function createTestProject(overrides: Partial<{
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  status: ProjectStatus;
  budget: number;
  deadline: Date;
}> = {}) {
  return testPrisma.project.create({
    data: {
      title: overrides.title || 'Test Project',
      description: overrides.description || 'Test project description',
      clientName: overrides.clientName || 'Test Client',
      clientEmail: overrides.clientEmail || 'client@example.com',
      status: overrides.status || ProjectStatus.PLANNING,
      budget: overrides.budget || null,
      deadline: overrides.deadline || null,
    },
  });
}

/**
 * Create a test quote
 */
export async function createTestQuote(overrides: Partial<{
  name: string;
  email: string;
  company: string;
  projectType: string;
  budgetRange: string;
  timeline: string;
  description: string;
  requirements: string;
  status: QuoteStatus;
  projectId: string;
}> = {}) {
  return testPrisma.quote.create({
    data: {
      name: overrides.name || 'Test Client',
      email: overrides.email || 'client@example.com',
      company: overrides.company || 'Test Company',
      projectType: overrides.projectType || 'Web Application',
      budgetRange: overrides.budgetRange || '10k-25k',
      timeline: overrides.timeline || '3 months',
      description: overrides.description || 'Test quote description',
      requirements: overrides.requirements || 'Test requirements',
      status: overrides.status || QuoteStatus.PENDING,
      projectId: overrides.projectId || null,
    },
  });
}

/**
 * Create a test proposal
 */
export async function createTestProposal(overrides: {
  quoteId: string;
  projectId: string;
  pdfUrl?: string;
  sentAt?: Date;
}) {
  return testPrisma.proposal.create({
    data: {
      quoteId: overrides.quoteId,
      projectId: overrides.projectId,
      pdfUrl: overrides.pdfUrl || 'data:application/pdf;base64,JVBERi0xLjQK...',
      sentAt: overrides.sentAt || null,
    },
  });
}

/**
 * Create a test time entry
 */
export async function createTestTimeEntry(overrides: {
  projectId: string;
  description?: string;
  startedAt?: Date;
  endedAt?: Date;
  durationMinutes?: number;
  loggedVia?: string;
}) {
  const startedAt = overrides.startedAt || new Date();
  const endedAt = overrides.endedAt || new Date(Date.now() + 60 * 60 * 1000); // 1 hour later
  const durationMinutes = overrides.durationMinutes || 60;

  return testPrisma.timeEntry.create({
    data: {
      projectId: overrides.projectId,
      description: overrides.description || 'Test time entry',
      startedAt,
      endedAt,
      durationMinutes,
      loggedVia: overrides.loggedVia || 'manual',
    },
  });
}

/**
 * Create a test user
 */
export async function createTestUser(overrides: Partial<{
  email: string;
  name: string;
  googleId: string;
  avatar: string;
}> = {}) {
  return testPrisma.user.create({
    data: {
      email: overrides.email || 'admin@example.com',
      name: overrides.name || 'Admin User',
      googleId: overrides.googleId || 'google_123',
      avatar: overrides.avatar || null,
    },
  });
}

/**
 * Create a test API key
 */
export async function createTestApiKey(overrides: Partial<{
  name: string;
  key: string;
  expiresAt: Date;
}> = {}) {
  return testPrisma.apiKey.create({
    data: {
      name: overrides.name || 'Test API Key',
      key: overrides.key || 'test_api_key_123',
      expiresAt: overrides.expiresAt || null,
    },
  });
}
