/**
 * /quote review Command
 *
 * Displays detailed information about a specific quote request
 *
 * @module bot/commands/quote/review
 */

import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createQuoteEmbed } from '../../utils/embed-builder';
import { validateId } from '../../core/validators';

/**
 * Quote Review Command
 */
export class QuoteReviewCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('quote-review')
    .setDescription('Review a specific quote request in detail')
    .addStringOption((option) =>
      option
        .setName('quote-id')
        .setDescription('The quote ID (from /quote-list)')
        .setRequired(true)
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Validate input
    const quoteIdRaw = interaction.options.get('quote-id')?.value as string;
    const quoteId = validateId(quoteIdRaw);

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.get<{
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

    if (response.error || !response.data) {
      throw new Error(response.error || `No quote found with ID: ${quoteId}`);
    }

    const { quote } = response.data;

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
