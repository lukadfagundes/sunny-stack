/**
 * /quote convert Command
 *
 * Converts a quote request into a project
 *
 * @module bot/commands/quote/convert
 */

import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, createProjectEmbed } from '../../utils/embed-builder';
import { validateId, validateBudget, validateDate } from '../../core/validators';

/**
 * Quote Convert Command
 */
export class QuoteConvertCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('quote-convert')
    .setDescription('Convert a quote request into a project')
    .addStringOption((option) =>
      option.setName('quote-id').setDescription('The quote ID to convert').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('budget')
        .setDescription('Project budget (e.g., 25000.00)')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('deadline')
        .setDescription('Project deadline (YYYY-MM-DD format)')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('status')
        .setDescription('Initial project status (default: PLANNING)')
        .setRequired(false)
        .addChoices(
          { name: 'Planning', value: 'PLANNING' },
          { name: 'In Progress', value: 'IN_PROGRESS' },
          { name: 'Review', value: 'REVIEW' }
        )
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Validate quote ID
    const quoteIdRaw = interaction.options.get('quote-id')?.value as string;
    const quoteId = validateId(quoteIdRaw);

    // Build conversion data
    const conversionData: Record<string, unknown> = {};

    const budgetRaw = interaction.options.get('budget')?.value as string | undefined;
    if (budgetRaw) {
      conversionData.budget = validateBudget(budgetRaw);
    }

    const deadlineRaw = interaction.options.get('deadline')?.value as string | undefined;
    if (deadlineRaw) {
      conversionData.deadline = validateDate(deadlineRaw);
    }

    const status = interaction.options.get('status')?.value as string | undefined;
    if (status) {
      conversionData.status = status;
    }

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.post<{
      project: any;
      quote: any;
    }>(`/admin/quotes/${quoteId}/convert`, conversionData);

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to convert quote to project');
    }

    const { project, quote } = response.data;

    // Create success message
    const successEmbed = createSuccessEmbed(
      'Quote Converted to Project',
      `Quote from **${quote.name}** has been successfully converted to a project.`
    );

    const projectEmbed = createProjectEmbed(project);

    await interaction.followUp({
      embeds: [successEmbed, projectEmbed],
    });
  }
}

export default new QuoteConvertCommand();
