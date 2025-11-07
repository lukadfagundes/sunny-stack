/**
 * Admin Route Protection Middleware
 *
 * Provides secure admin route protection with dynamic route hashing.
 * Uses ADMIN_ROUTE_HASH environment variable to generate obfuscated admin URLs.
 *
 * Features:
 * - Dynamic admin route paths (/admin-{hash})
 * - Leverages existing withAuth middleware
 * - Environment-based configuration
 * - Type-safe route generation
 *
 * Usage:
 * ```typescript
 * // In admin API routes
 * export const GET = adminRouteProtection(async (req) => { ... });
 *
 * // In admin pages
 * const adminPath = getAdminRoutePath('/projects');
 * // Returns: '/admin-abc123/projects'
 * ```
 *
 * Environment Variables:
 * - ADMIN_ROUTE_HASH: Secret hash for admin route obfuscation (required)
 *
 * @module lib/middleware/admin-auth
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * NextRequest handler type (matches auth.ts type)
 */
type NextHandler = (req: NextRequest, context?: { params: any }) => Promise<NextResponse>;

/**
 * Get admin route path with hash
 *
 * Generates dynamic admin route paths using ADMIN_ROUTE_HASH environment variable.
 * This provides security through obscurity for admin routes.
 *
 * @param subpath - Optional subpath to append (e.g., '/projects', '/quotes')
 * @returns Full admin route path (e.g., '/admin-abc123/projects')
 * @throws {Error} If ADMIN_ROUTE_HASH environment variable is not defined
 *
 * @example
 * // Get base admin path
 * const path = getAdminRoutePath(); // '/admin-abc123'
 *
 * // Get admin subpath
 * const projectsPath = getAdminRoutePath('/projects'); // '/admin-abc123/projects'
 * const quotesPath = getAdminRoutePath('quotes'); // '/admin-abc123/quotes'
 */
export function getAdminRoutePath(subpath = ''): string {
  // Validate ADMIN_ROUTE_HASH exists
  const hash = process.env.ADMIN_ROUTE_HASH;

  if (!hash) {
    throw new Error('ADMIN_ROUTE_HASH environment variable is not defined');
  }

  // Normalize subpath (ensure single leading slash)
  const normalizedSubpath = subpath.startsWith('/')
    ? subpath
    : subpath
      ? `/${subpath}`
      : '';

  // Construct admin route path
  return `/admin-${hash}${normalizedSubpath}`;
}

/**
 * Admin route protection middleware
 *
 * Wraps the existing withAuth middleware to provide admin-specific authentication.
 * All admin routes should use this wrapper instead of withAuth directly.
 *
 * Note: This dynamically imports withAuth to avoid ESM/CJS issues in tests.
 *
 * @param handler - The Next.js API route handler to protect
 * @returns Protected handler with admin authentication
 *
 * @example
 * // Protect admin API route
 * export const GET = adminRouteProtection(async (req: NextRequest) => {
 *   const projects = await prisma.project.findMany();
 *   return NextResponse.json({ projects });
 * });
 */
export function adminRouteProtection(handler: NextHandler): NextHandler {
  // Dynamically import withAuth to avoid module resolution issues in tests
  return async (req: NextRequest) => {
    const { withAuth } = await import('./auth');
    const protectedHandler = withAuth(handler);
    return protectedHandler(req);
  };
}
