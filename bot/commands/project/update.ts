/**
 * /project update Command
 *
 * Updates an existing project's details
 *
 * @module bot/commands/project/update
 */

import { SlashCommandBuilder, CommandInteraction, AutocompleteInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, createProjectEmbed } from '../../utils/embed-builder';
import {
  validateId,
  validateTitle,
  validateEmail,
  validateDescription,
  validateBudget,
  validateDate,
} from '../../core/validators';

/**
 * Project Update Command
 */
export class ProjectUpdateCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('project-update')
    .setDescription('Update an existing project')
    .addStringOption((option) =>
      option
        .setName('project-title')
        .setDescription('The project title to update')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option.setName('title').setDescription('New project title').setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('client-name').setDescription('New client name').setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('client-email').setDescription('New client email').setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('description').setDescription('New project description').setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('status')
        .setDescription('New project status')
        .setRequired(false)
        .addChoices(
          { name: 'Planning', value: 'PLANNING' },
          { name: 'In Progress', value: 'IN_PROGRESS' },
          { name: 'Review', value: 'REVIEW' },
          { name: 'Complete', value: 'COMPLETE' },
          { name: 'Archived', value: 'ARCHIVED' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('budget')
        .setDescription('New budget amount (e.g., 25000.00)')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('deadline')
        .setDescription('New deadline (DD-MM-YYYY format)')
        .setRequired(false)
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
          value: p.id
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
    await this.deferReply(interaction);

    // Get project input (ID from autocomplete or title from manual entry)
    const projectInput = interaction.options.get('project-title', true).value as string;

    // Call API to search by title
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    // Check if input is a UUID or CUID (from autocomplete)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectInput);
    const isCUID = /^c[a-z0-9]{24}$/i.test(projectInput);
    const isID = isUUID || isCUID;

    let projectId: string;

    if (isID) {
      // Direct use of ID from autocomplete
      projectId = projectInput;
    } else {
      // Fallback: Search by title for manual entry
      const searchResponse = await apiClient.get<{
        projects: Array<{ id: string; title: string; clientName: string; status: string }>;
      }>(`/admin/projects?title=${encodeURIComponent(projectInput)}`);

      if (searchResponse.error || !searchResponse.data || searchResponse.data.projects.length === 0) {
        await interaction.followUp({
          content: `❌ No project found matching "${projectInput}"`,
        });
        return;
      }

      if (searchResponse.data.projects.length > 1) {
        await interaction.followUp({
          content:
            `⚠️ Found ${searchResponse.data.projects.length} projects matching "${projectInput}":\n\n` +
            searchResponse.data.projects
              .map((p, i) => `${i + 1}. **${p.title}** (Client: ${p.clientName})`)
              .join('\n') +
            `\n\nPlease use the autocomplete dropdown to select a specific project.`,
        });
        return;
      }

      projectId = searchResponse.data.projects[0].id;
    }

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {};

    const titleRaw = interaction.options.get('title')?.value as string | undefined;
    if (titleRaw) {
      updateData.title = validateTitle(titleRaw);
    }

    const clientNameRaw = interaction.options.get('client-name')?.value as string | undefined;
    if (clientNameRaw) {
      updateData.clientName = validateTitle(clientNameRaw); // Reuse title validator for name
    }

    const clientEmailRaw = interaction.options.get('client-email')?.value as string | undefined;
    if (clientEmailRaw) {
      updateData.clientEmail = validateEmail(clientEmailRaw);
    }

    const descriptionRaw = interaction.options.get('description')?.value as string | undefined;
    if (descriptionRaw !== undefined) {
      updateData.description = validateDescription(descriptionRaw, false);
    }

    const status = interaction.options.get('status')?.value as string | undefined;
    if (status) {
      updateData.status = status;
    }

    const budgetRaw = interaction.options.get('budget')?.value as string | undefined;
    if (budgetRaw) {
      updateData.budget = validateBudget(budgetRaw);
    }

    const deadlineRaw = interaction.options.get('deadline')?.value as string | undefined;
    if (deadlineRaw) {
      updateData.deadline = validateDate(deadlineRaw);
    }

    // Check if any fields were provided
    if (Object.keys(updateData).length === 0) {
      await interaction.followUp({
        content: '⚠️ Please provide at least one field to update.',
        ephemeral: true,
      });
      return;
    }

    // Call API to update project
    const response = await apiClient.put<{ project: any }>(
      `/admin/projects/${projectId}`,
      updateData
    );

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to update project');
    }

    const { project } = response.data;

    // Create success message
    const updatedFields = Object.keys(updateData).join(', ');
    const successEmbed = createSuccessEmbed(
      'Project Updated',
      `Successfully updated: ${updatedFields}`
    );

    const projectEmbed = createProjectEmbed(project);

    await interaction.followUp({
      embeds: [successEmbed, projectEmbed],
    });
  }
}

export default new ProjectUpdateCommand();
