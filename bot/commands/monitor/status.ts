/**
 * /monitor status Command
 *
 * Displays overall monitoring system status
 *
 * @module bot/commands/monitor/status
 */

import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { COLORS } from '../../utils/embed-builder';
import { formatRelativeTime } from '../../utils/formatters';

/**
 * Monitor Status Command
 */
export class MonitorStatusCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('monitor-status')
    .setDescription('View overall monitoring system status') as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.get<{
      services: Array<{
        name: string;
        status: 'operational' | 'degraded' | 'down';
        lastCheck: string;
        uptime: number; // percentage
      }>;
      recentAlerts: Array<{
        id: string;
        type: string;
        severity: string;
        source: string;
        message: string;
        timestamp: string;
      }>;
      stats: {
        totalEvents: number;
        criticalAlerts: number;
        errorCount: number;
        warningCount: number;
        uptimePercentage: number;
      };
    }>('/admin/monitoring/status');

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch monitoring status');
    }

    const { services, recentAlerts, stats } = response.data;

    // Determine overall status color
    const hasDown = services.some((s) => s.status === 'down');
    const hasDegraded = services.some((s) => s.status === 'degraded');
    const statusColor = hasDown ? COLORS.ERROR : hasDegraded ? COLORS.WARNING : COLORS.SUCCESS;

    // Create status embed
    const statusEmbed = new EmbedBuilder()
      .setColor(statusColor)
      .setTitle('🖥️ Monitoring System Status')
      .setDescription(
        `**Overall Uptime:** ${stats.uptimePercentage.toFixed(2)}%\n` +
          `**Total Events:** ${stats.totalEvents}`
      );

    // Add service status
    if (services.length > 0) {
      const servicesText = services
        .map((service) => {
          const statusIcon =
            service.status === 'operational'
              ? '🟢'
              : service.status === 'degraded'
                ? '🟡'
                : '🔴';
          const uptimeText = service.uptime ? ` (${service.uptime.toFixed(1)}% uptime)` : '';
          return `${statusIcon} **${service.name}** - ${service.status.toUpperCase()}${uptimeText}\nLast check: ${formatRelativeTime(service.lastCheck)}`;
        })
        .join('\n\n');

      statusEmbed.addFields({
        name: '📊 Services',
        value: servicesText,
        inline: false,
      });
    }

    // Add alert summary
    statusEmbed.addFields(
      {
        name: '🚨 Alerts',
        value: [
          `**Critical:** ${stats.criticalAlerts}`,
          `**Errors:** ${stats.errorCount}`,
          `**Warnings:** ${stats.warningCount}`,
        ].join('\n'),
        inline: true,
      }
    );

    // Add recent alerts (if any)
    if (recentAlerts.length > 0) {
      const alertsEmbed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle('⚠️ Recent Alerts')
        .setDescription(
          recentAlerts
            .slice(0, 5)
            .map((alert) => {
              const severityIcon =
                alert.severity === 'CRITICAL'
                  ? '🔴'
                  : alert.severity === 'ERROR'
                    ? '🟠'
                    : alert.severity === 'WARNING'
                      ? '🟡'
                      : '🔵';
              return `${severityIcon} **${alert.source}** - ${alert.type}\n${alert.message.slice(0, 100)}\n${formatRelativeTime(alert.timestamp)}`;
            })
            .join('\n\n')
        );

      if (recentAlerts.length > 5) {
        alertsEmbed.setFooter({
          text: `Showing 5 of ${recentAlerts.length} recent alerts. Use /monitor-alerts for all.`,
        });
      }

      await interaction.followUp({
        embeds: [statusEmbed, alertsEmbed],
      });
    } else {
      statusEmbed.setFooter({
        text: '✅ No recent alerts - all systems nominal',
      });

      await interaction.followUp({
        embeds: [statusEmbed],
      });
    }
  }
}

export default new MonitorStatusCommand();
