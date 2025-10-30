/**
 * Discord Bot Main Entry Point
 *
 * Auto-selects deployment mode (Vercel vs Raspberry Pi) based on environment
 *
 * @module bot/index
 */

import { loadBotConfig, validateConfig } from './config';
import { DeploymentMode } from './types';
import { botLogger } from './core/logger';
import { ConfigurationError } from './core/errors';

/**
 * Initialize bot based on deployment mode
 */
async function initializeBot() {
  try {
    // Validate configuration
    botLogger.info('Validating bot configuration...');
    validateConfig();

    // Load configuration
    const config = loadBotConfig();

    botLogger.info('Bot configuration loaded', {
      deploymentMode: config.deploymentMode,
      guildId: config.guildId,
      applicationId: config.applicationId,
    });

    // Route to appropriate deployment mode
    if (config.deploymentMode === DeploymentMode.VERCEL) {
      botLogger.info('Starting in Vercel mode (Interactions API)');
      // Vercel mode exports webhook handler - no active process
      // The handler is exported from interactions/webhook.ts
      botLogger.info('Vercel webhook handler ready at /api/discord/interactions');
    } else if (config.deploymentMode === DeploymentMode.RASPBERRY_PI) {
      botLogger.info('Starting in Raspberry Pi mode (Gateway API)');
      // Pi mode starts persistent Gateway connection
      const { startGatewayBot } = await import('./gateway/client');
      await startGatewayBot(config);
    } else {
      throw new ConfigurationError(
        `Invalid deployment mode: ${config.deploymentMode}`,
        'DEPLOYMENT_MODE'
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      botLogger.error('Bot initialization failed', {
        error: error.message,
        stack: error.stack,
      });
    }
    process.exit(1);
  }
}

// Only start bot if not in Vercel environment
// Vercel will import the webhook handler directly
if (process.env.DEPLOYMENT_MODE !== 'vercel') {
  initializeBot();
}

// Export for Vercel Edge Functions
export { POST } from './interactions/webhook';
