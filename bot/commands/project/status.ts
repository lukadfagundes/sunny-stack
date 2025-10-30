/**
 * /project status Command
 *
 * Displays detailed project information by ID
 *
 * @module bot/commands/project/status
 */

import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createProjectEmbed, createErrorEmbed, COLORS } from '../../utils/embed-builder';
import {
  formatCurrency,
  formatRelativeTime,
  formatDuration,
  formatDiscordTimestamp,
} from '../../utils/formatters';
import { validateId } from '../../core/validators';

/**
 * Project Status Command
 */
export class ProjectStatusCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('project-status')
    .setDescription('Get detailed status of a specific project')
    .addStringOption((option) =>
      option
        .setName('project-id')
        .setDescription('The project ID (from /project-list)')
        .setRequired(true)
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Validate input
    const projectIdRaw = interaction.options.get('project-id')?.value as string;
    const projectId = validateId(projectIdRaw);

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.get<{
      project: {
        id: string;
        title: string;
        description: string | null;
        clientName: string;
        clientEmail: string;
        status: string;
        budget: number | null;
        deadline: string | null;
        createdAt: string;
        updatedAt: string;
        quotes?: Array<{
          id: string;
          projectType: string;
          status: string;
        }>;
        timeEntries?: Array<{
          id: string;
          durationMinutes: number;
        }>;
        _count?: {
          quotes: number;
          timeEntries: number;
        };
      };
    }>(`/admin/projects/${projectId}`);

    if (response.error || !response.data) {
      const errorEmbed = createErrorEmbed(
        'Project Not Found',
        response.error || `No project found with ID: ${projectId}`
      );
      await interaction.followUp({
        embeds: [errorEmbed],
      });
      return;
    }

    const { project } = response.data;

    // Create main project embed
    const projectEmbed = createProjectEmbed(project);

    // Add detailed fields
    if (project.description) {
      projectEmbed.addFields({
        name: '📝 Description',
        value: project.description.slice(0, 1024), // Discord embed field limit
        inline: false,
      });
    }

    // Calculate total hours worked
    const totalMinutes =
      project.timeEntries?.reduce((sum, entry) => sum + entry.durationMinutes, 0) || 0;
    const totalHours = formatDuration(totalMinutes);

    // Add stats footer
    const quotesCount = project._count?.quotes || project.quotes?.length || 0;
    const timeEntriesCount = project._count?.timeEntries || project.timeEntries?.length || 0;

    projectEmbed.addFields(
      {
        name: '📊 Statistics',
        value: [
          `**Quotes:** ${quotesCount}`,
          `**Time Entries:** ${timeEntriesCount}`,
          `**Total Time Tracked:** ${totalHours}`,
        ].join('\n'),
        inline: true,
      },
      {
        name: '📅 Timeline',
        value: [
          `**Created:** ${formatRelativeTime(project.createdAt)}`,
          `**Updated:** ${formatRelativeTime(project.updatedAt)}`,
          project.deadline
            ? `**Deadline:** ${formatDiscordTimestamp(project.deadline, 'D')}`
            : '**Deadline:** Not set',
        ].join('\n'),
        inline: true,
      }
    );

    // Create additional embed for related quotes (if any)
    const embeds: EmbedBuilder[] = [projectEmbed];

    if (project.quotes && project.quotes.length > 0) {
      const quotesEmbed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('📋 Related Quotes')
        .setDescription(
          project.quotes
            .slice(0, 5) // Limit to first 5
            .map((quote) => `**${quote.projectType}** - ${quote.status}`)
            .join('\n')
        );

      if (project.quotes.length > 5) {
        quotesEmbed.setFooter({
          text: `Showing 5 of ${project.quotes.length} quotes. Use /quote-list to see all.`,
        });
      }

      embeds.push(quotesEmbed);
    }

    await interaction.followUp({
      embeds,
    });
  }
}

export default new ProjectStatusCommand();
