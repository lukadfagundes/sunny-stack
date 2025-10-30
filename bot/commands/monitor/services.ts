/**
 * /monitor services Command
 *
 * Lists all monitored services with detailed status
 *
 * @module bot/commands/monitor/services
 */

import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { COLORS } from '../../utils/embed-builder';
import { formatRelativeTime, formatDiscordTimestamp } from '../../utils/formatters';

/**
 * Monitor Services Command
 */
export class MonitorServicesCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('monitor-services')
    .setDescription('List all monitored services with details')
    .addStringOption((option) =>
      option
        .setName('service')
        .setDescription('Filter by specific service')
        .setRequired(false)
        .addChoices(
          { name: 'Fly.io', value: 'fly' },
          { name: 'Cloudflare', value: 'cloudflare' },
          { name: 'cron-job.org', value: 'cronjob' },
          { name: 'Vercel', value: 'vercel' }
        )
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Get options
    const serviceFilter = interaction.options.get('service')?.value as string | undefined;

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const endpoint = serviceFilter
      ? `/admin/monitoring/services?service=${serviceFilter}`
      : '/admin/monitoring/services';

    const response = await apiClient.get<{
      services: Array<{
        id: string;
        name: string;
        source: string;
        status: 'operational' | 'degraded' | 'down';
        lastCheck: string;
        uptime: number;
        responseTime: number | null;
        metadata: {
          region?: string;
          version?: string;
          endpoint?: string;
        };
        recentEvents: Array<{
          type: string;
          severity: string;
          message: string;
          timestamp: string;
        }>;
      }>;
    }>(endpoint);

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch services');
    }

    const { services } = response.data;

    if (services.length === 0) {
      await interaction.followUp({
        content: '📋 No services found.',
      });
      return;
    }

    // Create embeds for each service (max 3 per message due to Discord limits)
    const embeds: EmbedBuilder[] = [];

    for (const service of services.slice(0, 3)) {
      const statusIcon =
        service.status === 'operational'
          ? '🟢'
          : service.status === 'degraded'
            ? '🟡'
            : '🔴';

      const statusColor =
        service.status === 'operational'
          ? COLORS.SUCCESS
          : service.status === 'degraded'
            ? COLORS.WARNING
            : COLORS.ERROR;

      const serviceEmbed = new EmbedBuilder()
        .setColor(statusColor)
        .setTitle(`${statusIcon} ${service.name}`)
        .setDescription(`**Source:** ${service.source}\n**Status:** ${service.status.toUpperCase()}`);

      serviceEmbed.addFields(
        {
          name: '📊 Metrics',
          value: [
            `**Uptime:** ${service.uptime.toFixed(2)}%`,
            service.responseTime
              ? `**Response Time:** ${service.responseTime}ms`
              : '**Response Time:** N/A',
            `**Last Check:** ${formatRelativeTime(service.lastCheck)}`,
          ].join('\n'),
          inline: true,
        }
      );

      // Add metadata if available
      if (service.metadata && Object.keys(service.metadata).length > 0) {
        const metadataText = Object.entries(service.metadata)
          .map(([key, value]) => `**${key}:** ${value}`)
          .join('\n');

        serviceEmbed.addFields({
          name: '⚙️ Configuration',
          value: metadataText,
          inline: true,
        });
      }

      // Add recent events
      if (service.recentEvents && service.recentEvents.length > 0) {
        const eventsText = service.recentEvents
          .slice(0, 3)
          .map((event) => {
            const severityIcon =
              event.severity === 'CRITICAL'
                ? '🔴'
                : event.severity === 'ERROR'
                  ? '🟠'
                  : event.severity === 'WARNING'
                    ? '🟡'
                    : '🔵';
            return `${severityIcon} ${event.type} - ${event.message.slice(0, 50)}\n${formatDiscordTimestamp(event.timestamp, 'R')}`;
          })
          .join('\n\n');

        serviceEmbed.addFields({
          name: '📝 Recent Events',
          value: eventsText,
          inline: false,
        });
      }

      serviceEmbed.setFooter({
        text: `Service ID: ${service.id}`,
      });

      embeds.push(serviceEmbed);
    }

    if (services.length > 3) {
      embeds[0].setDescription(
        embeds[0].data.description +
          `\n\n*Showing 3 of ${services.length} services. Use filters to see specific services.*`
      );
    }

    await interaction.followUp({
      embeds,
    });
  }
}

export default new MonitorServicesCommand();
