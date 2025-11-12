/**
 * @file Fly.io API Integration
 * @description Monitor Fly.io apps, machines, and deployments
 */

import logger from '@/lib/logger';

const FLYIO_API_BASE = 'https://api.fly.io/graphql';
const FLYIO_API_TOKEN = process.env.FLY_API_TOKEN;
const FLYIO_ORG_SLUG = process.env.FLY_ORG_SLUG;

interface FlyioApp {
  id: string;
  name: string;
  status: string;
  deployed: boolean;
  hostname: string;
  organization: {
    name: string;
    slug: string;
  };
  currentRelease?: {
    version: number;
    status: string;
    createdAt: string;
  };
}

interface FlyioMachine {
  id: string;
  name: string;
  state: string;
  region: string;
  createdAt: string;
  updatedAt: string;
}

interface FlyioHealthStatus {
  authenticated: boolean;
  organization: string | null;
}

/**
 * Make authenticated request to Fly.io GraphQL API
 */
async function flyioRequest<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  if (!FLYIO_API_TOKEN) {
    throw new Error('FLY_API_TOKEN not configured');
  }

  const response = await fetch(FLYIO_API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FLYIO_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error(`Fly.io API error (${response.status}):`, error);
    throw new Error(`Fly.io API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    logger.error('Fly.io GraphQL errors:', result.errors);
    throw new Error(`Fly.io GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
  }

  return result.data;
}

/**
 * Get Fly.io API health status
 */
export async function getFlyioHealth(): Promise<FlyioHealthStatus> {
  try {
    const query = `
      query {
        viewer {
          organizations {
            nodes {
              name
              slug
            }
          }
        }
      }
    `;

    const data = await flyioRequest<{
      viewer: {
        organizations: {
          nodes: Array<{ name: string; slug: string }>;
        };
      };
    }>(query);

    const org = data.viewer.organizations.nodes.find((o) => o.slug === FLYIO_ORG_SLUG);

    return {
      authenticated: true,
      organization: org?.name || null,
    };
  } catch (error) {
    logger.error('Failed to get Fly.io health:', error);
    throw error;
  }
}

/**
 * Get all apps in the organization
 */
export async function getApps(): Promise<FlyioApp[]> {
  try {
    const query = `
      query($orgSlug: String!) {
        organization(slug: $orgSlug) {
          apps {
            nodes {
              id
              name
              status
              deployed
              hostname
              organization {
                name
                slug
              }
              currentRelease {
                version
                status
                createdAt
              }
            }
          }
        }
      }
    `;

    const data = await flyioRequest<{
      organization: {
        apps: {
          nodes: FlyioApp[];
        };
      };
    }>(query, { orgSlug: FLYIO_ORG_SLUG });

    return data.organization.apps.nodes;
  } catch (error) {
    logger.error('Failed to get Fly.io apps:', error);
    throw error;
  }
}

/**
 * Get machines for a specific app
 */
export async function getAppMachines(appName: string): Promise<FlyioMachine[]> {
  try {
    const query = `
      query($appName: String!) {
        app(name: $appName) {
          machines {
            nodes {
              id
              name
              state
              region
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const data = await flyioRequest<{
      app: {
        machines: {
          nodes: FlyioMachine[];
        };
      };
    }>(query, { appName });

    return data.app.machines.nodes;
  } catch (error) {
    logger.error(`Failed to get machines for app ${appName}:`, error);
    throw error;
  }
}

/**
 * Get app status by name
 */
export async function getAppStatus(appName: string): Promise<FlyioApp> {
  try {
    const query = `
      query($appName: String!) {
        app(name: $appName) {
          id
          name
          status
          deployed
          hostname
          organization {
            name
            slug
          }
          currentRelease {
            version
            status
            createdAt
          }
        }
      }
    `;

    const data = await flyioRequest<{ app: FlyioApp }>(query, { appName });
    return data.app;
  } catch (error) {
    logger.error(`Failed to get status for app ${appName}:`, error);
    throw error;
  }
}

/**
 * Get comprehensive Fly.io status summary
 */
export async function getFlyioStatusSummary() {
  try {
    const [health, apps] = await Promise.all([
      getFlyioHealth(),
      getApps(),
    ]);

    // Get machines for each app
    const appsWithMachines = await Promise.all(
      apps.map(async (app) => {
        try {
          const machines = await getAppMachines(app.name);
          return {
            ...app,
            machines,
          };
        } catch (error) {
          logger.warn(`Failed to get machines for ${app.name}:`, error);
          return {
            ...app,
            machines: [],
          };
        }
      })
    );

    // Apps are considered "running" if deployed OR status is running/deployed
    // Suspended apps are intentionally stopped and counted separately
    const runningApps = apps.filter((a) => a.deployed || a.status === 'running' || a.status === 'deployed');
    const suspendedApps = apps.filter((a) => a.status === 'suspended');
    const stoppedApps = apps.filter((a) => !a.deployed && a.status !== 'running' && a.status !== 'deployed' && a.status !== 'suspended');

    return {
      health: {
        authenticated: health.authenticated,
        organization: health.organization,
      },
      apps: {
        total: apps.length,
        running: runningApps.length,
        suspended: suspendedApps.length,
        stopped: stoppedApps.length,
        appList: appsWithMachines.map((app) => ({
          name: app.name,
          status: app.status,
          deployed: app.deployed,
          hostname: app.hostname,
          machines: app.machines.length,
          machineStates: app.machines.reduce((acc, m) => {
            acc[m.state] = (acc[m.state] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          currentRelease: app.currentRelease
            ? {
                version: app.currentRelease.version,
                status: app.currentRelease.status,
                createdAt: app.currentRelease.createdAt,
              }
            : null,
        })),
      },
    };
  } catch (error) {
    logger.error('Failed to get Fly.io status summary:', error);
    throw error;
  }
}
