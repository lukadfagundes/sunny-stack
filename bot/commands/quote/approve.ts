/**
 * /quote approve Command
 *
 * Approves or declines a quote request
 *
 * @module bot/commands/quote/approve
 */

import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createSuccessEmbed, createQuoteEmbed } from '../../utils/embed-builder';
import { validateId } from '../../core/validators';

/**
 * Quote Approve Command
 */
export class QuoteApproveCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('quote-approve')
    .setDescription('Approve or decline a quote request')
    .addStringOption((option) =>
      option
        .setName('quote-id')
        .setDescription('The quote ID to update')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('action')
        .setDescription('Approve or decline the quote')
        .setRequired(true)
        .addChoices(
          { name: 'Approve', value: 'APPROVED' },
          { name: 'Decline', value: 'DECLINED' }
        )
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Validate input
    const quoteIdRaw = interaction.options.get('quote-id')?.value as string;
    const quoteId = validateId(quoteIdRaw);

    const action = interaction.options.get('action')?.value as string;

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

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
