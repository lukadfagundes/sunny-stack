/**
 * @file GitHub API Integration
 * @description Monitor GitHub repositories, workflows, pull requests, and deployments
 */

import logger from '@/lib/logger';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN;

interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  repository: {
    full_name: string;
  };
  head_branch: string;
  event: string;
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  draft: boolean;
}

interface GitHubRepository {
  id: number;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
  pushed_at: string;
  open_issues_count: number;
  default_branch: string;
}

interface GitHubDeployment {
  id: number;
  sha: string;
  ref: string;
  environment: string;
  created_at: string;
  updated_at: string;
  statuses_url: string;
}

interface GitHubDeploymentStatus {
  state: 'error' | 'failure' | 'inactive' | 'pending' | 'success' | 'queued' | 'in_progress';
  description: string | null;
  environment: string;
  created_at: string;
}

interface GitHubHealthStatus {
  authenticated: boolean;
  rateLimit: {
    limit: number;
    remaining: number;
    reset: Date;
  };
  user: {
    login: string;
    id: number;
  } | null;
}

/**
 * Make authenticated request to GitHub API
 */
async function githubRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!GITHUB_API_TOKEN) {
    throw new Error('GITHUB_API_TOKEN not configured');
  }

  const url = `${GITHUB_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_API_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error(`GitHub API error (${response.status}):`, error);
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get GitHub API health status and rate limit info
 */
export async function getGitHubHealth(): Promise<GitHubHealthStatus> {
  try {
    const [rateLimit, user] = await Promise.all([
      githubRequest<{ rate: { limit: number; remaining: number; reset: number } }>('/rate_limit'),
      githubRequest<{ login: string; id: number }>('/user'),
    ]);

    return {
      authenticated: true,
      rateLimit: {
        limit: rateLimit.rate.limit,
        remaining: rateLimit.rate.remaining,
        reset: new Date(rateLimit.rate.reset * 1000),
      },
      user: {
        login: user.login,
        id: user.id,
      },
    };
  } catch (error) {
    logger.error('Failed to get GitHub health:', error);
    throw error;
  }
}

/**
 * Get all repositories accessible to the authenticated user
 */
export async function getRepositories(): Promise<GitHubRepository[]> {
  try {
    const repos = await githubRequest<GitHubRepository[]>('/user/repos?per_page=100&sort=updated');
    return repos;
  } catch (error) {
    logger.error('Failed to get GitHub repositories:', error);
    throw error;
  }
}

/**
 * Get recent workflow runs across all repositories
 *
 * @param limit - Maximum number of runs to return (default: 20)
 * @param status - Filter by status (optional)
 */
export async function getRecentWorkflowRuns(
  limit: number = 20,
  status?: 'queued' | 'in_progress' | 'completed'
): Promise<GitHubWorkflowRun[]> {
  try {
    // Get all repos first
    const repos = await getRepositories();

    // Fetch recent workflow runs for each repo (limited to top 50 most active repos)
    const activeRepos = repos.slice(0, 50);

    const workflowPromises = activeRepos.map(async (repo) => {
      try {
        const response = await githubRequest<{ workflow_runs: GitHubWorkflowRun[] }>(
          `/repos/${repo.full_name}/actions/runs?per_page=5${status ? `&status=${status}` : ''}`
        );
        return response.workflow_runs;
      } catch (error) {
        logger.warn(`Failed to get workflows for ${repo.full_name}:`, error);
        return [];
      }
    });

    const allWorkflows = await Promise.all(workflowPromises);
    const flatWorkflows = allWorkflows.flat();

    // Sort by created_at descending and limit
    return flatWorkflows
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  } catch (error) {
    logger.error('Failed to get GitHub workflow runs:', error);
    throw error;
  }
}

/**
 * Get failed workflow runs in the last 24 hours
 */
export async function getFailedWorkflows(): Promise<GitHubWorkflowRun[]> {
  try {
    const allRuns = await getRecentWorkflowRuns(50, 'completed');

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return allRuns.filter(
      (run) =>
        run.conclusion === 'failure' &&
        new Date(run.created_at) > oneDayAgo
    );
  } catch (error) {
    logger.error('Failed to get failed GitHub workflows:', error);
    throw error;
  }
}

/**
 * Get open pull requests across all repositories
 *
 * @param limit - Maximum number of PRs to return (default: 20)
 */
export async function getOpenPullRequests(limit: number = 20): Promise<GitHubPullRequest[]> {
  try {
    // Search for open PRs across all repos
    const response = await githubRequest<{ items: GitHubPullRequest[] }>(
      '/search/issues?q=is:pr+is:open+author:@me&sort=updated&per_page=' + limit
    );

    return response.items;
  } catch (error) {
    logger.error('Failed to get GitHub pull requests:', error);
    throw error;
  }
}

/**
 * Get pull requests for a specific repository
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param state - PR state filter (default: 'open')
 */
export async function getRepositoryPullRequests(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubPullRequest[]> {
  try {
    const prs = await githubRequest<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?state=${state}&per_page=20`
    );
    return prs;
  } catch (error) {
    logger.error(`Failed to get PRs for ${owner}/${repo}:`, error);
    throw error;
  }
}

/**
 * Get deployments for a repository
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param limit - Maximum number of deployments to return
 */
export async function getRepositoryDeployments(
  owner: string,
  repo: string,
  limit: number = 10
): Promise<GitHubDeployment[]> {
  try {
    const deployments = await githubRequest<GitHubDeployment[]>(
      `/repos/${owner}/${repo}/deployments?per_page=${limit}`
    );
    return deployments;
  } catch (error) {
    logger.error(`Failed to get deployments for ${owner}/${repo}:`, error);
    throw error;
  }
}

/**
 * Get deployment status for a specific deployment
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param deploymentId - Deployment ID
 */
export async function getDeploymentStatus(
  owner: string,
  repo: string,
  deploymentId: number
): Promise<GitHubDeploymentStatus[]> {
  try {
    const statuses = await githubRequest<GitHubDeploymentStatus[]>(
      `/repos/${owner}/${repo}/deployments/${deploymentId}/statuses`
    );
    return statuses;
  } catch (error) {
    logger.error(`Failed to get deployment status for ${deploymentId}:`, error);
    throw error;
  }
}

/**
 * Get workflow run by ID
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param runId - Workflow run ID
 */
export async function getWorkflowRun(
  owner: string,
  repo: string,
  runId: number
): Promise<GitHubWorkflowRun> {
  try {
    const run = await githubRequest<GitHubWorkflowRun>(
      `/repos/${owner}/${repo}/actions/runs/${runId}`
    );
    return run;
  } catch (error) {
    logger.error(`Failed to get workflow run ${runId}:`, error);
    throw error;
  }
}

/**
 * Get comprehensive GitHub status summary
 */
export async function getGitHubStatusSummary() {
  try {
    const [health, repos, recentWorkflows, failedWorkflows, openPRs] = await Promise.all([
      getGitHubHealth(),
      getRepositories(),
      getRecentWorkflowRuns(10),
      getFailedWorkflows(),
      getOpenPullRequests(10),
    ]);

    return {
      health: {
        authenticated: health.authenticated,
        user: health.user?.login,
        rateLimit: {
          remaining: health.rateLimit.remaining,
          limit: health.rateLimit.limit,
          resetAt: health.rateLimit.reset,
        },
      },
      repositories: {
        total: repos.length,
        recentlyUpdated: repos.slice(0, 5).map((r) => ({
          name: r.full_name,
          url: r.html_url,
          updatedAt: r.updated_at,
        })),
      },
      workflows: {
        recent: recentWorkflows.length,
        failed: failedWorkflows.length,
        failedRuns: failedWorkflows.map((w) => ({
          name: w.name,
          repository: w.repository.full_name,
          branch: w.head_branch,
          url: w.html_url,
          createdAt: w.created_at,
        })),
      },
      pullRequests: {
        open: openPRs.length,
        recentPRs: openPRs.slice(0, 5).map((pr) => ({
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          author: pr.user.login,
          updatedAt: pr.updated_at,
        })),
      },
    };
  } catch (error) {
    logger.error('Failed to get GitHub status summary:', error);
    throw error;
  }
}
