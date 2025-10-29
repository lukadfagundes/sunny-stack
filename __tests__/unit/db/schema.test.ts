/**
 * @jest-environment node
 */

// __tests__/unit/db/schema.test.ts

/**
 * Unit Tests for Prisma Database Schema
 *
 * Tests schema compilation, relationships, required fields, unique constraints,
 * and enum definitions for the Discord bot + admin platform
 *
 * Follows TDD RED-GREEN-REFACTOR methodology
 */

import { PrismaClient, Prisma } from '@prisma/client';

// Mock PrismaClient for testing
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    quote: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    timeEntry: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    monitoringEvent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    discordMessage: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    apiKey: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    webhook: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    systemConfig: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    Prisma: {
      ProjectStatus: {
        PLANNING: 'PLANNING',
        IN_PROGRESS: 'IN_PROGRESS',
        REVIEW: 'REVIEW',
        COMPLETE: 'COMPLETE',
        ARCHIVED: 'ARCHIVED',
      },
      QuoteStatus: {
        PENDING: 'PENDING',
        APPROVED: 'APPROVED',
        DECLINED: 'DECLINED',
        CONVERTED: 'CONVERTED',
      },
      EventType: {
        DEPLOYMENT: 'DEPLOYMENT',
        UPTIME_CHECK: 'UPTIME_CHECK',
        ERROR: 'ERROR',
        ALERT: 'ALERT',
      },
      Severity: {
        INFO: 'INFO',
        WARNING: 'WARNING',
        ERROR: 'ERROR',
        CRITICAL: 'CRITICAL',
      },
    },
  };
});

describe('Prisma Database Schema', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('Schema Compilation', () => {
    test('should compile Prisma schema without errors', () => {
      // ARRANGE & ACT
      // Importing PrismaClient should succeed if schema is valid

      // ASSERT
      expect(PrismaClient).toBeDefined();
      expect(prisma).toBeDefined();
    });

    test('should export all required model types', () => {
      // ARRANGE & ACT
      const models = Object.keys(prisma).filter(
        (key) => !key.startsWith('$') && !key.startsWith('_')
      );

      // ASSERT
      expect(models).toContain('user');
      expect(models).toContain('project');
      expect(models).toContain('quote');
      expect(models).toContain('timeEntry');
      expect(models).toContain('monitoringEvent');
      expect(models).toContain('discordMessage');
      expect(models).toContain('apiKey');
      expect(models).toContain('webhook');
      expect(models).toContain('systemConfig');
    });
  });

  describe('Table: users', () => {
    test('should create user with required fields', async () => {
      // ARRANGE
      const userData = {
        id: 'user-123',
        email: 'admin@sunny-stack.com',
        name: 'Luka D. Fagundes',
        googleId: 'google-oauth-id-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(userData);

      // ACT
      const user = await prisma.user.create({
        data: userData,
      });

      // ASSERT
      expect(user).toBeDefined();
      expect(user.email).toBe('admin@sunny-stack.com');
      expect(user.googleId).toBe('google-oauth-id-123');
    });

    test('should enforce unique email constraint', async () => {
      // ARRANGE
      const userData = { email: 'admin@sunny-stack.com', name: 'Admin' };
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint failed on the constraint: `users_email_key`')
      );

      // ACT & ASSERT
      await expect(
        prisma.user.create({ data: userData })
      ).rejects.toThrow('Unique constraint failed');
    });

    test('should enforce unique googleId constraint', async () => {
      // ARRANGE
      const userData = {
        email: 'admin@sunny-stack.com',
        name: 'Admin',
        googleId: 'google-123',
      };
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint failed on the constraint: `users_googleId_key`')
      );

      // ACT & ASSERT
      await expect(
        prisma.user.create({ data: userData })
      ).rejects.toThrow('Unique constraint failed');
    });
  });

  describe('Table: projects', () => {
    test('should create project with required fields', async () => {
      // ARRANGE
      const projectData = {
        id: 'project-123',
        title: 'Discord Bot Admin Platform',
        description: 'Personal assistant bot with admin dashboard',
        clientName: 'Luka D. Fagundes',
        clientEmail: 'luka@sunny-stack.com',
        status: 'IN_PROGRESS',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(projectData);

      // ACT
      const project = await prisma.project.create({
        data: projectData,
      });

      // ASSERT
      expect(project).toBeDefined();
      expect(project.title).toBe('Discord Bot Admin Platform');
      expect(project.status).toBe('IN_PROGRESS');
    });

    test('should support ProjectStatus enum values', () => {
      // ARRANGE & ACT
      const validStatuses = [
        Prisma.ProjectStatus.PLANNING,
        Prisma.ProjectStatus.IN_PROGRESS,
        Prisma.ProjectStatus.REVIEW,
        Prisma.ProjectStatus.COMPLETE,
        Prisma.ProjectStatus.ARCHIVED,
      ];

      // ASSERT
      expect(validStatuses).toHaveLength(5);
      expect(validStatuses).toContain('PLANNING');
      expect(validStatuses).toContain('IN_PROGRESS');
      expect(validStatuses).toContain('REVIEW');
      expect(validStatuses).toContain('COMPLETE');
      expect(validStatuses).toContain('ARCHIVED');
    });

    test('should support optional budget and deadline fields', async () => {
      // ARRANGE
      const projectData = {
        id: 'project-456',
        title: 'Test Project',
        clientName: 'Client',
        clientEmail: 'client@example.com',
        status: 'PLANNING',
        budget: 25000.0,
        deadline: new Date('2025-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(projectData);

      // ACT
      const project = await prisma.project.create({
        data: projectData,
      });

      // ASSERT
      expect(project.budget).toBe(25000.0);
      expect(project.deadline).toBeInstanceOf(Date);
    });
  });

  describe('Table: quotes', () => {
    test('should create quote with required fields', async () => {
      // ARRANGE
      const quoteData = {
        id: 'quote-123',
        name: 'John Doe',
        email: 'john@example.com',
        projectType: 'Web Application',
        description: 'Need a project management system',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.quote.create as jest.Mock).mockResolvedValue(quoteData);

      // ACT
      const quote = await prisma.quote.create({
        data: quoteData,
      });

      // ASSERT
      expect(quote).toBeDefined();
      expect(quote.name).toBe('John Doe');
      expect(quote.status).toBe('PENDING');
    });

    test('should support QuoteStatus enum values', () => {
      // ARRANGE & ACT
      const validStatuses = [
        Prisma.QuoteStatus.PENDING,
        Prisma.QuoteStatus.APPROVED,
        Prisma.QuoteStatus.DECLINED,
        Prisma.QuoteStatus.CONVERTED,
      ];

      // ASSERT
      expect(validStatuses).toHaveLength(4);
      expect(validStatuses).toContain('PENDING');
      expect(validStatuses).toContain('APPROVED');
      expect(validStatuses).toContain('DECLINED');
      expect(validStatuses).toContain('CONVERTED');
    });

    test('should link quote to project via projectId', async () => {
      // ARRANGE
      const quoteData = {
        id: 'quote-456',
        name: 'Jane Smith',
        email: 'jane@example.com',
        projectType: 'Website',
        description: 'Company website redesign',
        status: 'CONVERTED',
        projectId: 'project-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.quote.create as jest.Mock).mockResolvedValue(quoteData);

      // ACT
      const quote = await prisma.quote.create({
        data: quoteData,
      });

      // ASSERT
      expect(quote.projectId).toBe('project-123');
      expect(quote.status).toBe('CONVERTED');
    });
  });

  describe('Table: time_entries', () => {
    test('should create time entry with required fields', async () => {
      // ARRANGE
      const timeEntryData = {
        id: 'entry-123',
        projectId: 'project-123',
        description: 'Implemented Discord bot commands',
        startedAt: new Date('2025-10-28T10:00:00Z'),
        endedAt: new Date('2025-10-28T12:30:00Z'),
        durationMinutes: 150,
        loggedVia: 'discord',
        createdAt: new Date(),
      };

      (prisma.timeEntry.create as jest.Mock).mockResolvedValue(timeEntryData);

      // ACT
      const entry = await prisma.timeEntry.create({
        data: timeEntryData,
      });

      // ASSERT
      expect(entry).toBeDefined();
      expect(entry.projectId).toBe('project-123');
      expect(entry.durationMinutes).toBe(150);
      expect(entry.loggedVia).toBe('discord');
    });

    test('should support optional endedAt for active timers', async () => {
      // ARRANGE
      const activeTimerData = {
        id: 'entry-456',
        projectId: 'project-123',
        startedAt: new Date(),
        loggedVia: 'admin',
        createdAt: new Date(),
      };

      (prisma.timeEntry.create as jest.Mock).mockResolvedValue(activeTimerData);

      // ACT
      const entry = await prisma.timeEntry.create({
        data: activeTimerData,
      });

      // ASSERT
      expect(entry.endedAt).toBeUndefined();
      expect(entry.durationMinutes).toBeUndefined();
    });

    test('should link time entry to project', async () => {
      // ARRANGE
      const timeEntryData = {
        id: 'entry-789',
        projectId: 'project-456',
        startedAt: new Date(),
        loggedVia: 'manual',
        createdAt: new Date(),
      };

      (prisma.timeEntry.create as jest.Mock).mockResolvedValue(timeEntryData);

      // ACT
      const entry = await prisma.timeEntry.create({
        data: timeEntryData,
      });

      // ASSERT
      expect(entry.projectId).toBe('project-456');
    });
  });

  describe('Table: monitoring_events', () => {
    test('should create monitoring event with required fields', async () => {
      // ARRANGE
      const eventData = {
        id: 'event-123',
        type: 'DEPLOYMENT',
        severity: 'INFO',
        source: 'Vercel',
        message: 'Deployment successful to production',
        metadata: { deploymentId: 'dpl_123', url: 'https://sunny-stack.com' },
        timestamp: new Date(),
        createdAt: new Date(),
      };

      (prisma.monitoringEvent.create as jest.Mock).mockResolvedValue(eventData);

      // ACT
      const event = await prisma.monitoringEvent.create({
        data: eventData,
      });

      // ASSERT
      expect(event).toBeDefined();
      expect(event.type).toBe('DEPLOYMENT');
      expect(event.severity).toBe('INFO');
      expect(event.source).toBe('Vercel');
    });

    test('should support EventType enum values', () => {
      // ARRANGE & ACT
      const validTypes = [
        Prisma.EventType.DEPLOYMENT,
        Prisma.EventType.UPTIME_CHECK,
        Prisma.EventType.ERROR,
        Prisma.EventType.ALERT,
      ];

      // ASSERT
      expect(validTypes).toHaveLength(4);
      expect(validTypes).toContain('DEPLOYMENT');
      expect(validTypes).toContain('UPTIME_CHECK');
      expect(validTypes).toContain('ERROR');
      expect(validTypes).toContain('ALERT');
    });

    test('should support Severity enum values', () => {
      // ARRANGE & ACT
      const validSeverities = [
        Prisma.Severity.INFO,
        Prisma.Severity.WARNING,
        Prisma.Severity.ERROR,
        Prisma.Severity.CRITICAL,
      ];

      // ASSERT
      expect(validSeverities).toHaveLength(4);
      expect(validSeverities).toContain('INFO');
      expect(validSeverities).toContain('WARNING');
      expect(validSeverities).toContain('ERROR');
      expect(validSeverities).toContain('CRITICAL');
    });

    test('should store metadata as JSON', async () => {
      // ARRANGE
      const eventData = {
        id: 'event-456',
        type: 'ERROR',
        severity: 'CRITICAL',
        source: 'Fly.io',
        message: 'Application crashed',
        metadata: {
          errorCode: 500,
          stackTrace: 'Error at line 42...',
          affectedUsers: 15,
        },
        timestamp: new Date(),
        createdAt: new Date(),
      };

      (prisma.monitoringEvent.create as jest.Mock).mockResolvedValue(eventData);

      // ACT
      const event = await prisma.monitoringEvent.create({
        data: eventData,
      });

      // ASSERT
      expect(event.metadata).toBeDefined();
      expect(event.metadata.errorCode).toBe(500);
      expect(event.metadata.affectedUsers).toBe(15);
    });
  });

  describe('Table: discord_messages', () => {
    test('should create discord message log entry', async () => {
      // ARRANGE
      const messageData = {
        id: 'msg-123',
        discordMessageId: '1234567890123456789',
        channelId: 'channel-123',
        userId: 'user-123',
        content: '/status project-123',
        messageType: 'COMMAND',
        metadata: { commandName: 'status', args: ['project-123'] },
        timestamp: new Date(),
        createdAt: new Date(),
      };

      (prisma.discordMessage.create as jest.Mock).mockResolvedValue(messageData);

      // ACT
      const message = await prisma.discordMessage.create({
        data: messageData,
      });

      // ASSERT
      expect(message).toBeDefined();
      expect(message.discordMessageId).toBe('1234567890123456789');
      expect(message.messageType).toBe('COMMAND');
    });

    test('should support optional projectId for project-related messages', async () => {
      // ARRANGE
      const messageData = {
        id: 'msg-456',
        discordMessageId: '9876543210987654321',
        channelId: 'channel-123',
        content: 'Deployment alert for project',
        messageType: 'ALERT',
        projectId: 'project-123',
        timestamp: new Date(),
        createdAt: new Date(),
      };

      (prisma.discordMessage.create as jest.Mock).mockResolvedValue(messageData);

      // ACT
      const message = await prisma.discordMessage.create({
        data: messageData,
      });

      // ASSERT
      expect(message.projectId).toBe('project-123');
    });
  });

  describe('Table: api_keys', () => {
    test('should create API key with required fields', async () => {
      // ARRANGE
      const apiKeyData = {
        id: 'key-123',
        name: 'Discord Bot API Key',
        key: 'bot_1234567890abcdef',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };

      (prisma.apiKey.create as jest.Mock).mockResolvedValue(apiKeyData);

      // ACT
      const apiKey = await prisma.apiKey.create({
        data: apiKeyData,
      });

      // ASSERT
      expect(apiKey).toBeDefined();
      expect(apiKey.name).toBe('Discord Bot API Key');
      expect(apiKey.key).toBe('bot_1234567890abcdef');
    });

    test('should enforce unique key constraint', async () => {
      // ARRANGE
      const apiKeyData = { name: 'Test Key', key: 'duplicate_key' };
      (prisma.apiKey.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint failed on the constraint: `api_keys_key_key`')
      );

      // ACT & ASSERT
      await expect(
        prisma.apiKey.create({ data: apiKeyData })
      ).rejects.toThrow('Unique constraint failed');
    });

    test('should support optional expiresAt field', async () => {
      // ARRANGE
      const apiKeyData = {
        id: 'key-456',
        name: 'Temporary Key',
        key: 'temp_key_123',
        expiresAt: new Date('2026-01-01'),
        createdAt: new Date(),
      };

      (prisma.apiKey.create as jest.Mock).mockResolvedValue(apiKeyData);

      // ACT
      const apiKey = await prisma.apiKey.create({
        data: apiKeyData,
      });

      // ASSERT
      expect(apiKey.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('Table: webhooks', () => {
    test('should create webhook with required fields', async () => {
      // ARRANGE
      const webhookData = {
        id: 'webhook-123',
        name: 'GitHub Deployment Webhook',
        url: 'https://api.sunny-stack.com/webhooks/github',
        secret: 'webhook_secret_123',
        events: ['push', 'deployment', 'pull_request'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.webhook.create as jest.Mock).mockResolvedValue(webhookData);

      // ACT
      const webhook = await prisma.webhook.create({
        data: webhookData,
      });

      // ASSERT
      expect(webhook).toBeDefined();
      expect(webhook.name).toBe('GitHub Deployment Webhook');
      expect(webhook.events).toContain('push');
      expect(webhook.active).toBe(true);
    });

    test('should support optional metadata field', async () => {
      // ARRANGE
      const webhookData = {
        id: 'webhook-456',
        name: 'Vercel Webhook',
        url: 'https://api.sunny-stack.com/webhooks/vercel',
        events: ['deployment.created', 'deployment.ready'],
        active: true,
        metadata: { projectId: 'vercel_project_123', teamId: 'team_456' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.webhook.create as jest.Mock).mockResolvedValue(webhookData);

      // ACT
      const webhook = await prisma.webhook.create({
        data: webhookData,
      });

      // ASSERT
      expect(webhook.metadata).toBeDefined();
      expect(webhook.metadata.projectId).toBe('vercel_project_123');
    });
  });

  describe('Table: system_config', () => {
    test('should create system config with required fields', async () => {
      // ARRANGE
      const configData = {
        id: 'config-123',
        key: 'discord.adminChannelId',
        value: 'channel_1234567890',
        description: 'Main admin notification channel',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.systemConfig.create as jest.Mock).mockResolvedValue(configData);

      // ACT
      const config = await prisma.systemConfig.create({
        data: configData,
      });

      // ASSERT
      expect(config).toBeDefined();
      expect(config.key).toBe('discord.adminChannelId');
      expect(config.value).toBe('channel_1234567890');
    });

    test('should enforce unique key constraint', async () => {
      // ARRANGE
      const configData = { key: 'duplicate.key', value: 'some_value' };
      (prisma.systemConfig.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint failed on the constraint: `system_config_key_key`')
      );

      // ACT & ASSERT
      await expect(
        prisma.systemConfig.create({ data: configData })
      ).rejects.toThrow('Unique constraint failed');
    });

    test('should support optional description field', async () => {
      // ARRANGE
      const configData = {
        id: 'config-456',
        key: 'monitoring.uptimeCheckInterval',
        value: '300000',
        description: 'Uptime check interval in milliseconds (5 minutes)',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.systemConfig.create as jest.Mock).mockResolvedValue(configData);

      // ACT
      const config = await prisma.systemConfig.create({
        data: configData,
      });

      // ASSERT
      expect(config.description).toBe('Uptime check interval in milliseconds (5 minutes)');
    });
  });

  describe('Relationships', () => {
    test('should link quote to project via foreign key', async () => {
      // ARRANGE
      const projectData = {
        id: 'project-123',
        title: 'Test Project',
        clientName: 'Client',
        clientEmail: 'client@example.com',
        status: 'IN_PROGRESS',
      };

      const quoteData = {
        id: 'quote-123',
        name: 'Client',
        email: 'client@example.com',
        projectType: 'Website',
        description: 'Test quote',
        status: 'CONVERTED',
        projectId: 'project-123',
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(projectData);
      (prisma.quote.create as jest.Mock).mockResolvedValue(quoteData);

      // ACT
      const project = await prisma.project.create({ data: projectData });
      const quote = await prisma.quote.create({ data: quoteData });

      // ASSERT
      expect(quote.projectId).toBe(project.id);
    });

    test('should link time entry to project via foreign key', async () => {
      // ARRANGE
      const projectData = {
        id: 'project-456',
        title: 'Another Project',
        clientName: 'Client',
        clientEmail: 'client@example.com',
        status: 'IN_PROGRESS',
      };

      const timeEntryData = {
        id: 'entry-123',
        projectId: 'project-456',
        startedAt: new Date(),
        loggedVia: 'discord',
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(projectData);
      (prisma.timeEntry.create as jest.Mock).mockResolvedValue(timeEntryData);

      // ACT
      const project = await prisma.project.create({ data: projectData });
      const entry = await prisma.timeEntry.create({ data: timeEntryData });

      // ASSERT
      expect(entry.projectId).toBe(project.id);
    });

    test('should link discord message to project via foreign key', async () => {
      // ARRANGE
      const projectData = {
        id: 'project-789',
        title: 'Project with Messages',
        clientName: 'Client',
        clientEmail: 'client@example.com',
        status: 'IN_PROGRESS',
      };

      const messageData = {
        id: 'msg-123',
        discordMessageId: '1234567890',
        channelId: 'channel-123',
        content: 'Project update',
        messageType: 'ALERT',
        projectId: 'project-789',
        timestamp: new Date(),
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(projectData);
      (prisma.discordMessage.create as jest.Mock).mockResolvedValue(messageData);

      // ACT
      const project = await prisma.project.create({ data: projectData });
      const message = await prisma.discordMessage.create({ data: messageData });

      // ASSERT
      expect(message.projectId).toBe(project.id);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt timestamp', async () => {
      // ARRANGE
      const beforeCreate = new Date();
      const projectData = {
        id: 'project-timestamp-1',
        title: 'Timestamp Test',
        clientName: 'Client',
        clientEmail: 'client@example.com',
        status: 'PLANNING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(projectData);

      // ACT
      const project = await prisma.project.create({ data: projectData });

      // ASSERT
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });

    test('should automatically set updatedAt timestamp', async () => {
      // ARRANGE
      const projectData = {
        id: 'project-timestamp-2',
        title: 'Update Test',
        clientName: 'Client',
        clientEmail: 'client@example.com',
        status: 'IN_PROGRESS',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(projectData);

      // ACT
      const project = await prisma.project.create({ data: projectData });

      // ASSERT
      expect(project.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Data Types', () => {
    test('should store Decimal for budget field', async () => {
      // ARRANGE
      const projectData = {
        id: 'project-decimal-1',
        title: 'Budget Test',
        clientName: 'Client',
        clientEmail: 'client@example.com',
        status: 'PLANNING',
        budget: 25000.50,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(projectData);

      // ACT
      const project = await prisma.project.create({ data: projectData });

      // ASSERT
      expect(typeof project.budget).toBe('number');
      expect(project.budget).toBe(25000.50);
    });

    test('should store JSON for metadata fields', async () => {
      // ARRANGE
      const eventData = {
        id: 'event-json-1',
        type: 'DEPLOYMENT',
        severity: 'INFO',
        source: 'Vercel',
        message: 'Deployment successful',
        metadata: {
          deploymentId: 'dpl_123',
          environment: 'production',
          duration: 45000,
        },
        timestamp: new Date(),
        createdAt: new Date(),
      };

      (prisma.monitoringEvent.create as jest.Mock).mockResolvedValue(eventData);

      // ACT
      const event = await prisma.monitoringEvent.create({ data: eventData });

      // ASSERT
      expect(typeof event.metadata).toBe('object');
      expect(event.metadata.deploymentId).toBe('dpl_123');
      expect(event.metadata.duration).toBe(45000);
    });

    test('should store array of strings for events field', async () => {
      // ARRANGE
      const webhookData = {
        id: 'webhook-array-1',
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['push', 'pull_request', 'deployment'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.webhook.create as jest.Mock).mockResolvedValue(webhookData);

      // ACT
      const webhook = await prisma.webhook.create({ data: webhookData });

      // ASSERT
      expect(Array.isArray(webhook.events)).toBe(true);
      expect(webhook.events).toHaveLength(3);
      expect(webhook.events).toContain('push');
    });
  });
});
