/**
 * /admin health Command
 *
 * Displays comprehensive health check of all systems
 *
 * @module bot/commands/admin/health
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { COLORS } from '../../utils/embed-builder';
import { formatRelativeTime, formatDuration } from '../../utils/formatters';

/**
 * Admin Health Command
 */
export class AdminHealthCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('admin-health')
    .setDescription('Check overall system health status') as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    const startTime = Date.now();

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.get<{
      status: 'healthy' | 'degraded' | 'unhealthy';
      timestamp: string;
      uptime: number; // seconds
      services: {
        database: {
          status: 'healthy' | 'degraded' | 'unhealthy';
          responseTime: number; // ms
        };
        discord: {
          status: 'healthy' | 'degraded' | 'unhealthy';
          latency?: number | null;
          guilds?: number;
        };
        api: {
          status: 'healthy' | 'degraded' | 'unhealthy';
          requestsPerMinute: number;
        };
      };
      memory: {
        used: number;
        total: number;
        percentage: number;
      };
    }>('/admin/health');

    const apiResponseTime = Date.now() - startTime;

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch health status');
    }

    const { status, timestamp, uptime, services, memory } = response.data;

    // Determine overall status color
    const statusColor =
      status === 'healthy'
        ? COLORS.SUCCESS
        : status === 'degraded'
          ? COLORS.WARNING
          : COLORS.ERROR;

    const statusIcon =
      status === 'healthy' ? '✅' : status === 'degraded' ? '⚠️' : '❌';

    // Create health embed
    const healthEmbed = new EmbedBuilder()
      .setColor(statusColor)
      .setTitle(`${statusIcon} System Health Status`)
      .setDescription(
        `**Overall Status:** ${status.toUpperCase()}\n` +
          `**Uptime:** ${formatDuration(Math.floor(uptime / 60))}\n` +
          `**Last Check:** ${formatRelativeTime(timestamp)}`
      );

    // Add service status
    const serviceStatus: string[] = [];

    for (const [name, service] of Object.entries(services)) {
      const icon =
        service.status === 'healthy'
          ? '🟢'
          : service.status === 'degraded'
            ? '🟡'
            : '🔴';

      let details = '';
      if ('responseTime' in service) {
        details = ` (${service.responseTime}ms)`;
      }
      if ('latency' in service && service.latency) {
        details = ` (${service.latency}ms latency)`;
      }

      serviceStatus.push(`${icon} **${name.charAt(0).toUpperCase() + name.slice(1)}**${details}`);
    }

    healthEmbed.addFields({
      name: '🔧 Services',
      value: serviceStatus.join('\n'),
      inline: false,
    });

    // Add database metrics
    if (services.database) {
      healthEmbed.addFields({
        name: '💾 Database',
        value: [`**Response Time:** ${services.database.responseTime}ms`].join('\n'),
        inline: true,
      });
    }

    // Add Discord metrics
    if (services.discord && services.discord.guilds) {
      healthEmbed.addFields({
        name: '💬 Discord',
        value: [
          `**Latency:** ${services.discord.latency || 'N/A'}`,
          `**Guilds:** ${services.discord.guilds}`,
        ].join('\n'),
        inline: true,
      });
    }

    // Add memory metrics
    healthEmbed.addFields({
      name: '💾 Memory',
      value: [
        `**Used:** ${(memory.used / 1024 / 1024).toFixed(2)} MB`,
        `**Total:** ${(memory.total / 1024 / 1024).toFixed(2)} MB`,
        `**Usage:** ${memory.percentage.toFixed(1)}%`,
      ].join('\n'),
      inline: true,
    });

    // Add API info
    healthEmbed.setFooter({
      text: `Response time: ${apiResponseTime}ms`,
    });

    // Add timestamp
    healthEmbed.setTimestamp(new Date(timestamp));

    await interaction.followUp({
      embeds: [healthEmbed],
    });
  }
}

export default new AdminHealthCommand();
