/**
 * /quote convert Command
 *
 * Converts a quote request into a project
 *
 * @module bot/commands/quote/convert
 */

import { SlashCommandBuilder, CommandInteraction, AutocompleteInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, createProjectEmbed, createErrorEmbed, createInfoEmbed } from '../../utils/embed-builder';
import { validateBudget, validateDate } from '../../core/validators';

/**
 * Quote Convert Command
 */
export class QuoteConvertCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('quote-convert')
    .setDescription('Convert a quote request into a project')
    .addStringOption((option) =>
      option
        .setName('email')
        .setDescription('Quote requester email address')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('company')
        .setDescription('Quote requester company name')
        .setRequired(false)
        .setAutocomplete(true)
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
        .setDescription('Project deadline (DD-MM-YYYY format)')
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

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const focusedOption = interaction.options.getFocused(true);
    const focusedValue = focusedOption.value;

    try {
      const config = loadBotConfig();
      const apiClient = new ApiClient(config.apiUrl, config.apiKey);

      // Query based on which field is focused
      const searchParam = focusedOption.name === 'email' ? 'email' : 'company';
      const response = await apiClient.get<{
        quotes: Array<{
          email: string;
          company: string | null;
          projectType: string;
        }>;
      }>(`/admin/quotes?${searchParam}=${encodeURIComponent(focusedValue)}&limit=25`);

      if (response.data && response.data.quotes) {
        const choices = response.data.quotes.map((q) => {
          const display =
            focusedOption.name === 'email'
              ? `${q.email}${q.company ? ` (${q.company})` : ''} - ${q.projectType}`
              : `${q.company || 'No Company'}${q.email ? ` (${q.email})` : ''} - ${q.projectType}`;
          return {
            name: display.slice(0, 100), // Discord limit
            value: focusedOption.name === 'email' ? q.email : q.company || q.email,
          };
        });

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

    // Get search parameters
    const email = interaction.options.get('email')?.value as string | undefined;
    const company = interaction.options.get('company')?.value as string | undefined;

    // At least one parameter required
    if (!email && !company) {
      const errorEmbed = createErrorEmbed(
        'Missing Parameters',
        'Please provide at least one of: `email` or `company`'
      );
      await interaction.followUp({ embeds: [errorEmbed] });
      return;
    }

    // Call API to search by email/company
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (company) params.append('company', company);

    const searchResponse = await apiClient.get<{
      quotes: Array<{
        id: string;
        name: string;
        email: string;
        company: string | null;
        projectType: string;
        status: string;
        createdAt: string;
      }>;
    }>(`/admin/quotes?${params.toString()}`);

    if (searchResponse.error || !searchResponse.data || searchResponse.data.quotes.length === 0) {
      const errorEmbed = createErrorEmbed(
        'No Quotes Found',
        `❌ No quotes found matching the provided criteria`
      );
      await interaction.followUp({ embeds: [errorEmbed] });
      return;
    }

    const { quotes } = searchResponse.data;

    // Handle multiple matches - show disambiguation list
    if (quotes.length > 1) {
      const disambiguationEmbed = createInfoEmbed(
        `Found ${quotes.length} Quotes`,
        `Multiple quotes match your criteria. Please be more specific:\n\n` +
          quotes
            .map(
              (q, i) =>
                `**${i + 1}.** ${q.name} (${q.email})` +
                (q.company ? `\n   Company: ${q.company}` : '') +
                `\n   Type: ${q.projectType} • Status: ${q.status}`
            )
            .join('\n\n')
      );
      await interaction.followUp({ embeds: [disambiguationEmbed] });
      return;
    }

    // Single match found
    const quoteId = quotes[0].id;

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

    // Call API to convert quote
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
