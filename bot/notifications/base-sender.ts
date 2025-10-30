/**
 * Base Notification Sender
 *
 * Abstract base class for sending notifications to Discord channels
 *
 * @module bot/notifications/base-sender
 */

import { Client, TextChannel, EmbedBuilder, Channel } from 'discord.js';
import { botLogger } from '../core/logger';
import { loadChannelConfig } from '../config';

export interface NotificationOptions {
  content?: string;
  embeds?: EmbedBuilder[];
  mentions?: string[]; // User IDs to mention
  silent?: boolean; // Suppress notifications
}

/**
 * Base class for notification senders
 */
export abstract class BaseNotificationSender {
  protected client: Client;
  protected channelId: string;

  constructor(client: Client, channelId: string) {
    this.client = client;
    this.channelId = channelId;
  }

  /**
   * Send a notification to the configured channel
   */
  async send(options: NotificationOptions): Promise<boolean> {
    try {
      const channel = await this.getChannel();

      if (!channel) {
        botLogger.error('Notification channel not found', {
          channelId: this.channelId,
          sender: this.constructor.name,
        });
        return false;
      }

      if (!channel.isTextBased()) {
        botLogger.error('Channel is not text-based', {
          channelId: this.channelId,
          channelType: channel.type,
        });
        return false;
      }

      // Build message content
      let content = options.content || '';

      // Add mentions if provided
      if (options.mentions && options.mentions.length > 0) {
        const mentions = options.mentions.map((userId) => `<@${userId}>`).join(' ');
        content = `${mentions} ${content}`.trim();
      }

      // Send the message
      await (channel as TextChannel).send({
        content: content || undefined,
        embeds: options.embeds,
        allowedMentions: {
          users: options.mentions || [],
        },
      });

      botLogger.info('Notification sent', {
        channelId: this.channelId,
        sender: this.constructor.name,
        hasMentions: (options.mentions?.length || 0) > 0,
        embedCount: options.embeds?.length || 0,
      });

      return true;
    } catch (error) {
      botLogger.error('Failed to send notification', {
        channelId: this.channelId,
        sender: this.constructor.name,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get the Discord channel
   */
  protected async getChannel(): Promise<Channel | null> {
    try {
      // Try cache first
      const cached = this.client.channels.cache.get(this.channelId);
      if (cached) {
        return cached;
      }

      // Fetch from API
      const fetched = await this.client.channels.fetch(this.channelId);
      return fetched;
    } catch (error) {
      botLogger.error('Failed to fetch channel', {
        channelId: this.channelId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Validate notification payload
   */
  protected validatePayload(options: NotificationOptions): boolean {
    if (!options.content && (!options.embeds || options.embeds.length === 0)) {
      botLogger.warn('Notification has no content or embeds', {
        sender: this.constructor.name,
      });
      return false;
    }

    return true;
  }
}

/**
 * Factory function to get notification sender for a specific channel
 */
export function getNotificationSender(
  client: Client,
  channelType: 'general' | 'notifications' | 'errors'
): BaseNotificationSender {
  const channels = loadChannelConfig();

  const channelMap = {
    general: channels.GENERAL_CHANNEL_ID,
    notifications: channels.NOTIFICATIONS_CHANNEL_ID,
    errors: channels.ERROR_CHANNEL_ID,
  };

  const channelId = channelMap[channelType];

  return new (class extends BaseNotificationSender {})(client, channelId);
}
