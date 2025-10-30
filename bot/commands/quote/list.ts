/**
 * /quote list Command
 *
 * Lists all quote requests with pagination and filtering
 *
 * @module bot/commands/quote/list
 */

import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { createListEmbed } from '../../utils/embed-builder';
import { formatQuoteStatus, formatRelativeTime } from '../../utils/formatters';

/**
 * Quote List Command
 */
export class QuoteListCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('quote-list')
    .setDescription('List all quote requests')
    .addIntegerOption((option) =>
      option
        .setName('page')
        .setDescription('Page number (default: 1)')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption((option) =>
      option
        .setName('status')
        .setDescription('Filter by status')
        .setRequired(false)
        .addChoices(
          { name: 'Pending', value: 'PENDING' },
          { name: 'Approved', value: 'APPROVED' },
          { name: 'Declined', value: 'DECLINED' },
          { name: 'Converted', value: 'CONVERTED' }
        )
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async execute(interaction: CommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Get options
    const page = (interaction.options.get('page')?.value as number) || 1;
    const statusFilter = interaction.options.get('status')?.value as string | undefined;

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const endpoint = statusFilter
      ? `/admin/quotes?page=${page}&status=${statusFilter}`
      : `/admin/quotes?page=${page}`;

    const response = await apiClient.get<{ quotes: any[]; total: number }>(endpoint);

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch quotes');
    }

    const { quotes, total } = response.data;
    const limit = 10;
    const totalPages = Math.ceil(total / limit);

    if (quotes.length === 0) {
      await interaction.followUp({
        content: '📋 No quote requests found.',
      });
      return;
    }

    // Format quote list
    const quoteLines = quotes.map((quote) => {
      const status = formatQuoteStatus(quote.status);
      const created = formatRelativeTime(quote.createdAt);
      const company = quote.company ? ` (${quote.company})` : '';

      return `**${quote.name}**${company}\n${status} • ${quote.projectType} • Received ${created}\nEmail: ${quote.email}`;
    });

    const embed = createListEmbed(
      statusFilter ? `Quotes (${statusFilter})` : 'All Quote Requests',
      quoteLines,
      page,
      totalPages
    );

    embed.addFields({
      name: 'Total Quotes',
      value: total.toString(),
      inline: true,
    });

    await interaction.followUp({
      embeds: [embed],
    });
  }
}

export default new QuoteListCommand();
