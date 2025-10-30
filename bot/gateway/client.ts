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
import { botLogger } from '../core/logger';
import { DiscordError } from '../core/errors';

/**
 * Start Gateway bot
 *
 * @param config - Bot configuration
 * @returns Promise resolving when bot is ready
 */
export async function startGatewayBot(config: BotConfig): Promise<Client> {
  try {
    botLogger.info('Starting Gateway bot...');

    // Create Discord client
    const client = createDiscordClient(config);

    // Register event handlers
    registerEventHandlers(client, config);

    // Set up graceful shutdown
    setupGracefulShutdown(client);

    // Connect to Discord
    await connectClient(client, config);

    // Wait for ready event
    await waitForReady(client);

    botLogger.info('Gateway bot started successfully', {
      guilds: client.guilds.cache.size,
      user: client.user?.tag,
    });

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
  client.on(Events.Resumed, () => {
    botLogger.info('Gateway connection resumed');
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
