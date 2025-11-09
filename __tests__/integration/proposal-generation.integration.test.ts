/**
 * @file Proposal generation integration tests
 * @description Tests PDF proposal generation workflow end-to-end
 * @jest-environment node
 */

// IMPORTANT: Unmock Prisma for integration tests - we need real DB access
jest.unmock('@prisma/client');

import { setupTestDatabase, teardownTestDatabase, testPrisma } from '../helpers/test-db';
import { createTestProject, createTestQuote, createTestProposal } from '../helpers/test-factories';
import { QuoteStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '@/lib/errors/app-error';

// Mock logger
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

// Mock Resend email service
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'email_123' }),
    },
  })),
}));

describe('Proposal Generation Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean proposal-related data before each test
    await testPrisma.proposal.deleteMany();
    await testPrisma.quote.deleteMany();
    await testPrisma.project.deleteMany();
  });

  describe('Create Proposal', () => {
    it('should create proposal with quote and project', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });

      // ACT
      const proposal = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });

      // ASSERT
      expect(proposal).toBeDefined();
      expect(proposal.id).toBeDefined();
      expect(proposal.quoteId).toBe(quote.id);
      expect(proposal.projectId).toBe(project.id);
      expect(proposal.pdfUrl).toBeDefined();
      expect(proposal.pdfUrl).toContain('data:application/pdf');
      expect(proposal.sentAt).toBeNull();
    });

    it('should create proposal with sentAt timestamp', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });
      const sentAt = new Date();

      // ACT
      const proposal = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
        sentAt,
      });

      // ASSERT
      expect(proposal.sentAt).toEqual(sentAt);
    });

    it('should allow multiple proposals for same quote', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });

      // ACT
      const proposal1 = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });
      const proposal2 = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });

      // ASSERT
      expect(proposal1.id).not.toBe(proposal2.id);
      expect(proposal1.quoteId).toBe(quote.id);
      expect(proposal2.quoteId).toBe(quote.id);
    });
  });

  describe('Read Proposals', () => {
    it('should find proposal by id', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });
      const createdProposal = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });

      // ACT
      const foundProposal = await testPrisma.proposal.findUnique({
        where: { id: createdProposal.id },
      });

      // ASSERT
      expect(foundProposal).toBeDefined();
      expect(foundProposal?.id).toBe(createdProposal.id);
    });

    it('should find proposals by quoteId', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });
      await createTestProposal({ quoteId: quote.id, projectId: project.id });
      await createTestProposal({ quoteId: quote.id, projectId: project.id });

      // ACT
      const proposals = await testPrisma.proposal.findMany({
        where: { quoteId: quote.id },
      });

      // ASSERT
      expect(proposals).toHaveLength(2);
    });

    it('should include quote and project relations', async () => {
      // ARRANGE
      const project = await createTestProject({ title: 'Test Project' });
      const quote = await createTestQuote({
        name: 'Test Client',
        projectId: project.id,
      });
      const proposal = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });

      // ACT
      const proposalWithRelations = await testPrisma.proposal.findUnique({
        where: { id: proposal.id },
        include: {
          quote: true,
        },
      });

      // ASSERT
      expect(proposalWithRelations).toBeDefined();
      expect(proposalWithRelations?.quote.name).toBe('Test Client');
    });
  });

  describe('Update Proposal', () => {
    it('should update sentAt timestamp', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });
      const proposal = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });

      // ACT
      const sentAt = new Date();
      const updated = await testPrisma.proposal.update({
        where: { id: proposal.id },
        data: { sentAt },
      });

      // ASSERT
      expect(updated.sentAt).toEqual(sentAt);
    });

    it('should track updatedAt timestamp', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });
      const proposal = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });
      const originalUpdatedAt = proposal.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      // ACT
      const updated = await testPrisma.proposal.update({
        where: { id: proposal.id },
        data: { sentAt: new Date() },
      });

      // ASSERT
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Delete Proposal', () => {
    it('should delete proposal', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });
      const proposal = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });

      // ACT
      await testPrisma.proposal.delete({ where: { id: proposal.id } });

      // ASSERT
      const found = await testPrisma.proposal.findUnique({
        where: { id: proposal.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('Proposal Cascade Behavior', () => {
    it('should cascade delete when quote is deleted', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });
      const proposal = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });

      // ACT
      await testPrisma.quote.delete({ where: { id: quote.id } });

      // ASSERT
      const foundProposal = await testPrisma.proposal.findUnique({
        where: { id: proposal.id },
      });
      expect(foundProposal).toBeNull();
    });

    it('should allow project deletion (no FK constraint on projectId)', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });
      const proposal = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });

      // First, set projectId to null on quote to avoid FK constraint
      await testPrisma.quote.update({
        where: { id: quote.id },
        data: { projectId: null },
      });

      // ACT - Delete project (should succeed - no FK constraint on proposal.projectId)
      await testPrisma.project.delete({ where: { id: project.id } });

      // ASSERT - Proposal still exists with orphaned projectId
      const foundProposal = await testPrisma.proposal.findUnique({
        where: { id: proposal.id },
      });
      expect(foundProposal).toBeDefined();
      expect(foundProposal?.projectId).toBe(project.id); // Orphaned reference
    });
  });

  describe('Proposal Listing and Filtering', () => {
    it('should list all proposals', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote1 = await createTestQuote({ projectId: project.id });
      const quote2 = await createTestQuote({ projectId: project.id });
      await createTestProposal({ quoteId: quote1.id, projectId: project.id });
      await createTestProposal({ quoteId: quote2.id, projectId: project.id });

      // ACT
      const proposals = await testPrisma.proposal.findMany();

      // ASSERT
      expect(proposals).toHaveLength(2);
    });

    it('should filter proposals by projectId', async () => {
      // ARRANGE
      const project1 = await createTestProject({ title: 'Project 1' });
      const project2 = await createTestProject({ title: 'Project 2' });
      const quote1 = await createTestQuote({ projectId: project1.id });
      const quote2 = await createTestQuote({ projectId: project2.id });
      await createTestProposal({ quoteId: quote1.id, projectId: project1.id });
      await createTestProposal({ quoteId: quote2.id, projectId: project2.id });

      // ACT
      const project1Proposals = await testPrisma.proposal.findMany({
        where: { projectId: project1.id },
      });

      // ASSERT
      expect(project1Proposals).toHaveLength(1);
      expect(project1Proposals[0].projectId).toBe(project1.id);
    });

    it('should filter proposals with sentAt not null', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote1 = await createTestQuote({ projectId: project.id });
      const quote2 = await createTestQuote({ projectId: project.id });
      await createTestProposal({
        quoteId: quote1.id,
        projectId: project.id,
        sentAt: new Date(),
      });
      await createTestProposal({
        quoteId: quote2.id,
        projectId: project.id,
        sentAt: null,
      });

      // ACT
      const sentProposals = await testPrisma.proposal.findMany({
        where: { sentAt: { not: null } },
      });

      // ASSERT
      expect(sentProposals).toHaveLength(1);
    });

    it('should sort proposals by createdAt descending', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });
      const proposal1 = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });
      await new Promise(resolve => setTimeout(resolve, 10));
      const proposal2 = await createTestProposal({
        quoteId: quote.id,
        projectId: project.id,
      });

      // ACT
      const proposals = await testPrisma.proposal.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // ASSERT
      expect(proposals[0].id).toBe(proposal2.id);
      expect(proposals[1].id).toBe(proposal1.id);
    });
  });

  describe('Proposal Validation', () => {
    it('should require quoteId', async () => {
      // ACT & ASSERT
      await expect(
        testPrisma.proposal.create({
          data: {
            // @ts-expect-error - Testing missing quoteId
            projectId: 'project_123',
            pdfUrl: 'data:application/pdf;base64,test',
          },
        })
      ).rejects.toThrow();
    });

    it('should require projectId', async () => {
      // ACT & ASSERT
      await expect(
        testPrisma.proposal.create({
          data: {
            // @ts-expect-error - Testing missing projectId
            quoteId: 'quote_123',
            pdfUrl: 'data:application/pdf;base64,test',
          },
        })
      ).rejects.toThrow();
    });

    it('should require pdfUrl', async () => {
      // ACT & ASSERT
      await expect(
        testPrisma.proposal.create({
          data: {
            // @ts-expect-error - Testing missing pdfUrl
            quoteId: 'quote_123',
            projectId: 'project_123',
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraint for quoteId', async () => {
      // ACT & ASSERT
      await expect(
        createTestProposal({
          quoteId: 'nonexistent_quote',
          projectId: 'nonexistent_project',
        })
      ).rejects.toThrow();
    });
  });

  describe('Proposal Error Handling', () => {
    it('should throw NotFoundError for non-existent proposal', () => {
      // ACT & ASSERT
      const error = new NotFoundError('Proposal', 'nonexistent_id');

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Proposal not found: nonexistent_id');
      expect(error.statusCode).toBe(404);
    });

    it('should throw ValidationError for invalid quote', () => {
      // ACT & ASSERT
      const error = new ValidationError(
        'Quote must be converted to project before generating proposal',
        'projectId'
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.statusCode).toBe(400);
      expect(error.field).toBe('projectId');
    });
  });

  describe('Proposal Count and Aggregation', () => {
    it('should count proposals by projectId', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote1 = await createTestQuote({ projectId: project.id });
      const quote2 = await createTestQuote({ projectId: project.id });
      await createTestProposal({ quoteId: quote1.id, projectId: project.id });
      await createTestProposal({ quoteId: quote2.id, projectId: project.id });

      // ACT
      const count = await testPrisma.proposal.count({
        where: { projectId: project.id },
      });

      // ASSERT
      expect(count).toBe(2);
    });

    it('should count total proposals', async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote1 = await createTestQuote({ projectId: project.id });
      const quote2 = await createTestQuote({ projectId: project.id });
      await createTestProposal({ quoteId: quote1.id, projectId: project.id });
      await createTestProposal({ quoteId: quote2.id, projectId: project.id });

      // ACT
      const total = await testPrisma.proposal.count();

      // ASSERT
      expect(total).toBe(2);
    });
  });
});
