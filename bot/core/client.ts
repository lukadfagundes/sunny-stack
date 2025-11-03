/**
 * Discord Client Factory
 *
 * Creates and configures Discord.js client with proper intents
 *
 * @module bot/core/client
 */

import { Client, GatewayIntentBits, Events } from 'discord.js';
import type { BotConfig } from '../types';
import { DiscordError, ConfigurationError } from './errors';
import { botLogger } from './logger';

/**
 * Create Discord client with proper intents
 *
 * @param config - Bot configuration
 * @returns Configured Discord client
 * @throws {ConfigurationError} If configuration is invalid
 */
export function createDiscordClient(config: BotConfig): Client {
  // Validate token
  if (!config.token) {
    throw new ConfigurationError('Discord bot token is missing', 'DISCORD_BOT_TOKEN');
  }

  // Create client with required intents
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, // Access to guilds and channels
      GatewayIntentBits.GuildMessages, // Access to messages (for audit logging)
      GatewayIntentBits.MessageContent, // Access to message content
      GatewayIntentBits.GuildMembers, // Access to guild members
    ],
  });

  // Set up error handling
  client.on(Events.Error, (error) => {
    botLogger.error('Discord client error', {
      error: error.message,
      stack: error.stack,
    });
  });

  botLogger.info('Discord client created', {
    intents: ['Guilds', 'GuildMessages', 'MessageContent', 'GuildMembers'],
  });

  return client;
}

/**
 * Connect Discord client to Gateway
 *
 * @param client - Discord client instance
 * @param config - Bot configuration
 * @returns Promise resolving when connected
 * @throws {DiscordError} If connection fails
 */
export async function connectClient(client: Client, config: BotConfig): Promise<void> {
  try {
    botLogger.info('Connecting to Discord Gateway...');

    await client.login(config.token);

    botLogger.info('Successfully connected to Discord Gateway', {
      user: client.user?.tag,
      id: client.user?.id,
    });
  } catch (error) {
    const err = error as Error;
    botLogger.error('Failed to connect to Discord Gateway', {
      error: err.message,
    });
    throw new DiscordError(
      `Failed to connect to Discord: ${err.message}`,
      undefined,
      err
    );
  }
}

/**
 * Gracefully disconnect Discord client
 *
 * @param client - Discord client instance
 * @returns Promise resolving when disconnected
 */
export async function disconnectClient(client: Client): Promise<void> {
  try {
    botLogger.info('Disconnecting from Discord Gateway...');

    client.destroy();

    botLogger.info('Successfully disconnected from Discord Gateway');
  } catch (error) {
    const err = error as Error;
    botLogger.error('Error during disconnect', {
      error: err.message,
    });
  }
}

/**
 * Set up graceful shutdown handlers
 *
 * @param client - Discord client instance
 */
export function setupGracefulShutdown(client: Client): void {
  const shutdown = async (signal: string) => {
    botLogger.info(`Received ${signal}, shutting down gracefully...`);

    await disconnectClient(client);

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Wait for client to be ready
 *
 * @param client - Discord client instance
 * @param timeoutMs - Timeout in milliseconds (default: 30s)
 * @returns Promise resolving when client is ready
 * @throws {DiscordError} If timeout is reached
 */
export function waitForReady(client: Client, timeoutMs = 30000): Promise<void> {
  // If client is already ready, resolve immediately
  if (client.isReady()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new DiscordError(
          `Client failed to become ready within ${timeoutMs}ms`,
          undefined
        )
      );
    }, timeoutMs);

    client.once(Events.ClientReady, () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}
