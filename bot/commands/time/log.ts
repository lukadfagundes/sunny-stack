/**
 * /time log Command
 *
 * Manually log a completed time entry (retroactive)
 *
 * @module bot/commands/time/log
 */

import { SlashCommandBuilder, CommandInteraction, AutocompleteInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed } from '../../utils/embed-builder';
import { validateDescription, validateDuration } from '../../core/validators';
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
        .setName('project-title')
        .setAutocomplete(true)
        .setDescription('Project title or partial name')
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
