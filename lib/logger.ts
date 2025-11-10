/**
 * @file Winston logger configuration
 * @description Centralized logging with file rotation and environment-aware transports
 * @module lib/logger
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

/**
 * Log format for development (human-readable)
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

/**
 * Log format for production (JSON)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Daily rotate file transport for error logs
 */
const errorFileTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
  format: prodFormat,
});

/**
 * Daily rotate file transport for combined logs (all levels)
 */
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: prodFormat,
});

/**
 * Console transport for development
 */
const consoleTransport = new winston.transports.Console({
  format: devFormat,
});

/**
 * Determine if we're running on Vercel (serverless environment with read-only filesystem)
 */
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

/**
 * Winston logger instance
 * Configured with:
 * - Daily rotating file logs (error.log, combined.log) - Only on Pi/local, not Vercel
 * - Console output always enabled (Vercel captures console logs)
 * - JSON format for structured logging
 * - 14-day log retention
 *
 * @example
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Database error', { error: err.message });
 * logger.warn('API rate limit approaching', { remaining: 10 });
 * logger.debug('Request payload', { body: requestBody });
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: prodFormat,
  defaultMeta: {
    service: 'sunny-stack',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Always add console transport (Vercel captures this)
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    }),
  ],
});

/**
 * Add file transports only when NOT on Vercel (read-only filesystem)
 */
if (!isVercel) {
  logger.add(errorFileTransport);
  logger.add(combinedFileTransport);
}

/**
 * Export logger as default
 */
export default logger;
