/**
 * Gateway Bot Client (Raspberry Pi Mode)
 *
 * Maintains persistent WebSocket connection to Discord Gateway
 *
 * @module bot/gateway/client
 */

import { Client, Events } from 'discord.js';
import type { BotConfig } from '../types';
import { createDiscordClient, connectClient, setupGracefulShutdown, waitForReady } from '../core/client';
import { registerEventHandlers } from './events';
import { discoverCommands } from '../commands/registry';
import { botLogger } from '../core/logger';
import { DiscordError } from '../core/errors';
import { startServiceHealthMonitoring, stopServiceHealthMonitoring } from '../../lib/monitoring/service-health-checker';
import { startGitHubMonitoring, stopGitHubMonitoring } from '../../lib/monitoring/github-monitor';
import { startVercelMonitoring, stopVercelMonitoring } from '../../lib/monitoring/vercel-monitor';
import { startFlyioMonitoring, stopFlyioMonitoring } from '../../lib/monitoring/flyio-monitor';
import { startCloudflareMonitoring, stopCloudflareMonitoring } from '../../lib/monitoring/cloudflare-monitor';
import { startCronJobMonitoring, stopCronJobMonitoring } from '../../lib/monitoring/cronjob-monitor';

/**
 * Start Gateway bot
 *
 * @param config - Bot configuration
 * @returns Promise resolving when bot is ready
 */
export async function startGatewayBot(config: BotConfig): Promise<Client> {
  try {
    botLogger.info('Starting Gateway bot...');

    // Discover and register all commands
    await discoverCommands();

    // Create Discord client
    const client = createDiscordClient(config);

    // Register event handlers
    registerEventHandlers(client, config);

    // Set up graceful shutdown with health monitoring cleanup
    setupGracefulShutdown(client, () => {
      stopServiceHealthMonitoring();
      stopGitHubMonitoring();
      stopVercelMonitoring();
      stopFlyioMonitoring();
      stopCloudflareMonitoring();
      stopCronJobMonitoring();
    });

    // Connect to Discord
    await connectClient(client, config);

    // Wait for ready event
    await waitForReady(client);

    botLogger.info('Gateway bot started successfully', {
      guilds: client.guilds.cache.size,
      user: client.user?.tag,
    });

    // Store bot start time and client globally for monitoring API FIRST
    global.botStartTime = Date.now();
    global.discordClient = client;
    // Note: botCommandsCount is set by discoverCommands() internally

    // Ensure guild channels are cached before starting monitoring services
    const guild = client.guilds.cache.first();
    if (guild) {
      botLogger.info('Fetching guild channels to populate cache...');
      await guild.channels.fetch();
      botLogger.info(`Guild channels cached: ${guild.channels.cache.size} channels`);
    } else {
      botLogger.warn('No guild found in cache');
    }

    // Start service health monitoring
    startServiceHealthMonitoring();
    botLogger.info('Service health monitoring initialized');

    // Start GitHub monitoring
    startGitHubMonitoring(client);
    botLogger.info('GitHub monitoring initialized');

    // Start Vercel monitoring
    startVercelMonitoring(client);
    botLogger.info('Vercel monitoring initialized');

    // Start Fly.io monitoring
    startFlyioMonitoring(client);
    botLogger.info('Fly.io monitoring initialized');

    // Start Cloudflare monitoring
    startCloudflareMonitoring(client);
    botLogger.info('Cloudflare monitoring initialized');

    // Start cron-job.org monitoring
    startCronJobMonitoring(client);
    botLogger.info('cron-job.org monitoring initialized');

    return client;
  } catch (error) {
    const err = error as Error;
    botLogger.error('Failed to start Gateway bot', {
      error: err.message,
      stack: err.stack,
    });

    throw new DiscordError(
      `Gateway bot startup failed: ${err.message}`,
      undefined,
      err
    );
  }
}

/**
 * Handle bot reconnection
 *
 * @param client - Discord client
 */
export function handleReconnect(client: Client): void {
  client.on(Events.ShardResume, (shardId, replayedEvents) => {
    botLogger.info('Gateway shard resumed', { shardId, replayedEvents });
  });

  client.on(Events.Warn, (info) => {
    botLogger.warn('Gateway warning', { info });
  });

  client.on(Events.Debug, (info) => {
    if (process.env.NODE_ENV === 'development') {
      botLogger.debug('Gateway debug', { info });
    }
  });
}
