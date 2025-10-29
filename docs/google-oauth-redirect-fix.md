# Fix: Google OAuth Redirect URI Mismatch

**Error:** `Error 400: redirect_uri_mismatch`

**Cause:** You have **two different Google OAuth flows** in this project:

1. **Bot OAuth** - For Discord bot to access Google APIs (Gmail, Drive, etc.)
2. **NextAuth OAuth** - For admin dashboard login (sign in with Google)

These require **different redirect URIs**.

---

## Solution: Add NextAuth Redirect URIs

### Step 1: Go to Google Cloud Console

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID: **"Sunny Stack Bot - Web Client"**
3. Click the ✏️ (edit) icon

### Step 2: Add NextAuth Redirect URIs

Scroll down to **"Authorized redirect URIs"** section.

**Current URIs** (for bot):

```
http://localhost:3000/api/auth/callback/google
https://sunny-stack.com/api/auth/callback/google
```

**Add these NextAuth URIs** (click **+ ADD URI** for each):

```
http://localhost:3000/api/auth/callback/google
https://sunny-stack.com/api/auth/callback/google
http://localhost:3000/auth/callback/google
https://sunny-stack.com/auth/callback/google
```

**Wait, these look the same!** Actually, NextAuth uses the same `/api/auth/callback/google` path by default. The error suggests NextAuth is sending a different redirect URI.

### Step 3: Check What URI NextAuth is Actually Sending

The error page shows the actual redirect URI that was sent. Look at the browser URL bar - it should show something like:

```
https://accounts.google.com/signin/oauth/error?...redirect_uri=http://localhost:3000/SOMETHING
```

**What does `SOMETHING` say?**

Common NextAuth redirect URIs:

- `/api/auth/callback/google` (default)
- `/auth/callback/google` (custom)
- `/api/auth/signin/google` (incorrect, but sometimes misconfigured)

---

## Quick Fix: Try These URIs

Since I can't see the exact URI from your error, add **all of these** to be safe:

### In Google Cloud Console > Credentials > Your OAuth Client > Authorized redirect URIs

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/auth/callback/google
http://localhost:3000/api/auth/signin/google
https://sunny-stack.com/api/auth/callback/google
https://sunny-stack.com/auth/callback/google
https://sunny-stack.com/api/auth/signin/google
```

Click **SAVE**

---

## Step 4: Verify Your .env.local

Make sure your `.env.local` has:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-64-char-secret-here

# Google OAuth (same credentials work for both bot and NextAuth)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

**Note:** The same Google OAuth credentials are used for both the bot's Google API access AND NextAuth admin login. You just need different redirect URIs registered.

---

## Step 5: Restart Your Dev Server

After adding the redirect URIs in Google Cloud Console:

```bash
# Stop dev server (Ctrl+C)
npm run dev
```

Wait 30-60 seconds for Google's OAuth configuration to propagate, then try signing in again.

---

## Still Getting the Error?

### Option A: Check Browser URL During Error

1. When you see the error page, look at the browser URL bar
2. Find the `redirect_uri=` parameter
3. Copy the exact value
4. Add that exact URI to Google Cloud Console > Authorized redirect URIs
5. Click SAVE
6. Wait 60 seconds
7. Try again

### Option B: Check NextAuth Configuration

Your project might have a custom NextAuth configuration. Check `app/api/auth/[...nextauth]/route.ts`:

```typescript
// Look for this:
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // Is there a custom callbackUrl here?
  }),
],
```

If there's a custom `callbackUrl`, add that exact URL to Google Cloud Console.

---

## Understanding the Two OAuth Flows

### Flow 1: Bot OAuth (for Google APIs)

- **Purpose:** Bot accesses Gmail, Drive, Calendar, etc.
- **Redirect URI:** `http://localhost:3000/api/auth/callback/google`
- **Uses:** Refresh token stored in `GOOGLE_REFRESH_TOKEN`
- **Setup:** Covered in [google-api-setup.md](google-api-setup.md)

### Flow 2: NextAuth (for Admin Login)

- **Purpose:** You sign in to admin dashboard with Google account
- **Redirect URI:** `http://localhost:3000/api/auth/callback/google` (NextAuth default)
- **Uses:** Session cookies (handled by NextAuth)
- **Setup:** Uses same `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

**Both flows use the same OAuth client**, they just need their redirect URIs registered.

---

## Summary

**Quick Fix Steps:**

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add all 6 redirect URIs listed above in "Quick Fix"
4. Click SAVE
5. Wait 60 seconds
6. Restart `npm run dev`
7. Try signing in again

**This should resolve the `redirect_uri_mismatch` error.**

---

**Last Updated:** 2025-10-28
**Related Docs:** [google-api-setup.md](google-api-setup.md), [.env.example](../.env.example)
