/**
 * @file Google API Quota Manager
 * @description Tracks API usage, enforces rate limits, and manages quota across Google services
 * @module lib/google/quota-manager
 */

import { logger } from '@/lib/logger';

/**
 * Google API quota limits for each service
 * Source: Google API documentation
 */
export const GOOGLE_QUOTA_LIMITS = {
  gmail: { perMinute: 250, perDay: 1_000_000 },
  drive: { perMinute: 1000, perDay: 10_000_000 },
  calendar: { perMinute: 600, perDay: 1_000_000 },
  sheets: { perMinute: 100, perDay: 500_000 },
  docs: { perMinute: 100, perDay: 500_000 },
  tasks: { perMinute: 100, perDay: 50_000 },
  contacts: { perMinute: 60, perDay: 10_000 },
} as const;

/**
 * Valid Google service names
 */
export type GoogleServiceName = keyof typeof GOOGLE_QUOTA_LIMITS;

/**
 * Service quota tracking data
 */
interface ServiceQuota {
  perMinuteLimit: number;
  perDayLimit: number;
  currentMinute: number;
  currentDay: number;
  minuteUsage: number;
  dayUsage: number;
}

/**
 * Quota usage response
 */
export interface QuotaUsage {
  minuteUsage: number;
  dayUsage: number;
  perMinuteLimit: number;
  perDayLimit: number;
  minuteWarning: boolean;
  minuteExceeded: boolean;
  dayWarning: boolean;
  dayExceeded: boolean;
  minuteUsagePercent: number;
  dayUsagePercent: number;
}

/**
 * Google Quota Manager
 *
 * Manages API quota across all Google services to prevent rate limit errors.
 * Features:
 * - Per-minute and per-day quota tracking
 * - Warning thresholds at 80% usage
 * - Automatic quota resets
 * - Multi-service support
 *
 * @example
 * ```typescript
 * const quotaManager = new GoogleQuotaManager();
 *
 * // Track API usage
 * quotaManager.track('gmail', 1);
 *
 * // Check if request is allowed
 * if (quotaManager.canMakeRequest('gmail', 1)) {
 *   // Make API call
 * }
 *
 * // Get current usage
 * const usage = quotaManager.getUsage('gmail');
 * console.log(`Usage: ${usage.minuteUsagePercent}%`);
 * ```
 */
export class GoogleQuotaManager {
  private quotas: Map<GoogleServiceName, ServiceQuota>;
  private minuteResetTimer: NodeJS.Timeout | null = null;
  private dayResetTimer: NodeJS.Timeout | null = null;

  /**
   * Creates a new GoogleQuotaManager instance
   * Initializes quota tracking for all Google services
   */
  constructor() {
    this.quotas = new Map();
    this.initializeQuotas();
    this.startAutoReset();
  }

  /**
   * Initialize quota tracking for all services
   * @private
   */
  private initializeQuotas(): void {
    const services = Object.keys(GOOGLE_QUOTA_LIMITS) as GoogleServiceName[];
    const currentMinute = Math.floor(Date.now() / 60000);
    const currentDay = Math.floor(Date.now() / 86400000);

    services.forEach((service) => {
      const limits = GOOGLE_QUOTA_LIMITS[service];
      this.quotas.set(service, {
        perMinuteLimit: limits.perMinute,
        perDayLimit: limits.perDay,
        currentMinute,
        currentDay,
        minuteUsage: 0,
        dayUsage: 0,
      });
    });
  }

  /**
   * Start automatic quota reset timers
   * @private
   */
  private startAutoReset(): void {
    // Reset minute quotas every minute
    this.minuteResetTimer = setInterval(() => {
      this.resetMinutely();
    }, 60000);

    // Reset day quotas at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    this.dayResetTimer = setTimeout(() => {
      this.resetDaily();
      // Set up recurring daily reset
      this.dayResetTimer = setInterval(() => {
        this.resetDaily();
      }, 86400000);
    }, msUntilMidnight);
  }

  /**
   * Track API usage for a service
   *
   * @param serviceName - Name of the Google service
   * @param cost - Quota cost of the operation (default: 1)
   * @throws {Error} If service name is invalid or cost is negative
   *
   * @example
   * ```typescript
   * quotaManager.track('gmail', 1); // Track single API call
   * quotaManager.track('drive', 5); // Track batch operation
   * ```
   */
  public track(serviceName: GoogleServiceName, cost: number): void {
    // Validate inputs
    if (!GOOGLE_QUOTA_LIMITS[serviceName]) {
      throw new Error(`Unknown Google service: ${serviceName}`);
    }

    if (cost < 0) {
      throw new Error('Quota cost cannot be negative');
    }

    if (cost === 0) {
      return; // Nothing to track
    }

    const quota = this.quotas.get(serviceName);
    if (!quota) {
      throw new Error(`Quota not initialized for service: ${serviceName}`);
    }

    const currentMinute = Math.floor(Date.now() / 60000);
    const currentDay = Math.floor(Date.now() / 86400000);

    // Auto-reset if time window changed
    if (quota.currentMinute !== currentMinute) {
      quota.minuteUsage = 0;
      quota.currentMinute = currentMinute;
    }

    if (quota.currentDay !== currentDay) {
      quota.dayUsage = 0;
      quota.currentDay = currentDay;
    }

    // Update usage
    quota.minuteUsage += cost;
    quota.dayUsage += cost;

    // Log warnings
    const usage = this.getUsage(serviceName);
    if (usage.minuteWarning) {
      logger.warn('Google API quota warning', {
        service: serviceName,
        type: 'per-minute',
        usage: usage.minuteUsage,
        limit: usage.perMinuteLimit,
        percent: usage.minuteUsagePercent,
      });
    }

    if (usage.dayWarning) {
      logger.warn('Google API quota warning', {
        service: serviceName,
        type: 'per-day',
        usage: usage.dayUsage,
        limit: usage.perDayLimit,
        percent: usage.dayUsagePercent,
      });
    }
  }

  /**
   * Get current quota usage for a service
   *
   * @param serviceName - Name of the Google service
   * @returns Quota usage details
   *
   * @example
   * ```typescript
   * const usage = quotaManager.getUsage('gmail');
   * console.log(`Minute usage: ${usage.minuteUsagePercent}%`);
   * console.log(`Day usage: ${usage.dayUsagePercent}%`);
   * ```
   */
  public getUsage(serviceName: GoogleServiceName): QuotaUsage {
    let quota = this.quotas.get(serviceName);

    // Initialize if not exists
    if (!quota) {
      const limits = GOOGLE_QUOTA_LIMITS[serviceName];
      if (!limits) {
        throw new Error(`Unknown Google service: ${serviceName}`);
      }

      const currentMinute = Math.floor(Date.now() / 60000);
      const currentDay = Math.floor(Date.now() / 86400000);

      quota = {
        perMinuteLimit: limits.perMinute,
        perDayLimit: limits.perDay,
        currentMinute,
        currentDay,
        minuteUsage: 0,
        dayUsage: 0,
      };

      this.quotas.set(serviceName, quota);
    }

    // Calculate percentages
    const minuteUsagePercent = Math.round(
      (quota.minuteUsage / quota.perMinuteLimit) * 100
    );
    const dayUsagePercent = Math.round(
      (quota.dayUsage / quota.perDayLimit) * 100
    );

    // Check thresholds
    const minuteWarning = minuteUsagePercent >= 80;
    const minuteExceeded = minuteUsagePercent >= 100;
    const dayWarning = dayUsagePercent >= 80;
    const dayExceeded = dayUsagePercent >= 100;

    return {
      minuteUsage: quota.minuteUsage,
      dayUsage: quota.dayUsage,
      perMinuteLimit: quota.perMinuteLimit,
      perDayLimit: quota.perDayLimit,
      minuteWarning,
      minuteExceeded,
      dayWarning,
      dayExceeded,
      minuteUsagePercent,
      dayUsagePercent,
    };
  }

  /**
   * Check if a request can be made without exceeding quota
   *
   * @param serviceName - Name of the Google service
   * @param cost - Quota cost of the planned operation
   * @returns True if request is allowed, false otherwise
   *
   * @example
   * ```typescript
   * if (quotaManager.canMakeRequest('gmail', 1)) {
   *   await gmailClient.sendMessage();
   * } else {
   *   throw new Error('Quota exceeded');
   * }
   * ```
   */
  public canMakeRequest(serviceName: GoogleServiceName, cost: number): boolean {
    const quota = this.quotas.get(serviceName);
    if (!quota) {
      // Service not tracked yet, allow request
      return true;
    }

    const wouldExceedMinute = quota.minuteUsage + cost > quota.perMinuteLimit;
    const wouldExceedDay = quota.dayUsage + cost > quota.perDayLimit;

    return !wouldExceedMinute && !wouldExceedDay;
  }

  /**
   * Reset per-minute quotas for all services
   * Called automatically every minute
   *
   * @example
   * ```typescript
   * quotaManager.resetMinutely();
   * ```
   */
  public resetMinutely(): void {
    const currentMinute = Math.floor(Date.now() / 60000);

    this.quotas.forEach((quota, service) => {
      logger.debug('Resetting per-minute quota', {
        service,
        previousUsage: quota.minuteUsage,
        limit: quota.perMinuteLimit,
      });

      quota.minuteUsage = 0;
      quota.currentMinute = currentMinute;
    });
  }

  /**
   * Reset per-day quotas for all services
   * Called automatically at midnight
   *
   * @example
   * ```typescript
   * quotaManager.resetDaily();
   * ```
   */
  public resetDaily(): void {
    const currentDay = Math.floor(Date.now() / 86400000);

    this.quotas.forEach((quota, service) => {
      logger.info('Resetting per-day quota', {
        service,
        previousUsage: quota.dayUsage,
        limit: quota.perDayLimit,
      });

      quota.dayUsage = 0;
      quota.currentDay = currentDay;
    });
  }

  /**
   * Clean up timers when instance is destroyed
   */
  public destroy(): void {
    if (this.minuteResetTimer) {
      clearInterval(this.minuteResetTimer);
      this.minuteResetTimer = null;
    }

    if (this.dayResetTimer) {
      clearTimeout(this.dayResetTimer);
      this.dayResetTimer = null;
    }
  }
}
