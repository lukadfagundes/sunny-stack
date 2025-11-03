/**
 * /project status Command
 *
 * Displays detailed project information by title
 *
 * @module bot/commands/project/status
 */

import { SlashCommandBuilder, CommandInteraction, AutocompleteInteraction, EmbedBuilder } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createProjectEmbed, createErrorEmbed, createInfoEmbed, COLORS } from '../../utils/embed-builder';
import {
  formatCurrency,
  formatRelativeTime,
  formatDuration,
  formatDiscordTimestamp,
} from '../../utils/formatters';

/**
 * Project Status Command
 */
export class ProjectStatusCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('project-status')
    .setDescription('Get detailed status of a specific project')
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Project title or partial name')
        .setRequired(true)
        .setAutocomplete(true)
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const focusedValue = interaction.options.getFocused();

    try {
      const config = loadBotConfig();
      const apiClient = new ApiClient(config.apiUrl, config.apiKey);

      // Search for projects matching the input
      const searchResponse = await apiClient.get<{
        projects: Array<{ id: string; title: string; clientName: string; status: string }>;
      }>(`/admin/projects?title=${encodeURIComponent(focusedValue)}&limit=25`);

      if (searchResponse.data && searchResponse.data.projects) {
        const choices = searchResponse.data.projects.map(p => ({
          name: `${p.title} (${p.clientName})`,
          value: p.id
        }));

        await interaction.respond(choices.slice(0, 25)); // Discord limit is 25
      } else {
        await interaction.respond([]);
      }
    } catch (error) {
      // If autocomplete fails, just return empty array
      await interaction.respond([]);
    }
  }

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Get project input (ID from autocomplete or title from manual entry)
    const projectInput = interaction.options.get('title', true).value as string;

    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    // Check if input is an ID (UUID or CUID from autocomplete)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectInput);
    const isCUID = /^c[a-z0-9]{24}$/i.test(projectInput);
    const isID = isUUID || isCUID;

    let projectId: string;

    if (isID) {
      // Direct lookup by ID from autocomplete
      projectId = projectInput;
    } else {
      // Fallback: Search by title for manual entry
      const searchResponse = await apiClient.get<{
        projects: Array<{
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
          _count?: {
            quotes: number;
            timeEntries: number;
          };
        }>;
        pagination: {
          total: number;
        };
      }>(`/admin/projects?title=${encodeURIComponent(projectInput)}`);

      if (searchResponse.error || !searchResponse.data) {
        const errorEmbed = createErrorEmbed(
          'Search Failed',
          searchResponse.error || 'Failed to search for projects'
        );
        await interaction.followUp({
          embeds: [errorEmbed],
        });
        return;
      }

      const { projects } = searchResponse.data;

      // Handle no matches
      if (projects.length === 0) {
        const errorEmbed = createErrorEmbed(
          'No Projects Found',
          `No projects found matching "${projectInput}"`
        );
        await interaction.followUp({
          embeds: [errorEmbed],
        });
        return;
      }

      // Handle multiple matches - show disambiguation list
      if (projects.length > 1) {
        const disambiguationEmbed = createInfoEmbed(
          `Found ${projects.length} Projects`,
          `Multiple projects match "${projectInput}". Please use the autocomplete dropdown to select a specific project:\n\n` +
            projects
              .map(
                (p, i) =>
                  `**${i + 1}.** ${p.title}\n   Client: ${p.clientName} • Status: ${p.status}`
              )
              .join('\n\n')
        );
        await interaction.followUp({
          embeds: [disambiguationEmbed],
        });
        return;
      }

      // Single match
      projectId = projects[0].id;
    }

    // Fetch full project details by ID
    const detailResponse = await apiClient.get<{
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

    if (detailResponse.error || !detailResponse.data) {
      const errorEmbed = createErrorEmbed(
        'Failed to Load Project',
        detailResponse.error || 'Failed to load project details'
      );
      await interaction.followUp({
        embeds: [errorEmbed],
      });
      return;
    }

    const { project } = detailResponse.data;

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
