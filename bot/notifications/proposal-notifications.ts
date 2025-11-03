/**
 * Proposal Notifications
 *
 * Handles sending notifications for proposal-related events
 *
 * @module bot/notifications/proposal-notifications
 */

import { Client, EmbedBuilder } from 'discord.js';
import { BaseNotificationSender } from './base-sender';
import { loadChannelConfig } from '../config';
import { COLORS } from '../utils/embed-builder';
import { formatDiscordTimestamp, formatRelativeTime } from '../utils/formatters';
import { botLogger } from '../core/logger';

export interface ProposalNotificationPayload {
  proposal: {
    id: string;
    quoteId: string;
    pdfUrl: string;
    sentAt: string | null;
    createdAt: string;
  };
  quote: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    projectType: string;
  };
  eventType: 'generated' | 'sent' | 'viewed' | 'accepted' | 'declined';
  metadata?: {
    viewedAt?: string;
    acceptedAt?: string;
    declinedAt?: string;
    ipAddress?: string;
  };
}

/**
 * Proposal Notification Sender
 */
export class ProposalNotificationSender extends BaseNotificationSender {
  /**
   * Send proposal generated notification
   */
  async sendProposalGenerated(payload: ProposalNotificationPayload): Promise<boolean> {
    const { proposal, quote } = payload;

    const clientName = quote.company ? `${quote.name} (${quote.company})` : quote.name;

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle('📄 Proposal Generated')
      .setDescription(`A proposal has been generated for **${clientName}**.`)
      .addFields(
        {
          name: 'Client',
          value: clientName,
          inline: true,
        },
        {
          name: 'Project Type',
          value: quote.projectType,
          inline: true,
        },
        {
          name: 'Generated',
          value: formatRelativeTime(proposal.createdAt),
          inline: true,
        }
      )
      .addFields({
        name: '📎 Proposal',
        value: `[View PDF](${proposal.pdfUrl})`,
        inline: false,
      })
      .addFields({
        name: '⚡ Next Steps',
        value:
          '• Review the proposal in the admin dashboard\n' +
          '• Send proposal to client via email\n' +
          `• Or review quote: \`/quote-review ${quote.id}\``,
        inline: false,
      })
      .setFooter({
        text: `Proposal ID: ${proposal.id} • Quote ID: ${quote.id}`,
      })
      .setTimestamp();

    return this.send({
      embeds: [embed],
    });
  }

  /**
   * Send proposal sent notification
   */
  async sendProposalSent(payload: ProposalNotificationPayload): Promise<boolean> {
    const { proposal, quote } = payload;

    const clientName = quote.company ? `${quote.name} (${quote.company})` : quote.name;

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('📧 Proposal Sent')
      .setDescription(`Proposal has been sent to **${clientName}** (${quote.email}).`)
      .addFields(
        {
          name: 'Client',
          value: clientName,
          inline: true,
        },
        {
          name: 'Sent At',
          value: proposal.sentAt ? formatDiscordTimestamp(proposal.sentAt, 'F') : 'Just now',
          inline: true,
        }
      )
      .addFields({
        name: '📎 Proposal',
        value: `[View PDF](${proposal.pdfUrl})`,
        inline: false,
      })
      .setFooter({
        text: `Proposal ID: ${proposal.id}`,
      })
      .setTimestamp();

    return this.send({
      embeds: [embed],
    });
  }

  /**
   * Send proposal viewed notification
   */
  async sendProposalViewed(payload: ProposalNotificationPayload): Promise<boolean> {
    const { proposal, quote, metadata } = payload;

    const clientName = quote.company ? `${quote.name} (${quote.company})` : quote.name;

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle('👀 Proposal Viewed')
      .setDescription(`**${clientName}** has viewed their proposal.`)
      .addFields(
        {
          name: 'Client',
          value: clientName,
          inline: true,
        },
        {
          name: 'Viewed At',
          value: metadata?.viewedAt
            ? formatDiscordTimestamp(metadata.viewedAt, 'F')
            : 'Just now',
          inline: true,
        }
      );

    if (metadata?.ipAddress) {
      embed.addFields({
        name: 'IP Address',
        value: metadata.ipAddress,
        inline: true,
      });
    }

    embed.addFields({
      name: '💡 Follow Up',
      value:
        '• Client is actively reviewing the proposal\n' +
        '• Consider following up via email\n' +
        `• Review quote: \`/quote-review ${quote.id}\``,
      inline: false,
    });

    embed.setFooter({
      text: `Proposal ID: ${proposal.id}`,
    });

    embed.setTimestamp();

    return this.send({
      content: '📊 **Client Activity**',
      embeds: [embed],
    });
  }

  /**
   * Send proposal accepted notification
   */
  async sendProposalAccepted(payload: ProposalNotificationPayload): Promise<boolean> {
    const { proposal, quote, metadata } = payload;

    const clientName = quote.company ? `${quote.name} (${quote.company})` : quote.name;

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('🎉 Proposal Accepted!')
      .setDescription(`**${clientName}** has accepted the proposal!`)
      .addFields(
        {
          name: 'Client',
          value: clientName,
          inline: true,
        },
        {
          name: 'Accepted At',
          value: metadata?.acceptedAt
            ? formatDiscordTimestamp(metadata.acceptedAt, 'F')
            : 'Just now',
          inline: true,
        }
      )
      .addFields({
        name: '⚡ Next Steps',
        value:
          `• Convert quote to project: \`/quote-convert ${quote.id}\`\n` +
          '• Send welcome email to client\n' +
          '• Schedule kickoff meeting',
        inline: false,
      })
      .setFooter({
        text: `Proposal ID: ${proposal.id} • Quote ID: ${quote.id}`,
      })
      .setTimestamp();

    return this.send({
      content: '🎊 **Great News!**',
      embeds: [embed],
    });
  }

  /**
   * Send proposal declined notification
   */
  async sendProposalDeclined(payload: ProposalNotificationPayload): Promise<boolean> {
    const { proposal, quote, metadata } = payload;

    const clientName = quote.company ? `${quote.name} (${quote.company})` : quote.name;

    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle('❌ Proposal Declined')
      .setDescription(`**${clientName}** has declined the proposal.`)
      .addFields(
        {
          name: 'Client',
          value: clientName,
          inline: true,
        },
        {
          name: 'Declined At',
          value: metadata?.declinedAt
            ? formatDiscordTimestamp(metadata.declinedAt, 'F')
            : 'Just now',
          inline: true,
        }
      )
      .addFields({
        name: '💡 Follow Up',
        value:
          '• Consider sending a follow-up email\n' +
          '• Ask for feedback on the proposal\n' +
          `• Decline quote: \`/quote-approve ${quote.id} action:DECLINED\``,
        inline: false,
      })
      .setFooter({
        text: `Proposal ID: ${proposal.id} • Quote ID: ${quote.id}`,
      })
      .setTimestamp();

    return this.send({
      embeds: [embed],
    });
  }
}

/**
 * Factory function to create proposal notification sender
 */
export function createProposalNotificationSender(client: Client): ProposalNotificationSender {
  const channels = loadChannelConfig();
  return new ProposalNotificationSender(client, channels.proposals);
}

/**
 * Handle incoming proposal webhook notification
 */
export async function handleProposalWebhook(
  client: Client,
  payload: ProposalNotificationPayload
): Promise<void> {
  const sender = createProposalNotificationSender(client);

  try {
    switch (payload.eventType) {
      case 'generated':
        await sender.sendProposalGenerated(payload);
        break;
      case 'sent':
        await sender.sendProposalSent(payload);
        break;
      case 'viewed':
        await sender.sendProposalViewed(payload);
        break;
      case 'accepted':
        await sender.sendProposalAccepted(payload);
        break;
      case 'declined':
        await sender.sendProposalDeclined(payload);
        break;
      default:
        botLogger.warn('Unknown proposal event type', {
          eventType: payload.eventType,
        });
    }
  } catch (error) {
    botLogger.error('Failed to handle proposal webhook', {
      eventType: payload.eventType,
      proposalId: payload.proposal.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
