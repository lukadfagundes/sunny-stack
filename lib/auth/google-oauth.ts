/**
 * Direct Google OAuth 2.0 Implementation
 *
 * Bypasses NextAuth to avoid PKCE parsing issues in Vercel
 * Uses Google's official OAuth 2.0 flow
 */

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const COOKIE_NAME = "sunny-stack-session";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
);

interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

interface SessionData {
  [key: string]: unknown;
  user: {
    email: string;
    name: string;
    image: string;
  };
  expires: number;
}

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl(callbackUrl: string): string {
  const baseUrl =
    process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state: callbackUrl, // Store callback URL in state
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token and user info
 */
export async function handleGoogleCallback(code: string): Promise<GoogleUser> {
  const baseUrl =
    process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  // Exchange code for tokens
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange code for tokens");
  }

  const tokens = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to get user info");
  }

  return await userResponse.json();
}

/**
 * Create session JWT and set cookie
 */
export async function createSession(user: GoogleUser): Promise<void> {
  const sessionData: SessionData = {
    user: {
      email: user.email,
      name: user.name,
      image: user.picture,
    },
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  const token = await new SignJWT(sessionData)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

/**
 * Get current session from cookie
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, SECRET);
    const session = verified.payload as unknown as SessionData;

    // Check if expired
    if (session.expires < Date.now()) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Destroy session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Check if user email is authorized admin
 */
export function isAuthorizedAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAIL
    ? process.env.ADMIN_EMAIL.split(",").map((e) => e.trim())
    : [];

  return adminEmails.includes(email);
}
