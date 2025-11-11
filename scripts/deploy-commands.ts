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

// Load environment variables from .env.local
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { loadBotConfig } from '../bot/config.js';
import { deployCommands, deployGlobalCommands, deleteGuildCommands } from '../bot/commands/deploy.js';
import { discoverCommands } from '../bot/commands/registry.js';
import { botLogger } from '../bot/core/logger.js';

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

    // Discover and register all commands
    await discoverCommands();

    botLogger.info('Commands discovered and ready for deployment');

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
