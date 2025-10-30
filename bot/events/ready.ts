/**
 * Ready Event Handler
 *
 * Triggered when the Discord bot successfully connects and is ready
 *
 * @module bot/events/ready
 */

import { Client, Events } from 'discord.js';
import { botLogger } from '../core/logger';
import { loadBotConfig, loadChannelConfig } from '../config';

/**
 * Handle the ready event
 */
export async function handleReady(client: Client): Promise<void> {
  if (!client.user) {
    botLogger.error('Ready event fired but client.user is null');
    return;
  }

  const config = loadBotConfig();
  const channels = loadChannelConfig();

  botLogger.info('Discord bot ready', {
    username: client.user.tag,
    id: client.user.id,
    guildCount: client.guilds.cache.size,
    deploymentMode: config.deploymentMode,
  });

  // Set bot presence/activity
  client.user.setPresence({
    status: 'online',
    activities: [
      {
        name: 'Sunny Stack Admin',
        type: 3, // WATCHING
      },
    ],
  });

  // Verify guild access
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) {
    botLogger.error('Bot is not in the configured guild', {
      guildId: config.guildId,
    });
    return;
  }

  botLogger.info('Connected to guild', {
    guildId: guild.id,
    guildName: guild.name,
    memberCount: guild.memberCount,
  });

  // Verify channels exist
  const channelVerification: Array<{ name: string; id: string; exists: boolean }> = [];

  for (const [name, id] of Object.entries(channels)) {
    const channel = guild.channels.cache.get(id);
    channelVerification.push({
      name,
      id,
      exists: !!channel,
    });

    if (!channel) {
      botLogger.warn('Configured channel not found', {
        channelName: name,
        channelId: id,
      });
    }
  }

  botLogger.info('Channel verification complete', {
    channels: channelVerification,
  });

  // Log command count
  const commandCount = client.application?.commands.cache.size || 0;
  botLogger.info('Bot ready and operational', {
    commandCount,
    uptime: process.uptime(),
  });

  // Send ready notification to notifications channel (if exists)
  try {
    const notificationsChannel = guild.channels.cache.get(channels.NOTIFICATIONS_CHANNEL_ID);
    if (notificationsChannel?.isTextBased()) {
      await notificationsChannel.send({
        content: '✅ **Sunny Stack Bot Online**\nBot is ready and monitoring all systems.',
      });
    }
  } catch (error) {
    botLogger.warn('Failed to send ready notification', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Register the ready event handler
 */
export function registerReadyEvent(client: Client): void {
  client.once(Events.ClientReady, handleReady);
}
