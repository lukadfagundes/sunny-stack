/**
 * Deploy Discord Slash Commands
 *
 * Standalone script to register commands with Discord API
 *
 * Usage:
 *   npm run deploy:commands        - Deploy to guild (fast)
 *   npm run deploy:commands:global - Deploy globally (slow, 1hr)
 *   npm run deploy:commands:delete - Delete all guild commands
 */

import { loadBotConfig } from '../bot/config';
import { deployCommands, deployGlobalCommands, deleteGuildCommands } from '../bot/commands/deploy';
import { commandRegistry } from '../bot/commands/registry';
import { botLogger } from '../bot/core/logger';

async function main() {
  try {
    // Get command from args
    const command = process.argv[2] || 'guild';

    // Load configuration
    const config = loadBotConfig();

    botLogger.info('Command deployment script started', {
      mode: command,
      guildId: config.guildId,
    });

    // TODO: Register all commands here
    // For now, this is a placeholder
    // Commands will be registered when implemented in Phase 3C

    botLogger.info('Commands registered in registry', {
      count: commandRegistry.size(),
    });

    // Execute appropriate deployment
    switch (command) {
      case 'guild':
        await deployCommands(config);
        break;

      case 'global':
        await deployGlobalCommands(config);
        break;

      case 'delete':
        await deleteGuildCommands(config);
        break;

      default:
        botLogger.error('Invalid command', { command });
        console.error('Usage: npm run deploy:commands [guild|global|delete]');
        process.exit(1);
    }

    botLogger.info('Command deployment script completed successfully');
    process.exit(0);
  } catch (error) {
    const err = error as Error;
    botLogger.error('Command deployment script failed', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

main();
