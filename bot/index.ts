/**
 * Discord Bot Main Entry Point
 *
 * Auto-selects deployment mode (Vercel vs Raspberry Pi) based on environment
 *
 * Environment variables loaded via docker-compose env_file directive
 *
 * @module bot/index
 */

import { loadBotConfig, validateConfig } from './config';
import { DeploymentMode } from './types';
import { botLogger } from './core/logger';
import { ConfigurationError } from './core/errors';
import { startHealthServer, stopHealthServer } from './health-server';

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

      // Start health check server after bot is ready
      botLogger.info('Starting health check server...');
      await startHealthServer();
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

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  botLogger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Stop health server first
    await stopHealthServer();

    // Exit cleanly
    botLogger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    botLogger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Only start bot if not in Vercel environment
// Vercel will import the webhook handler directly
if (process.env.DEPLOYMENT_MODE !== 'vercel') {
  initializeBot();
}

// Export for Vercel Edge Functions
// COMMENTED OUT: Causes @noble/ed25519 ES module error in Pi mode
// Re-enable when deploying to Vercel or fix ES module imports
// export { POST } from './interactions/webhook';
