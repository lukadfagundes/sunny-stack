/**
 * Discord Bot Configuration
 *
 * Validates and loads bot configuration from environment variables
 *
 * @module bot/config
 */

import { DeploymentMode, type BotConfig, type ChannelConfig } from './types';

/**
 * Validate required environment variable
 *
 * @param name - Environment variable name
 * @param value - Environment variable value
 * @returns Validated value
 * @throws {Error} If environment variable is missing
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

/**
 * Load bot configuration from environment variables
 *
 * @returns Validated bot configuration
 * @throws {Error} If required variables are missing
 */
export function loadBotConfig(): BotConfig {
  const deploymentModeStr = process.env.DEPLOYMENT_MODE?.toLowerCase() || 'vercel';

  // Validate deployment mode
  const deploymentMode =
    deploymentModeStr === 'pi'
      ? DeploymentMode.RASPBERRY_PI
      : DeploymentMode.VERCEL;

  return {
    token: requireEnv('DISCORD_BOT_TOKEN', process.env.DISCORD_BOT_TOKEN),
    applicationId: requireEnv(
      'DISCORD_APPLICATION_ID',
      process.env.DISCORD_APPLICATION_ID
    ),
    guildId: requireEnv('DISCORD_GUILD_ID', process.env.DISCORD_GUILD_ID),
    adminUserId: requireEnv(
      'DISCORD_ADMIN_USER_ID',
      process.env.DISCORD_ADMIN_USER_ID
    ),
    deploymentMode,
    apiUrl: requireEnv('BOT_API_URL', process.env.BOT_API_URL),
    apiKey: requireEnv('BOT_API_KEY', process.env.BOT_API_KEY),
  };
}

/**
 * Load channel configuration from environment variables
 *
 * @returns Validated channel configuration
 * @throws {Error} If required channel IDs are missing
 */
export function loadChannelConfig(): ChannelConfig {
  return {
    adminLogs: requireEnv(
      'DISCORD_CHANNEL_ADMIN_LOGS',
      process.env.DISCORD_CHANNEL_ADMIN_LOGS
    ),
    botCommands: requireEnv(
      'DISCORD_CHANNEL_BOT_COMMANDS',
      process.env.DISCORD_CHANNEL_BOT_COMMANDS
    ),
    activeProjects: requireEnv(
      'DISCORD_CHANNEL_ACTIVE_PROJECTS',
      process.env.DISCORD_CHANNEL_ACTIVE_PROJECTS
    ),
    proposals: requireEnv(
      'DISCORD_CHANNEL_PROPOSALS',
      process.env.DISCORD_CHANNEL_PROPOSALS
    ),
    tasks: requireEnv(
      'DISCORD_CHANNEL_TASKS',
      process.env.DISCORD_CHANNEL_TASKS
    ),
    timeTracking: requireEnv(
      'DISCORD_CHANNEL_TIME_TRACKING',
      process.env.DISCORD_CHANNEL_TIME_TRACKING
    ),
    clientInquiries: requireEnv(
      'DISCORD_CHANNEL_CLIENT_INQUIRIES',
      process.env.DISCORD_CHANNEL_CLIENT_INQUIRIES
    ),
    clientUpdates: requireEnv(
      'DISCORD_CHANNEL_CLIENT_UPDATES',
      process.env.DISCORD_CHANNEL_CLIENT_UPDATES
    ),
    calendarSync: requireEnv(
      'DISCORD_CHANNEL_CALENDAR_SYNC',
      process.env.DISCORD_CHANNEL_CALENDAR_SYNC
    ),
    emailNotifications: requireEnv(
      'DISCORD_CHANNEL_EMAIL_NOTIFICATIONS',
      process.env.DISCORD_CHANNEL_EMAIL_NOTIFICATIONS
    ),
    analytics: requireEnv(
      'DISCORD_CHANNEL_ANALYTICS',
      process.env.DISCORD_CHANNEL_ANALYTICS
    ),
    invoices: requireEnv(
      'DISCORD_CHANNEL_INVOICES',
      process.env.DISCORD_CHANNEL_INVOICES
    ),
    payments: requireEnv(
      'DISCORD_CHANNEL_PAYMENTS',
      process.env.DISCORD_CHANNEL_PAYMENTS
    ),
  };
}

/**
 * Validate configuration on startup
 *
 * @returns True if configuration is valid
 * @throws {Error} If configuration is invalid
 */
export function validateConfig(): boolean {
  try {
    loadBotConfig();
    loadChannelConfig();
    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Configuration validation failed: ${error.message}`);
    }
    throw error;
  }
}
