/**
 * /monitor alerts Command
 *
 * Lists monitoring alerts with filtering options
 *
 * @module bot/commands/monitor/alerts
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createListEmbed, COLORS } from '../../utils/embed-builder';
import { formatRelativeTime } from '../../utils/formatters';

/**
 * Monitor Alerts Command
 */
export class MonitorAlertsCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('monitor-alerts')
    .setDescription('List monitoring alerts')
    .addIntegerOption((option) =>
      option
        .setName('page')
        .setDescription('Page number (default: 1)')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption((option) =>
      option
        .setName('severity')
        .setDescription('Filter by severity')
        .setRequired(false)
        .addChoices(
          { name: 'Critical', value: 'CRITICAL' },
          { name: 'Error', value: 'ERROR' },
          { name: 'Warning', value: 'WARNING' },
          { name: 'Info', value: 'INFO' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('source')
        .setDescription('Filter by source')
        .setRequired(false)
        .addChoices(
          { name: 'Fly.io', value: 'Fly.io' },
          { name: 'Cloudflare', value: 'Cloudflare' },
          { name: 'cron-job.org', value: 'cron-job.org' },
          { name: 'Vercel', value: 'Vercel' }
        )
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Get options
    const page = interaction.options.getInteger('page') ?? 1;
    const severityFilter = interaction.options.getString('severity') ?? undefined;
    const sourceFilter = interaction.options.getString('source') ?? undefined;

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const queryParams = new URLSearchParams({ page: page.toString() });
    if (severityFilter) queryParams.append('severity', severityFilter);
    if (sourceFilter) queryParams.append('source', sourceFilter);

    const endpoint = `/admin/monitor/alerts?${queryParams.toString()}`;

    const response = await apiClient.get<{
      alerts: Array<{
        id: string;
        type: string;
        severity: string;
        source: string;
        message: string;
        timestamp: string;
        acknowledged: boolean;
        metadata?: Record<string, unknown>;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(endpoint);

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch alerts');
    }

    const { alerts, pagination } = response.data;
    const total = pagination.total;
    const totalPages = pagination.totalPages;

    if (alerts.length === 0) {
      await interaction.followUp({
        content: '✅ No alerts found. All systems nominal!',
      });
      return;
    }

    // Format alert list
    const alertLines = alerts.map((alert) => {
      const severityIcon =
        alert.severity === 'CRITICAL'
          ? '🔴'
          : alert.severity === 'ERROR'
            ? '🟠'
            : alert.severity === 'WARNING'
              ? '🟡'
              : '🔵';

      const typeIcon =
        alert.type === 'DEPLOYMENT'
          ? '🚀'
          : alert.type === 'UPTIME_CHECK'
            ? '🔍'
            : alert.type === 'ERROR'
              ? '❌'
              : '🔔';

      return `${severityIcon} ${typeIcon} **${alert.source}** - ${alert.type}\n${alert.message.slice(0, 100)}\n${formatRelativeTime(alert.timestamp)}`;
    });

    // Build title
    let title = 'Monitoring Alerts';
    const filters: string[] = [];
    if (severityFilter) filters.push(severityFilter);
    if (sourceFilter) filters.push(sourceFilter);
    if (filters.length > 0) {
      title += ` (${filters.join(', ')})`;
    }

    const embed = createListEmbed(title, alertLines, page, totalPages);

    // Add summary
    embed.addFields({
      name: 'Total Alerts',
      value: total.toString(),
      inline: true,
    });

    // Set color based on highest severity
    const hasCritical = alerts.some((a) => a.severity === 'CRITICAL');
    const hasError = alerts.some((a) => a.severity === 'ERROR');
    const hasWarning = alerts.some((a) => a.severity === 'WARNING');

    if (hasCritical) {
      embed.setColor(COLORS.ERROR);
    } else if (hasError) {
      embed.setColor(0xff6b35); // Orange
    } else if (hasWarning) {
      embed.setColor(COLORS.WARNING);
    } else {
      embed.setColor(COLORS.INFO);
    }

    await interaction.followUp({
      embeds: [embed],
    });
  }
}

export default new MonitorAlertsCommand();
