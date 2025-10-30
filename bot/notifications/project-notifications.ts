/**
 * Project Notifications
 *
 * Handles sending notifications for project-related events
 *
 * @module bot/notifications/project-notifications
 */

import { Client, EmbedBuilder } from 'discord.js';
import { BaseNotificationSender } from './base-sender';
import { loadChannelConfig } from '../config';
import { createProjectEmbed, COLORS } from '../utils/embed-builder';
import { formatCurrency, formatDiscordTimestamp } from '../utils/formatters';
import { botLogger } from '../core/logger';

export interface ProjectNotificationPayload {
  project: {
    id: string;
    title: string;
    clientName: string;
    clientEmail: string;
    status: string;
    budget: number | null;
    deadline: string | null;
    createdAt: string;
    updatedAt: string;
  };
  eventType: 'created' | 'updated' | 'status_changed' | 'deadline_approaching' | 'completed';
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

/**
 * Project Notification Sender
 */
export class ProjectNotificationSender extends BaseNotificationSender {
  /**
   * Send project created notification
   */
  async sendProjectCreated(payload: ProjectNotificationPayload): Promise<boolean> {
    const { project } = payload;

    const embed = createProjectEmbed(project);
    embed.setTitle('✨ New Project Created');
    embed.setDescription(`A new project has been created: **${project.title}**`);

    embed.addFields({
      name: '⚡ Quick Actions',
      value:
        `• View details: \`/project-status ${project.id}\`\n` +
        `• Start tracking time: \`/time-start ${project.id}\`\n` +
        `• Update project: \`/project-update ${project.id}\``,
      inline: false,
    });

    return this.send({
      embeds: [embed],
    });
  }

  /**
   * Send project updated notification
   */
  async sendProjectUpdated(payload: ProjectNotificationPayload): Promise<boolean> {
    const { project, changes } = payload;

    const embed = createProjectEmbed(project);
    embed.setTitle('📝 Project Updated');
    embed.setDescription(`Project **${project.title}** has been updated.`);

    if (changes && changes.length > 0) {
      const changesText = changes
        .map((change) => {
          const oldVal = change.oldValue?.toString() || 'Not set';
          const newVal = change.newValue?.toString() || 'Not set';
          return `**${change.field}**\n~~${oldVal}~~ → ${newVal}`;
        })
        .join('\n\n');

      embed.addFields({
        name: '🔄 Changes',
        value: changesText.slice(0, 1024),
        inline: false,
      });
    }

    return this.send({
      embeds: [embed],
    });
  }

  /**
   * Send project status changed notification
   */
  async sendProjectStatusChanged(payload: ProjectNotificationPayload): Promise<boolean> {
    const { project, changes } = payload;

    const statusChange = changes?.find((c) => c.field === 'status');
    const oldStatus = statusChange?.oldValue || 'Unknown';
    const newStatus = project.status;

    const statusColors: Record<string, number> = {
      PLANNING: COLORS.INFO,
      IN_PROGRESS: COLORS.PRIMARY,
      REVIEW: COLORS.WARNING,
      COMPLETE: COLORS.SUCCESS,
      ARCHIVED: COLORS.NEUTRAL,
    };

    const embed = new EmbedBuilder()
      .setColor(statusColors[newStatus] || COLORS.INFO)
      .setTitle('🔄 Project Status Changed')
      .setDescription(`**${project.title}**\n\n~~${oldStatus}~~ → **${newStatus}**`)
      .addFields(
        {
          name: 'Client',
          value: project.clientName,
          inline: true,
        },
        {
          name: 'Budget',
          value: project.budget ? formatCurrency(project.budget) : 'Not set',
          inline: true,
        }
      )
      .setFooter({
        text: `Project ID: ${project.id}`,
      })
      .setTimestamp();

    return this.send({
      embeds: [embed],
    });
  }

  /**
   * Send deadline approaching notification
   */
  async sendDeadlineApproaching(payload: ProjectNotificationPayload): Promise<boolean> {
    const { project } = payload;

    if (!project.deadline) {
      return false;
    }

    const daysUntil = Math.ceil(
      (new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle('⏰ Project Deadline Approaching')
      .setDescription(
        `**${project.title}** has a deadline approaching in **${daysUntil} day(s)**.`
      )
      .addFields(
        {
          name: 'Deadline',
          value: formatDiscordTimestamp(project.deadline, 'F'),
          inline: true,
        },
        {
          name: 'Current Status',
          value: project.status,
          inline: true,
        },
        {
          name: 'Client',
          value: project.clientName,
          inline: true,
        }
      )
      .addFields({
        name: '⚡ Quick Actions',
        value:
          `• View details: \`/project-status ${project.id}\`\n` +
          `• Update status: \`/project-update ${project.id} status:...\``,
        inline: false,
      })
      .setTimestamp();

    return this.send({
      content: '⚠️ **Deadline Alert**',
      embeds: [embed],
    });
  }

  /**
   * Send project completed notification
   */
  async sendProjectCompleted(payload: ProjectNotificationPayload): Promise<boolean> {
    const { project } = payload;

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('🎉 Project Completed')
      .setDescription(`**${project.title}** has been marked as complete!`)
      .addFields(
        {
          name: 'Client',
          value: project.clientName,
          inline: true,
        },
        {
          name: 'Budget',
          value: project.budget ? formatCurrency(project.budget) : 'Not set',
          inline: true,
        }
      )
      .addFields({
        name: '📊 Next Steps',
        value:
          `• View time report: \`/time-report project-id:${project.id}\`\n` +
          `• Archive project: \`/project-update ${project.id} status:ARCHIVED\``,
        inline: false,
      })
      .setTimestamp();

    return this.send({
      embeds: [embed],
    });
  }
}

/**
 * Factory function to create project notification sender
 */
export function createProjectNotificationSender(client: Client): ProjectNotificationSender {
  const channels = loadChannelConfig();
  return new ProjectNotificationSender(client, channels.NOTIFICATIONS_CHANNEL_ID);
}

/**
 * Handle incoming project webhook notification
 */
export async function handleProjectWebhook(
  client: Client,
  payload: ProjectNotificationPayload
): Promise<void> {
  const sender = createProjectNotificationSender(client);

  try {
    switch (payload.eventType) {
      case 'created':
        await sender.sendProjectCreated(payload);
        break;
      case 'updated':
        await sender.sendProjectUpdated(payload);
        break;
      case 'status_changed':
        await sender.sendProjectStatusChanged(payload);
        break;
      case 'deadline_approaching':
        await sender.sendDeadlineApproaching(payload);
        break;
      case 'completed':
        await sender.sendProjectCompleted(payload);
        break;
      default:
        botLogger.warn('Unknown project event type', {
          eventType: payload.eventType,
        });
    }
  } catch (error) {
    botLogger.error('Failed to handle project webhook', {
      eventType: payload.eventType,
      projectId: payload.project.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
