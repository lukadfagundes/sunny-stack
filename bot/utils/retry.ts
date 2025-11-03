/**
 * Retry Utility with Exponential Backoff
 *
 * Automatically retries failed operations with exponential backoff and jitter
 *
 * @module bot/utils/retry
 */

import { botLogger } from '../core/logger';

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in ms (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in ms (default: 10000) */
  maxDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Add random jitter (default: true) */
  jitter?: boolean;
  /** Operation name for logging */
  operationName?: string;
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitter: true,
  operationName: 'operation',
};

/**
 * Calculate delay for next retry with exponential backoff
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  let delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);

  // Cap at max delay
  delay = Math.min(delay, config.maxDelayMs);

  // Add jitter (random ±25%)
  if (config.jitter) {
    const jitterRange = delay * 0.25;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;
    delay += jitter;
  }

  return Math.floor(delay);
}

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - Async function to retry
 * @param config - Retry configuration
 * @returns Result of successful operation
 * @throws Error if all retry attempts fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const fullConfig: Required<RetryConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < fullConfig.maxAttempts; attempt++) {
    try {
      // Attempt operation
      const result = await operation();

      // Success
      if (attempt > 0) {
        botLogger.info('Retry successful', {
          operation: fullConfig.operationName,
          attempt: attempt + 1,
        });
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Log failure
      botLogger.warn('Operation failed, will retry', {
        operation: fullConfig.operationName,
        attempt: attempt + 1,
        maxAttempts: fullConfig.maxAttempts,
        error: lastError.message,
      });

      // Don't delay after last attempt
      if (attempt < fullConfig.maxAttempts - 1) {
        const delay = calculateDelay(attempt, fullConfig);

        botLogger.debug('Waiting before retry', {
          operation: fullConfig.operationName,
          delayMs: delay,
        });

        await sleep(delay);
      }
    }
  }

  // All attempts failed
  botLogger.error('All retry attempts failed', {
    operation: fullConfig.operationName,
    attempts: fullConfig.maxAttempts,
    error: lastError?.message,
  });

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Retry with custom retry condition
 *
 * @param operation - Async function to retry
 * @param shouldRetry - Function to determine if error should be retried
 * @param config - Retry configuration
 * @returns Result of successful operation
 */
export async function withRetryIf<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  config: RetryConfig = {}
): Promise<T> {
  const fullConfig: Required<RetryConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < fullConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();

      if (attempt > 0) {
        botLogger.info('Retry successful', {
          operation: fullConfig.operationName,
          attempt: attempt + 1,
        });
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (!shouldRetry(lastError)) {
        botLogger.info('Error not retryable, throwing immediately', {
          operation: fullConfig.operationName,
          error: lastError.message,
        });
        throw lastError;
      }

      botLogger.warn('Operation failed, will retry', {
        operation: fullConfig.operationName,
        attempt: attempt + 1,
        maxAttempts: fullConfig.maxAttempts,
        error: lastError.message,
      });

      if (attempt < fullConfig.maxAttempts - 1) {
        const delay = calculateDelay(attempt, fullConfig);
        await sleep(delay);
      }
    }
  }

  botLogger.error('All retry attempts failed', {
    operation: fullConfig.operationName,
    attempts: fullConfig.maxAttempts,
    error: lastError?.message,
  });

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Retry helper for common network errors
 *
 * @param operation - Async function to retry
 * @param config - Retry configuration
 * @returns Result of successful operation
 */
export async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  return withRetryIf(
    operation,
    (error) => {
      // Retry on network errors
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('econnreset') ||
        message.includes('etimedout') ||
        message.includes('enotfound') ||
        message.includes('503') ||
        message.includes('502')
      );
    },
    config
  );
}
