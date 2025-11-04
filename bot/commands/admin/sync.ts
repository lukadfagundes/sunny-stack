/**
 * /admin sync Command
 *
 * Manually trigger sync between Discord and admin platform
 *
 * @module bot/commands/admin/sync
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, createInfoEmbed, COLORS } from '../../utils/embed-builder';

/**
 * Admin Sync Command
 */
export class AdminSyncCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('admin-sync')
    .setDescription('Manually sync Discord bot with admin platform')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Type of sync to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Projects', value: 'projects' },
          { name: 'Quotes', value: 'quotes' },
          { name: 'Time Entries', value: 'time' },
          { name: 'Monitoring', value: 'monitoring' },
          { name: 'All', value: 'all' }
        )
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Get sync type
    const syncType = interaction.options.getString('type', true);

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.post<{
      syncType: string;
      results: {
        projects?: {
          synced: number;
          updated: number;
          errors: number;
        };
        quotes?: {
          synced: number;
          updated: number;
          errors: number;
        };
        timeEntries?: {
          synced: number;
          updated: number;
          errors: number;
        };
        monitoring?: {
          synced: number;
          updated: number;
          errors: number;
        };
      };
      timestamp: string;
      duration: number; // milliseconds
    }>('/admin/sync', { type: syncType });

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to perform sync');
    }

    const { results, timestamp, duration } = response.data;

    // Create success message
    const successEmbed = createSuccessEmbed(
      '🔄 Sync Completed',
      `Successfully synchronized ${syncType === 'all' ? 'all data' : syncType} with admin platform.`
    );

    // Add sync results
    const resultsText: string[] = [];

    if (results.projects) {
      resultsText.push(
        `**Projects:**\n` +
          `✅ Synced: ${results.projects.synced}\n` +
          `🔄 Updated: ${results.projects.updated}\n` +
          `❌ Errors: ${results.projects.errors}`
      );
    }

    if (results.quotes) {
      resultsText.push(
        `**Quotes:**\n` +
          `✅ Synced: ${results.quotes.synced}\n` +
          `🔄 Updated: ${results.quotes.updated}\n` +
          `❌ Errors: ${results.quotes.errors}`
      );
    }

    if (results.timeEntries) {
      resultsText.push(
        `**Time Entries:**\n` +
          `✅ Synced: ${results.timeEntries.synced}\n` +
          `🔄 Updated: ${results.timeEntries.updated}\n` +
          `❌ Errors: ${results.timeEntries.errors}`
      );
    }

    if (results.monitoring) {
      resultsText.push(
        `**Monitoring:**\n` +
          `✅ Synced: ${results.monitoring.synced}\n` +
          `🔄 Updated: ${results.monitoring.updated}\n` +
          `❌ Errors: ${results.monitoring.errors}`
      );
    }

    if (resultsText.length > 0) {
      successEmbed.addFields({
        name: '📊 Sync Results',
        value: resultsText.join('\n\n'),
        inline: false,
      });
    }

    successEmbed.setFooter({
      text: `Completed in ${duration}ms at ${new Date(timestamp).toLocaleString()}`,
    });

    // Check for errors
    const totalErrors =
      (results.projects?.errors || 0) +
      (results.quotes?.errors || 0) +
      (results.timeEntries?.errors || 0) +
      (results.monitoring?.errors || 0);

    if (totalErrors > 0) {
      successEmbed.setColor(COLORS.WARNING);
      successEmbed.setDescription(
        successEmbed.data.description +
          `\n\n⚠️ **Warning:** ${totalErrors} error(s) occurred during sync. Check logs for details.`
      );
    }

    await interaction.followUp({
      embeds: [successEmbed],
    });
  }
}

export default new AdminSyncCommand();
