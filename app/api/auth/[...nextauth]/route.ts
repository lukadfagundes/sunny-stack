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
import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

/**
 * NextAuth configuration
 */
const config: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    pkceCodeVerifier: {
      name: 'authjs.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    async signIn({ user }) {
      const adminEmails = process.env.ADMIN_EMAIL
        ? process.env.ADMIN_EMAIL.split(',').map((email) => email.trim())
        : [];

      if (user.email && adminEmails.includes(user.email)) {
        return true;
      }
      return false;
    },
  },
  trustHost: true,
};

/**
 * NextAuth v5 handler
 */
const { handlers, auth, signIn, signOut } = NextAuth(config);

export const GET = handlers.GET;
export const POST = handlers.POST;
export { auth, signIn, signOut };
