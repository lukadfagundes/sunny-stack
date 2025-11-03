/**
 * Quote Notifications
 *
 * Handles sending notifications for quote-related events
 *
 * @module bot/notifications/quote-notifications
 */

import { Client, EmbedBuilder } from 'discord.js';
import { BaseNotificationSender } from './base-sender';
import { loadChannelConfig, loadBotConfig } from '../config';
import { createQuoteEmbed, COLORS } from '../utils/embed-builder';
import { botLogger } from '../core/logger';

export interface QuoteNotificationPayload {
  quote: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    projectType: string;
    budgetRange: string | null;
    timeline: string | null;
    description: string;
    status: string;
    createdAt: string;
  };
  eventType: 'new' | 'approved' | 'declined' | 'converted';
  project?: {
    id: string;
    title: string;
  };
}

/**
 * Quote Notification Sender
 */
export class QuoteNotificationSender extends BaseNotificationSender {
  /**
   * Send new quote notification
   */
  async sendNewQuote(payload: QuoteNotificationPayload): Promise<boolean> {
    const { quote } = payload;
    const config = loadBotConfig();

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle('📬 New Quote Request Received')
      .setDescription(`A new quote request has been submitted via the website.`)
      .addFields(
        {
          name: 'Client',
          value: quote.company ? `${quote.name} (${quote.company})` : quote.name,
          inline: true,
        },
        {
          name: 'Contact',
          value: quote.email,
          inline: true,
        },
        {
          name: 'Project Type',
          value: quote.projectType,
          inline: true,
        }
      );

    if (quote.budgetRange) {
      embed.addFields({
        name: 'Budget Range',
        value: quote.budgetRange,
        inline: true,
      });
    }

    if (quote.timeline) {
      embed.addFields({
        name: 'Timeline',
        value: quote.timeline,
        inline: true,
      });
    }

    embed.addFields({
      name: 'Description',
      value: quote.description.slice(0, 1024),
      inline: false,
    });

    embed.addFields({
      name: '⚡ Quick Actions',
      value:
        `• Review: \`/quote-review ${quote.id}\`\n` +
        `• Approve: \`/quote-approve ${quote.id} action:APPROVED\`\n` +
        `• Decline: \`/quote-approve ${quote.id} action:DECLINED\``,
      inline: false,
    });

    embed.setFooter({
      text: `Quote ID: ${quote.id}`,
    });

    embed.setTimestamp();

    return this.send({
      content: '🔔 **New Quote Request**',
      embeds: [embed],
      mentions: [config.adminUserId],
    });
  }

  /**
   * Send quote approved notification
   */
  async sendQuoteApproved(payload: QuoteNotificationPayload): Promise<boolean> {
    const { quote } = payload;

    const embed = createQuoteEmbed(quote);
    embed.setTitle('✅ Quote Approved');
    embed.setColor(COLORS.SUCCESS);

    embed.addFields({
      name: '💡 Next Steps',
      value:
        `• Convert to project: \`/quote-convert ${quote.id}\`\n` +
        `• Or generate a proposal via the admin dashboard`,
      inline: false,
    });

    return this.send({
      embeds: [embed],
    });
  }

  /**
   * Send quote declined notification
   */
  async sendQuoteDeclined(payload: QuoteNotificationPayload): Promise<boolean> {
    const { quote } = payload;

    const embed = createQuoteEmbed(quote);
    embed.setTitle('❌ Quote Declined');
    embed.setColor(COLORS.ERROR);

    return this.send({
      embeds: [embed],
    });
  }

  /**
   * Send quote converted notification
   */
  async sendQuoteConverted(payload: QuoteNotificationPayload): Promise<boolean> {
    const { quote, project } = payload;

    if (!project) {
      botLogger.error('Quote converted notification missing project data', {
        quoteId: quote.id,
      });
      return false;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('🔄 Quote Converted to Project')
      .setDescription(`Quote from **${quote.name}** has been converted to a project.`)
      .addFields(
        {
          name: 'Original Quote',
          value: `${quote.projectType}\nID: \`${quote.id}\``,
          inline: true,
        },
        {
          name: 'New Project',
          value: `${project.title}\nID: \`${project.id}\``,
          inline: true,
        }
      )
      .addFields({
        name: '⚡ Quick Actions',
        value: `• View project: \`/project-status ${project.id}\`\n` + `• Start time tracking: \`/time-start ${project.id}\``,
        inline: false,
      })
      .setTimestamp();

    return this.send({
      embeds: [embed],
    });
  }
}

/**
 * Factory function to create quote notification sender
 */
export function createQuoteNotificationSender(client: Client): QuoteNotificationSender {
  const channels = loadChannelConfig();
  return new QuoteNotificationSender(client, channels.clientInquiries);
}

/**
 * Handle incoming quote webhook notification
 */
export async function handleQuoteWebhook(
  client: Client,
  payload: QuoteNotificationPayload
): Promise<void> {
  const sender = createQuoteNotificationSender(client);

  try {
    switch (payload.eventType) {
      case 'new':
        await sender.sendNewQuote(payload);
        break;
      case 'approved':
        await sender.sendQuoteApproved(payload);
        break;
      case 'declined':
        await sender.sendQuoteDeclined(payload);
        break;
      case 'converted':
        await sender.sendQuoteConverted(payload);
        break;
      default:
        botLogger.warn('Unknown quote event type', {
          eventType: payload.eventType,
        });
    }
  } catch (error) {
    botLogger.error('Failed to handle quote webhook', {
      eventType: payload.eventType,
      quoteId: payload.quote.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
