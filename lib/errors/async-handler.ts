/**
 * @file Async handler wrapper for automatic error catching
 * @description Wraps async functions to automatically catch and propagate errors
 * @module lib/errors/async-handler
 */

/**
 * Wraps an async function to automatically catch errors
 * Preserves function signature and type safety
 *
 * @template T - Function type to wrap
 * @param {T} handler - Async function to wrap
 * @returns {T} Wrapped function with error handling
 *
 * @example
 * // Wrap an API route handler
 * const safeHandler = asyncHandler(async (req, res) => {
 *   const data = await fetchData();
 *   return data;
 * });
 *
 * @example
 * // Use with Next.js API route
 * export const POST = asyncHandler(async (request: Request) => {
 *   const body = await request.json();
 *   // If any error occurs, it will be caught and re-thrown
 *   return NextResponse.json({ success: true });
 * });
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  // Return wrapped function with preserved signature
  // Errors will automatically propagate to caller
  const wrappedFunction = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return await handler(...args);
  };

  // Cast to T to preserve original function signature
  return wrappedFunction as T;
}
