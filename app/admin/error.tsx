'use client';

/**
 * @file Admin route error boundary
 * @description Graceful error handling for admin pages with logging
 * @module app/admin/error
 */

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary component for admin routes
 * Catches and displays errors with logging and retry functionality
 *
 * @param {ErrorProps} props - Error boundary props
 * @param {Error} props.error - The caught error object
 * @param {string} [props.error.digest] - Optional error digest for tracking
 * @param {Function} props.reset - Function to retry the failed operation
 *
 * @example
 * // Automatically used by Next.js when errors occur in /admin routes
 * // User sees friendly error UI with retry button
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console (client-side)
    // Server-side logging happens automatically via Next.js error handling
    console.error('[Admin Error]', {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
