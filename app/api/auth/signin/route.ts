/**
 * Google OAuth Sign In Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/auth/google-oauth';

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/admin';
  const authUrl = getGoogleAuthUrl(callbackUrl);

  return NextResponse.redirect(authUrl);
}
