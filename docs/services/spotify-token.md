# Spotify Token Module

## Overview

Shared Spotify OAuth 2.0 token management module. Implements the refresh token flow with in-memory token caching and a 60-second expiry buffer. Used by both the top-track and wrapped Spotify routes.

**Source:** `src/app/api/spotify/token.ts` (53 lines)

## Exports

### Functions

#### `hasSpotifyCredentials(): boolean`

Returns `true` if all three Spotify environment variables are set:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`

Uses double-bang (`!!`) coercion to check for truthy values.

#### `getSpotifyAccessToken(): Promise<string | null>`

Obtains a valid Spotify access token using the refresh token grant flow:

1. Returns `null` immediately if credentials are missing (via `hasSpotifyCredentials()`)
2. Returns the cached token if it exists and hasn't expired (`Date.now() < cachedToken.expiresAt`)
3. Otherwise, sends a POST request to `https://accounts.spotify.com/api/token` with:
   - `Content-Type: application/x-www-form-urlencoded`
   - `Authorization: Basic {base64(clientId:clientSecret)}`
   - Body: `grant_type=refresh_token&refresh_token={SPOTIFY_REFRESH_TOKEN}`
4. Caches the new token with an expiry calculated as: `Date.now() + (expires_in - 60) * 1000`
5. Returns the access token string, or `null` on failure

## Implementation Details

### Token Cache

Module-level variable shared across requests within the same server process:
```typescript
let cachedToken: { accessToken: string; expiresAt: number } | null = null;
```

### Expiry Buffer

The cached token is considered expired 60 seconds before the actual Spotify expiry time. This prevents edge cases where a token expires between validation and use:
```typescript
expiresAt: Date.now() + (data.expires_in - 60) * 1000
```

### Client Credentials Encoding

The `Authorization` header uses Base64-encoded `clientId:clientSecret`:
```typescript
Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
```

## Error Handling

| Condition | Behavior |
|-----------|----------|
| Missing credentials | `hasSpotifyCredentials()` returns `false`; `getSpotifyAccessToken()` returns `null` |
| Token refresh HTTP error | Logs error text, returns `null` |
| Network exception | Logs error, returns `null` |

## Dependencies

- **External API:** Spotify Accounts Service (`accounts.spotify.com/api/token`)
- **Environment Variables:** `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`

## Usage

Imported by both Spotify route handlers:

```typescript
import { getSpotifyAccessToken, hasSpotifyCredentials } from "../token";

// In route handler:
if (!hasSpotifyCredentials()) {
  return NextResponse.json(null, { status: 200 });
}
const accessToken = await getSpotifyAccessToken();
if (!accessToken) {
  return NextResponse.json(null, { status: 200 });
}
```
