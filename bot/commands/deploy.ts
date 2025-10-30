/**
 * Command Deployment Script
 *
 * Registers slash commands with Discord API
 *
 * @module bot/commands/deploy
 */

import { REST, Routes } from 'discord.js';
import { commandRegistry } from './registry';
import { botLogger } from '../core/logger';
import type { BotConfig } from '../types';

/**
 * Deploy commands to Discord
 *
 * @param config - Bot configuration
 * @returns Promise resolving when commands are deployed
 */
export async function deployCommands(config: BotConfig): Promise<void> {
  try {
    botLogger.info('Starting command deployment...');

    const commands = commandRegistry.getAllData();

    if (commands.length === 0) {
      botLogger.warn('No commands to deploy');
      return;
    }

    // Create REST client
    const rest = new REST({ version: '10' }).setToken(config.token);

    botLogger.info('Deploying commands to Discord', {
      count: commands.length,
      guildId: config.guildId,
    });

    // Register guild commands (faster updates, recommended for development)
    await rest.put(
      Routes.applicationGuildCommands(config.applicationId, config.guildId),
      { body: commands }
    );

    botLogger.info('Commands deployed successfully', {
      count: commands.length,
      commands: commands.map((cmd) => cmd.name),
    });
  } catch (error) {
    const err = error as Error;
    botLogger.error('Command deployment failed', {
      error: err.message,
      stack: err.stack,
    });
    throw error;
  }
}

/**
 * Deploy commands globally (production use)
 *
 * Note: Global commands can take up to 1 hour to propagate
 *
 * @param config - Bot configuration
 * @returns Promise resolving when commands are deployed
 */
export async function deployGlobalCommands(config: BotConfig): Promise<void> {
  try {
    botLogger.info('Starting global command deployment...');

    const commands = commandRegistry.getAllData();

    if (commands.length === 0) {
      botLogger.warn('No commands to deploy');
      return;
    }

    const rest = new REST({ version: '10' }).setToken(config.token);

    botLogger.warn('Deploying global commands (may take up to 1 hour)', {
      count: commands.length,
    });

    // Register global commands
    await rest.put(Routes.applicationCommands(config.applicationId), {
      body: commands,
    });

    botLogger.info('Global commands deployed successfully', {
      count: commands.length,
      commands: commands.map((cmd) => cmd.name),
    });
  } catch (error) {
    const err = error as Error;
    botLogger.error('Global command deployment failed', {
      error: err.message,
      stack: err.stack,
    });
    throw error;
  }
}

/**
 * Delete all guild commands
 *
 * @param config - Bot configuration
 */
export async function deleteGuildCommands(config: BotConfig): Promise<void> {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);

    botLogger.info('Deleting all guild commands...');

    await rest.put(
      Routes.applicationGuildCommands(config.applicationId, config.guildId),
      { body: [] }
    );

    botLogger.info('Guild commands deleted');
  } catch (error) {
    const err = error as Error;
    botLogger.error('Failed to delete guild commands', {
      error: err.message,
    });
    throw error;
  }
}

/**
 * Delete all global commands
 *
 * @param config - Bot configuration
 */
export async function deleteGlobalCommands(config: BotConfig): Promise<void> {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);

    botLogger.info('Deleting all global commands...');

    await rest.put(Routes.applicationCommands(config.applicationId), {
      body: [],
    });

    botLogger.info('Global commands deleted');
  } catch (error) {
    const err = error as Error;
    botLogger.error('Failed to delete global commands', {
      error: err.message,
    });
    throw error;
  }
}
