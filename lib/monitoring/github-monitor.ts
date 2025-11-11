/**
 * @file GitHub Monitoring Service
 * @description Background monitoring for GitHub workflows, PRs, and deployments with Discord notifications
 */

import { EmbedBuilder, TextChannel } from 'discord.js';
import type { Client } from '@/bot/types';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';
import {
  getFailedWorkflows,
  getOpenPullRequests,
  getRecentWorkflowRuns,
  getGitHubHealth,
} from '@/lib/integrations/github';

const GITHUB_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const GITHUB_NOTIFICATION_CHANNEL = process.env.DISCORD_CHANNEL_ADMIN_LOGS;

interface MonitoredWorkflow {
  id: number;
  name: string;
  repository: string;
  status: string;
  conclusion: string | null;
  url: string;
  branch: string;
  event: string;
  createdAt: string;
}

interface MonitoredPullRequest {
  id: number;
  number: number;
  title: string;
  repository: string;
  state: string;
  url: string;
  author: string;
  draft: boolean;
  updatedAt: string;
}

let githubMonitorInterval: NodeJS.Timeout | null = null;
let lastWorkflowCheck: Map<number, MonitoredWorkflow> = new Map();
let lastPRCheck: Map<number, MonitoredPullRequest> = new Map();

/**
 * Send Discord notification for workflow failure
 */
async function notifyWorkflowFailure(
  client: Client,
  workflow: MonitoredWorkflow
): Promise<void> {
  if (!GITHUB_NOTIFICATION_CHANNEL) {
    logger.warn('DISCORD_CHANNEL_ADMIN_LOGS not configured, skipping notification');
    return;
  }

  // Check if client exists and is ready before attempting to send notifications
  if (!client || !client.isReady()) {
    logger.debug('Discord client not available or not ready, skipping notification');
    return;
  }

  try {
    // Use guild cache instead of fetching from API - faster and more reliable
    const guild = client.guilds.cache.first();
    if (!guild) {
      logger.error('No guild found in cache');
      return;
    }

    logger.info(`DEBUG: Looking for channel ID: ${GITHUB_NOTIFICATION_CHANNEL}`);
    logger.info(`DEBUG: Guild has ${guild.channels.cache.size} channels in cache`);
    logger.info(`DEBUG: Guild ID: ${guild.id}, Name: ${guild.name}`);

    const channel = guild.channels.cache.get(GITHUB_NOTIFICATION_CHANNEL);

    logger.info(`DEBUG: Channel found: ${channel ? 'YES' : 'NO'}`);
    if (channel) {
      logger.info(`DEBUG: Channel type: ${channel.type}, isTextBased: ${channel.isTextBased()}`);
      logger.info(`DEBUG: Is TextChannel: ${channel instanceof TextChannel}`);
    }

    if (!channel || !channel.isTextBased()) {
      logger.error('Admin logs channel not found or not a text channel');
      logger.error(`DEBUG: Available channel IDs in cache: ${Array.from(guild.channels.cache.keys()).join(', ')}`);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('❌ GitHub Workflow Failed')
      .setColor(0xff0000)
      .setDescription(`**${workflow.name}** failed in **${workflow.repository}**`)
      .addFields(
        { name: '📂 Repository', value: workflow.repository, inline: true },
        { name: '🌿 Branch', value: workflow.branch, inline: true },
        { name: '⚡ Event', value: workflow.event, inline: true },
        { name: '🔗 Workflow URL', value: `[View Workflow](${workflow.url})`, inline: false }
      )
      .setTimestamp(new Date(workflow.createdAt))
      .setFooter({ text: 'GitHub Monitoring' });

    await channel.send({ embeds: [embed] });

    logger.info(`Sent workflow failure notification for ${workflow.repository} - ${workflow.name}`);
  } catch (error) {
    logger.error('Failed to send workflow failure notification:', error);
  }
}

/**
 * Send Discord notification for new pull request
 */
async function notifyNewPullRequest(
  client: Client,
  pr: MonitoredPullRequest
): Promise<void> {
  if (!GITHUB_NOTIFICATION_CHANNEL) {
    logger.warn('DISCORD_CHANNEL_ADMIN_LOGS not configured, skipping notification');
    return;
  }

  // Check if client is ready before attempting to send notifications
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

    const channel = guild.channels.cache.get(GITHUB_NOTIFICATION_CHANNEL);

    if (!channel || !(channel instanceof TextChannel)) {
      logger.error('Admin logs channel not found or not a text channel');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🔀 New Pull Request')
      .setColor(pr.draft ? 0xffa500 : 0x00ff00)
      .setDescription(`**#${pr.number}** - ${pr.title}`)
      .addFields(
        { name: '👤 Author', value: pr.author, inline: true },
        { name: '📝 Status', value: pr.draft ? '📋 Draft' : '✅ Ready for Review', inline: true },
        { name: '🔗 Pull Request URL', value: `[View PR](${pr.url})`, inline: false }
      )
      .setTimestamp(new Date(pr.updatedAt))
      .setFooter({ text: 'GitHub Monitoring' });

    await channel.send({ embeds: [embed] });

    logger.info(`Sent new PR notification for #${pr.number} - ${pr.title}`);
  } catch (error) {
    logger.error('Failed to send PR notification:', error);
  }
}

/**
 * Send Discord notification for workflow recovery
 */
async function notifyWorkflowSuccess(
  client: Client,
  workflow: MonitoredWorkflow
): Promise<void> {
  if (!GITHUB_NOTIFICATION_CHANNEL) return;

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

    const channel = guild.channels.cache.get(GITHUB_NOTIFICATION_CHANNEL);

    if (!channel || !(channel instanceof TextChannel)) {
      logger.error('Admin logs channel not found');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ GitHub Workflow Recovered')
      .setColor(0x00ff00)
      .setDescription(`**${workflow.name}** succeeded in **${workflow.repository}**`)
      .addFields(
        { name: '📂 Repository', value: workflow.repository, inline: true },
        { name: '🌿 Branch', value: workflow.branch, inline: true },
        { name: '🔗 Workflow URL', value: `[View Workflow](${workflow.url})`, inline: false }
      )
      .setTimestamp(new Date(workflow.createdAt))
      .setFooter({ text: 'GitHub Monitoring' });

    await channel.send({ embeds: [embed] });

    logger.info(`Sent workflow success notification for ${workflow.repository} - ${workflow.name}`);
  } catch (error) {
    logger.error('Failed to send workflow success notification:', error);
  }
}

/**
 * Send Discord notification for API rate limit warning
 */
async function notifyRateLimitWarning(
  client: Client,
  remaining: number,
  limit: number,
  resetAt: Date
): Promise<void> {
  if (!GITHUB_NOTIFICATION_CHANNEL) return;

  if (!client || !client.isReady()) {
    logger.debug('Discord client not available or not ready, skipping notification');
    return;
  }

  try {
    const channel = await client.channels.fetch(GITHUB_NOTIFICATION_CHANNEL);

    if (!channel || !(channel instanceof TextChannel)) return;

    const embed = new EmbedBuilder()
      .setTitle('⚠️ GitHub API Rate Limit Warning')
      .setColor(0xffa500)
      .setDescription(`GitHub API rate limit is running low!`)
      .addFields(
        { name: '📊 Remaining', value: `${remaining}/${limit}`, inline: true },
        { name: '🔄 Resets At', value: resetAt.toLocaleString(), inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'GitHub Monitoring' });

    await channel.send({ embeds: [embed] });

    logger.warn(`Sent rate limit warning: ${remaining}/${limit} remaining`);
  } catch (error) {
    logger.error('Failed to send rate limit warning:', error);
  }
}

/**
 * Monitor GitHub workflows and notify on failures/recoveries
 */
async function monitorWorkflows(client: Client): Promise<void> {
  try {
    const recentWorkflows = await getRecentWorkflowRuns(20, 'completed');

    for (const workflow of recentWorkflows) {
      const monitored: MonitoredWorkflow = {
        id: workflow.id,
        name: workflow.name,
        repository: workflow.repository.full_name,
        status: workflow.status,
        conclusion: workflow.conclusion,
        url: workflow.html_url,
        branch: workflow.head_branch,
        event: workflow.event,
        createdAt: workflow.created_at,
      };

      const previous = lastWorkflowCheck.get(workflow.id);

      // New workflow failure detected
      if (workflow.conclusion === 'failure' && !previous) {
        await notifyWorkflowFailure(client, monitored);

        // Create alert in database
        await prisma.monitoringAlert.create({
          data: {
            type: 'ERROR',
            severity: 'ERROR',
            source: 'GitHub',
            message: `Workflow failed: ${monitored.repository} - ${monitored.name}`,
            metadata: monitored,
          },
        });
      }

      // Workflow recovered (was failing, now succeeded)
      if (
        workflow.conclusion === 'success' &&
        previous &&
        previous.conclusion === 'failure'
      ) {
        await notifyWorkflowSuccess(client, monitored);

        // Create recovery alert
        await prisma.monitoringAlert.create({
          data: {
            type: 'UPTIME_CHECK',
            severity: 'INFO',
            source: 'GitHub',
            message: `Workflow recovered: ${monitored.repository} - ${monitored.name}`,
            metadata: monitored,
          },
        });
      }

      lastWorkflowCheck.set(workflow.id, monitored);
    }

    // Clean up old entries (keep last 100)
    if (lastWorkflowCheck.size > 100) {
      const entries = Array.from(lastWorkflowCheck.entries());
      lastWorkflowCheck = new Map(entries.slice(-100));
    }
  } catch (error) {
    logger.error('Failed to monitor GitHub workflows:', error);
  }
}

/**
 * Monitor GitHub pull requests and notify on new PRs
 */
async function monitorPullRequests(client: Client): Promise<void> {
  try {
    const openPRs = await getOpenPullRequests(20);

    for (const pr of openPRs) {
      const monitored: MonitoredPullRequest = {
        id: pr.id,
        number: pr.number,
        title: pr.title,
        repository: '', // PR search doesn't include repo, we'll parse from URL
        state: pr.state,
        url: pr.html_url,
        author: pr.user.login,
        draft: pr.draft,
        updatedAt: pr.updated_at,
      };

      const previous = lastPRCheck.get(pr.id);

      // New PR detected
      if (!previous) {
        await notifyNewPullRequest(client, monitored);

        // Create alert in database
        await prisma.monitoringAlert.create({
          data: {
            type: 'NOTIFICATION',
            severity: 'INFO',
            source: 'GitHub',
            message: `New pull request: #${monitored.number} - ${monitored.title}`,
            metadata: monitored,
          },
        });
      }

      lastPRCheck.set(pr.id, monitored);
    }

    // Clean up old entries
    if (lastPRCheck.size > 100) {
      const entries = Array.from(lastPRCheck.entries());
      lastPRCheck = new Map(entries.slice(-100));
    }
  } catch (error) {
    logger.error('Failed to monitor GitHub pull requests:', error);
  }
}

/**
 * Check GitHub API rate limit and warn if low
 */
async function checkRateLimit(client: Client): Promise<void> {
  try {
    const health = await getGitHubHealth();

    const { remaining, limit, reset } = health.rateLimit;

    // Warn if less than 20% remaining
    if (remaining < limit * 0.2) {
      await notifyRateLimitWarning(client, remaining, limit, reset);
    }
  } catch (error) {
    logger.error('Failed to check GitHub rate limit:', error);
  }
}

/**
 * Run all GitHub monitoring checks
 */
async function runGitHubMonitoring(client: Client): Promise<void> {
  try {
    logger.info('Running GitHub monitoring checks...');

    await Promise.all([
      monitorWorkflows(client),
      monitorPullRequests(client),
      checkRateLimit(client),
    ]);

    logger.info('GitHub monitoring checks complete');
  } catch (error) {
    logger.error('GitHub monitoring failed:', error);
  }
}

/**
 * Start GitHub background monitoring
 */
export function startGitHubMonitoring(client: Client): void {
  if (githubMonitorInterval) {
    logger.warn('GitHub monitoring already running, restarting...');
    stopGitHubMonitoring();
  }

  // Delay initial check by 5 seconds to ensure Discord client is fully ready
  setTimeout(() => {
    runGitHubMonitoring(client);
  }, 5000);

  // Schedule recurring checks
  githubMonitorInterval = setInterval(() => {
    runGitHubMonitoring(client);
  }, GITHUB_POLL_INTERVAL);

  logger.info(`GitHub monitoring started (${GITHUB_POLL_INTERVAL / 60000}-minute interval, first check in 5s)`);
}

/**
 * Stop GitHub background monitoring
 */
export function stopGitHubMonitoring(): void {
  if (githubMonitorInterval) {
    clearInterval(githubMonitorInterval);
    githubMonitorInterval = null;
    logger.info('GitHub monitoring stopped');
  }
}
