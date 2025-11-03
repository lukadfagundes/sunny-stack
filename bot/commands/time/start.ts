/**
 * /time start Command
 *
 * Starts a new time tracking entry for a project
 *
 * @module bot/commands/time/start
 */

import { SlashCommandBuilder, CommandInteraction, AutocompleteInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed, COLORS } from '../../utils/embed-builder';
import { validateDescription } from '../../core/validators';
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
        .setName('project-title')
        .setDescription('Project title or partial name')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('What are you working on?')
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
    const descriptionRaw = interaction.options.get('description')?.value as string | undefined;
    const description = descriptionRaw ? validateDescription(descriptionRaw, false) : null;

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
