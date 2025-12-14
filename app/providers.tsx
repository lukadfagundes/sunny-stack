'use client';

/**
 * Providers Component
 *
 * Root providers wrapper (currently empty since we removed NextAuth SessionProvider)
 */

import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
