/**
 * @file cron-job.org Monitoring Service
 * @description Background monitoring for cron-job.org scheduled jobs with Discord notifications
 */

import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';
import { getCronJobs, getJobExecutions } from '@/lib/integrations/cronjob';

const CRONJOB_POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes
const CRONJOB_NOTIFICATION_CHANNEL = process.env.DISCORD_CHANNEL_ADMIN_LOGS;

interface MonitoredJob {
  id: number;
  title: string;
  url: string;
  enabled: boolean;
  lastExecution?: {
    date: string;
    status: string;
    httpStatus: number;
  };
}

let cronjobMonitorInterval: NodeJS.Timeout | null = null;
const lastJobCheck: Map<number, MonitoredJob> = new Map();

/**
 * Send Discord notification for job failure
 */
async function notifyJobFailure(
  client: Client,
  job: MonitoredJob,
  execution: {
    date: string;
    httpStatus: number;
    statusText: string;
  }
): Promise<void> {
  if (!CRONJOB_NOTIFICATION_CHANNEL) return;

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

    const channel = guild.channels.cache.get(CRONJOB_NOTIFICATION_CHANNEL);

    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle('❌ Cron Job Failed')
      .setColor(0xff0000)
      .setDescription(`Job **${job.title}** failed to execute`)
      .addFields(
        { name: '🔗 URL', value: job.url, inline: false },
        { name: '📊 HTTP Status', value: execution.httpStatus.toString(), inline: true },
        { name: '⏰ Execution Time', value: new Date(execution.date).toLocaleString(), inline: true }
      )
      .setTimestamp(new Date(execution.date))
      .setFooter({ text: 'cron-job.org Monitoring' });

    await channel.send({ embeds: [embed] });

    logger.info(`Sent job failure notification for ${job.title}`);
  } catch (error) {
    logger.error('Failed to send cron job failure notification:', error);
  }
}

/**
 * Send Discord notification for job disabled
 */
async function notifyJobDisabled(client: Client, job: MonitoredJob): Promise<void> {
  if (!CRONJOB_NOTIFICATION_CHANNEL) return;

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

    const channel = guild.channels.cache.get(CRONJOB_NOTIFICATION_CHANNEL);

    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Cron Job Disabled')
      .setColor(0xffa500)
      .setDescription(`Job **${job.title}** has been disabled`)
      .addFields({ name: '🔗 URL', value: job.url, inline: false })
      .setTimestamp()
      .setFooter({ text: 'cron-job.org Monitoring' });

    await channel.send({ embeds: [embed] });

    logger.info(`Sent job disabled notification for ${job.title}`);
  } catch (error) {
    logger.error('Failed to send job disabled notification:', error);
  }
}

/**
 * Monitor cron jobs and executions
 */
async function monitorCronJobs(client: Client): Promise<void> {
  try {
    const jobs = await getCronJobs();

    for (const job of jobs) {
      const monitored: MonitoredJob = {
        id: job.jobId,
        title: job.title,
        url: job.url,
        enabled: job.enabled,
        lastExecution: job.lastExecution
          ? {
              date: job.lastExecution.date,
              status: job.lastExecution.status,
              httpStatus: job.lastExecution.httpStatus,
            }
          : undefined,
      };

      const previous = lastJobCheck.get(job.jobId);

      // Check for new failures
      if (
        job.lastExecution &&
        job.lastExecution.status === 'FAILED' &&
        (!previous?.lastExecution ||
          previous.lastExecution.date !== job.lastExecution.date)
      ) {
        await notifyJobFailure(client, monitored, {
          date: job.lastExecution.date,
          httpStatus: job.lastExecution.httpStatus,
          statusText: '',
        });

        // Create alert in database (non-blocking)
        setImmediate(async () => {
          try {
            await prisma.monitoringAlert.create({
              data: {
                type: 'ERROR',
                severity: 'ERROR',
                source: 'cron-job.org',
                message: `Cron job failed: ${monitored.title}`,
                metadata: monitored as any,
              },
            });
          } catch (error) {
            logger.error('Failed to create monitoring alert', error);
          }
        });
      }

      // Check if job was disabled
      if (!job.enabled && previous && previous.enabled) {
        await notifyJobDisabled(client, monitored);

        // Create alert (non-blocking)
        setImmediate(async () => {
          try {
            await prisma.monitoringAlert.create({
              data: {
                type: 'NOTIFICATION',
                severity: 'WARNING',
                source: 'cron-job.org',
                message: `Cron job disabled: ${monitored.title}`,
                metadata: monitored as any,
              },
            });
          } catch (error) {
            logger.error('Failed to create monitoring alert', error);
          }
        });
      }

      lastJobCheck.set(job.jobId, monitored);
    }

    // Clean up jobs that no longer exist
    const currentJobIds = new Set(jobs.map((j) => j.jobId));
    for (const [jobId] of lastJobCheck) {
      if (!currentJobIds.has(jobId)) {
        lastJobCheck.delete(jobId);
      }
    }
  } catch (error) {
    logger.error('Failed to monitor cron jobs:', error);
  }
}

/**
 * Run cron-job.org monitoring checks
 */
async function runCronJobMonitoring(client: Client): Promise<void> {
  try {
    logger.info('Running cron-job.org monitoring checks...');

    await monitorCronJobs(client);

    logger.info('cron-job.org monitoring checks complete');
  } catch (error) {
    logger.error('cron-job.org monitoring failed:', error);
  }
}

/**
 * Start cron-job.org background monitoring
 */
export function startCronJobMonitoring(client: Client): void {
  if (cronjobMonitorInterval) {
    logger.warn('cron-job.org monitoring already running, restarting...');
    stopCronJobMonitoring();
  }

  // Run initial check immediately (channels are already cached)
  runCronJobMonitoring(client);

  // Schedule recurring checks
  cronjobMonitorInterval = setInterval(() => {
    runCronJobMonitoring(client);
  }, CRONJOB_POLL_INTERVAL);

  logger.info(`cron-job.org monitoring started (${CRONJOB_POLL_INTERVAL / 60000}-minute interval)`);
}

/**
 * Stop cron-job.org background monitoring
 */
export function stopCronJobMonitoring(): void {
  if (cronjobMonitorInterval) {
    clearInterval(cronjobMonitorInterval);
    cronjobMonitorInterval = null;
    logger.info('cron-job.org monitoring stopped');
  }
}
