/**
 * Admin Authentication Wrapper
 *
 * Higher-order function (HOC) for protecting admin API routes and pages.
 * Uses NextAuth Google OAuth for authentication.
 *
 * @module lib/admin/auth-wrapper
 *
 * Usage:
 * ```typescript
 * // Protect admin API route
 * export const GET = withAdminAuth(async (req) => {
 *   return NextResponse.json({ data: 'protected' });
 * });
 *
 * // Protect with custom admin emails
 * export const POST = withAdminAuth(async (req) => {
 *   return NextResponse.json({ success: true });
 * }, { adminEmails: ['admin@example.com'] });
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/google-oauth";

/**
 * Configuration for admin authentication wrapper
 */
export interface AdminAuthConfig {
  /**
   * List of admin email addresses allowed to access protected resources.
   * Defaults to ADMIN_EMAIL environment variable if not provided.
   */
  adminEmails?: string[];
}

/**
 * Type for Next.js API route handler
 */
type NextHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * withAdminAuth - Admin Authentication Middleware
 *
 * Wraps a Next.js API route handler with Google OAuth authentication.
 * Only allows users with admin email addresses to access the handler.
 *
 * @param handler - The Next.js API route handler to protect
 * @param config - Optional configuration (admin emails)
 * @returns Protected handler that validates admin authentication
 *
 * @throws Will return 401 if user is not authenticated
 * @throws Will return 403 if user is authenticated but not an admin
 *
 * @example
 * ```typescript
 * // Protect admin endpoint
 * export const GET = withAdminAuth(async (req) => {
 *   return NextResponse.json({ users: [] });
 * });
 * ```
 */
export function withAdminAuth(
  handler: NextHandler,
  config?: AdminAuthConfig,
): NextHandler {
  return async (req: NextRequest) => {
    try {
      // Get admin emails from config or environment variable
      const adminEmails =
        config?.adminEmails ||
        (process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : null);

      if (!adminEmails) {
        throw new Error("ADMIN_EMAIL environment variable is not defined");
      }

      // Get server session
      const session = await getSession();

      // Check if session exists
      if (!session || !session.user) {
        return NextResponse.json(
          { error: "Unauthorized - No session found" },
          { status: 401 },
        );
      }

      // Check if user is admin
      const userEmail = session.user.email;
      if (!userEmail || !adminEmails.includes(userEmail)) {
        return NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 },
        );
      }

      // User is authenticated and authorized - call handler
      return handler(req);
    } catch (error) {
      // Handle errors (e.g., session retrieval failure)
      if (error instanceof Error && error.message.includes("ADMIN_EMAIL")) {
        throw error; // Re-throw configuration errors
      }

      return NextResponse.json(
        {
          error:
            "Authentication failed - " +
            (error instanceof Error ? error.message : "Unknown error"),
        },
        { status: 401 },
      );
    }
  };
}
