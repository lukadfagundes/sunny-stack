# API Endpoint Map

Visual map of all 10 API endpoints across 8 resource groups in the sunny-stack portfolio application. All endpoints are **GET-only** and return JSON responses. Rate-limited at **30 requests per minute per IP** via middleware.

## Endpoint Hierarchy

```mermaid
flowchart LR
    API["/api"]

    API --> Bluesky["Bluesky"]
    API --> YouTube["YouTube"]
    API --> GitHub["GitHub"]
    API --> Activity["Activity"]
    API --> Spotify["Spotify"]
    API --> Steam["Steam"]
    API --> Docs["Docs"]
    API --> Instagram["Instagram"]

    Bluesky --> BS1["/api/bluesky"]
    YouTube --> YT1["/api/youtube"]
    GitHub --> GH1["/api/github"]
    Activity --> AC1["/api/activity"]
    Spotify --> SP1["/api/spotify/top-track"]
    Spotify --> SP2["/api/spotify/wrapped"]
    Steam --> ST1["/api/steam"]
    Steam --> ST2["/api/steam/achievements"]
    Docs --> DC1["/api/docs?list=true"]
    Docs --> DC2["/api/docs?path=..."]
    Instagram --> IG1["/api/instagram"]

    style API fill:#1e293b,color:#f8fafc,stroke:#3b82f6,stroke-width:2px
    style Bluesky fill:#0285c7,color:#fff,stroke:#0285c7
    style YouTube fill:#dc2626,color:#fff,stroke:#dc2626
    style GitHub fill:#333,color:#fff,stroke:#333
    style Activity fill:#16a34a,color:#fff,stroke:#16a34a
    style Spotify fill:#1db954,color:#fff,stroke:#1db954
    style Steam fill:#1b2838,color:#fff,stroke:#1b2838
    style Docs fill:#6366f1,color:#fff,stroke:#6366f1
    style Instagram fill:#e1306c,color:#fff,stroke:#e1306c
```

## Endpoint Details

### Bluesky (1 endpoint)

| Method | Endpoint | Description | Parameters | Response Type |
|---|---|---|---|---|
| GET | `/api/bluesky` | Latest Bluesky post | None | `BlueskyPost \| null` |

### YouTube (1 endpoint)

| Method | Endpoint | Description | Parameters | Response Type |
|---|---|---|---|---|
| GET | `/api/youtube` | 5 most recent videos with statistics | None | `YouTubeVideo[]` |

### GitHub (1 endpoint)

| Method | Endpoint | Description | Parameters | Response Type |
|---|---|---|---|---|
| GET | `/api/github` | Profile card data (avatar, name, bio, location) | None | `GitHubProfile \| null` |

### Activity (1 endpoint)

| Method | Endpoint | Description | Parameters | Response Type |
|---|---|---|---|---|
| GET | `/api/activity` | Cross-platform activity status | None | `ActivityStatus` |

### Spotify (2 endpoints)

| Method | Endpoint | Description | Parameters | Response Type |
|---|---|---|---|---|
| GET | `/api/spotify/top-track` | Current top track | None | `SpotifyTopTrack \| null` |
| GET | `/api/spotify/wrapped` | Top 5 tracks, top 5 artists, top genres | None | `SpotifyWrappedData \| null` |

### Steam (2 endpoints)

| Method | Endpoint | Description | Parameters | Response Type |
|---|---|---|---|---|
| GET | `/api/steam` | Top 8 most-played games with header images | None | `SteamGame[]` |
| GET | `/api/steam/achievements` | Achievement data for a specific game | `?appid={number}` (required, validated with `/^\d+$/`) | `SteamAchievementData \| null` |

### Docs (1 endpoint, 2 modes)

| Method | Endpoint | Description | Parameters | Response Type |
|---|---|---|---|---|
| GET | `/api/docs` | Documentation file tree | `?list=true` | `DocFile[]` |
| GET | `/api/docs` | Markdown file content with Mermaid preprocessing | `?path={filepath}` (validated against path traversal) | `string` |

### Instagram (1 endpoint)

| Method | Endpoint | Description | Parameters | Response Type |
|---|---|---|---|---|
| GET | `/api/instagram` | 5 most recent image posts | None | `InstagramPost[]` |

## Rate Limiting

All endpoints are protected by the rate limiter in `src/proxy.ts`:

- **Limit**: 30 requests per minute per IP address
- **Scope**: All routes matching `/api/*`
- **Exceeded response**: `429 Too Many Requests` with `Retry-After` header

## Error Responses

| Status Code | Meaning | When |
|---|---|---|
| 200 | Success | Data returned (or `null`/empty array as graceful fallback when credentials are missing) |
| 400 | Bad Request | Missing or invalid parameters (only from `/api/docs`, `/api/steam/achievements`) |
| 404 | Not Found | Requested file not found (only from `/api/docs`) |
| 429 | Too Many Requests | Rate limit exceeded (includes `Retry-After` header) |

## Authentication

No client-side authentication is required. API route handlers authenticate with external services using server-side environment variables (OAuth tokens and API keys stored in `process.env`).
