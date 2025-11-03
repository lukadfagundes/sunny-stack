/**
 * /quote approve Command
 *
 * Approves or declines a quote request
 *
 * @module bot/commands/quote/approve
 */

import { SlashCommandBuilder, CommandInteraction, AutocompleteInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, createQuoteEmbed, createErrorEmbed, createInfoEmbed } from '../../utils/embed-builder';

/**
 * Quote Approve Command
 */
export class QuoteApproveCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('quote-approve')
    .setDescription('Approve or decline a quote request')
    .addStringOption((option) =>
      option
        .setName('action')
        .setDescription('Approve or decline the quote')
        .setRequired(true)
        .addChoices(
          { name: 'Approve', value: 'APPROVED' },
          { name: 'Decline', value: 'DECLINED' }
        )
    )
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
    const action = interaction.options.get('action')?.value as string;

    // At least one search parameter required
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

    const response = await apiClient.put<{ quote: any }>(`/admin/quotes/${quoteId}`, {
      status: action,
      reviewedAt: new Date().toISOString(),
    });

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to update quote status');
    }

    const { quote } = response.data;

    // Create success message
    const actionText = action === 'APPROVED' ? 'approved' : 'declined';
    const successEmbed = createSuccessEmbed(
      `Quote ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      `Quote from **${quote.name}** has been ${actionText}.`
    );

    if (action === 'APPROVED') {
      successEmbed.addFields({
        name: '💡 Next Steps',
        value:
          '1. Use `/quote-convert` to create a project from this quote\n' +
          '2. Or generate a proposal with the admin dashboard',
        inline: false,
      });
    }

    const quoteEmbed = createQuoteEmbed(quote);

    await interaction.followUp({
      embeds: [successEmbed, quoteEmbed],
    });
  }
}

export default new QuoteApproveCommand();
