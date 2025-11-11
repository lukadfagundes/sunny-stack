/**
 * @file Test Notification API Endpoint
 * @description Triggers a test Discord notification to admin logs channel
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmbedBuilder, TextChannel } from 'discord.js';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const ADMIN_CHANNEL_ID = process.env.DISCORD_CHANNEL_ADMIN_LOGS;

    if (!ADMIN_CHANNEL_ID) {
      return NextResponse.json(
        { error: 'DISCORD_CHANNEL_ADMIN_LOGS not configured' },
        { status: 500 }
      );
    }

    // Get the global Discord client
    const client = (global as any).discordClient;

    if (!client) {
      logger.warn('Discord client not available (bot not running)');
      return NextResponse.json(
        { error: 'Discord bot not running' },
        { status: 503 }
      );
    }

    if (!client.isReady()) {
      logger.warn('Discord client not ready yet');
      return NextResponse.json(
        { error: 'Discord bot not ready' },
        { status: 503 }
      );
    }

    logger.info(`Client ready state: ${client.isReady()}`);
    logger.info(`Client user: ${client.user?.tag}`);

    // Get the channel from guild cache (faster and more reliable than fetching)
    const guild = client.guilds.cache.first();
    if (!guild) {
      logger.error('No guild found in cache');
      return NextResponse.json(
        { error: 'No guild found' },
        { status: 500 }
      );
    }

    const channel = guild.channels.cache.get(ADMIN_CHANNEL_ID);

    if (!channel) {
      logger.error('Admin logs channel not found');
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    if (!channel.isTextBased()) {
      logger.error('Admin logs channel is not a text channel');
      return NextResponse.json(
        { error: 'Channel is not a text channel' },
        { status: 400 }
      );
    }

    // Send test notification
    const embed = new EmbedBuilder()
      .setTitle('🧪 Test Notification')
      .setColor(0x00ff00)
      .setDescription('This is a test notification from the API')
      .addFields(
        { name: '📅 Time', value: new Date().toLocaleString(), inline: true },
        { name: '✅ Status', value: 'Bot is connected and working', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Test Notification System' });

    await channel.send({ embeds: [embed] });

    logger.info('Test notification sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Test notification sent to admin logs channel',
      channelId: ADMIN_CHANNEL_ID,
      botUser: client.user?.tag,
    });
  } catch (error) {
    logger.error('Failed to send test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: (error as Error).message },
      { status: 500 }
    );
  }
}
