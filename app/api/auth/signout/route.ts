/**
 * Sign Out Endpoint
 */

import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/google-oauth';

export async function GET() {
  await destroySession();
  return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
}
