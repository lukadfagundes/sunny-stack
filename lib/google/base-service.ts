/**
 * @file Google Service Base Class
 * @description Abstract base class for Google API service wrappers
 * @module lib/google/base-service
 */

import { GoogleQuotaManager, GoogleServiceName } from './quota-manager';
import { AuthError, ValidationError, AppError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger';

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * OAuth credentials configuration
 */
interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Cached response with expiry
 */
interface CachedResponse<T = any> {
  value: T;
  expiresAt: number;
}

/**
 * Quota limits for a service
 */
export interface QuotaLimits {
  perMinute: number;
  perDay: number;
}

/**
 * Abstract base class for Google API services
 *
 * Provides common functionality for all Google API wrappers:
 * - OAuth token management with auto-refresh
 * - Quota tracking and enforcement
 * - Retry logic with exponential backoff
 * - Response caching with TTL
 * - Structured error handling
 *
 * @template TClient - Type of the Google API client
 *
 * @example
 * ```typescript
 * class GmailService extends GoogleServiceBase<gmail_v1.Gmail> {
 *   getServiceName() {
 *     return 'gmail';
 *   }
 *
 *   getQuotaLimits() {
 *     return { perMinute: 250, perDay: 1_000_000 };
 *   }
 *
 *   async createClient() {
 *     const auth = new google.auth.OAuth2(
 *       this.credentials.clientId,
 *       this.credentials.clientSecret,
 *       this.credentials.redirectUri
 *     );
 *     auth.setCredentials({ access_token: this.accessToken });
 *     return google.gmail({ version: 'v1', auth });
 *   }
 *
 *   async sendEmail(to: string, subject: string, body: string) {
 *     return this.executeWithRetry(async () => {
 *       const response = await this.client.users.messages.send({
 *         userId: 'me',
 *         requestBody: { ... }
 *       });
 *       return response.data;
 *     });
 *   }
 * }
 * ```
 */
export abstract class GoogleServiceBase<TClient> {
  protected client!: TClient;
  protected quotaManager: GoogleQuotaManager;
  protected retryConfig: RetryConfig;
  protected cacheLayer: Map<string, CachedResponse>;
  protected credentials: OAuthCredentials;
  protected accessToken: string | null = null;
  protected tokenExpiresAt: number = 0;

  /**
   * Default cache TTL: 5 minutes
   */
  private static readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000;

  /**
   * Retryable HTTP status codes (transient errors)
   */
  private static readonly RETRYABLE_STATUS_CODES = [429, 500, 502, 503];

  /**
   * Non-retryable HTTP status codes (permanent errors)
   */
  private static readonly NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404];

  /**
   * Get the service name (e.g., 'gmail', 'drive')
   * @abstract
   */
  abstract getServiceName(): GoogleServiceName;

  /**
   * Get quota limits for this service
   * @abstract
   */
  abstract getQuotaLimits(): QuotaLimits;

  /**
   * Create the Google API client instance
   * @abstract
   */
  abstract createClient(): Promise<TClient>;

  /**
   * Initialize the Google service base
   * Loads credentials, initializes quota manager, and creates client
   */
  constructor() {
    // Load OAuth credentials from environment
    this.credentials = this.loadCredentials();

    // Initialize quota manager
    this.quotaManager = new GoogleQuotaManager();

    // Set default retry configuration
    this.retryConfig = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 4000,
    };

    // Initialize cache layer
    this.cacheLayer = new Map();

    // Initialize client (must be called asynchronously after construction)
    this.initializeClient();
  }

  /**
   * Load OAuth credentials from environment variables
   * @private
   * @throws {Error} If required environment variables are missing
   */
  private loadCredentials(): OAuthCredentials {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'Missing Google OAuth credentials. Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI'
      );
    }

    return { clientId, clientSecret, redirectUri };
  }

  /**
   * Initialize the Google API client
   * @private
   */
  private async initializeClient(): Promise<void> {
    try {
      this.client = await this.createClient();
      logger.debug('Google API client initialized', {
        service: this.getServiceName(),
      });
    } catch (error) {
      logger.error('Failed to initialize Google API client', {
        service: this.getServiceName(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Execute a function with automatic retry logic
   *
   * Retries on transient errors (429, 500, 502, 503) with exponential backoff.
   * Checks quota before execution and tracks usage.
   *
   * @template T - Return type of the function
   * @param fn - Async function to execute
   * @param cost - Quota cost of the operation (default: 1)
   * @returns Result of the function
   * @throws {Error} If max retries exceeded or non-retryable error occurs
   *
   * @protected
   */
  protected async executeWithRetry<T>(
    fn: () => Promise<T>,
    cost: number = 1
  ): Promise<T> {
    const serviceName = this.getServiceName();

    // Check quota before making request
    if (!this.quotaManager.canMakeRequest(serviceName, cost)) {
      throw new AppError(
        `Quota exceeded for ${serviceName}. Please try again later.`,
        429
      );
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
      try {
        // Execute the function
        const result = await fn();

        // Track successful API usage
        this.quotaManager.track(serviceName, cost);

        // Log quota warnings
        const usage = this.quotaManager.getUsage(serviceName);
        if (usage.minuteWarning || usage.dayWarning) {
          logger.warn('Google API quota warning', {
            service: serviceName,
            minuteUsage: usage.minuteUsagePercent,
            dayUsage: usage.dayUsagePercent,
          });
        }

        return result;
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        const statusCode = error.status || error.statusCode || error.code;
        const isRetryable =
          GoogleServiceBase.RETRYABLE_STATUS_CODES.includes(statusCode);

        // Check for token expiration (401)
        if (statusCode === 401) {
          logger.info('Access token expired, refreshing...', {
            service: serviceName,
          });
          await this.refreshToken();
          // Retry immediately after token refresh
          continue;
        }

        // Don't retry on non-retryable errors
        if (
          GoogleServiceBase.NON_RETRYABLE_STATUS_CODES.includes(statusCode)
        ) {
          logger.error('Non-retryable error', {
            service: serviceName,
            statusCode,
            error: error.message,
          });
          this.handleApiError(error);
        }

        // If not retryable and not in known lists, throw immediately
        if (!isRetryable) {
          logger.error('Unknown error type', {
            service: serviceName,
            error: error.message,
          });
          throw error;
        }

        // If this was the last attempt, throw
        if (attempt === this.retryConfig.maxAttempts - 1) {
          logger.error('Max retries exceeded', {
            service: serviceName,
            attempts: this.retryConfig.maxAttempts,
            error: error.message,
          });
          break;
        }

        // Calculate exponential backoff with jitter
        const delay = this.calculateBackoff(attempt);
        logger.debug('Retrying after error', {
          service: serviceName,
          attempt: attempt + 1,
          maxAttempts: this.retryConfig.maxAttempts,
          delayMs: delay,
          error: error.message,
        });

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // All retries exhausted
    throw new AppError(
      `Max retries (${this.retryConfig.maxAttempts}) exceeded for ${serviceName}: ${lastError?.message}`,
      500
    );
  }

  /**
   * Refresh OAuth access token using refresh token
   *
   * @protected
   * @throws {AuthError} If refresh token is missing or refresh fails
   */
  protected async refreshToken(): Promise<void> {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!refreshToken) {
      throw new AuthError(
        'No refresh token available. Please re-authenticate.',
        401
      );
    }

    try {
      // Make request to Google OAuth token endpoint
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new AuthError(
          `Token refresh failed: ${errorData.error_description || errorData.error}`,
          401
        );
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

      logger.info('Access token refreshed successfully', {
        service: this.getServiceName(),
        expiresIn: data.expires_in,
      });

      // Reinitialize client with new token
      await this.initializeClient();
    } catch (error) {
      logger.error('Token refresh failed', {
        service: this.getServiceName(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get cached response
   *
   * @template T - Type of cached value
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   * @protected
   */
  protected getCached<T>(key: string): T | null {
    const cached = this.cacheLayer.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cacheLayer.delete(key);
      return null;
    }

    logger.debug('Cache hit', {
      service: this.getServiceName(),
      key,
    });

    return cached.value as T;
  }

  /**
   * Set cached response
   *
   * @template T - Type of value to cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   * @protected
   */
  protected setCached<T>(
    key: string,
    value: T,
    ttl: number = GoogleServiceBase.DEFAULT_CACHE_TTL
  ): void {
    const expiresAt = Date.now() + ttl;

    this.cacheLayer.set(key, { value, expiresAt });

    logger.debug('Cache set', {
      service: this.getServiceName(),
      key,
      ttl,
    });

    // Clean up expired entries periodically
    this.cleanupExpiredCache();
  }

  /**
   * Generate cache key from method name and parameters
   *
   * @param method - Method name
   * @param params - Parameters object
   * @returns Cache key
   * @protected
   */
  protected generateCacheKey(method: string, params: any): string {
    const serviceName = this.getServiceName();
    const paramsHash = JSON.stringify(params);
    return `${serviceName}:${method}:${paramsHash}`;
  }

  /**
   * Handle Google API errors
   *
   * Converts Google API errors to application error classes.
   *
   * @param error - Error from Google API
   * @throws {ValidationError} For 400/404 errors
   * @throws {AuthError} For 401/403 errors
   * @throws {AppError} For other errors
   * @protected
   */
  protected handleApiError(error: any): never {
    const serviceName = this.getServiceName();
    const statusCode = error.status || error.statusCode || error.code || 500;
    const message = error.message || 'Unknown error';

    // Log all errors
    logger.error('Google API error', {
      service: serviceName,
      statusCode,
      message,
      error: error,
    });

    // Map to appropriate error class
    switch (statusCode) {
      case 400:
        throw new ValidationError(
          `${serviceName}: Invalid request - ${message}`,
          'request'
        );

      case 401:
        throw new AuthError(`${serviceName}: Unauthorized - ${message}`, 401);

      case 403:
        throw new AuthError(
          `${serviceName}: Insufficient permissions - ${message}`,
          403
        );

      case 404:
        throw new ValidationError(
          `${serviceName}: Resource not found - ${message}`,
          'resource'
        );

      case 429:
        throw new AppError(`${serviceName}: Rate limit exceeded`, 429);

      default:
        throw new AppError(`${serviceName}: ${message}`, statusCode);
    }
  }

  /**
   * Calculate exponential backoff delay with jitter
   *
   * @param attempt - Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   * @private
   */
  private calculateBackoff(attempt: number): number {
    const exponentialDelay =
      this.retryConfig.baseDelayMs * Math.pow(2, attempt);
    const cappedDelay = Math.min(exponentialDelay, this.retryConfig.maxDelayMs);

    // Add jitter (±20%)
    const jitter = cappedDelay * 0.2 * (Math.random() - 0.5);
    return Math.round(cappedDelay + jitter);
  }

  /**
   * Sleep for specified milliseconds
   *
   * @param ms - Milliseconds to sleep
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean up expired cache entries
   * @private
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cacheLayer.forEach((cached, key) => {
      if (now > cached.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cacheLayer.delete(key));

    if (keysToDelete.length > 0) {
      logger.debug('Cleaned up expired cache entries', {
        service: this.getServiceName(),
        count: keysToDelete.length,
      });
    }
  }
}
