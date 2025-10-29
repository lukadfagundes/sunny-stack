'use client';

/**
 * Providers Component
 *
 * Wraps the app with necessary context providers (NextAuth SessionProvider)
 */

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
