/**
 * /time log Command
 *
 * Manually log a completed time entry (retroactive)
 *
 * @module bot/commands/time/log
 */

import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed } from '../../utils/embed-builder';
import { validateId, validateDescription, validateDuration } from '../../core/validators';
import { formatDuration, formatDiscordTimestamp } from '../../utils/formatters';

/**
 * Time Log Command
 */
export class TimeLogCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('time-log')
    .setDescription('Manually log time worked on a project (retroactive)')
    .addStringOption((option) =>
      option
        .setName('project-id')
        .setDescription('The project ID')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('duration')
        .setDescription('Duration in minutes (1-1440)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1440)
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('What did you work on?')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('started-at')
        .setDescription('When did you start? (ISO format, e.g., 2025-01-15T09:00:00Z)')
        .setRequired(false)
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Validate input
    const projectIdRaw = interaction.options.get('project-id')?.value as string;
    const projectId = validateId(projectIdRaw);

    const durationRaw = interaction.options.get('duration')?.value as number;
    const durationMinutes = validateDuration(durationRaw);

    const descriptionRaw = interaction.options.get('description')?.value as string | undefined;
    const description = descriptionRaw ? validateDescription(descriptionRaw, false) : null;

    const startedAtRaw = interaction.options.get('started-at')?.value as string | undefined;
    let startedAt: Date;
    if (startedAtRaw) {
      startedAt = new Date(startedAtRaw);
      if (isNaN(startedAt.getTime())) {
        throw new Error('Invalid started-at date format. Use ISO format (e.g., 2025-01-15T09:00:00Z)');
      }
    } else {
      // Default to current time minus duration
      startedAt = new Date(Date.now() - durationMinutes * 60 * 1000);
    }

    const endedAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.post<{
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
    }>('/admin/time-entries/manual', {
      projectId,
      description,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationMinutes,
      loggedVia: 'discord',
    });

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to log time entry');
    }

    const { timeEntry, project } = response.data;

    // Create success message
    const successEmbed = createSuccessEmbed(
      '✅ Time Entry Logged',
      `Logged ${formatDuration(timeEntry.durationMinutes)} for **${project.title}**`
    );

    successEmbed.addFields(
      {
        name: 'Duration',
        value: formatDuration(timeEntry.durationMinutes),
        inline: true,
      },
      {
        name: 'Time Period',
        value: `${formatDiscordTimestamp(timeEntry.startedAt, 't')} - ${formatDiscordTimestamp(timeEntry.endedAt, 't')}`,
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

    successEmbed.setFooter({
      text: `Entry ID: ${timeEntry.id}`,
    });

    await interaction.followUp({
      embeds: [successEmbed],
    });
  }
}

export default new TimeLogCommand();
