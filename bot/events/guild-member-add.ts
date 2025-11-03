/**
 * Guild Member Add Event Handler
 *
 * Handles new members joining the Discord server
 *
 * @module bot/events/guild-member-add
 */

import { Client, Events, GuildMember, EmbedBuilder } from 'discord.js';
import { botLogger } from '../core/logger';
import { loadChannelConfig, loadBotConfig } from '../config';
import { COLORS } from '../utils/embed-builder';
import { formatDiscordTimestamp } from '../utils/formatters';

/**
 * Handle guild member add event
 */
export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
  botLogger.info('New member joined', {
    userId: member.user.id,
    username: member.user.tag,
    guildId: member.guild.id,
    accountCreated: member.user.createdAt.toISOString(),
  });

  const config = loadBotConfig();
  const channels = loadChannelConfig();

  // Check if new member is the admin
  const isAdmin = member.user.id === config.adminUserId;

  // Create welcome embed
  const welcomeEmbed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('👋 Welcome to Sunny Stack!')
    .setDescription(
      isAdmin
        ? `Welcome back, ${member.user.tag}!\n\nAs the admin, you have full access to all bot commands.`
        : `Welcome, ${member.user.tag}!\n\nThis is a private admin server for Sunny Stack portfolio management.`
    )
    .addFields(
      {
        name: '📋 Getting Started',
        value: isAdmin
          ? '• Use `/admin-health` to check system status\n' +
            '• Use `/project-list` to see all projects\n' +
            '• Use `/quote-list` to review incoming quotes\n' +
            '• Type `/` to see all available commands'
          : '• You currently have limited access\n' +
            '• Contact the admin for more information',
        inline: false,
      },
      {
        name: '🔗 Useful Links',
        value: '[Portfolio Website](https://sunny-stack.com) • [Admin Dashboard](https://sunny-stack.com/admin)',
        inline: false,
      }
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({
      text: `Member #${member.guild.memberCount}`,
    })
    .setTimestamp();

  // Send welcome message to general channel
  try {
    const generalChannel = member.guild.channels.cache.get(channels.botCommands);

    if (generalChannel?.isTextBased()) {
      await generalChannel.send({
        content: `Welcome ${member.user}!`,
        embeds: [welcomeEmbed],
      });
    }
  } catch (error) {
    botLogger.error('Failed to send welcome message', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Send notification to notifications channel
  try {
    const notificationsChannel = member.guild.channels.cache.get(
      channels.adminLogs
    );

    if (notificationsChannel?.isTextBased()) {
      const notificationEmbed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('📥 New Member Joined')
        .addFields(
          {
            name: 'User',
            value: `${member.user.tag} (${member.user.id})`,
            inline: true,
          },
          {
            name: 'Account Created',
            value: formatDiscordTimestamp(member.user.createdAt, 'R'),
            inline: true,
          },
          {
            name: 'Is Admin',
            value: isAdmin ? '✅ Yes' : '❌ No',
            inline: true,
          }
        )
        .setTimestamp();

      await notificationsChannel.send({
        embeds: [notificationEmbed],
      });
    }
  } catch (error) {
    botLogger.error('Failed to send join notification', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Auto-assign roles (if configured)
  // For now, we don't have roles configured, but this is where we'd add them
  if (isAdmin) {
    botLogger.info('Admin user joined - no role assignment needed', {
      userId: member.user.id,
    });
  }
}

/**
 * Register the guild member add event handler
 */
export function registerGuildMemberAddEvent(client: Client): void {
  client.on(Events.GuildMemberAdd, handleGuildMemberAdd);
}
