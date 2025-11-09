/**
 * Integration Tests: Command Execution Flow
 *
 * Tests the full command execution flow from interaction to response
 */

import { CommandInteraction } from 'discord.js';
import { ProjectListCommand } from '@/bot/commands/project/list';
import { QuoteListCommand } from '@/bot/commands/quote/list';
import { TimeReportCommand } from '@/bot/commands/time/report';
import { AdminHealthCommand } from '@/bot/commands/admin/health';

// Mock API client and config
jest.mock('@/bot/core/api-client');
jest.mock('@/bot/config', () => ({
  loadBotConfig: jest.fn().mockReturnValue({
    apiUrl: 'http://localhost:3000',
    apiKey: 'test-api-key',
    token: 'test-token',
  }),
}));

describe('Integration: Command Execution Flow', () => {
  let mockInteraction: Partial<CommandInteraction>;
  let deferReplySpy: jest.Mock;
  let followUpSpy: jest.Mock;
  let replySpy: jest.Mock;

  beforeEach(() => {
    deferReplySpy = jest.fn().mockResolvedValue(undefined);
    followUpSpy = jest.fn().mockResolvedValue(undefined);
    replySpy = jest.fn().mockResolvedValue(undefined);

    mockInteraction = {
      commandName: 'test-command',
      user: {
        id: '123456789',
        tag: 'TestUser#1234',
      } as any,
      guildId: '987654321',
      channelId: '111222333',
      options: {
        get: jest.fn(),
        getString: jest.fn(),
        getInteger: jest.fn(),
        getBoolean: jest.fn(),
      } as any,
      isChatInputCommand: jest.fn().mockReturnValue(true),
      deferReply: deferReplySpy,
      followUp: followUpSpy,
      reply: replySpy,
      // Per INV-003: Interaction is pre-deferred by handler
      deferred: true,
      replied: false,
    };
  });

  describe('ProjectListCommand', () => {
    it('should execute successfully with valid API response', async () => {
      const command = new ProjectListCommand();

      // Mock options
      (mockInteraction.options!.getInteger as jest.Mock).mockImplementation((name: string) => {
        if (name === 'page') return 1;
        return null;
      });
      (mockInteraction.options!.getString as jest.Mock).mockImplementation((name: string) => {
        if (name === 'status') return null;
        return null;
      });

      // Mock API client response
      const { ApiClient } = require('@/bot/core/api-client');
      ApiClient.mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          data: {
            projects: [
              {
                id: 'proj_1',
                title: 'Test Project',
                status: 'IN_PROGRESS',
                budget: 10000,
                createdAt: new Date().toISOString(),
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
            },
          },
          error: null,
        }),
      }));

      try {
        await command.execute(mockInteraction as CommandInteraction);
      } catch (error) {
        console.error('Command execution error:', error);
        throw error;
      }

      // Per INV-003: deferReply is a no-op, so we don't check it
      // We only verify that followUp was called
      expect(followUpSpy).toHaveBeenCalled();

      const followUpCall = followUpSpy.mock.calls[0][0];
      expect(followUpCall.embeds).toBeDefined();
      expect(followUpCall.embeds.length).toBeGreaterThan(0);
    });

    it('should handle empty project list', async () => {
      const command = new ProjectListCommand();

      (mockInteraction.options!.getInteger as jest.Mock).mockReturnValue(null);
      (mockInteraction.options!.getString as jest.Mock).mockReturnValue(null);

      const { ApiClient } = require('@/bot/core/api-client');
      ApiClient.mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          data: {
            projects: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
            },
          },
          error: null,
        }),
      }));

      await command.execute(mockInteraction as CommandInteraction);

      expect(followUpSpy).toHaveBeenCalled();
      const followUpCall = followUpSpy.mock.calls[0][0];
      expect(followUpCall.content).toContain('No projects found');
    });
  });

  describe('QuoteListCommand', () => {
    it('should filter quotes by status', async () => {
      const command = new QuoteListCommand();

      (mockInteraction.options!.getInteger as jest.Mock).mockImplementation((name: string) => {
        if (name === 'page') return 1;
        return null;
      });
      (mockInteraction.options!.getString as jest.Mock).mockImplementation((name: string) => {
        if (name === 'status') return 'PENDING';
        return null;
      });

      const { ApiClient } = require('@/bot/core/api-client');
      const getMock = jest.fn().mockResolvedValue({
        data: {
          quotes: [
            {
              id: 'quote_1',
              name: 'Client Name',
              email: 'client@example.com',
              projectType: 'Web App',
              status: 'PENDING',
              createdAt: new Date().toISOString(),
            },
          ],
          total: 1,
        },
        error: null,
      });

      ApiClient.mockImplementation(() => ({
        get: getMock,
      }));

      await command.execute(mockInteraction as CommandInteraction);

      expect(getMock).toHaveBeenCalled();
      const endpoint = getMock.mock.calls[0][0];
      expect(endpoint).toContain('status=PENDING');
    });
  });

  describe('TimeReportCommand', () => {
    it('should generate report with project breakdown', async () => {
      const command = new TimeReportCommand();

      (mockInteraction.options!.getString as jest.Mock).mockImplementation((name: string) => {
        if (name === 'period') return 'week';
        if (name === 'project-title') return null;
        return null;
      });

      const { ApiClient } = require('@/bot/core/api-client');
      ApiClient.mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          data: {
            totalMinutes: 480, // 8 hours
            entryCount: 5,
            projectBreakdown: [
              {
                projectId: 'proj_1',
                projectTitle: 'Project A',
                totalMinutes: 300,
                entryCount: 3,
              },
              {
                projectId: 'proj_2',
                projectTitle: 'Project B',
                totalMinutes: 180,
                entryCount: 2,
              },
            ],
            recentEntries: [],
          },
          error: null,
        }),
      }));

      await command.execute(mockInteraction as CommandInteraction);

      expect(followUpSpy).toHaveBeenCalled();
      const followUpCall = followUpSpy.mock.calls[0][0];
      expect(followUpCall.embeds).toBeDefined();
      expect(followUpCall.embeds[0].data.title).toContain('This Week');
    });
  });

  describe('AdminHealthCommand', () => {
    it('should display system health status', async () => {
      const command = new AdminHealthCommand();

      const { ApiClient } = require('@/bot/core/api-client');
      ApiClient.mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: 3600,
            services: {
              database: {
                status: 'healthy',
                responseTime: 50,
              },
              api: {
                status: 'healthy',
                requestsPerMinute: 100,
              },
              discord: {
                status: 'healthy',
                latency: 75,
                guilds: 1,
              },
            },
            memory: {
              used: 536870912, // 512 MB
              total: 1073741824, // 1 GB
              percentage: 50,
            },
          },
          error: null,
        }),
      }));

      await command.execute(mockInteraction as CommandInteraction);

      expect(followUpSpy).toHaveBeenCalled();
      const followUpCall = followUpSpy.mock.calls[0][0];
      expect(followUpCall.embeds).toBeDefined();
      expect(followUpCall.embeds[0].data.title).toContain('System Health');
    });

    it('should handle degraded system status', async () => {
      const command = new AdminHealthCommand();

      const { ApiClient } = require('@/bot/core/api-client');
      ApiClient.mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          data: {
            status: 'degraded',
            timestamp: new Date().toISOString(),
            uptime: 3600,
            services: {
              database: {
                status: 'degraded',
                responseTime: 500,
              },
              api: {
                status: 'healthy',
                requestsPerMinute: 100,
              },
              discord: {
                status: 'healthy',
                latency: 75,
                guilds: 1,
              },
            },
            memory: {
              used: 858993459, // 819 MB
              total: 1073741824, // 1 GB
              percentage: 80,
            },
          },
          error: null,
        }),
      }));

      await command.execute(mockInteraction as CommandInteraction);

      expect(followUpSpy).toHaveBeenCalled();
      const followUpCall = followUpSpy.mock.calls[0][0];
      expect(followUpCall.embeds[0].data.description).toContain('DEGRADED');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const command = new ProjectListCommand();

      (mockInteraction.options!.get as jest.Mock).mockReturnValue(null);

      const { ApiClient } = require('@/bot/core/api-client');
      ApiClient.mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          data: null,
          error: 'Database connection failed',
        }),
      }));

      await expect(
        command.execute(mockInteraction as CommandInteraction)
      ).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      const command = new ProjectListCommand();

      (mockInteraction.options!.get as jest.Mock).mockReturnValue(null);

      const { ApiClient } = require('@/bot/core/api-client');
      ApiClient.mockImplementation(() => ({
        get: jest.fn().mockRejectedValue(new Error('Request timeout')),
      }));

      await expect(
        command.execute(mockInteraction as CommandInteraction)
      ).rejects.toThrow('Request timeout');
    });
  });
});
