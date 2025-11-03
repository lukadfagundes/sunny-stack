/**
 * Monitoring Notifications
 *
 * Handles sending notifications for monitoring alerts and system events
 *
 * @module bot/notifications/monitoring-notifications
 */

import { Client, EmbedBuilder } from 'discord.js';
import { BaseNotificationSender } from './base-sender';
import { loadChannelConfig, loadBotConfig } from '../config';
import { createMonitoringEmbed, COLORS } from '../utils/embed-builder';
import { formatDiscordTimestamp } from '../utils/formatters';
import { botLogger } from '../core/logger';

export interface MonitoringNotificationPayload {
  alert: {
    id: string;
    type: string;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    source: string;
    message: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  };
  eventType: 'alert' | 'resolved' | 'escalated';
  service?: {
    name: string;
    status: 'operational' | 'degraded' | 'down';
    uptime: number;
  };
}

/**
 * Monitoring Notification Sender
 */
export class MonitoringNotificationSender extends BaseNotificationSender {
  /**
   * Send monitoring alert notification
   */
  async sendAlert(payload: MonitoringNotificationPayload): Promise<boolean> {
    const { alert, service } = payload;
    const config = loadBotConfig();

    // Determine if admin should be mentioned based on severity
    const shouldMention = alert.severity === 'CRITICAL' || alert.severity === 'ERROR';

    const embed = createMonitoringEmbed(alert);

    if (service) {
      embed.addFields(
        {
          name: 'Service',
          value: service.name,
          inline: true,
        },
        {
          name: 'Status',
          value: service.status.toUpperCase(),
          inline: true,
        },
        {
          name: 'Uptime',
          value: `${service.uptime.toFixed(2)}%`,
          inline: true,
        }
      );
    }

    // Add metadata if available
    if (alert.metadata && Object.keys(alert.metadata).length > 0) {
      const metadataText = Object.entries(alert.metadata)
        .slice(0, 5) // Limit to 5 entries
        .map(([key, value]) => `**${key}:** ${String(value).slice(0, 100)}`)
        .join('\n');

      embed.addFields({
        name: '📋 Details',
        value: metadataText,
        inline: false,
      });
    }

    embed.addFields({
      name: '⚡ Quick Actions',
      value:
        '• Check status: `/monitor-status`\n' +
        '• View services: `/monitor-services`\n' +
        '• View all alerts: `/monitor-alerts`',
      inline: false,
    });

    return this.send({
      content: shouldMention ? '🚨 **ALERT**' : undefined,
      embeds: [embed],
      mentions: shouldMention ? [config.adminUserId] : undefined,
    });
  }

  /**
   * Send alert resolved notification
   */
  async sendResolved(payload: MonitoringNotificationPayload): Promise<boolean> {
    const { alert, service } = payload;

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('✅ Alert Resolved')
      .setDescription(`**${alert.source}** - ${alert.type}\n\n${alert.message}`)
      .addFields({
        name: 'Original Alert',
        value: `ID: \`${alert.id}\`\nSeverity: ${alert.severity}`,
        inline: true,
      });

    if (service) {
      embed.addFields({
        name: 'Current Status',
        value: `${service.name}: ${service.status.toUpperCase()}\nUptime: ${service.uptime.toFixed(2)}%`,
        inline: true,
      });
    }

    embed.setFooter({
      text: `Alert ID: ${alert.id}`,
    });

    embed.setTimestamp();

    return this.send({
      embeds: [embed],
    });
  }

  /**
   * Send escalated alert notification
   */
  async sendEscalated(payload: MonitoringNotificationPayload): Promise<boolean> {
    const { alert, service } = payload;
    const config = loadBotConfig();

    const embed = new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle('🔴 ESCALATED ALERT')
      .setDescription(
        `**${alert.source}** - ${alert.type}\n\n` +
          `${alert.message}\n\n` +
          `⚠️ This alert has been escalated due to persistence or severity.`
      )
      .addFields(
        {
          name: 'Severity',
          value: alert.severity,
          inline: true,
        },
        {
          name: 'Alert ID',
          value: `\`${alert.id}\``,
          inline: true,
        },
        {
          name: 'Timestamp',
          value: formatDiscordTimestamp(alert.timestamp, 'F'),
          inline: true,
        }
      );

    if (service) {
      embed.addFields({
        name: 'Service Status',
        value: `${service.name}: **${service.status.toUpperCase()}**\nUptime: ${service.uptime.toFixed(2)}%`,
        inline: false,
      });
    }

    embed.addFields({
      name: '🚨 Required Action',
      value:
        '• Investigate immediately\n' +
        '• Check service logs\n' +
        '• Verify infrastructure status\n' +
        '• Escalate to service provider if needed',
      inline: false,
    });

    return this.send({
      content: '🚨 **CRITICAL ESCALATION**',
      embeds: [embed],
      mentions: [config.adminUserId],
    });
  }

  /**
   * Send deployment notification
   */
  async sendDeployment(data: {
    service: string;
    version: string;
    status: 'started' | 'completed' | 'failed';
    environment: string;
    timestamp: string;
    url?: string;
  }): Promise<boolean> {
    const statusColors = {
      started: COLORS.INFO,
      completed: COLORS.SUCCESS,
      failed: COLORS.ERROR,
    };

    const statusIcons = {
      started: '🚀',
      completed: '✅',
      failed: '❌',
    };

    const embed = new EmbedBuilder()
      .setColor(statusColors[data.status])
      .setTitle(`${statusIcons[data.status]} Deployment ${data.status.toUpperCase()}`)
      .addFields(
        {
          name: 'Service',
          value: data.service,
          inline: true,
        },
        {
          name: 'Environment',
          value: data.environment,
          inline: true,
        },
        {
          name: 'Version',
          value: data.version,
          inline: true,
        },
        {
          name: 'Timestamp',
          value: formatDiscordTimestamp(data.timestamp, 'F'),
          inline: false,
        }
      );

    if (data.url) {
      embed.addFields({
        name: '🔗 URL',
        value: data.url,
        inline: false,
      });
    }

    embed.setTimestamp();

    return this.send({
      embeds: [embed],
    });
  }

  /**
   * Send uptime check notification
   */
  async sendUptimeCheck(data: {
    service: string;
    status: 'up' | 'down';
    responseTime?: number;
    statusCode?: number;
    timestamp: string;
  }): Promise<boolean> {
    const isDown = data.status === 'down';

    const embed = new EmbedBuilder()
      .setColor(isDown ? COLORS.ERROR : COLORS.SUCCESS)
      .setTitle(`${isDown ? '🔴' : '🟢'} Uptime Check: ${data.service}`)
      .addFields(
        {
          name: 'Status',
          value: data.status.toUpperCase(),
          inline: true,
        },
        {
          name: 'Response Time',
          value: data.responseTime ? `${data.responseTime}ms` : 'N/A',
          inline: true,
        }
      );

    if (data.statusCode) {
      embed.addFields({
        name: 'HTTP Status',
        value: data.statusCode.toString(),
        inline: true,
      });
    }

    embed.setTimestamp(new Date(data.timestamp));

    // Only send if service is down
    if (isDown) {
      const config = loadBotConfig();
      return this.send({
        content: '⚠️ **Service Down**',
        embeds: [embed],
        mentions: [config.adminUserId],
      });
    }

    return true; // Don't spam for successful checks
  }
}

/**
 * Factory function to create monitoring notification sender
 */
export function createMonitoringNotificationSender(
  client: Client
): MonitoringNotificationSender {
  const channels = loadChannelConfig();
  return new MonitoringNotificationSender(client, channels.adminLogs);
}

/**
 * Handle incoming monitoring webhook notification
 */
export async function handleMonitoringWebhook(
  client: Client,
  payload: MonitoringNotificationPayload
): Promise<void> {
  const sender = createMonitoringNotificationSender(client);

  try {
    switch (payload.eventType) {
      case 'alert':
        await sender.sendAlert(payload);
        break;
      case 'resolved':
        await sender.sendResolved(payload);
        break;
      case 'escalated':
        await sender.sendEscalated(payload);
        break;
      default:
        botLogger.warn('Unknown monitoring event type', {
          eventType: payload.eventType,
        });
    }
  } catch (error) {
    botLogger.error('Failed to handle monitoring webhook', {
      eventType: payload.eventType,
      alertId: payload.alert.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
