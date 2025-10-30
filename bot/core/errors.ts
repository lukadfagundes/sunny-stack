/**
 * Custom Error Classes for Discord Bot
 *
 * Provides typed error classes with HTTP status codes and operational flags
 *
 * @module bot/core/errors
 */

/**
 * Base bot error class
 * All custom bot errors extend this class
 */
export class BotError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'BotError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - user input validation failures
 * HTTP Status: 400 Bad Request
 */
export class ValidationError extends BotError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * API error - Next.js API request failures
 * HTTP Status: 500 Internal Server Error (or specific status from API)
 */
export class ApiError extends BotError {
  public readonly endpoint: string;
  public readonly originalError?: Error;

  constructor(message: string, endpoint: string, statusCode = 500, originalError?: Error) {
    super(message, statusCode);
    this.name = 'ApiError';
    this.endpoint = endpoint;
    this.originalError = originalError;
  }
}

/**
 * Discord API error - Discord API failures
 * HTTP Status: 500 Internal Server Error
 */
export class DiscordError extends BotError {
  public readonly code?: number;
  public readonly originalError?: Error;

  constructor(message: string, code?: number, originalError?: Error) {
    super(message, 500);
    this.name = 'DiscordError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Database error - Prisma/database operation failures
 * HTTP Status: 500 Internal Server Error
 */
export class DatabaseError extends BotError {
  public readonly operation: string;
  public readonly originalError?: Error;

  constructor(message: string, operation: string, originalError?: Error) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.operation = operation;
    this.originalError = originalError;
  }
}

/**
 * Permission error - unauthorized access attempts
 * HTTP Status: 403 Forbidden
 */
export class PermissionError extends BotError {
  public readonly userId: string;
  public readonly requiredPermission: string;

  constructor(message: string, userId: string, requiredPermission: string) {
    super(message, 403);
    this.name = 'PermissionError';
    this.userId = userId;
    this.requiredPermission = requiredPermission;
  }
}

/**
 * Rate limit error - user exceeded rate limits
 * HTTP Status: 429 Too Many Requests
 */
export class RateLimitError extends BotError {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Configuration error - invalid or missing configuration
 * HTTP Status: 500 Internal Server Error
 */
export class ConfigurationError extends BotError {
  public readonly configKey: string;

  constructor(message: string, configKey: string) {
    super(message, 500, false); // Not operational - needs admin fix
    this.name = 'ConfigurationError';
    this.configKey = configKey;
  }
}

/**
 * Timeout error - operation exceeded timeout
 * HTTP Status: 408 Request Timeout
 */
export class TimeoutError extends BotError {
  public readonly operation: string;
  public readonly timeoutMs: number;

  constructor(message: string, operation: string, timeoutMs: number) {
    super(message, 408);
    this.name = 'TimeoutError';
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Circuit breaker open error - service unavailable due to circuit breaker
 * HTTP Status: 503 Service Unavailable
 */
export class CircuitBreakerOpenError extends BotError {
  public readonly service: string;
  public readonly retryAfter: number;

  constructor(message: string, service: string, retryAfter: number) {
    super(message, 503);
    this.name = 'CircuitBreakerOpenError';
    this.service = service;
    this.retryAfter = retryAfter;
  }
}
