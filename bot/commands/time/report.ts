/**
 * /time report Command
 *
 * Generates time tracking reports for projects
 *
 * @module bot/commands/time/report
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { COLORS, createErrorEmbed, createInfoEmbed } from '../../utils/embed-builder';
import { formatDuration, formatRelativeTime } from '../../utils/formatters';

/**
 * Time Report Command
 */
export class TimeReportCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('time-report')
    .setDescription('Generate time tracking report')
    .addStringOption((option) =>
      option
        .setName('project-title')
        .setAutocomplete(true)
        .setDescription('Filter by specific project (optional)')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('period')
        .setDescription('Time period for the report')
        .setRequired(false)
        .addChoices(
          { name: 'Today', value: 'today' },
          { name: 'This Week', value: 'week' },
          { name: 'This Month', value: 'month' },
          { name: 'All Time', value: 'all' }
        )
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

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Get options
    const projectInput = interaction.options.getString('project-title');
    const period = interaction.options.getString('period') ?? 'all';

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    let projectId: string | undefined;

    // If project input provided, look it up first
    if (projectInput) {
      // Check if input is a UUID or CUID (from autocomplete)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectInput);
      const isCUID = /^c[a-z0-9]{24}$/i.test(projectInput);
      const isID = isUUID || isCUID;

      if (isID) {
        // Direct use of ID from autocomplete
        projectId = projectInput;
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
          await interaction.followUp({ embeds: [errorEmbed] });
          return;
        }

        const { projects } = searchResponse.data;

        if (projects.length > 1) {
          const disambiguationEmbed = createInfoEmbed(
            `Found ${projects.length} Projects`,
            `Multiple projects match "${projectInput}". Please use the autocomplete dropdown to select a specific project:\n\n` +
              projects
                .map((p, i) => `**${i + 1}.** ${p.title}\n   Client: ${p.clientName} • Status: ${p.status}`)
                .join('\n\n')
          );
          await interaction.followUp({ embeds: [disambiguationEmbed] });
          return;
        }

        projectId = projects[0].id;
      }
    }

    const queryParams = new URLSearchParams();
    if (projectId) queryParams.append('projectId', projectId);
    queryParams.append('period', period);

    const endpoint = `/admin/time-entries/report?${queryParams.toString()}`;

    const response = await apiClient.get<{
      totalMinutes: number;
      entryCount: number;
      projectBreakdown: Array<{
        projectId: string;
        projectTitle: string;
        totalMinutes: number;
        entryCount: number;
      }>;
      recentEntries: Array<{
        id: string;
        projectTitle: string;
        description: string | null;
        durationMinutes: number;
        startedAt: string;
      }>;
    }>(endpoint);

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to generate time report');
    }

    const { totalMinutes, entryCount, projectBreakdown, recentEntries } = response.data;

    // Create report embed
    const periodLabel = {
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      all: 'All Time',
    }[period];

    const reportEmbed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`⏱️ Time Tracking Report - ${periodLabel}`)
      .setDescription(
        `**Total Time:** ${formatDuration(totalMinutes)}\n` +
          `**Total Entries:** ${entryCount}`
      );

    // Add project breakdown
    if (projectBreakdown.length > 0) {
      const breakdownText = projectBreakdown
        .slice(0, 10) // Limit to top 10
        .map((project) => {
          const percentage = totalMinutes > 0 ? ((project.totalMinutes / totalMinutes) * 100).toFixed(1) : '0.0';
          return `**${project.projectTitle}**\n${formatDuration(project.totalMinutes)} (${percentage}%) • ${project.entryCount} entries`;
        })
        .join('\n\n');

      reportEmbed.addFields({
        name: '📊 Project Breakdown',
        value: breakdownText || 'No time entries',
        inline: false,
      });
    }

    // Add recent entries
    if (recentEntries.length > 0) {
      const recentText = recentEntries
        .slice(0, 5) // Limit to 5 most recent
        .map((entry) => {
          const desc = entry.description ? ` - ${entry.description.slice(0, 50)}` : '';
          return `**${entry.projectTitle}**${desc}\n${formatDuration(entry.durationMinutes)} • ${formatRelativeTime(entry.startedAt)}`;
        })
        .join('\n\n');

      reportEmbed.addFields({
        name: '🕒 Recent Entries',
        value: recentText,
        inline: false,
      });
    }

    reportEmbed.setFooter({
      text: `Report generated at ${new Date().toLocaleString()}`,
    });

    await interaction.followUp({
      embeds: [reportEmbed],
    });
  }
}

export default new TimeReportCommand();
