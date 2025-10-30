/**
 * User Rate Limiter
 *
 * Token bucket algorithm for rate limiting user commands
 *
 * @module bot/utils/rate-limiter
 */

import type { RateLimitData } from '../types';
import { botLogger } from '../core/logger';

/**
 * Rate limit storage (userId -> RateLimitData)
 */
const rateLimits = new Map<string, RateLimitData>();

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
  maxCommands: 5, // Max commands per window
  windowMs: 60000, // 1 minute window
};

/**
 * Check if user is rate limited
 *
 * @param userId - Discord user ID
 * @returns Rate limit result
 */
export function checkRateLimit(userId: string): {
  allowed: boolean;
  retryAfter: number;
  remaining: number;
} {
  const now = Date.now();

  // Get or create rate limit data
  let data = rateLimits.get(userId);

  if (!data || now > data.resetAt) {
    // Create new rate limit window
    data = {
      count: 0,
      resetAt: now + RATE_LIMIT_CONFIG.windowMs,
    };
    rateLimits.set(userId, data);
  }

  // Increment counter
  data.count++;

  // Check if over limit
  if (data.count > RATE_LIMIT_CONFIG.maxCommands) {
    const retryAfter = data.resetAt - now;

    botLogger.warn('User rate limited', {
      userId,
      count: data.count,
      retryAfter,
    });

    return {
      allowed: false,
      retryAfter,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    retryAfter: 0,
    remaining: RATE_LIMIT_CONFIG.maxCommands - data.count,
  };
}

/**
 * Reset rate limit for user
 *
 * @param userId - Discord user ID
 */
export function resetRateLimit(userId: string): void {
  rateLimits.delete(userId);
  botLogger.info('Rate limit reset', { userId });
}

/**
 * Get current rate limit status for user
 *
 * @param userId - Discord user ID
 * @returns Rate limit status
 */
export function getRateLimitStatus(userId: string): {
  count: number;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const data = rateLimits.get(userId);

  if (!data || now > data.resetAt) {
    return {
      count: 0,
      remaining: RATE_LIMIT_CONFIG.maxCommands,
      resetAt: now + RATE_LIMIT_CONFIG.windowMs,
    };
  }

  return {
    count: data.count,
    remaining: Math.max(0, RATE_LIMIT_CONFIG.maxCommands - data.count),
    resetAt: data.resetAt,
  };
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [userId, data] of rateLimits.entries()) {
    if (now > data.resetAt) {
      rateLimits.delete(userId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    botLogger.debug('Rate limit cleanup', { cleaned });
  }
}

/**
 * Start periodic cleanup of rate limit entries
 * Runs every 5 minutes
 */
export function startRateLimitCleanup(): NodeJS.Timeout {
  const interval = 300000; // 5 minutes

  botLogger.info('Starting rate limit cleanup task', {
    intervalMs: interval,
  });

  return setInterval(cleanupRateLimits, interval);
}
