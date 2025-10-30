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

// Mock API client
jest.mock('@/bot/core/api-client');

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
      } as any,
      deferReply: deferReplySpy,
      followUp: followUpSpy,
      reply: replySpy,
      deferred: false,
      replied: false,
    };
  });

  describe('ProjectListCommand', () => {
    it('should execute successfully with valid API response', async () => {
      const command = new ProjectListCommand();

      // Mock options
      (mockInteraction.options!.get as jest.Mock).mockImplementation((name: string) => {
        if (name === 'page') return { value: 1 };
        if (name === 'status') return { value: undefined };
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
            total: 1,
          },
          error: null,
        }),
      }));

      await command.execute(mockInteraction as CommandInteraction);

      expect(deferReplySpy).toHaveBeenCalled();
      expect(followUpSpy).toHaveBeenCalled();

      const followUpCall = followUpSpy.mock.calls[0][0];
      expect(followUpCall.embeds).toBeDefined();
      expect(followUpCall.embeds.length).toBeGreaterThan(0);
    });

    it('should handle empty project list', async () => {
      const command = new ProjectListCommand();

      (mockInteraction.options!.get as jest.Mock).mockReturnValue(null);

      const { ApiClient } = require('@/bot/core/api-client');
      ApiClient.mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          data: {
            projects: [],
            total: 0,
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

      (mockInteraction.options!.get as jest.Mock).mockImplementation((name: string) => {
        if (name === 'page') return { value: 1 };
        if (name === 'status') return { value: 'PENDING' };
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

      (mockInteraction.options!.get as jest.Mock).mockImplementation((name: string) => {
        if (name === 'period') return { value: 'week' };
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
            components: {
              database: {
                status: 'healthy',
                responseTime: 50,
                connections: 10,
              },
              api: {
                status: 'healthy',
                responseTime: 100,
                version: '1.0.0',
              },
              discord: {
                status: 'healthy',
                latency: 75,
                guilds: 1,
              },
              monitoring: {
                status: 'healthy',
                activeAlerts: 0,
                criticalAlerts: 0,
              },
            },
            metrics: {
              totalProjects: 10,
              activeProjects: 5,
              pendingQuotes: 3,
              recentTimeEntries: 20,
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
            components: {
              database: {
                status: 'degraded',
                responseTime: 500,
                connections: 10,
              },
              api: {
                status: 'healthy',
                responseTime: 100,
                version: '1.0.0',
              },
              discord: {
                status: 'healthy',
                latency: 75,
                guilds: 1,
              },
              monitoring: {
                status: 'healthy',
                activeAlerts: 2,
                criticalAlerts: 0,
              },
            },
            metrics: {
              totalProjects: 10,
              activeProjects: 5,
              pendingQuotes: 3,
              recentTimeEntries: 20,
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
