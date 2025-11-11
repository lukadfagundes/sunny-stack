/**
 * @file cron-job.org API Integration
 * @description Monitor cron-job.org scheduled jobs
 */

import logger from '@/lib/logger';

const CRONJOB_API_BASE = 'https://api.cron-job.org';
const CRONJOB_API_KEY = process.env.CRONJOB_API_KEY;

interface CronJob {
  jobId: number;
  title: string;
  url: string;
  enabled: boolean;
  schedule: {
    timezone: string;
    hours: number[];
    mdays: number[];
    minutes: number[];
    months: number[];
    wdays: number[];
  };
  lastExecution?: {
    date: string;
    duration: number;
    httpStatus: number;
    status: 'OK' | 'FAILED';
  };
  nextExecution?: string;
}

interface CronJobExecution {
  executionId: number;
  jobId: number;
  date: string;
  duration: number;
  httpStatus: number;
  status: 'OK' | 'FAILED';
  statusText: string;
}

interface CronJobHealthStatus {
  authenticated: boolean;
  email: string | null;
}

/**
 * Make authenticated request to cron-job.org API
 */
async function cronjobRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!CRONJOB_API_KEY) {
    throw new Error('CRONJOB_API_KEY not configured');
  }

  const url = `${CRONJOB_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${CRONJOB_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error(`cron-job.org API error (${response.status}):`, error);
    throw new Error(`cron-job.org API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  return result;
}

/**
 * Get cron-job.org API health status
 */
export async function getCronJobHealth(): Promise<CronJobHealthStatus> {
  try {
    const user = await cronjobRequest<{ email: string }>('/user');

    return {
      authenticated: true,
      email: user.email,
    };
  } catch (error) {
    logger.error('Failed to get cron-job.org health:', error);
    throw error;
  }
}

/**
 * Get all cron jobs
 */
export async function getCronJobs(): Promise<CronJob[]> {
  try {
    const response = await cronjobRequest<{ jobs: CronJob[] }>('/jobs');
    return response.jobs;
  } catch (error) {
    logger.error('Failed to get cron jobs:', error);
    throw error;
  }
}

/**
 * Get job execution history
 */
export async function getJobExecutions(
  jobId: number,
  limit: number = 10
): Promise<CronJobExecution[]> {
  try {
    const response = await cronjobRequest<{ history: CronJobExecution[] }>(
      `/jobs/${jobId}/history?limit=${limit}`
    );
    return response.history;
  } catch (error) {
    logger.error(`Failed to get executions for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Get failed job executions in the last 24 hours
 */
export async function getFailedJobExecutions(): Promise<Array<CronJobExecution & { job: CronJob }>> {
  try {
    const jobs = await getCronJobs();
    const failedExecutions: Array<CronJobExecution & { job: CronJob }> = [];

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const job of jobs) {
      try {
        const executions = await getJobExecutions(job.jobId, 20);

        const recentFailed = executions.filter(
          (exec) =>
            exec.status === 'FAILED' &&
            new Date(exec.date).getTime() > oneDayAgo
        );

        recentFailed.forEach((exec) => {
          failedExecutions.push({ ...exec, job });
        });
      } catch (error) {
        logger.warn(`Failed to get executions for job ${job.jobId}:`, error);
      }
    }

    return failedExecutions;
  } catch (error) {
    logger.error('Failed to get failed job executions:', error);
    throw error;
  }
}

/**
 * Get comprehensive cron-job.org status summary
 */
export async function getCronJobStatusSummary() {
  try {
    const [health, jobs, failedExecutions] = await Promise.all([
      getCronJobHealth(),
      getCronJobs(),
      getFailedJobExecutions(),
    ]);

    const enabledJobs = jobs.filter((j) => j.enabled);
    const disabledJobs = jobs.filter((j) => !j.enabled);

    const recentlyFailed = jobs.filter((job) =>
      job.lastExecution && job.lastExecution.status === 'FAILED'
    );

    return {
      health: {
        authenticated: health.authenticated,
        email: health.email,
      },
      jobs: {
        total: jobs.length,
        enabled: enabledJobs.length,
        disabled: disabledJobs.length,
        recentlyFailed: recentlyFailed.length,
        failedExecutions: failedExecutions.length,
        jobList: jobs.map((job) => ({
          id: job.jobId,
          title: job.title,
          url: job.url,
          enabled: job.enabled,
          lastExecution: job.lastExecution
            ? {
                date: job.lastExecution.date,
                status: job.lastExecution.status,
                httpStatus: job.lastExecution.httpStatus,
                duration: job.lastExecution.duration,
              }
            : null,
          nextExecution: job.nextExecution,
        })),
        failedList: failedExecutions.map((exec) => ({
          jobTitle: exec.job.title,
          url: exec.job.url,
          date: exec.date,
          httpStatus: exec.httpStatus,
          statusText: exec.statusText,
        })),
      },
    };
  } catch (error) {
    logger.error('Failed to get cron-job.org status summary:', error);
    throw error;
  }
}
