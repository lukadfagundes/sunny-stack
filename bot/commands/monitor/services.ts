/**
 * /monitor services Command
 *
 * Lists all monitored services with detailed status
 *
 * @module bot/commands/monitor/services
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
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

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Get options
    const serviceFilter = interaction.options.getString('service') ?? undefined;

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const endpoint = '/admin/monitor/services';

    const response = await apiClient.get<{
      services: Array<{
        name: string;
        status: 'operational' | 'degraded' | 'down';
        responseTime: number | null;
        lastChecked: string;
        endpoint: string;
      }>;
      summary: {
        total: number;
        operational: number;
        degraded: number;
        down: number;
      };
    }>(endpoint);

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch services');
    }

    const { services, summary } = response.data;

    if (services.length === 0) {
      await interaction.followUp({
        content: '📋 No external services configured.',
      });
      return;
    }

    // Filter by service if specified
    let filteredServices = services;
    if (serviceFilter) {
      filteredServices = services.filter((s) =>
        s.name.toLowerCase().includes(serviceFilter.toLowerCase())
      );
      if (filteredServices.length === 0) {
        await interaction.followUp({
          content: `📋 No services found matching "${serviceFilter}".`,
        });
        return;
      }
    }

    // Determine overall status color
    const statusColor =
      summary.down > 0 ? COLORS.ERROR : summary.degraded > 0 ? COLORS.WARNING : COLORS.SUCCESS;

    // Create main embed
    const mainEmbed = new EmbedBuilder()
      .setColor(statusColor)
      .setTitle('🌐 External Services Status')
      .setDescription(
        `**Total:** ${summary.total} | ` +
          `🟢 ${summary.operational} | ` +
          `🟡 ${summary.degraded} | ` +
          `🔴 ${summary.down}`
      );

    // Add service details
    const servicesList = filteredServices
      .map((service) => {
        const statusIcon =
          service.status === 'operational'
            ? '🟢'
            : service.status === 'degraded'
              ? '🟡'
              : '🔴';

        const responseText = service.responseTime
          ? ` (${service.responseTime}ms)`
          : ' (timeout)';

        return (
          `${statusIcon} **${service.name}**${service.status === 'operational' ? responseText : ''}\n` +
          `${service.status.toUpperCase()} - Last checked ${formatRelativeTime(service.lastChecked)}`
        );
      })
      .join('\n\n');

    mainEmbed.addFields({
      name: '📊 Services',
      value: servicesList,
      inline: false,
    });

    mainEmbed.setFooter({
      text: '💡 Status cached for 60 seconds',
    });

    await interaction.followUp({
      embeds: [mainEmbed],
    });
  }
}

export default new MonitorServicesCommand();
