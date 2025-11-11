/**
 * @file Vercel API Integration
 * @description Monitor Vercel projects, deployments, and domains
 */

import logger from '@/lib/logger';

const VERCEL_API_BASE = 'https://api.vercel.com';
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS';
  created: number;
  buildingAt?: number;
  ready?: number;
  target: 'production' | 'preview' | 'development' | null;
  meta: {
    githubCommitRef?: string;
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
  };
}

interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
  framework: string | null;
  link?: {
    type: 'github';
    repo: string;
    repoId: number;
  };
  latestDeployments?: VercelDeployment[];
}

interface VercelDomain {
  name: string;
  verified: boolean;
  created: number;
  expiresAt: number | null;
}

interface VercelHealthStatus {
  authenticated: boolean;
  user: {
    username: string;
    email: string;
    uid: string;
  } | null;
}

/**
 * Make authenticated request to Vercel API
 */
async function vercelRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!VERCEL_API_TOKEN) {
    throw new Error('VERCEL_API_TOKEN not configured');
  }

  const url = `${VERCEL_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error(`Vercel API error (${response.status}):`, error);
    throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get Vercel API health status
 */
export async function getVercelHealth(): Promise<VercelHealthStatus> {
  try {
    const user = await vercelRequest<{ user: { username: string; email: string; uid: string } }>(
      '/v2/user'
    );

    return {
      authenticated: true,
      user: user.user,
    };
  } catch (error) {
    logger.error('Failed to get Vercel health:', error);
    throw error;
  }
}

/**
 * Get all Vercel projects
 */
export async function getProjects(): Promise<VercelProject[]> {
  try {
    const response = await vercelRequest<{ projects: VercelProject[] }>('/v9/projects');
    return response.projects;
  } catch (error) {
    logger.error('Failed to get Vercel projects:', error);
    throw error;
  }
}

/**
 * Get deployments for a specific project
 *
 * @param projectId - Project ID or name
 * @param limit - Maximum number of deployments to return
 */
export async function getProjectDeployments(
  projectId: string,
  limit: number = 10
): Promise<VercelDeployment[]> {
  try {
    const response = await vercelRequest<{ deployments: VercelDeployment[] }>(
      `/v6/deployments?projectId=${projectId}&limit=${limit}`
    );
    return response.deployments;
  } catch (error) {
    logger.error(`Failed to get deployments for project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Get recent deployments across all projects
 *
 * @param limit - Maximum number of deployments to return
 */
export async function getRecentDeployments(limit: number = 20): Promise<VercelDeployment[]> {
  try {
    const response = await vercelRequest<{ deployments: VercelDeployment[] }>(
      `/v6/deployments?limit=${limit}`
    );
    return response.deployments;
  } catch (error) {
    logger.error('Failed to get recent Vercel deployments:', error);
    throw error;
  }
}

/**
 * Get failed deployments in the last 24 hours
 */
export async function getFailedDeployments(): Promise<VercelDeployment[]> {
  try {
    const allDeployments = await getRecentDeployments(50);

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    return allDeployments.filter(
      (deployment) =>
        deployment.state === 'ERROR' &&
        deployment.created > oneDayAgo
    );
  } catch (error) {
    logger.error('Failed to get failed Vercel deployments:', error);
    throw error;
  }
}

/**
 * Get all domains
 */
export async function getDomains(): Promise<VercelDomain[]> {
  try {
    const response = await vercelRequest<{ domains: VercelDomain[] }>('/v5/domains');
    return response.domains;
  } catch (error) {
    logger.error('Failed to get Vercel domains:', error);
    throw error;
  }
}

/**
 * Get deployment by ID
 *
 * @param deploymentId - Deployment ID
 */
export async function getDeployment(deploymentId: string): Promise<VercelDeployment> {
  try {
    const deployment = await vercelRequest<VercelDeployment>(`/v13/deployments/${deploymentId}`);
    return deployment;
  } catch (error) {
    logger.error(`Failed to get deployment ${deploymentId}:`, error);
    throw error;
  }
}

/**
 * Get comprehensive Vercel status summary
 */
export async function getVercelStatusSummary() {
  try {
    const [health, projects, recentDeployments, failedDeployments, domains] = await Promise.all([
      getVercelHealth(),
      getProjects(),
      getRecentDeployments(10),
      getFailedDeployments(),
      getDomains(),
    ]);

    // Get production deployments
    const productionDeployments = recentDeployments.filter((d) => d.target === 'production');

    return {
      health: {
        authenticated: health.authenticated,
        user: health.user?.username,
      },
      projects: {
        total: projects.length,
        recentProjects: projects.slice(0, 5).map((p) => ({
          name: p.name,
          framework: p.framework,
          repo: p.link?.repo,
        })),
      },
      deployments: {
        recent: recentDeployments.length,
        production: productionDeployments.length,
        failed: failedDeployments.length,
        failedList: failedDeployments.map((d) => ({
          name: d.name,
          url: d.url,
          created: new Date(d.created).toISOString(),
          commitMessage: d.meta.githubCommitMessage,
          commitAuthor: d.meta.githubCommitAuthorName,
        })),
        recentList: recentDeployments.slice(0, 5).map((d) => ({
          name: d.name,
          url: d.url,
          state: d.state,
          target: d.target,
          created: new Date(d.created).toISOString(),
        })),
      },
      domains: {
        total: domains.length,
        verified: domains.filter((d) => d.verified).length,
        domainList: domains.slice(0, 5).map((d) => ({
          name: d.name,
          verified: d.verified,
        })),
      },
    };
  } catch (error) {
    logger.error('Failed to get Vercel status summary:', error);
    throw error;
  }
}
