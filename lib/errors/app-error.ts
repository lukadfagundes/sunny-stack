/**
 * @file Custom error classes for application-wide error handling
 * @description Provides typed error classes with HTTP status codes and operational flags
 * @module lib/errors/app-error
 */

/**
 * Base application error class
 * All custom errors should extend this class
 *
 * @extends Error
 * @property {number} statusCode - HTTP status code for the error
 * @property {boolean} isOperational - Whether error is operational (expected) or programming error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  /**
   * Creates an AppError instance
   *
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {boolean} isOperational - Whether error is operational (default: true)
   *
   * @example
   * throw new AppError('Something went wrong', 500);
   */
  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'AppError';

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - used for input validation failures
 * HTTP Status: 400 Bad Request
 *
 * @extends AppError
 * @property {string} [field] - Field name that failed validation
 */
export class ValidationError extends AppError {
  public readonly field?: string;

  /**
   * Creates a ValidationError instance
   *
   * @param {string} message - Validation error message
   * @param {string} [field] - Field name that failed validation
   *
   * @example
   * throw new ValidationError('Invalid email format', 'email');
   */
  constructor(message: string, field?: string) {
    super(message, 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Authentication/Authorization error
 * HTTP Status: 401 Unauthorized or 403 Forbidden
 *
 * @extends AppError
 */
export class AuthError extends AppError {
  /**
   * Creates an AuthError instance
   *
   * @param {string} message - Auth error message
   * @param {number} statusCode - 401 (Unauthorized) or 403 (Forbidden) - default: 401
   *
   * @example
   * throw new AuthError('Token expired', 401);
   * throw new AuthError('Insufficient permissions', 403);
   */
  constructor(message: string, statusCode = 401) {
    super(message, statusCode);
    this.name = 'AuthError';
  }
}

/**
 * Database error - used for database operation failures
 * HTTP Status: 500 Internal Server Error
 *
 * @extends AppError
 * @property {Error} [originalError] - Original error from database driver
 */
export class DatabaseError extends AppError {
  public readonly originalError?: Error;

  /**
   * Creates a DatabaseError instance
   *
   * @param {string} message - Database error message
   * @param {Error} [originalError] - Original error from database
   *
   * @example
   * throw new DatabaseError('Connection timeout', originalDbError);
   */
  constructor(message: string, originalError?: Error) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * Not Found error - used when a resource is not found
 * HTTP Status: 404 Not Found
 *
 * @extends AppError
 * @property {string} resource - Resource type that was not found
 * @property {string} id - ID of the resource that was not found
 */
export class NotFoundError extends AppError {
  public readonly resource: string;
  public readonly id: string;

  /**
   * Creates a NotFoundError instance
   *
   * @param {string} resource - Resource type (e.g., 'User', 'Post')
   * @param {string} id - Resource ID
   *
   * @example
   * throw new NotFoundError('User', '123');
   * // Error message: "User not found: 123"
   */
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 404);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}
