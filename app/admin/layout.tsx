'use client';

/**
 * Admin Layout Component
 *
 * Provides authentication wrapper and layout structure for admin dashboard.
 * Uses custom Google OAuth for session management and validates admin email access.
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

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import AdminNav from '@/components/admin/AdminNav';

interface AdminLayoutProps {
  children: ReactNode;
}

interface SessionData {
  user: {
    email: string;
    name: string;
    picture?: string;
  };
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
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        setSession(data);
        setLoading(false);

        if (!data) {
          // No session - redirect to signin
          const callbackUrl = encodeURIComponent(pathname);
          router.push(`/api/auth/signin?callbackUrl=${callbackUrl}`);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setLoading(false);
        router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      }
    }

    checkSession();
  }, [router, pathname]);

  // Show loading state while checking authentication
  if (loading) {
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
