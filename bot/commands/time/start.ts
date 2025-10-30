/**
 * /time start Command
 *
 * Starts a new time tracking entry for a project
 *
 * @module bot/commands/time/start
 */

import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, COLORS } from '../../utils/embed-builder';
import { validateId, validateDescription } from '../../core/validators';
import { formatDiscordTimestamp } from '../../utils/formatters';

/**
 * Time Start Command
 */
export class TimeStartCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('time-start')
    .setDescription('Start tracking time for a project')
    .addStringOption((option) =>
      option
        .setName('project-id')
        .setDescription('The project ID to track time for')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('What are you working on?')
        .setRequired(false)
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Validate input
    const projectIdRaw = interaction.options.get('project-id')?.value as string;
    const projectId = validateId(projectIdRaw);

    const descriptionRaw = interaction.options.get('description')?.value as string | undefined;
    const description = descriptionRaw ? validateDescription(descriptionRaw, false) : null;

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.post<{
      timeEntry: {
        id: string;
        projectId: string;
        description: string | null;
        startedAt: string;
        loggedVia: string;
      };
      project: {
        id: string;
        title: string;
      };
    }>('/admin/time-entries', {
      projectId,
      description,
      loggedVia: 'discord',
    });

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to start time tracking');
    }

    const { timeEntry, project } = response.data;

    // Create success message
    const successEmbed = createSuccessEmbed(
      '⏱️ Time Tracking Started',
      `Started tracking time for **${project.title}**`
    );

    successEmbed.addFields(
      {
        name: 'Time Entry ID',
        value: `\`${timeEntry.id}\``,
        inline: true,
      },
      {
        name: 'Started At',
        value: formatDiscordTimestamp(timeEntry.startedAt, 'F'),
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
      text: `Use /time-stop ${timeEntry.id} to stop tracking`,
    });

    await interaction.followUp({
      embeds: [successEmbed],
    });
  }
}

export default new TimeStartCommand();
