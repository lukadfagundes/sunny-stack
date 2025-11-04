/**
 * /quote review Command
 *
 * Displays detailed information about a specific quote request
 *
 * @module bot/commands/quote/review
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createQuoteEmbed, createErrorEmbed, createInfoEmbed } from '../../utils/embed-builder';

/**
 * Quote Review Command
 */
export class QuoteReviewCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('quote-review')
    .setDescription('Review a specific quote request in detail')
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

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Get search parameters
    const email = interaction.options.getString('email') ?? undefined;
    const company = interaction.options.getString('company') ?? undefined;

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

    // Single match - fetch full details
    const quoteId = quotes[0].id;
    const detailResponse = await apiClient.get<{
      quote: {
        id: string;
        name: string;
        email: string;
        company: string | null;
        projectType: string;
        budgetRange: string | null;
        timeline: string | null;
        description: string;
        requirements: string | null;
        status: string;
        projectId: string | null;
        createdAt: string;
        updatedAt: string;
        reviewedAt: string | null;
        project?: {
          id: string;
          title: string;
          status: string;
        };
        proposals?: Array<{
          id: string;
          pdfUrl: string;
          sentAt: string | null;
          createdAt: string;
        }>;
      };
    }>(`/admin/quotes/${quoteId}`);

    if (detailResponse.error || !detailResponse.data) {
      throw new Error(detailResponse.error || 'Failed to load quote details');
    }

    const { quote } = detailResponse.data;

    // Create detailed quote embed
    const quoteEmbed = createQuoteEmbed(quote);

    // Add full description and requirements
    if (quote.description) {
      quoteEmbed.addFields({
        name: '📝 Project Description',
        value: quote.description.slice(0, 1024), // Discord embed field limit
        inline: false,
      });
    }

    if (quote.requirements) {
      quoteEmbed.addFields({
        name: '✅ Requirements',
        value: quote.requirements.slice(0, 1024),
        inline: false,
      });
    }

    // Add proposal info if exists
    if (quote.proposals && quote.proposals.length > 0) {
      const latestProposal = quote.proposals[0];
      quoteEmbed.addFields({
        name: '📄 Proposal Status',
        value: latestProposal.sentAt
          ? `✅ Sent on ${new Date(latestProposal.sentAt).toLocaleDateString()}`
          : '⏳ Generated but not sent yet',
        inline: false,
      });
    }

    // Add linked project info if converted
    if (quote.project) {
      quoteEmbed.addFields({
        name: '🔗 Linked Project',
        value: `**${quote.project.title}**\nStatus: ${quote.project.status}\nID: \`${quote.project.id}\``,
        inline: false,
      });
    }

    await interaction.followUp({
      embeds: [quoteEmbed],
    });
  }
}

export default new QuoteReviewCommand();
