/**
 * Error Event Handler
 *
 * Handles Discord.js client errors
 *
 * @module bot/events/error
 */

import { Client, Events } from 'discord.js';
import { botLogger } from '../core/logger';
import { loadChannelConfig } from '../config';

/**
 * Handle client error event
 */
export async function handleError(client: Client, error: Error): Promise<void> {
  botLogger.error('Discord client error', {
    error: error.message,
    stack: error.stack,
    name: error.name,
  });

  // Determine severity
  const isCritical =
    error.message.includes('ECONNRESET') ||
    error.message.includes('WebSocket') ||
    error.message.includes('Gateway') ||
    error.message.includes('Heartbeat');

  if (isCritical) {
    botLogger.error('CRITICAL: Discord connection error', {
      error: error.message,
      willAttemptReconnect: true,
    });

    // Try to send alert to notifications channel
    try {
      const channels = loadChannelConfig();
      const guild = client.guilds.cache.first();

      if (guild) {
        const notificationsChannel = guild.channels.cache.get(
          channels.NOTIFICATIONS_CHANNEL_ID
        );

        if (notificationsChannel?.isTextBased()) {
          await notificationsChannel.send({
            content:
              '🔴 **CRITICAL: Discord Bot Error**\n' +
              `Error: ${error.message}\n` +
              `The bot will attempt to reconnect automatically.`,
          });
        }
      }
    } catch (notificationError) {
      botLogger.error('Failed to send error notification', {
        error: notificationError instanceof Error
          ? notificationError.message
          : String(notificationError),
      });
    }
  }

  // Log specific error types for debugging
  if (error.name === 'DiscordAPIError') {
    botLogger.error('Discord API Error', {
      message: error.message,
      stack: error.stack,
    });
  } else if (error.name === 'RateLimitError') {
    botLogger.warn('Discord rate limit hit', {
      message: error.message,
    });
  }
}

/**
 * Handle client warning event
 */
export function handleWarning(info: string): void {
  botLogger.warn('Discord client warning', {
    warning: info,
  });
}

/**
 * Handle shard error event
 */
export function handleShardError(error: Error, shardId: number): void {
  botLogger.error('Discord shard error', {
    shardId,
    error: error.message,
    stack: error.stack,
  });
}

/**
 * Register error event handlers
 */
export function registerErrorEvents(client: Client): void {
  client.on(Events.Error, (error) => handleError(client, error));
  client.on(Events.Warn, handleWarning);
  client.on(Events.ShardError, handleShardError);
}
