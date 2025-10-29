/**
 * NextAuth.js v5 Configuration
 *
 * Provides Google OAuth authentication for admin dashboard.
 * Only users with emails in ADMIN_EMAIL whitelist can access protected routes.
 *
 * Environment Variables Required:
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - NEXTAUTH_SECRET: Secret for encrypting session tokens
 * - NEXTAUTH_URL: Base URL for NextAuth (e.g., http://localhost:3000)
 * - ADMIN_EMAIL: Comma-separated list of admin emails
 *
 * Usage:
 * ```typescript
 * // In API route or server component
 * import { getServerSession } from 'next-auth/next';
 * const session = await getServerSession();
 *
 * // In client component
 * import { useSession } from 'next-auth/react';
 * const { data: session } = useSession();
 * ```
 */

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { NextAuthOptions } from 'next-auth';

/**
 * NextAuth configuration
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    /**
     * JWT callback - runs when JWT is created or updated
     */
    async jwt({ token, user }) {
      // Add user info to token
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },

    /**
     * Session callback - runs when session is checked
     */
    async session({ session, token }) {
      // Add user info from token to session
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },

    /**
     * Sign-in callback - control who can sign in
     */
    async signIn({ user }) {
      // Get admin email whitelist
      const adminEmails = process.env.ADMIN_EMAIL
        ? process.env.ADMIN_EMAIL.split(',').map((email) => email.trim())
        : [];

      // Check if user email is in whitelist
      if (user.email && adminEmails.includes(user.email)) {
        return true; // Allow sign in
      }

      // Reject sign in for non-admin users
      return false;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page (optional)
    error: '/auth/error', // Custom error page (optional)
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * NextAuth handler
 */
const handler = NextAuth(authOptions);

/**
 * Export GET and POST handlers for Next.js App Router
 */
export { handler as GET, handler as POST };
