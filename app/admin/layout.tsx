'use client';

/**
 * Admin Layout Component
 *
 * Provides authentication wrapper and layout structure for admin dashboard.
 * Uses NextAuth for session management and validates admin email access.
 *
 * Features:
 * - Client-side session verification
 * - Admin email whitelist validation
 * - Loading states during auth check
 * - Automatic redirect for unauthorized users
 *
 * @module app/admin/layout
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import AdminNav from '@/components/admin/AdminNav';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * AdminLayout Component
 *
 * Wraps admin routes with authentication and authorization checks.
 * Redirects unauthorized users to signin page.
 *
 * @param props - Component props
 * @param props.children - Child components to render if authorized
 * @returns Protected admin layout or loading/redirect state
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    // Redirect to signin if no session
    if (!session) {
      // Use signIn() instead of router.push to properly handle CSRF tokens
      // This ensures CSRF cookie is set and validated correctly in production
      signIn('google', { callbackUrl: pathname });
      return;
    }

    // Validate admin email
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.split(',').map(e => e.trim()) || [];
    const userEmail = session.user?.email;

    if (!userEmail || !adminEmails.includes(userEmail)) {
      // User authenticated but not admin - show error
      router.push('/unauthorized');
    }
  }, [session, status, router, pathname]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // If no session, return null (will redirect in useEffect)
  if (!session) {
    return null;
  }

  // Validate admin email
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.split(',').map(e => e.trim()) || [];
  const userEmail = session.user?.email;

  if (!userEmail || !adminEmails.includes(userEmail)) {
    return null; // Will redirect in useEffect
  }

  // User is authenticated and authorized - render layout
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminNav />
      <main className="flex-1 p-8 lg:ml-0 mt-16 lg:mt-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
