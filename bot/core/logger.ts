/**
 * Discord Bot Logger
 *
 * Wraps existing Winston logger with Discord-specific context
 *
 * @module bot/core/logger
 */

import logger from '../../lib/logger';

/**
 * Bot-specific logger context
 */
interface BotLogContext {
  command?: string;
  userId?: string;
  guildId?: string;
  channelId?: string;
  executionTime?: number;
  [key: string]: unknown;
}

/**
 * Create Discord bot logger with structured context
 *
 * @param context - Additional context to include in all logs
 * @returns Logger instance
 */
export function createBotLogger(context: BotLogContext = {}) {
  return {
    /**
     * Log info message
     */
    info(message: string, meta: BotLogContext = {}) {
      logger.info(message, { ...context, ...meta, service: 'discord-bot' });
    },

    /**
     * Log error message
     */
    error(message: string, meta: BotLogContext = {}) {
      logger.error(message, { ...context, ...meta, service: 'discord-bot' });
    },

    /**
     * Log warning message
     */
    warn(message: string, meta: BotLogContext = {}) {
      logger.warn(message, { ...context, ...meta, service: 'discord-bot' });
    },

    /**
     * Log debug message (dev only)
     */
    debug(message: string, meta: BotLogContext = {}) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug(message, { ...context, ...meta, service: 'discord-bot' });
      }
    },
  };
}

/**
 * Default bot logger instance
 */
export const botLogger = createBotLogger();

/**
 * Log command execution
 */
export function logCommandExecution(params: {
  command: string;
  userId: string;
  success: boolean;
  executionTime: number;
  error?: string;
}) {
  const { command, userId, success, executionTime, error } = params;

  if (success) {
    botLogger.info('Command executed successfully', {
      command,
      userId,
      executionTime,
      success: true,
    });
  } else {
    botLogger.error('Command execution failed', {
      command,
      userId,
      executionTime,
      success: false,
      error,
    });
  }
}

/**
 * Log API request
 */
export function logApiRequest(params: {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  error?: string;
}) {
  const { endpoint, method, statusCode, responseTime, error } = params;

  if (statusCode >= 200 && statusCode < 300) {
    botLogger.info('API request successful', {
      endpoint,
      method,
      statusCode,
      responseTime,
    });
  } else {
    botLogger.error('API request failed', {
      endpoint,
      method,
      statusCode,
      responseTime,
      error,
    });
  }
}

/**
 * Log Discord event
 */
export function logDiscordEvent(params: {
  event: string;
  data?: Record<string, unknown>;
}) {
  botLogger.info('Discord event received', params);
}

export default botLogger;
