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
    setupGracefulShutdown(client, stopServiceHealthMonitoring);

    // Connect to Discord
    await connectClient(client, config);

    // Wait for ready event
    await waitForReady(client);

    botLogger.info('Gateway bot started successfully', {
      guilds: client.guilds.cache.size,
      user: client.user?.tag,
    });

    // Start service health monitoring
    startServiceHealthMonitoring();
    botLogger.info('Service health monitoring initialized');

    // Discover and register commands
    await discoverCommands();

    // Store bot start time and client globally for monitoring API
    global.botStartTime = Date.now();
    global.discordClient = client;
    // Note: botCommandsCount is set by discoverCommands() internally

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
