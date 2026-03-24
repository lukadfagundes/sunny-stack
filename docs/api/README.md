# sunny-stack API Documentation

Complete REST API reference for sunny-stack.

---

## Overview

sunny-stack provides **10 REST API endpoints** across **8 resources**.

**Base URL:** `/api`

**API Version:** Unversioned (single version)

All endpoints are **GET-only** and return JSON. No mutations, no POST/PUT/DELETE operations.

---

## Authentication

No client authentication required. API routes authenticate with external services using server-side environment variables (OAuth tokens, API keys). Clients call `/api/*` endpoints without any auth headers.

---

## Request Format

All endpoints accept standard HTTP GET requests. No request body or authentication headers are needed from clients.

```
GET /api/{resource}
```

Some endpoints accept query parameters for filtering:

```
GET /api/steam/achievements?appid=730
GET /api/docs?list=true
GET /api/docs?path=README.md
```

---

## Response Format

All responses are returned as JSON. The response structure varies per endpoint -- each returns the data directly (not wrapped in a standard envelope).

### Success Response (with data)

```json
{
  "avatarUrl": "https://avatars.githubusercontent.com/u/...",
  "name": "Luka",
  "bio": "Developer",
  "location": "USA",
  "lastPushedAt": "2026-03-20T15:30:00Z"
}
```

### Success Response (graceful fallback)

When credentials are missing or the external API fails, endpoints return `null` or `[]` with a 200 status code instead of throwing errors:

```json
null
```

```json
[]
```

### Error Response

```json
{
  "error": "Missing 'path' parameter"
}
```

---

## Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded. Returns data, `null`, or `[]` as graceful fallback when credentials are missing or external APIs fail. |
| 400 | Bad Request | Missing or invalid parameters. Only returned by `/api/docs` for invalid path inputs. |
| 404 | Not Found | File not found. Only returned by `/api/docs` when a requested markdown file does not exist. |
| 429 | Too Many Requests | Rate limit exceeded. Includes `Retry-After` header with seconds until the limit resets. |

---

## Rate Limiting

30 requests per minute per IP address. Enforced by `src/proxy.ts`. Returns 429 Too Many Requests with `Retry-After` header when exceeded.

Rate limit response:

```json
{
  "error": "Too many requests"
}
```

Response headers on 429:

```
Retry-After: 45
```

---

## Query Parameters

The following endpoints accept query parameters:

| Endpoint | Parameter | Type | Description |
|----------|-----------|------|-------------|
| `GET /api/steam/achievements` | `appid` | number | Steam application ID (validated with `/^\d+$/` regex) |
| `GET /api/docs` | `list` | string | Set to `"true"` to return the documentation file tree |
| `GET /api/docs` | `path` | string | File path to a markdown document (e.g., `README.md` or `docs/guides/getting-started.md`) |

---

## API Resources

| Resource | Endpoints | Description |
|----------|-----------|-------------|
| bluesky | 1 | Latest Bluesky social post |
| youtube | 1 | Recent YouTube videos with statistics |
| github | 1 | GitHub profile card data |
| activity | 1 | Cross-platform activity status |
| spotify | 2 | Top track and wrapped/yearly summary |
| steam | 2 | Most-played games and achievements |
| docs | 1 | Documentation file tree and content (2 modes) |
| instagram | 1 | Recent image posts |

---

## Endpoints

### Bluesky

#### `GET /api/bluesky`

Returns the latest Bluesky post (excluding replies) for the configured handle.

**Parameters:** None

**Response:** `BlueskyPost | null`

```json
{
  "text": "Just shipped a new feature!",
  "facets": [
    {
      "index": { "byteStart": 0, "byteEnd": 10 },
      "features": [{ "$type": "app.bsky.richtext.facet#link", "uri": "https://example.com" }]
    }
  ],
  "embed": {
    "type": "external",
    "external": {
      "uri": "https://example.com",
      "title": "Example Site",
      "description": "An example website",
      "thumb": "https://cdn.bsky.app/thumb.jpg"
    }
  },
  "likeCount": 12,
  "replyCount": 3,
  "repostCount": 5,
  "permalink": "https://bsky.app/profile/handle.bsky.social/post/abc123",
  "createdAt": "2026-03-20T15:30:00.000Z"
}
```

**Fallback:** Returns `null` when `BLUESKY_HANDLE` is not set or the Bluesky API fails.

---

### YouTube

#### `GET /api/youtube`

Returns the 5 most recent YouTube videos with view, like, and comment statistics.

**Parameters:** None

**Response:** `YouTubeVideo[]`

```json
[
  {
    "id": "dQw4w9WgXcQ",
    "title": "Building a Portfolio Site with Next.js",
    "description": "In this video we build...",
    "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "publishedAt": "2026-03-15T12:00:00Z",
    "viewCount": 1500,
    "likeCount": 120,
    "commentCount": 25
  }
]
```

**Fallback:** Returns `[]` when `YOUTUBE_API_KEY` or `YOUTUBE_CHANNEL_ID` is not set.

---

### GitHub

#### `GET /api/github`

Returns GitHub profile card data including avatar, name, bio, location, and last push timestamp.

**Parameters:** None

**Response:** `GitHubProfile | null`

```json
{
  "avatarUrl": "https://avatars.githubusercontent.com/u/12345678?s=200",
  "name": "Luka",
  "bio": "Full-stack developer building cool things",
  "location": "USA",
  "lastPushedAt": "2026-03-20T15:30:00Z"
}
```

**Fallback:** Returns `null` when `GITHUB_TOKEN` is not set or the GitHub GraphQL API fails.

---

### Activity

#### `GET /api/activity`

Returns cross-platform activity status by aggregating the most recent activity across GitHub, Bluesky, Instagram, and YouTube. Considers the user "online" if any activity occurred within the last hour.

**Parameters:** None

**Response:** `ActivityStatus`

```json
{
  "lastActivityAt": "2026-03-20T15:30:00.000Z",
  "isOnline": true
}
```

**Fallback:** Returns `{ "lastActivityAt": null, "isOnline": false }` when no platform credentials are configured.

---

### Spotify

#### `GET /api/spotify/top-track`

Returns the current top track from Spotify (medium-term time range).

**Parameters:** None

**Response:** `SpotifyTopTrack | null`

```json
{
  "id": "4uLU6hMCjMI75M1A2tKUQC",
  "name": "Blinding Lights",
  "artist": "The Weeknd",
  "albumName": "After Hours",
  "albumImageUrl": "https://i.scdn.co/image/ab67616d0000b273...",
  "spotifyUrl": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"
}
```

**Fallback:** Returns `null` when Spotify credentials (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`) are not set.

---

#### `GET /api/spotify/wrapped`

Returns a Spotify Wrapped-style summary: top 5 tracks, top 5 artists, top genres, and the current year.

**Parameters:** None

**Response:** `SpotifyWrappedData | null`

```json
{
  "tracks": [
    {
      "id": "4uLU6hMCjMI75M1A2tKUQC",
      "name": "Blinding Lights",
      "artist": "The Weeknd",
      "albumName": "After Hours",
      "albumImageUrl": "https://i.scdn.co/image/...",
      "spotifyUrl": "https://open.spotify.com/track/..."
    }
  ],
  "artists": [
    {
      "id": "1Xyo4u8uXC1ZmMpatF05PJ",
      "name": "The Weeknd",
      "imageUrl": "https://i.scdn.co/image/...",
      "genres": ["canadian pop", "pop"],
      "spotifyUrl": "https://open.spotify.com/artist/..."
    }
  ],
  "topGenres": ["canadian pop", "pop", "r&b", "dance pop"],
  "year": 2026
}
```

**Fallback:** Returns `null` when Spotify credentials are not set.

---

### Steam

#### `GET /api/steam`

Returns the top 8 most-played Steam games with header images and recently-played status.

**Parameters:** None

**Response:** `SteamGamesData | null`

```json
{
  "games": [
    {
      "appid": 730,
      "name": "Counter-Strike 2",
      "playtimeMinutes": 15000,
      "headerImage": "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg",
      "recentlyPlayed": true
    }
  ]
}
```

**Fallback:** Returns `null` when `STEAM_API_KEY` or `STEAM_ID` is not set.

---

#### `GET /api/steam/achievements?appid={id}`

Returns achievement data for a specific Steam game, including earned achievements sorted by unlock time (newest first).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appid` | number | Yes | Steam application ID (must be numeric) |

**Response:** `SteamAchievementData | null`

```json
{
  "achieved": 45,
  "total": 100,
  "achievements": [
    {
      "apiname": "ACH_WIN_PISTOL_ROUND",
      "displayName": "Pistol Round Winner",
      "description": "Win a pistol round",
      "icon": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/730/...",
      "unlocktime": 1711036200
    }
  ]
}
```

**Fallback:** Returns `null` when credentials are missing, `appid` is not provided, or the game has no achievements.

---

### Docs

#### `GET /api/docs?list=true`

Returns the documentation file tree, including root-level files (`README.md`, `CHANGELOG.md`) and all markdown files in the `docs/` directory.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list` | string | Yes | Must be `"true"` to return file tree |

**Response:** `{ files: DocFile[] }`

```json
{
  "files": [
    { "name": "README.md", "path": "README.md", "type": "file" },
    { "name": "CHANGELOG.md", "path": "CHANGELOG.md", "type": "file" },
    {
      "name": "docs",
      "path": "docs",
      "type": "directory",
      "children": [
        {
          "name": "guides",
          "path": "docs/guides",
          "type": "directory",
          "children": [
            { "name": "getting-started.md", "path": "docs/guides/getting-started.md", "type": "file" }
          ]
        }
      ]
    }
  ]
}
```

---

#### `GET /api/docs?path={filepath}`

Returns the content of a specific markdown file. Mermaid code blocks are preprocessed into `<mermaid-diagram>` HTML markers for client-side rendering.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | File path (e.g., `README.md` or `docs/guides/getting-started.md`) |

**Validation:**
- Path must not contain `..` (path traversal blocked)
- Path must be a root-level file (`README.md`, `CHANGELOG.md`) or start with `docs/`
- Path must end with `.md`

**Response:** `{ content: string }`

```json
{
  "content": "# sunny-stack\n\nA portfolio website built with Next.js..."
}
```

**Error Responses:**

```json
// 400 - Missing path parameter
{ "error": "Missing 'path' parameter" }

// 400 - Invalid path
{ "error": "Invalid path" }

// 404 - File not found
{ "error": "File not found" }
```

---

### Instagram

#### `GET /api/instagram`

Returns the 5 most recent Instagram image posts (filters out videos and carousel albums).

**Parameters:** None

**Response:** `InstagramPost[]`

```json
[
  {
    "id": "17895695668004550",
    "imageUrl": "https://scontent.cdninstagram.com/...",
    "caption": "Beautiful sunset at the beach",
    "timestamp": "2026-03-18T19:30:00+0000",
    "permalink": "https://www.instagram.com/p/ABC123/",
    "likeCount": 42,
    "commentsCount": 5
  }
]
```

**Fallback:** Returns `[]` when `INSTAGRAM_ACCESS_TOKEN` is not set.

---

## Error Codes

### Common Errors

| Code | Condition | Response |
|------|-----------|----------|
| 200 | Success (data returned) | Endpoint-specific JSON data |
| 200 | Success (graceful fallback) | `null` or `[]` when credentials missing or external API fails |
| 400 | Missing or invalid parameters | `{ "error": "..." }` (only from `/api/docs` and `/api/steam/achievements`) |
| 404 | File not found | `{ "error": "File not found" }` (only from `/api/docs`) |
| 429 | Rate limit exceeded | `{ "error": "Too many requests" }` with `Retry-After` header |

---

## Code Examples

### JavaScript (Fetch)

```javascript
// Fetch GitHub profile data
const response = await fetch('/api/github');
const profile = await response.json();

if (profile) {
  console.log(profile.name, profile.bio);
} else {
  console.log('GitHub data unavailable');
}
```

### JavaScript (Multiple endpoints)

```javascript
// Fetch data from multiple endpoints in parallel
const [github, bluesky, youtube] = await Promise.all([
  fetch('/api/github').then(r => r.json()),
  fetch('/api/bluesky').then(r => r.json()),
  fetch('/api/youtube').then(r => r.json()),
]);

console.log('GitHub:', github?.name);
console.log('Bluesky:', bluesky?.text);
console.log('Videos:', youtube?.length ?? 0);
```

### cURL

```bash
# Fetch GitHub profile
curl http://localhost:3000/api/github

# Fetch Steam achievements for Counter-Strike 2
curl "http://localhost:3000/api/steam/achievements?appid=730"

# Fetch documentation file tree
curl "http://localhost:3000/api/docs?list=true"

# Fetch a specific markdown file
curl "http://localhost:3000/api/docs?path=README.md"
```

### Python (Requests)

```python
import requests

# Fetch GitHub profile
response = requests.get('http://localhost:3000/api/github')
profile = response.json()

if profile:
    print(f"{profile['name']} - {profile['bio']}")

# Fetch Instagram posts
posts = requests.get('http://localhost:3000/api/instagram').json()
for post in posts:
    print(f"{post['caption'][:50]}... ({post['likeCount']} likes)")
```

---

## Versioning

Single unversioned API. All endpoints at `/api/*`. There are no versioned prefixes (e.g., no `/api/v1/`).

---

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) in the project root.

---

## Related Documentation

- [Getting Started](../guides/getting-started.md) - Setup and installation
- [API Development Guide](../guides/api-development.md) - Creating new endpoints
- [Deployment Guide](../guides/deployment.md) - Production deployment

---

## Support

For API support:
- **Documentation:** [Full documentation](../README.md)
- **Issues:** Report bugs via [GitHub Issues](https://github.com/strawhatluka/sunny-stack/issues)
- **Questions:** [GitHub Discussions](https://github.com/strawhatluka/sunny-stack/discussions)

---

*Last updated: 2026-03-24*
