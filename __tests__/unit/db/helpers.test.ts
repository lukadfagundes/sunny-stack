/**
 * Unit Tests for Database Query Helpers
 *
 * Tests CRUD operations for database tables
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Create separate mock functions for each method
const createMockFn = () => jest.fn();

// Mock Prisma Client class to prevent initialization
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      project: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      quote: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      timeEntry: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      },
      monitoringEvent: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      discordMessage: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    })),
  };
});

// Set DATABASE_URL after mocking Prisma
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Import helpers and prisma after mocking
import { prisma } from '@/lib/db/prisma';
const mockPrisma = prisma;

// Import helpers after mocking
import * as helpers from '@/lib/db/helpers';

describe('Database Query Helpers', () => {
  beforeEach(() => {
    // Reset all mock implementations
    Object.values(mockPrisma).forEach((model: any) => {
      if (typeof model === 'object') {
        Object.values(model).forEach((method: any) => {
          if (typeof method?.mockClear === 'function') {
            method.mockClear();
          }
        });
      }
    });
  });

  describe('Project Helpers', () => {
    it('should find project by id', async () => {
      // ARRANGE
      const mockProject = { id: 'proj-123', title: 'Test Project' };
      (mockPrisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      // ACT
      const result = await helpers.findProjectById('proj-123');

      // ASSERT
      expect(result).toEqual(mockProject);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'proj-123' },
      });
    });

    it('should find projects by status', async () => {
      // ARRANGE
      const mockProjects = [
        { id: 'proj-1', status: 'IN_PROGRESS' },
        { id: 'proj-2', status: 'IN_PROGRESS' },
      ];
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      // ACT
      const result = await helpers.findProjectsByStatus('IN_PROGRESS');

      // ASSERT
      expect(result).toEqual(mockProjects);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { status: 'IN_PROGRESS' },
      });
    });

    it('should create project', async () => {
      // ARRANGE
      const projectData = {
        title: 'New Project',
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
      };
      const mockCreated = { id: 'proj-new', ...projectData };
      (mockPrisma.project.create as jest.Mock).mockResolvedValue(mockCreated);

      // ACT
      const result = await helpers.createProject(projectData);

      // ASSERT
      expect(result).toEqual(mockCreated);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: projectData,
      });
    });

    it('should update project', async () => {
      // ARRANGE
      const updateData = { title: 'Updated Title' };
      const mockUpdated = { id: 'proj-123', ...updateData };
      (mockPrisma.project.update as jest.Mock).mockResolvedValue(mockUpdated);

      // ACT
      const result = await helpers.updateProject('proj-123', updateData);

      // ASSERT
      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-123' },
        data: updateData,
      });
    });

    it('should soft delete project (set deletedAt)', async () => {
      // ARRANGE
      const mockDeleted = { id: 'proj-123', deletedAt: new Date() };
      (mockPrisma.project.update as jest.Mock).mockResolvedValue(mockDeleted);

      // ACT
      const result = await helpers.softDeleteProject('proj-123');

      // ASSERT
      expect(result).toEqual(mockDeleted);
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('Quote Helpers', () => {
    it('should find quote by id', async () => {
      // ARRANGE
      const mockQuote = { id: 'quote-123', name: 'Test Quote' };
      (mockPrisma.quote.findUnique as jest.Mock).mockResolvedValue(mockQuote);

      // ACT
      const result = await helpers.findQuoteById('quote-123');

      // ASSERT
      expect(result).toEqual(mockQuote);
    });

    it('should find quotes by status', async () => {
      // ARRANGE
      const mockQuotes = [{ id: 'q1', status: 'PENDING' }];
      (mockPrisma.quote.findMany as jest.Mock).mockResolvedValue(mockQuotes);

      // ACT
      const result = await helpers.findQuotesByStatus('PENDING');

      // ASSERT
      expect(result).toEqual(mockQuotes);
    });

    it('should create quote', async () => {
      // ARRANGE
      const quoteData = {
        name: 'John',
        email: 'john@example.com',
        projectType: 'Web App',
        description: 'Test description',
      };
      const mockCreated = { id: 'quote-new', ...quoteData };
      (mockPrisma.quote.create as jest.Mock).mockResolvedValue(mockCreated);

      // ACT
      const result = await helpers.createQuote(quoteData);

      // ASSERT
      expect(result).toEqual(mockCreated);
    });

    it('should update quote status', async () => {
      // ARRANGE
      const mockUpdated = { id: 'quote-123', status: 'APPROVED' };
      (mockPrisma.quote.update as jest.Mock).mockResolvedValue(mockUpdated);

      // ACT
      const result = await helpers.updateQuoteStatus('quote-123', 'APPROVED');

      // ASSERT
      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.quote.update).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        data: { status: 'APPROVED' },
      });
    });

    it('should soft delete quote', async () => {
      // ARRANGE
      const mockDeleted = { id: 'quote-123', deletedAt: new Date() };
      (mockPrisma.quote.update as jest.Mock).mockResolvedValue(mockDeleted);

      // ACT
      const result = await helpers.softDeleteQuote('quote-123');

      // ASSERT
      expect(result.deletedAt).toBeDefined();
    });
  });

  describe('Time Entry Helpers', () => {
    it('should start time entry', async () => {
      // ARRANGE
      const mockEntry = {
        id: 'time-123',
        projectId: 'proj-123',
        description: 'Working on feature',
        startedAt: new Date(),
        endedAt: null,
      };
      (mockPrisma.timeEntry.create as jest.Mock).mockResolvedValue(mockEntry);

      // ACT
      const result = await helpers.startTimeEntry('proj-123', 'Working on feature');

      // ASSERT
      expect(result).toEqual(mockEntry);
      expect(result.endedAt).toBeNull();
    });

    it('should end time entry and calculate duration', async () => {
      // ARRANGE
      const startedAt = new Date('2024-01-01T10:00:00Z');
      const mockEntry = {
        id: 'time-123',
        projectId: 'proj-123',
        startedAt,
        endedAt: null,
      };
      const mockEnded = {
        ...mockEntry,
        endedAt: new Date(),
        durationMinutes: 150,
      };
      (mockPrisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry);
      (mockPrisma.timeEntry.update as jest.Mock).mockResolvedValue(mockEnded);

      // ACT
      const result = await helpers.endTimeEntry('time-123');

      // ASSERT
      expect(result.endedAt).toBeDefined();
      expect(result.durationMinutes).toBeDefined();
    });

    it('should get total project hours', async () => {
      // ARRANGE
      (mockPrisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
        _sum: { durationMinutes: 300 }, // 5 hours
      });

      // ACT
      const result = await helpers.getProjectHours('proj-123');

      // ASSERT
      expect(result).toBe(5); // 300 minutes = 5 hours
    });
  });

  describe('Monitoring Event Helpers', () => {
    it('should log monitoring event', async () => {
      // ARRANGE
      const eventData = {
        type: 'DEPLOYMENT',
        severity: 'INFO',
        source: 'Vercel',
        message: 'Deployment successful',
      };
      const mockEvent = { id: 'event-123', ...eventData };
      (mockPrisma.monitoringEvent.create as jest.Mock).mockResolvedValue(mockEvent);

      // ACT
      const result = await helpers.logMonitoringEvent(eventData);

      // ASSERT
      expect(result).toEqual(mockEvent);
    });

    it('should get events by type with limit', async () => {
      // ARRANGE
      const mockEvents = [
        { id: 'e1', type: 'ERROR' },
        { id: 'e2', type: 'ERROR' },
      ];
      (mockPrisma.monitoringEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      // ACT
      const result = await helpers.getEventsByType('ERROR', 10);

      // ASSERT
      expect(result).toEqual(mockEvents);
      expect(mockPrisma.monitoringEvent.findMany).toHaveBeenCalledWith({
        where: { type: 'ERROR' },
        take: 10,
        orderBy: { timestamp: 'desc' },
      });
    });
  });

  describe('Discord Message Helpers', () => {
    it('should log discord message', async () => {
      // ARRANGE
      const messageData = {
        discordMessageId: 'discord-123',
        channelId: 'channel-456',
        content: 'Hello Discord',
        messageType: 'COMMAND',
      };
      const mockMessage = { id: 'msg-123', ...messageData };
      (mockPrisma.discordMessage.create as jest.Mock).mockResolvedValue(mockMessage);

      // ACT
      const result = await helpers.logDiscordMessage(messageData);

      // ASSERT
      expect(result).toEqual(mockMessage);
    });

    it('should find messages by project', async () => {
      // ARRANGE
      const mockMessages = [
        { id: 'm1', projectId: 'proj-123' },
        { id: 'm2', projectId: 'proj-123' },
      ];
      (mockPrisma.discordMessage.findMany as jest.Mock).mockResolvedValue(mockMessages);

      // ACT
      const result = await helpers.findMessagesByProject('proj-123');

      // ASSERT
      expect(result).toEqual(mockMessages);
    });
  });

  describe('Pagination Helpers', () => {
    it('should paginate results with skip and take', async () => {
      // ARRANGE
      const mockProjects = [
        { id: 'proj-11', title: 'Page 2 Project 1' },
        { id: 'proj-12', title: 'Page 2 Project 2' },
      ];
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      // ACT
      const result = await helpers.paginateProjects({ page: 2, pageSize: 10 });

      // ASSERT
      expect(result).toEqual(mockProjects);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        skip: 10, // (page - 1) * pageSize
        take: 10,
      });
    });
  });

  describe('Search Helpers', () => {
    it('should search projects by title', async () => {
      // ARRANGE
      const mockResults = [{ id: 'proj-1', title: 'Website Redesign' }];
      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockResults);

      // ACT
      const result = await helpers.searchProjects('Website');

      // ASSERT
      expect(result).toEqual(mockResults);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'Website', mode: 'insensitive' } },
            { description: { contains: 'Website', mode: 'insensitive' } },
            { clientName: { contains: 'Website', mode: 'insensitive' } },
          ],
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when find fails', async () => {
      // ARRANGE
      (mockPrisma.project.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      // ACT & ASSERT
      await expect(helpers.findProjectById('invalid-id')).rejects.toThrow('Database error');
    });

    it('should throw error when create fails', async () => {
      // ARRANGE
      (mockPrisma.project.create as jest.Mock).mockRejectedValue(
        new Error('Validation error')
      );

      // ACT & ASSERT
      await expect(
        helpers.createProject({
          title: 'Test',
          clientName: 'Test',
          clientEmail: 'test@example.com',
        })
      ).rejects.toThrow('Validation error');
    });
  });
});
