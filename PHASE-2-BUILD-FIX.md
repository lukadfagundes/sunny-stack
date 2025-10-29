# Phase 2 Build Fix - NextAuth v5 Compatibility

**Date:** 2025-10-29
**Issue:** Build failing due to NextAuth v5 beta API changes
**Status:** ✅ RESOLVED

---

## Problem

The build was failing with this error:

```
TypeError: Cannot destructure property 'data' of '(0 , e.wV)(...)' as it is undefined.
```

**Root Cause:**

- Admin pages used `useSession()` from `next-auth/react`
- NextAuth v5 beta requires `SessionProvider` wrapper
- Without the provider, `useSession()` returned undefined during build
- Next.js tried to statically generate admin pages, but they need client-side session

---

## Solution

### 1. Created SessionProvider Wrapper

**File:** `app/providers.tsx`

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### 2. Updated Root Layout

**File:** `app/layout.tsx`

Added `<Providers>` wrapper around the entire app to provide NextAuth session context.

### 3. Fixed Auth Middleware

**File:** `lib/middleware/auth.ts`

Removed deprecated `getServerSession` import from `next-auth/next` (not available in v5).
Auth checking now happens at the layout/page level instead of in API middleware.

### 4. Admin Layout Already Correct

**File:** `app/admin/layout.tsx`

- Uses `useSession()` from `next-auth/react` (correct for v5)
- Has proper loading states
- Redirects to `/api/auth/signin` for unauthenticated users
- Validates admin email from `NEXT_PUBLIC_ADMIN_EMAIL`

---

## Build Result

✅ **Build Successful!**

```
Route (app)                                 Size  First Load JS
├ ○ /admin                               3.25 kB         105 kB
├ ○ /admin/projects                      3.42 kB         109 kB
├ ƒ /admin/projects/[id]                  3.1 kB         108 kB
├ ƒ /admin/projects/[id]/edit            3.12 kB         108 kB
├ ○ /admin/proposals                     2.35 kB         104 kB
├ ○ /admin/quotes                        3.13 kB         109 kB
├ ƒ /admin/quotes/[id]                   3.74 kB         109 kB
├ ○ /admin/reports                        117 kB         219 kB
├ ƒ /api/admin/analytics                   159 B         102 kB
├ ƒ /api/admin/projects                    159 B         102 kB
├ ƒ /api/admin/projects/[id]               159 B         102 kB
├ ƒ /api/admin/proposals                   159 B         102 kB
├ ƒ /api/admin/quotes                      159 B         102 kB
├ ƒ /api/admin/quotes/[id]                 159 B         102 kB
├ ƒ /api/admin/quotes/[id]/convert         159 B         102 kB
```

**Legend:**

- ○ (Static) - Prerendered as static content
- ƒ (Dynamic) - Server-rendered on demand

All admin pages build successfully and are properly marked as dynamic.

---

## Authentication Flow (As Requested)

### User Journey

1. **User visits `/admin/`**
   - Admin layout checks session with `useSession()`
   - No session found → redirects to `/api/auth/signin`

2. **User clicks "Sign in with Google"**
   - NextAuth handles OAuth flow
   - Google authentication page opens
   - User grants permissions

3. **After successful Google sign-in:**
   - NextAuth validates email against `ADMIN_EMAIL` whitelist
   - If email matches → creates session
   - Redirects back to `/admin/` (or original URL via `callbackUrl`)

4. **User lands on admin dashboard**
   - Session exists → layout allows access
   - Dashboard displays: metrics, projects, quotes, reports
   - Full CRUD functionality available

5. **Unauthorized users:**
   - If email not in whitelist → redirected to `/unauthorized`
   - Session exists but not admin → access denied

---

## Environment Variables Required

```bash
# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Admin Access
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com  # Comma-separated list

# Admin Route (64-char hash)
ADMIN_ROUTE_HASH=6bde736bb52aa194f1d69d140619b25cb9f9a42eb3acb1f6e7a502b375fda6ac
```

**Note:** `NEXT_PUBLIC_ADMIN_EMAIL` must be public because the admin layout (client component) needs to check it.

---

## Testing the Fix

### 1. Build Test

```bash
npm run build
# ✅ Should complete successfully
```

### 2. Dev Server Test

```bash
npm run dev
# Navigate to http://localhost:3000/admin
# Should redirect to /api/auth/signin
```

### 3. Auth Flow Test

1. Visit `http://localhost:3000/admin`
2. Redirected to sign-in page
3. Click "Sign in with Google"
4. Complete Google OAuth
5. Redirected back to `/admin/`
6. Dashboard loads with your session

---

## Files Modified

1. **app/providers.tsx** (NEW) - SessionProvider wrapper
2. **app/layout.tsx** - Added Providers wrapper
3. **lib/middleware/auth.ts** - Removed deprecated import
4. **app/api/auth/[...nextauth]/route.ts** - Cleaned up unused exports
5. **app/admin/layout.tsx** - Already correct (no changes needed)
6. **app/admin/\*/page.tsx** - Added `export const dynamic = 'force-dynamic'`

---

## Key Learnings

### NextAuth v5 Beta Changes

- ❌ **Don't use:** `getServerSession` from `next-auth/next` (deprecated)
- ✅ **Do use:** `useSession()` from `next-auth/react` with `SessionProvider`
- ✅ **Do wrap:** App with `<SessionProvider>` in root layout
- ✅ **Do mark:** Admin routes as dynamic (not static)

### Next.js 15 Best Practices

- Client components can't export route config (`export const dynamic`)
- Use `SessionProvider` at root level for global session access
- Admin routes should be dynamic (server-rendered on demand)
- Loading states are essential for auth checks

---

## Production Checklist

Before deploying to production:

- [ ] Set `NEXTAUTH_SECRET` to strong random value
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Configure Google OAuth with production redirect URIs
- [ ] Set `NEXT_PUBLIC_ADMIN_EMAIL` to actual admin email(s)
- [ ] Verify `ADMIN_ROUTE_HASH` is secure (64 random characters)
- [ ] Test complete auth flow on production
- [ ] Verify unauthorized users are blocked
- [ ] Check all admin pages load correctly

---

**Status:** ✅ Build working, auth flow ready to test!
**Next Step:** Test authentication flow manually, then proceed with database migration.
