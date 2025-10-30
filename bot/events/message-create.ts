/**
 * Message Create Event Handler
 *
 * Handles new messages in Discord (for monitoring bot mentions, etc.)
 *
 * @module bot/events/message-create
 */

import { Client, Events, Message } from 'discord.js';
import { botLogger } from '../core/logger';
import { createInfoEmbed } from '../utils/embed-builder';

/**
 * Handle message create event
 */
export async function handleMessageCreate(message: Message): Promise<void> {
  // Ignore bot messages (prevent infinite loops)
  if (message.author.bot) {
    return;
  }

  // Check if bot was mentioned
  const botMentioned = message.mentions.has(message.client.user?.id || '');

  if (botMentioned) {
    botLogger.info('Bot mentioned in message', {
      userId: message.author.id,
      username: message.author.tag,
      channelId: message.channelId,
      messageContent: message.content.slice(0, 100), // Log first 100 chars
    });

    // Respond with help message
    const helpEmbed = createInfoEmbed(
      '👋 Hello!',
      "I'm the Sunny Stack admin bot. Use slash commands to interact with me.\n\n" +
        '**Available Commands:**\n' +
        '• `/project-*` - Manage projects\n' +
        '• `/quote-*` - Review and manage quotes\n' +
        '• `/time-*` - Track time\n' +
        '• `/monitor-*` - View monitoring status\n' +
        '• `/admin-*` - Admin utilities\n\n' +
        'Type `/` in the message box to see all available commands!'
    );

    try {
      await message.reply({
        embeds: [helpEmbed],
      });
    } catch (error) {
      botLogger.error('Failed to reply to mention', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Log messages in specific monitoring channels (optional)
  // This can be used for debugging or audit logging
  const isMonitoringChannel = message.channelId === process.env.DISCORD_NOTIFICATIONS_CHANNEL_ID;

  if (isMonitoringChannel && !botMentioned) {
    botLogger.debug('Message in monitoring channel', {
      userId: message.author.id,
      channelId: message.channelId,
      hasAttachments: message.attachments.size > 0,
      hasEmbeds: message.embeds.length > 0,
    });
  }
}

/**
 * Register the message create event handler
 */
export function registerMessageCreateEvent(client: Client): void {
  client.on(Events.MessageCreate, handleMessageCreate);
}
