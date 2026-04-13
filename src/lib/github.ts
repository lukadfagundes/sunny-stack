/**
 * GitHub GraphQL API - single batched query for all landing page data.
 * Runs server-side only (called from page.tsx server component).
 * Private repos: aggregate stats are included, but names/descriptions/URLs
 * are only returned for public repos.
 */

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const GITHUB_USERNAME = "strawhatluka";

// ── Response Types ──

export interface GitHubLanguage {
  name: string;
  color: string;
}

export interface GitHubRepo {
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

export interface GitHubPinnedRepo {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: GitHubLanguage | null;
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
  color: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface GitHubPullRequest {
  title: string;
  url: string;
  mergedAt: string;
  repository: { name: string; isPrivate: boolean };
}

export interface GitHubData {
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

// ── GraphQL Query ──

const QUERY = `
query GitHubProfile($username: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $username) {
    avatarUrl(size: 200)
    pinnedItems(first: 6, types: [REPOSITORY]) {
      nodes {
        ... on Repository {
          name
          description
          url
          stargazerCount
          forkCount
          primaryLanguage { name color }
        }
      }
    }
    repositories(
      first: 100
      ownerAffiliations: OWNER
      privacy: PUBLIC
      orderBy: { field: PUSHED_AT, direction: DESC }
    ) {
      totalCount
      nodes {
        name
        url
        description
        pushedAt
        stargazerCount
        forkCount
        primaryLanguage { name color }
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges {
            size
            node { name color }
          }
        }
      }
    }
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
            color
          }
        }
      }
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalRepositoryContributions
    }
    pullRequests(
      first: 10
      states: MERGED
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      totalCount
      nodes {
        title
        url
        mergedAt
        repository { name isPrivate }
      }
    }
  }
}
`;

// ── Fallback data when token is missing or API fails ──

const FALLBACK_DATA: GitHubData = {
  avatarUrl: "",
  pinnedRepos: [],
  publicRepos: [],
  totalPublicRepos: 0,
  totalStars: 0,
  contributionCalendar: { totalContributions: 0, weeks: [] },
  totalCommits: 0,
  totalPRs: 0,
  totalIssues: 0,
  totalReposCreated: 0,
  mergedPRs: [],
  totalMergedPRs: 0,
};

// ── Fetcher ──

export async function fetchGitHubData(): Promise<GitHubData> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.warn("[github] GITHUB_TOKEN not set - using fallback data");
    return FALLBACK_DATA;
  }

  // Contribution calendar: last 365 days
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          username: GITHUB_USERNAME,
          from: oneYearAgo.toISOString(),
          to: now.toISOString(),
        },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[github] API responded ${res.status}`);
      return FALLBACK_DATA;
    }

    const json = await res.json();

    if (json.errors) {
      console.error("[github] GraphQL errors:", json.errors);
      return FALLBACK_DATA;
    }

    const user = json.data.user;
    const contributions = user.contributionsCollection;

    // Filter out PRs from private repos before returning
    const publicMergedPRs = (user.pullRequests.nodes as GitHubPullRequest[]).filter(
      (pr) => !pr.repository.isPrivate
    );

    const repos = user.repositories.nodes as GitHubRepo[];
    const totalStars = repos.reduce((sum: number, r: GitHubRepo) => sum + r.stargazerCount, 0);

    return {
      avatarUrl: user.avatarUrl ?? "",
      pinnedRepos: user.pinnedItems.nodes as GitHubPinnedRepo[],
      publicRepos: repos,
      totalPublicRepos: user.repositories.totalCount,
      totalStars,
      contributionCalendar: contributions.contributionCalendar,
      totalCommits: contributions.totalCommitContributions,
      totalPRs: contributions.totalPullRequestContributions,
      totalIssues: contributions.totalIssueContributions,
      totalReposCreated: contributions.totalRepositoryContributions,
      mergedPRs: publicMergedPRs,
      totalMergedPRs: user.pullRequests.totalCount,
    };
  } catch (error) {
    console.error("[github] Fetch failed:", error);
    return FALLBACK_DATA;
  }
}
