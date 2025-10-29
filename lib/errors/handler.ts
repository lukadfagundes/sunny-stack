/**
 * @file Global error handler for Next.js API routes
 * @description Centralized error handling with logging and sanitization
 * @module lib/errors/handler
 */

import { logger } from '@/lib/logger';
import { AppError } from './app-error';

/**
 * Error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    name: string;
    stack?: string;
  };
}

/**
 * Global error handler for Next.js API routes
 * Logs errors via Winston and returns appropriate HTTP responses
 *
 * @param {unknown} error - Error to handle (can be any type)
 * @param {object} [customLogger] - Optional custom logger (for testing)
 * @returns {object} Response object with status and body
 *
 * @example
 * // In API route:
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const response = handleError(error);
 *   return NextResponse.json(response.body, { status: response.status });
 * }
 */
export function handleError(
  error: unknown,
  customLogger?: any
): { status: number; body: ErrorResponse } {
  const log = customLogger || logger;
  const isProduction = process.env.NODE_ENV === 'production';

  // Determine if error is operational
  const isOperational = error instanceof AppError && error.isOperational;

  // Extract error properties
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const errorName = error instanceof Error ? error.name : 'Error';
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log error with full details
  log.error({
    message: errorMessage,
    statusCode,
    name: errorName,
    stack: errorStack,
    isOperational,
  });

  // Sanitize error message in production for non-operational errors
  const sanitizedMessage = isProduction && !isOperational
    ? 'An unexpected error occurred'
    : errorMessage;

  // Build error response
  const responseBody: ErrorResponse = {
    success: false,
    error: {
      message: sanitizedMessage,
      statusCode,
      name: errorName,
    },
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development' && errorStack) {
    responseBody.error.stack = errorStack;
  }

  return {
    status: statusCode,
    body: responseBody,
  };
}

/**
 * Error handler middleware for Next.js API routes
 * Returns response data suitable for NextResponse.json()
 *
 * @param {unknown} error - Error to handle
 * @returns {object} Object with body and status for NextResponse
 *
 * @example
 * // In API route:
 * import { NextResponse } from 'next/server';
 *
 * export async function POST(request: Request) {
 *   try {
 *     // ... your code
 *   } catch (error) {
 *     const { status, body } = handleErrorResponse(error);
 *     return NextResponse.json(body, { status });
 *   }
 * }
 */
export function handleErrorResponse(error: unknown): { status: number; body: ErrorResponse } {
  return handleError(error);
}
