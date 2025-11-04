/**
 * /monitor status Command
 *
 * Displays overall monitoring system status
 *
 * @module bot/commands/monitor/status
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
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

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.get<{
      bot: {
        online: boolean;
        uptime: number;
        version: string;
        deploymentMode: string;
        commandsLoaded: number;
        lastRestart: string;
      };
      database: {
        connected: boolean;
        responseTime: number;
        stats: {
          projects: number;
          quotes: number;
          timeEntries: number;
          users: number;
        };
      };
      discord: {
        connected: boolean;
        guilds: number;
        channels: number;
        latency: number | null;
      };
    }>('/admin/monitor/status');

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch monitoring status');
    }

    const { bot, database, discord } = response.data;

    // Determine overall status color
    const allHealthy = bot.online && database.connected && discord.connected;
    const statusColor = allHealthy ? COLORS.SUCCESS : COLORS.WARNING;

    // Format uptime
    const uptimeHours = Math.floor(bot.uptime / 3600);
    const uptimeMinutes = Math.floor((bot.uptime % 3600) / 60);
    const uptimeFormatted = `${uptimeHours}h ${uptimeMinutes}m`;

    // Create status embed
    const statusEmbed = new EmbedBuilder()
      .setColor(statusColor)
      .setTitle('🖥️ Bot Status')
      .setDescription(
        `**Version:** ${bot.version}\n` +
          `**Uptime:** ${uptimeFormatted}\n` +
          `**Deployment Mode:** ${bot.deploymentMode}\n` +
          `**Commands Loaded:** ${bot.commandsLoaded}\n` +
          `**Last Restart:** ${formatRelativeTime(bot.lastRestart)}`
      );

    // Add service status
    const botStatus = bot.online ? '🟢 Online' : '🔴 Offline';
    const dbStatus = database.connected
      ? `🟢 Connected (${database.responseTime}ms)`
      : '🔴 Disconnected';
    const discordStatus = discord.connected
      ? `🟢 Connected\n${discord.guilds} guilds, ${discord.channels} channels`
      : '🔴 Disconnected';

    statusEmbed.addFields(
      {
        name: '🤖 Bot',
        value: botStatus,
        inline: true,
      },
      {
        name: '💾 Database',
        value: dbStatus,
        inline: true,
      },
      {
        name: '💬 Discord',
        value: discordStatus,
        inline: true,
      }
    );

    // Add database stats
    const dbStats =
      `**Projects:** ${database.stats.projects}\n` +
      `**Quotes:** ${database.stats.quotes}\n` +
      `**Time Entries:** ${database.stats.timeEntries}\n` +
      `**Users:** ${database.stats.users}`;

    statusEmbed.addFields({
      name: '📊 Database Stats',
      value: dbStats,
      inline: false,
    });

    statusEmbed.setFooter({
      text: '✅ All systems operational',
    });

    await interaction.followUp({
      embeds: [statusEmbed],
    });
  }
}

export default new MonitorStatusCommand();
