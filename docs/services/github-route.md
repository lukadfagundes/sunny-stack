# GitHub Profile Route

## Overview

Fetches GitHub user profile card data (avatar, name, bio, location, last push timestamp) using the GitHub GraphQL API. Returns a `GitHubProfile` object for display in the About page's profile card.

**Source:** `src/app/api/github/route.ts` (76 lines)

## Endpoint

`GET /api/github`

## Authentication

| Environment Variable | Required | Description                                         |
| -------------------- | -------- | --------------------------------------------------- |
| `GITHUB_TOKEN`       | Yes      | GitHub personal access token with `read:user` scope |

If `GITHUB_TOKEN` is not set, the endpoint returns `null` with HTTP 200.

## Response Type

### `GitHubProfile` (exported)

```typescript
interface GitHubProfile {
  avatarUrl: string; // GitHub avatar URL (200px size)
  name: string | null; // Display name
  bio: string | null; // Bio text
  location: string | null; // Location string
  lastPushedAt: string | null; // ISO 8601 timestamp of most recent push
}
```

## Implementation Details

### GraphQL Query

Uses the `GitHubProfileCard` query targeting a hardcoded username (`strawhatluka`):

```graphql
query GitHubProfileCard($username: String!) {
  user(login: $username) {
    avatarUrl(size: 200)
    name
    bio
    location
    repositories(first: 1, orderBy: { field: PUSHED_AT, direction: DESC }) {
      nodes {
        pushedAt
      }
    }
  }
}
```

### Constants

- `GITHUB_GRAPHQL`: `https://api.github.com/graphql`
- `GITHUB_USERNAME`: `"strawhatluka"` (hardcoded)

### Data Extraction

- `lastPushedAt` is extracted from the first node of repositories sorted by most recent push
- All nullable fields default to `null` if not present in the API response
- `avatarUrl` defaults to empty string if not present

## Error Handling

| Condition                  | Behavior                                        |
| -------------------------- | ----------------------------------------------- |
| `GITHUB_TOKEN` not set     | Returns `null` with HTTP 200                    |
| API returns non-OK status  | Logs status code, returns `null` with HTTP 200  |
| GraphQL errors in response | Logs errors array, returns `null` with HTTP 200 |
| Network exception          | Logs error, returns `null` with HTTP 200        |

## Dependencies

- **External API:** GitHub GraphQL API (`https://api.github.com/graphql`)
- **Next.js:** `NextResponse` from `next/server`
- **Caching:** `cache: "no-store"`

## Usage

Consumed by components on the About page that display GitHub profile information.

```typescript
const res = await fetch("/api/github");
const profile: GitHubProfile | null = await res.json();
```
