/**
 * Google OAuth Callback Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  handleGoogleCallback,
  createSession,
  isAuthorizedAdmin,
} from '@/lib/auth/google-oauth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // callback URL
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/api/auth/error?error=${error}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/api/auth/error?error=missing_code', request.url)
    );
  }

  try {
    // Exchange code for user info
    const user = await handleGoogleCallback(code);

    // Check if user is authorized admin
    if (!isAuthorizedAdmin(user.email)) {
      return NextResponse.redirect(
        new URL('/api/auth/error?error=AccessDenied', request.url)
      );
    }

    // Create session
    await createSession(user);

    // Redirect to callback URL or admin dashboard
    const callbackUrl = state || '/admin';
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  } catch (error) {
    console.error('[Auth Callback Error]', error);
    return NextResponse.redirect(
      new URL('/api/auth/error?error=Configuration', request.url)
    );
  }
}
