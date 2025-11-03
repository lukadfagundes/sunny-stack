/**
 * /project delete Command
 *
 * Soft-deletes a project
 *
 * @module bot/commands/project/delete
 */

import { SlashCommandBuilder, CommandInteraction, AutocompleteInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, createWarningEmbed, createErrorEmbed, createInfoEmbed } from '../../utils/embed-builder';

/**
 * Project Delete Command
 */
export class ProjectDeleteCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('project-delete')
    .setDescription('Delete a project (soft delete)')
    .addStringOption((option) =>
      option
        .setName('project-title')
        .setDescription('The project title to delete')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('confirm')
        .setDescription('Confirm deletion (must be true)')
        .setRequired(true)
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const focusedValue = interaction.options.getFocused();

    try {
      const config = loadBotConfig();
      const apiClient = new ApiClient(config.apiUrl, config.apiKey);

      const searchResponse = await apiClient.get<{
        projects: Array<{ id: string; title: string; clientName: string; status: string }>;
      }>(`/admin/projects?title=${encodeURIComponent(focusedValue)}&limit=25`);

      if (searchResponse.data && searchResponse.data.projects) {
        const choices = searchResponse.data.projects.map(p => ({
          name: `${p.title} (${p.clientName})`,
          value: p.id // Return ID instead of title for exact lookup
        }));

        await interaction.respond(choices.slice(0, 25));
      } else {
        await interaction.respond([]);
      }
    } catch (error) {
      await interaction.respond([]);
    }
  }

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction, true); // Ephemeral for confirmation prompts

    // Get project ID from autocomplete (or fallback to title if manually entered)
    const projectInput = interaction.options.get('project-title', true).value as string;
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

    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    // Check if input is an ID (UUID or CUID from autocomplete) or a title (manual entry)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectInput);
    const isCUID = /^c[a-z0-9]{24}$/i.test(projectInput);
    const isID = isUUID || isCUID;

    let projectId: string;
    let projectName: string;

    if (isID) {
      // Direct lookup by ID
      const projectResponse = await apiClient.get<{
        project: { id: string; title: string; clientName: string };
      }>(`/admin/projects/${projectInput}`);

      if (projectResponse.error || !projectResponse.data) {
        const errorEmbed = createErrorEmbed(
          'Project Not Found',
          `❌ No project found with the specified ID`
        );
        await interaction.followUp({
          embeds: [errorEmbed],
          ephemeral: true,
        });
        return;
      }

      projectId = projectResponse.data.project.id;
      projectName = projectResponse.data.project.title;
    } else {
      // Fallback: Search by title for manual entry
      const searchResponse = await apiClient.get<{
        projects: Array<{ id: string; title: string; clientName: string; status: string }>;
      }>(`/admin/projects?title=${encodeURIComponent(projectInput)}`);

      if (searchResponse.error || !searchResponse.data || searchResponse.data.projects.length === 0) {
        const errorEmbed = createErrorEmbed(
          'No Projects Found',
          `❌ No project found matching "${projectInput}"`
        );
        await interaction.followUp({
          embeds: [errorEmbed],
          ephemeral: true,
        });
        return;
      }

      if (searchResponse.data.projects.length > 1) {
        const errorEmbed = createErrorEmbed(
          'Multiple Projects Found',
          `⚠️ Found ${searchResponse.data.projects.length} projects matching "${projectInput}":\n\n` +
            searchResponse.data.projects
              .map((p, i) => `${i + 1}. **${p.title}** (Client: ${p.clientName})`)
              .join('\n') +
            `\n\nPlease use the autocomplete dropdown to select a specific project.`
        );
        await interaction.followUp({
          embeds: [errorEmbed],
          ephemeral: true,
        });
        return;
      }

      projectId = searchResponse.data.projects[0].id;
      projectName = searchResponse.data.projects[0].title;
    }

    const response = await apiClient.delete<{ success: boolean }>(
      `/admin/projects/${projectId}`
    );

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to delete project');
    }

    const successEmbed = createSuccessEmbed(
      'Project Deleted',
      `Project **${projectName}** has been soft-deleted.\n\n` +
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
