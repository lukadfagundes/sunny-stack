/**
 * Command Registry
 *
 * Central registry for all slash commands
 *
 * @module bot/commands/registry
 */

import type { Command } from '../types';
import { botLogger } from '../core/logger';

/**
 * Command registry singleton
 */
class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  /**
   * Register a command
   *
   * @param command - Command to register
   */
  register(command: Command): void {
    const name = command.data.name;

    if (this.commands.has(name)) {
      botLogger.warn('Command already registered, overwriting', { name });
    }

    this.commands.set(name, command);
    botLogger.info('Command registered', {
      name,
      permissions: command.permissions || 'none',
    });
  }

  /**
   * Get command by name
   *
   * @param name - Command name
   * @returns Command instance or undefined
   */
  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  /**
   * Get all registered commands
   *
   * @returns Array of all commands
   */
  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get all command data for registration
   *
   * @returns Array of command data (SlashCommandBuilder)
   */
  getAllData() {
    return this.getAll().map((cmd) => cmd.data.toJSON());
  }

  /**
   * Check if command exists
   *
   * @param name - Command name
   * @returns True if command is registered
   */
  has(name: string): boolean {
    return this.commands.has(name);
  }

  /**
   * Get command count
   *
   * @returns Number of registered commands
   */
  size(): number {
    return this.commands.size;
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.commands.clear();
    botLogger.info('Command registry cleared');
  }

  /**
   * Get command names
   *
   * @returns Array of command names
   */
  getNames(): string[] {
    return Array.from(this.commands.keys());
  }
}

/**
 * Singleton instance
 */
export const commandRegistry = new CommandRegistry();

/**
 * Auto-discover and register commands
 *
 * This function will be called during bot initialization to
 * dynamically load all command modules
 */
export async function discoverCommands(): Promise<void> {
  botLogger.info('Discovering commands...');

  try {
    // Import all command modules
    const commands = [
      // Project commands
      await import('./project/create'),
      await import('./project/list'),
      await import('./project/status'),
      await import('./project/update'),
      await import('./project/delete'),

      // Quote commands
      await import('./quote/list'),
      await import('./quote/review'),
      await import('./quote/convert'),
      await import('./quote/approve'),

      // Time tracking commands
      await import('./time/start'),
      await import('./time/stop'),
      await import('./time/log'),
      await import('./time/report'),

      // Monitor commands
      await import('./monitor/status'),
      await import('./monitor/services'),
      await import('./monitor/alerts'),
      await import('./monitoring/monitor-github'),

      // Admin commands
      await import('./admin/sync'),
      await import('./admin/health'),
    ];

    // Register each command
    for (const module of commands) {
      const command = module.default;
      if (command && command.data) {
        commandRegistry.register(command);
      } else {
        botLogger.error('Invalid command module', { module });
      }
    }

    const commandCount = commandRegistry.size();
    botLogger.info('Command discovery complete', {
      count: commandCount,
      commands: commandRegistry.getNames(),
    });
  } catch (error) {
    botLogger.error('Failed to discover commands', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
