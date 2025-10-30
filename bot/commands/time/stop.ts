/**
 * /time stop Command
 *
 * Stops an active time tracking entry
 *
 * @module bot/commands/time/stop
 */

import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, COLORS } from '../../utils/embed-builder';
import { validateId } from '../../core/validators';
import { formatDuration, formatDiscordTimestamp } from '../../utils/formatters';

/**
 * Time Stop Command
 */
export class TimeStopCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('time-stop')
    .setDescription('Stop tracking time for an active entry')
    .addStringOption((option) =>
      option
        .setName('entry-id')
        .setDescription('The time entry ID to stop (from /time-start)')
        .setRequired(true)
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Validate input
    const entryIdRaw = interaction.options.get('entry-id')?.value as string;
    const entryId = validateId(entryIdRaw);

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.put<{
      timeEntry: {
        id: string;
        projectId: string;
        description: string | null;
        startedAt: string;
        endedAt: string;
        durationMinutes: number;
      };
      project: {
        id: string;
        title: string;
      };
    }>(`/admin/time-entries/${entryId}/stop`, {});

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to stop time tracking');
    }

    const { timeEntry, project } = response.data;

    // Create success message
    const successEmbed = createSuccessEmbed(
      '⏹️ Time Tracking Stopped',
      `Stopped tracking time for **${project.title}**`
    );

    successEmbed.addFields(
      {
        name: 'Duration',
        value: formatDuration(timeEntry.durationMinutes),
        inline: true,
      },
      {
        name: 'Started At',
        value: formatDiscordTimestamp(timeEntry.startedAt, 't'),
        inline: true,
      },
      {
        name: 'Ended At',
        value: formatDiscordTimestamp(timeEntry.endedAt, 't'),
        inline: true,
      }
    );

    if (timeEntry.description) {
      successEmbed.addFields({
        name: 'Description',
        value: timeEntry.description,
        inline: false,
      });
    }

    await interaction.followUp({
      embeds: [successEmbed],
    });
  }
}

export default new TimeStopCommand();
