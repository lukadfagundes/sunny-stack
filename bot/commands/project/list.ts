/**
 * /project list Command
 *
 * Lists all projects with pagination
 *
 * @module bot/commands/project/list
 */

import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createListEmbed } from '../../utils/embed-builder';
import { formatProjectStatus, formatCurrency, formatRelativeTime } from '../../utils/formatters';

/**
 * Project List Command
 */
export class ProjectListCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('project-list')
    .setDescription('List all projects')
    .addIntegerOption((option) =>
      option
        .setName('page')
        .setDescription('Page number (default: 1)')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption((option) =>
      option
        .setName('status')
        .setDescription('Filter by status')
        .setRequired(false)
        .addChoices(
          { name: 'Planning', value: 'PLANNING' },
          { name: 'In Progress', value: 'IN_PROGRESS' },
          { name: 'Review', value: 'REVIEW' },
          { name: 'Complete', value: 'COMPLETE' },
          { name: 'Archived', value: 'ARCHIVED' }
        )
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Get options
    const page = (interaction.options.get('page')?.value as number) || 1;
    const statusFilter = interaction.options.get('status')?.value as string | undefined;

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const endpoint = statusFilter
      ? `/admin/projects?page=${page}&status=${statusFilter}`
      : `/admin/projects?page=${page}`;

    const response = await apiClient.get<{
      projects: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(endpoint);

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch projects');
    }

    const { projects, pagination } = response.data;
    const { total, totalPages } = pagination;

    if (projects.length === 0) {
      await interaction.followUp({
        content: '📋 No projects found.',
      });
      return;
    }

    // Format project list
    const projectLines = projects.map((project) => {
      const status = formatProjectStatus(project.status);
      const budget = project.budget ? formatCurrency(project.budget) : 'No budget';
      const created = formatRelativeTime(project.createdAt);

      return `**${project.title}**\n${status} • ${budget} • Created ${created}\nClient: ${project.clientName}`;
    });

    const embed = createListEmbed(
      statusFilter ? `Projects (${statusFilter})` : 'All Projects',
      projectLines,
      page,
      totalPages
    );

    embed.addFields({
      name: 'Total Projects',
      value: total.toString(),
      inline: true,
    });

    await interaction.followUp({
      embeds: [embed],
    });
  }
}

export default new ProjectListCommand();
