/**
 * /admin health Command
 *
 * Displays comprehensive health check of all systems
 *
 * @module bot/commands/admin/health
 */

import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
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

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    const startTime = Date.now();

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.get<{
      status: 'healthy' | 'degraded' | 'unhealthy';
      timestamp: string;
      uptime: number; // seconds
      components: {
        database: {
          status: 'healthy' | 'degraded' | 'unhealthy';
          responseTime: number; // ms
          connections: number;
        };
        api: {
          status: 'healthy' | 'degraded' | 'unhealthy';
          responseTime: number;
          version: string;
        };
        discord: {
          status: 'healthy' | 'degraded' | 'unhealthy';
          latency: number;
          guilds: number;
        };
        monitoring: {
          status: 'healthy' | 'degraded' | 'unhealthy';
          activeAlerts: number;
          criticalAlerts: number;
        };
      };
      metrics: {
        totalProjects: number;
        activeProjects: number;
        pendingQuotes: number;
        recentTimeEntries: number;
      };
    }>('/admin/health');

    const apiResponseTime = Date.now() - startTime;

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch health status');
    }

    const { status, timestamp, uptime, components, metrics } = response.data;

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

    // Add component status
    const componentStatus: string[] = [];

    for (const [name, component] of Object.entries(components)) {
      const icon =
        component.status === 'healthy'
          ? '🟢'
          : component.status === 'degraded'
            ? '🟡'
            : '🔴';

      let details = '';
      if ('responseTime' in component) {
        details = ` (${component.responseTime}ms)`;
      }
      if ('latency' in component) {
        details = ` (${component.latency}ms latency)`;
      }

      componentStatus.push(`${icon} **${name.charAt(0).toUpperCase() + name.slice(1)}**${details}`);
    }

    healthEmbed.addFields({
      name: '🔧 Components',
      value: componentStatus.join('\n'),
      inline: false,
    });

    // Add database metrics
    if (components.database) {
      healthEmbed.addFields({
        name: '💾 Database',
        value: [
          `**Connections:** ${components.database.connections}`,
          `**Response Time:** ${components.database.responseTime}ms`,
        ].join('\n'),
        inline: true,
      });
    }

    // Add Discord metrics
    if (components.discord) {
      healthEmbed.addFields({
        name: '💬 Discord',
        value: [
          `**Latency:** ${components.discord.latency}ms`,
          `**Guilds:** ${components.discord.guilds}`,
        ].join('\n'),
        inline: true,
      });
    }

    // Add monitoring alerts
    if (components.monitoring) {
      const alertText =
        components.monitoring.criticalAlerts > 0
          ? `🔴 ${components.monitoring.criticalAlerts} critical`
          : `✅ No critical alerts`;

      healthEmbed.addFields({
        name: '🚨 Monitoring',
        value: [
          `**Active Alerts:** ${components.monitoring.activeAlerts}`,
          `**Status:** ${alertText}`,
        ].join('\n'),
        inline: true,
      });
    }

    // Add platform metrics
    healthEmbed.addFields({
      name: '📊 Platform Metrics',
      value: [
        `**Total Projects:** ${metrics.totalProjects}`,
        `**Active Projects:** ${metrics.activeProjects}`,
        `**Pending Quotes:** ${metrics.pendingQuotes}`,
        `**Recent Time Entries:** ${metrics.recentTimeEntries}`,
      ].join('\n'),
      inline: false,
    });

    // Add API info
    if (components.api) {
      healthEmbed.setFooter({
        text: `API v${components.api.version} • Response time: ${apiResponseTime}ms`,
      });
    }

    // Add timestamp
    healthEmbed.setTimestamp(new Date(timestamp));

    await interaction.followUp({
      embeds: [healthEmbed],
    });
  }
}

export default new AdminHealthCommand();
