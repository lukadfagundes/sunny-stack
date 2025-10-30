/**
 * /project delete Command
 *
 * Soft-deletes a project
 *
 * @module bot/commands/project/delete
 */

import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, createWarningEmbed } from '../../utils/embed-builder';
import { validateId } from '../../core/validators';

/**
 * Project Delete Command
 */
export class ProjectDeleteCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('project-delete')
    .setDescription('Delete a project (soft delete)')
    .addStringOption((option) =>
      option
        .setName('project-id')
        .setDescription('The project ID to delete')
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('confirm')
        .setDescription('Confirm deletion (must be true)')
        .setRequired(true)
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction, true); // Ephemeral for confirmation prompts

    // Validate input
    const projectIdRaw = interaction.options.get('project-id')?.value as string;
    const projectId = validateId(projectIdRaw);

    const confirm = interaction.options.get('confirm')?.value as boolean;

    if (!confirm) {
      const warningEmbed = createWarningEmbed(
        'Deletion Not Confirmed',
        'You must set `confirm` to `true` to delete this project.\n\n' +
          '**Warning:** This will soft-delete the project and all related data.'
      );

      await interaction.followUp({
        embeds: [warningEmbed],
        ephemeral: true,
      });
      return;
    }

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.delete<{ success: boolean }>(
      `/admin/projects/${projectId}`
    );

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to delete project');
    }

    const successEmbed = createSuccessEmbed(
      'Project Deleted',
      `Project \`${projectId}\` has been soft-deleted.\n\n` +
        '**Note:** The project is still in the database but marked as deleted. ' +
        'It will not appear in project lists or searches.'
    );

    await interaction.followUp({
      embeds: [successEmbed],
      ephemeral: true,
    });
  }
}

export default new ProjectDeleteCommand();
