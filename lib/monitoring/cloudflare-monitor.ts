/**
 * @file Cloudflare Monitoring Service
 * @description Background monitoring for Cloudflare DNS, SSL, and zone status with Discord notifications
 */

import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';
import { getZone, getSSLStatus } from '@/lib/integrations/cloudflare';

const CLOUDFLARE_POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes (less frequent)
const CLOUDFLARE_NOTIFICATION_CHANNEL = process.env.DISCORD_CHANNEL_ADMIN_LOGS;

interface MonitoredZone {
  name: string;
  status: string;
  paused: boolean;
}

interface MonitoredSSL {
  type: string;
  status: string;
  expiresOn: string;
  hosts: string[];
}

let cloudflareMonitorInterval: NodeJS.Timeout | null = null;
let lastZoneCheck: MonitoredZone | null = null;
const lastSSLCheck: Map<string, MonitoredSSL> = new Map();

/**
 * Send Discord notification for zone status change
 */
async function notifyZoneStatusChange(
  client: Client,
  zone: MonitoredZone,
  previousStatus: string
): Promise<void> {
  if (!CLOUDFLARE_NOTIFICATION_CHANNEL) return;

  if (!client || !client.isReady()) {
    logger.debug('Discord client not available or not ready, skipping notification');
    return;
  }

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      logger.error('No guild found in cache');
      return;
    }

    const channel = guild.channels.cache.get(CLOUDFLARE_NOTIFICATION_CHANNEL);

    if (!channel || !channel.isTextBased()) return;

    const isDown = zone.status !== 'active' || zone.paused;

    const embed = new EmbedBuilder()
      .setTitle(isDown ? '⚠️ Cloudflare Zone Issue' : '✅ Cloudflare Zone Recovered')
      .setColor(isDown ? 0xffa500 : 0x00ff00)
      .setDescription(`Zone **${zone.name}** status changed`)
      .addFields(
        { name: 'Previous Status', value: previousStatus, inline: true },
        { name: 'Current Status', value: zone.status, inline: true },
        { name: 'Paused', value: zone.paused ? 'Yes' : 'No', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Cloudflare Monitoring' });

    await channel.send({ embeds: [embed] });

    logger.info(`Sent zone status change notification for ${zone.name}`);
  } catch (error) {
    logger.error('Failed to send Cloudflare zone status notification:', error);
  }
}

/**
 * Send Discord notification for SSL certificate expiring soon
 */
async function notifySSLExpiring(client: Client, cert: MonitoredSSL): Promise<void> {
  if (!CLOUDFLARE_NOTIFICATION_CHANNEL) return;

  if (!client || !client.isReady()) {
    logger.debug('Discord client not available or not ready, skipping notification');
    return;
  }

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      logger.error('No guild found in cache');
      return;
    }

    const channel = guild.channels.cache.get(CLOUDFLARE_NOTIFICATION_CHANNEL);

    if (!channel || !channel.isTextBased()) return;

    const expiresAt = new Date(cert.expiresOn);
    const daysUntilExpiry = Math.floor(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Cloudflare SSL Certificate Expiring Soon')
      .setColor(0xffa500)
      .setDescription(`SSL certificate for **${cert.hosts.join(', ')}** expires in ${daysUntilExpiry} days`)
      .addFields(
        { name: 'Type', value: cert.type, inline: true },
        { name: 'Status', value: cert.status, inline: true },
        { name: 'Expires On', value: expiresAt.toLocaleDateString(), inline: true },
        { name: 'Hosts', value: cert.hosts.join('\n'), inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Cloudflare Monitoring' });

    await channel.send({ embeds: [embed] });

    logger.info(`Sent SSL expiring notification for ${cert.hosts.join(', ')}`);
  } catch (error) {
    logger.error('Failed to send SSL expiring notification:', error);
  }
}

/**
 * Monitor Cloudflare zone and SSL status
 */
async function monitorCloudflare(client: Client): Promise<void> {
  try {
    const [zone, sslCerts] = await Promise.all([getZone(), getSSLStatus()]);

    const monitoredZone: MonitoredZone = {
      name: zone.name,
      status: zone.status,
      paused: zone.paused,
    };

    // Check for zone status changes
    if (lastZoneCheck) {
      if (
        lastZoneCheck.status !== zone.status ||
        lastZoneCheck.paused !== zone.paused
      ) {
        await notifyZoneStatusChange(client, monitoredZone, lastZoneCheck.status);

        // Create alert in database (non-blocking)
        setImmediate(async () => {
          try {
            await prisma.monitoringAlert.create({
              data: {
                type: 'UPTIME_CHECK',
                severity: zone.status === 'active' && !zone.paused ? 'INFO' : 'WARNING',
                source: 'Cloudflare',
                message: `Zone status changed: ${zone.name}`,
                metadata: monitoredZone as any,
              },
            });
          } catch (error) {
            logger.error('Failed to create monitoring alert', error);
          }
        });
      }
    }

    lastZoneCheck = monitoredZone;

    // Check SSL certificates
    for (const cert of sslCerts) {
      if (cert.status !== 'active') continue;

      const certKey = cert.hosts.join(',');
      const monitoredSSL: MonitoredSSL = {
        type: cert.type,
        status: cert.status,
        expiresOn: cert.expires_on,
        hosts: cert.hosts,
      };

      const expiresAt = new Date(cert.expires_on);
      const daysUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

      // Warn if cert expires in less than 30 days
      const previous = lastSSLCheck.get(certKey);
      if (daysUntilExpiry < 30 && daysUntilExpiry > 0) {
        // Only notify once per cert (not already notified)
        if (!previous || previous.status !== 'expiring_soon') {
          await notifySSLExpiring(client, monitoredSSL);

          // Create alert (non-blocking)
          setImmediate(async () => {
            try {
              await prisma.monitoringAlert.create({
                data: {
                  type: 'NOTIFICATION',
                  severity: 'WARNING',
                  source: 'Cloudflare',
                  message: `SSL certificate expiring soon: ${cert.hosts.join(', ')}`,
                  metadata: { ...monitoredSSL, daysUntilExpiry: Math.floor(daysUntilExpiry) } as any,
                },
              });
            } catch (error) {
              logger.error('Failed to create monitoring alert', error);
            }
          });

          // Mark as notified
          lastSSLCheck.set(certKey, { ...monitoredSSL, status: 'expiring_soon' });
        }
      } else {
        lastSSLCheck.set(certKey, monitoredSSL);
      }
    }
  } catch (error) {
    logger.error('Failed to monitor Cloudflare:', error);
  }
}

/**
 * Run Cloudflare monitoring checks
 */
async function runCloudflareMonitoring(client: Client): Promise<void> {
  try {
    logger.info('Running Cloudflare monitoring checks...');

    await monitorCloudflare(client);

    logger.info('Cloudflare monitoring checks complete');
  } catch (error) {
    logger.error('Cloudflare monitoring failed:', error);
  }
}

/**
 * Start Cloudflare background monitoring
 */
export function startCloudflareMonitoring(client: Client): void {
  if (cloudflareMonitorInterval) {
    logger.warn('Cloudflare monitoring already running, restarting...');
    stopCloudflareMonitoring();
  }

  // Run initial check immediately (channels are already cached)
  runCloudflareMonitoring(client);

  // Schedule recurring checks
  cloudflareMonitorInterval = setInterval(() => {
    runCloudflareMonitoring(client);
  }, CLOUDFLARE_POLL_INTERVAL);

  logger.info(`Cloudflare monitoring started (${CLOUDFLARE_POLL_INTERVAL / 60000}-minute interval)`);
}

/**
 * Stop Cloudflare background monitoring
 */
export function stopCloudflareMonitoring(): void {
  if (cloudflareMonitorInterval) {
    clearInterval(cloudflareMonitorInterval);
    cloudflareMonitorInterval = null;
    logger.info('Cloudflare monitoring stopped');
  }
}
