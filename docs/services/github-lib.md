# GitHub Library (github.ts)

## Overview

Server-side GitHub GraphQL API client that fetches all landing page data in a single batched query. Retrieves the user's avatar, pinned repositories, public repositories with languages, contribution calendar (last 365 days), commit/PR/issue statistics, and merged pull requests. Includes a comprehensive fallback data constant for graceful degradation.

**Source:** `src/lib/github.ts` (241 lines)

## Exports

### Functions

#### `fetchGitHubData(): Promise<GitHubData>`

Fetches all GitHub data for the landing page in a single GraphQL query. Returns `FALLBACK_DATA` if the token is missing or any error occurs.

**Environment Variables:**
- `GITHUB_TOKEN` (required) -- GitHub personal access token

**Behavior:**
1. Returns `FALLBACK_DATA` immediately if `GITHUB_TOKEN` is not set
2. Calculates a 365-day date range for the contribution calendar
3. Executes a single GraphQL query with `username`, `from`, and `to` variables
4. Filters merged PRs to exclude private repositories
5. Aggregates total star count across all public repos
6. Returns complete `GitHubData` object

### Types/Interfaces

#### `GitHubData` (exported)

```typescript
interface GitHubData {
  avatarUrl: string;
  pinnedRepos: GitHubPinnedRepo[];
  publicRepos: GitHubRepo[];
  totalPublicRepos: number;
  totalStars: number;
  contributionCalendar: {
    totalContributions: number;
    weeks: ContributionWeek[];
  };
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReposCreated: number;
  mergedPRs: GitHubPullRequest[];
  totalMergedPRs: number;
}
```

#### `GitHubRepo` (exported)

```typescript
interface GitHubRepo {
  name: string;
  description: string | null;
  url: string;
  pushedAt: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: GitHubLanguage | null;
  languages: {
    edges: Array<{ size: number; node: GitHubLanguage }>;
  };
}
```

#### `GitHubPinnedRepo` (exported)

```typescript
interface GitHubPinnedRepo {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: GitHubLanguage | null;
}
```

#### `GitHubLanguage` (exported)

```typescript
interface GitHubLanguage {
  name: string;
  color: string;
}
```

#### `ContributionDay` (exported)

```typescript
interface ContributionDay {
  contributionCount: number;
  date: string;
  color: string;
}
```

#### `ContributionWeek` (exported)

```typescript
interface ContributionWeek {
  contributionDays: ContributionDay[];
}
```

#### `GitHubPullRequest` (exported)

```typescript
interface GitHubPullRequest {
  title: string;
  url: string;
  mergedAt: string;
  repository: { name: string; isPrivate: boolean };
}
```

## Implementation Details

### Constants

- `GITHUB_GRAPHQL`: `"https://api.github.com/graphql"`
- `GITHUB_USERNAME`: `"strawhatluka"` (hardcoded)

### GraphQL Query

The `GitHubProfile` query fetches in a single request:
- `avatarUrl(size: 200)`
- `pinnedItems(first: 6, types: [REPOSITORY])` -- up to 6 pinned repos
- `repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: PUSHED_AT DESC)` -- up to 100 public repos with languages (first 10 by size)
- `contributionsCollection(from, to)` -- contribution calendar and totals (commits, PRs, issues, repos created)
- `pullRequests(first: 10, states: MERGED, orderBy: UPDATED_AT DESC)` -- recent merged PRs with totalCount

### Contribution Calendar Date Range

Dynamically calculates a 365-day window:
```typescript
const now = new Date();
const oneYearAgo = new Date(now);
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
```

### Private Repo PR Filtering

Merged PRs are filtered to exclude those from private repositories before returning, even though the total count (`totalMergedPRs`) includes all merged PRs:
```typescript
const publicMergedPRs = user.pullRequests.nodes.filter(pr => !pr.repository.isPrivate);
```

### Star Count Aggregation

Total stars are computed by reducing over all public repos:
```typescript
const totalStars = repos.reduce((sum, r) => sum + r.stargazerCount, 0);
```

### Fallback Data

`FALLBACK_DATA` is a module-level constant `GitHubData` object with all fields set to empty arrays, empty strings, or zero values. Used when the token is missing or any API error occurs, ensuring the landing page always renders.

## Error Handling

| Condition | Behavior |
|-----------|----------|
| `GITHUB_TOKEN` not set | Logs warning, returns `FALLBACK_DATA` |
| API returns non-OK status | Logs status code, returns `FALLBACK_DATA` |
| GraphQL errors in response | Logs errors, returns `FALLBACK_DATA` |
| Network exception | Logs error, returns `FALLBACK_DATA` |

## Dependencies

- **External API:** GitHub GraphQL API (`https://api.github.com/graphql`)
- **No Next.js imports** -- this is a pure utility module
- **Caching:** `cache: "no-store"` on the fetch call

## Usage

Called from the landing page server component (`src/app/page.tsx`):

```typescript
import { fetchGitHubData } from "@/lib/github";

export const revalidate = 3600; // ISR: 1 hour

export default async function Home() {
  const data = await fetchGitHubData();
  // Pass data as props to child components
}
```
