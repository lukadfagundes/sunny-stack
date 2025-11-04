/**
 * /time log Command
 *
 * Manually log a completed time entry (retroactive)
 *
 * @module bot/commands/time/log
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed } from '../../utils/embed-builder';
import { validateDescription } from '../../core/validators';
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
        .setName('hours')
        .setDescription('Hours worked (0-23)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(23)
    )
    .addIntegerOption((option) =>
      option
        .setName('minutes')
        .setDescription('Minutes worked (0-59)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(59)
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
        .setDescription('When did you start? (e.g., 2:30 PM, 9:00 AM)')
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

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Get project input (ID from autocomplete or title from manual entry)
    const projectInput = interaction.options.getString('project-title', true);
    const hours = interaction.options.getInteger('hours', true);
    const minutes = interaction.options.getInteger('minutes', true);

    // Calculate total duration in minutes
    const durationMinutes = (hours * 60) + minutes;

    // Validate total duration (max 24 hours = 1440 minutes)
    if (durationMinutes < 1) {
      throw new Error('Duration must be at least 1 minute');
    }
    if (durationMinutes > 1440) {
      throw new Error('Duration cannot exceed 24 hours');
    }

    const descriptionRaw = interaction.options.getString('description');
    const description = descriptionRaw ? validateDescription(descriptionRaw, false) : null;

    const startedAtRaw = interaction.options.getString('started-at');
    let startedAt: Date;
    if (startedAtRaw) {
      // Parse time in HH:MM AM/PM format
      const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
      const match = startedAtRaw.trim().match(timeRegex);

      if (!match) {
        throw new Error('Invalid time format. Use format like "2:30 PM" or "9:00 AM"');
      }

      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();

      // Validate hours and minutes
      if (hours < 1 || hours > 12) {
        throw new Error('Hours must be between 1 and 12');
      }
      if (minutes < 0 || minutes > 59) {
        throw new Error('Minutes must be between 0 and 59');
      }

      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }

      // Create date for today with specified time
      startedAt = new Date();
      startedAt.setHours(hours, minutes, 0, 0);

      // If the calculated end time would be in the future, assume they meant yesterday
      const endedAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
      if (endedAt > new Date()) {
        startedAt.setDate(startedAt.getDate() - 1);
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
