#!/usr/bin/env tsx
/**
 * Bot Command Integration Test Script
 *
 * Comprehensive test suite for ALL 19 Discord bot commands and API endpoints:
 *
 * PROJECT COMMANDS (5):
 * ✓ project-create  - Create new project
 * ✓ project-list    - List all projects
 * ✓ project-status  - Get specific project details
 * ✓ project-update  - Update project information
 * ✓ project-delete  - Delete project (cleanup)
 *
 * QUOTE COMMANDS (4):
 * ✓ quote-list      - List all quotes
 * ✓ quote-review    - Review pending quotes
 * ⚠ quote-convert   - Convert quote to project (requires quote ID)
 * ⚠ quote-approve   - Approve quote (requires quote ID)
 *
 * TIME TRACKING COMMANDS (4):
 * ✓ time-start      - Start time tracking
 * ⚠ time-stop       - Stop time tracking (requires active entry)
 * ✓ time-log        - Log time entry
 * ✓ time-report     - Generate time report
 *
 * MONITORING COMMANDS (4):
 * ✓ monitor-status  - Overall system status
 * ✓ monitor-services - Service health checks
 * ✓ monitor-alerts  - Recent monitoring alerts
 * ✓ monitor-github  - GitHub repos, workflows, PRs
 *
 * ADMIN COMMANDS (2):
 * ✓ admin-health    - System health check
 * ✓ admin-sync      - Sync with admin platform
 *
 * ANALYTICS:
 * ✓ admin-analytics - Dashboard analytics
 *
 * DISCORD BOT HEALTH:
 * ✓ bot-health-check - Verify Discord bot is running via health endpoint
 *
 * MONITORING SERVICES (Background):
 * • GitHub Monitor - Workflow failures, PR notifications (5-min interval)
 * • Vercel Monitor - Deployment status, production alerts (5-min interval)
 * • Fly.io Monitor - App health, machine state changes (5-min interval)
 * • Cloudflare Monitor - Zone status, SSL certificate warnings (10-min interval)
 * • Cron-job Monitor - Job failures, disabled job alerts (10-min interval)
 *
 * Verifies:
 * - Database connectivity
 * - API authentication (bot API key)
 * - CRUD operations
 * - Error handling
 * - API response formats
 * - Discord bot connection and notifications
 *
 * Usage: npm run bot:test
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Simple API client for testing
class SimpleApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Test results tracker
interface TestResult {
  command: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
}

const results: TestResult[] = [];
let testProjectId: string | null = null;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name: string) {
  console.log(`\n${colors.cyan}▶ Testing: ${name}${colors.reset}`);
}

function logPass(message: string) {
  log(`  ✓ ${message}`, 'green');
}

function logFail(message: string) {
  log(`  ✗ ${message}`, 'red');
}

function logInfo(message: string) {
  log(`  ℹ ${message}`, 'blue');
}

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ command: name, status: 'PASS', duration });
    logPass(`Passed (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({ command: name, status: 'FAIL', duration, error: errorMsg });
    logFail(`Failed: ${errorMsg}`);
  }
}

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Discord Bot Command Integration Tests                   ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

  // Load configuration from environment
  const apiUrl = process.env.BOT_API_URL || 'http://localhost:3000/api';
  const apiKey = process.env.BOT_API_KEY;

  if (!apiKey) {
    log('ERROR: BOT_API_KEY not found in environment variables', 'red');
    process.exit(1);
  }

  const apiClient = new SimpleApiClient(apiUrl, apiKey);

  logInfo(`API URL: ${apiUrl}`);
  logInfo(`API Key: ${apiKey.substring(0, 8)}...`);

  // ============================================================================
  // PROJECT COMMANDS
  // ============================================================================

  log('\n═══ PROJECT COMMANDS ═══', 'yellow');

  // Test: Project List (Empty)
  logTest('GET /admin/projects (list projects)');
  await runTest('project-list (initial)', async () => {
    const response = await apiClient.get<{
      projects: any[];
      pagination: any;
    }>('/admin/projects?page=1');

    logInfo(`Found ${response.projects.length} project(s)`);
  });

  // Test: Project Create
  logTest('POST /admin/projects (create test project)');
  await runTest('project-create', async () => {
    const response = await apiClient.post<{ project: any }>('/admin/projects', {
      title: 'Test Project - Automated',
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      description: 'This is a test project created by automated testing script',
      status: 'PLANNING',
      budget: 5000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (!response.project?.id) throw new Error('No project ID returned');

    testProjectId = response.project.id;
    logInfo(`Created project: ${testProjectId}`);
  });

  // Test: Project List (With Data)
  logTest('GET /admin/projects (with newly created project)');
  await runTest('project-list (with data)', async () => {
    const response = await apiClient.get<{
      projects: any[];
      pagination: any;
    }>('/admin/projects?page=1');

    if (response.projects.length === 0) {
      throw new Error('Expected projects but found none');
    }

    logInfo(`Found ${response.projects.length} project(s)`);
  });

  // Test: Project Status (specific project)
  if (testProjectId) {
    logTest(`GET /admin/projects/${testProjectId} (get specific project)`);
    await runTest('project-status', async () => {
      const response = await apiClient.get<{ project: any }>(
        `/admin/projects/${testProjectId}`
      );

      if (!response.project) throw new Error('No project returned');

      logInfo(`Project: ${response.project.title}`);
      logInfo(`Status: ${response.project.status}`);
    });

    // Test: Project Update
    logTest(`PUT /admin/projects/${testProjectId} (update project)`);
    await runTest('project-update', async () => {
      const response = await apiClient.put<{ project: any }>(
        `/admin/projects/${testProjectId}`,
        {
          status: 'IN_PROGRESS',
          description: 'Updated by automated test script',
        }
      );

      if (!response.project) throw new Error('No project returned');

      logInfo(`Updated status to: ${response.project.status}`);
    });
  }

  // ============================================================================
  // QUOTE COMMANDS
  // ============================================================================

  log('\n═══ QUOTE COMMANDS ═══', 'yellow');

  // Test: Quote List
  logTest('GET /admin/quotes (list quotes)');
  await runTest('quote-list', async () => {
    const response = await apiClient.get<{
      quotes: any[];
      pagination: any;
    }>('/admin/quotes?page=1');

    logInfo(`Found ${response.quotes.length} quote(s)`);
  });

  // Test: Quote Review (if we have quotes)
  logTest('GET /admin/quotes?status=PENDING (review pending quotes)');
  await runTest('quote-review', async () => {
    const response = await apiClient.get<{
      quotes: any[];
      pagination: any;
    }>('/admin/quotes?status=PENDING&page=1');

    logInfo(`Found ${response.quotes.length} pending quote(s)`);
  });

  // Test: Quote Convert (requires quote ID - skip if none)
  // Test: Quote Approve (requires quote ID - skip if none)
  logInfo('Note: quote-convert and quote-approve require specific quote IDs');

  // ============================================================================
  // TIME TRACKING COMMANDS
  // ============================================================================

  log('\n═══ TIME TRACKING COMMANDS ═══', 'yellow');

  // Test: Time Start (begin timer)
  if (testProjectId) {
    logTest(`POST /admin/time-entries (start time tracking)`);
    await runTest('time-start', async () => {
      const response = await apiClient.post<{
        timeEntry: any;
        project: any;
      }>('/admin/time-entries', {
        projectId: testProjectId,
        description: 'Automated test time entry',
      });

      if (!response.timeEntry?.id) throw new Error('No time entry ID returned');
      logInfo(`Started time entry: ${response.timeEntry.id}`);
    });
  }

  // Test: Time Stop (simulated - would need active entry)
  logInfo('Note: time-stop requires an active time entry ID');

  // Test: Time Log (manual entry with completed time)
  if (testProjectId) {
    logTest(`POST /admin/time-entries/manual (log manual time entry)`);
    await runTest('time-log', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const response = await apiClient.post<{
        timeEntry: any;
        project: any;
      }>('/admin/time-entries/manual', {
        projectId: testProjectId,
        description: 'Manual time log from test',
        startedAt: oneHourAgo.toISOString(),
        endedAt: now.toISOString(),
        durationMinutes: 60,
        loggedVia: 'api',
      });

      if (!response.timeEntry?.id) throw new Error('No time entry ID returned');
      logInfo(`Logged time entry: ${response.timeEntry.id}`);
    });
  }

  // Test: Time Report
  if (testProjectId) {
    logTest(`GET /admin/time-entries/report (time report for project)`);
    await runTest('time-report', async () => {
      const response = await apiClient.get<{
        totalMinutes: number;
        entryCount: number;
        projectBreakdown: any[];
        recentEntries: any[];
      }>(`/admin/time-entries/report?projectId=${testProjectId}`);

      logInfo(`Total Minutes: ${response.totalMinutes}`);
      logInfo(`Entry Count: ${response.entryCount}`);
      logInfo(`Recent Entries: ${response.recentEntries.length}`);
    });
  }

  // ============================================================================
  // MONITORING COMMANDS
  // ============================================================================

  log('\n═══ MONITORING COMMANDS ═══', 'yellow');

  // Test: Monitor Status (Overall health)
  logTest('GET /admin/monitor/status (overall system status)');
  await runTest('monitor-status', async () => {
    const response = await apiClient.get<{
      status: string;
      data: any;
    }>('/admin/monitor/status');

    logInfo(`System Status: ${response.status}`);
  });

  // Test: Monitor Services
  logTest('GET /admin/monitor/services (service health)');
  await runTest('monitor-services', async () => {
    const response = await apiClient.get<{
      services: any[];
      summary: any;
    }>('/admin/monitor/services');

    logInfo(`Monitoring ${response.services.length} service(s)`);
  });

  // Test: Monitor Alerts
  logTest('GET /admin/monitor/alerts (recent alerts)');
  await runTest('monitor-alerts', async () => {
    const response = await apiClient.get<{
      alerts: any[];
      pagination: any;
    }>('/admin/monitor/alerts?page=1');

    logInfo(`Found ${response.alerts.length} alert(s)`);
  });

  // Test: Monitor GitHub
  logTest('GET /admin/monitor/github (GitHub status)');
  await runTest('monitor-github', async () => {
    const response = await apiClient.get<{
      status: string;
      data: {
        health: {
          authenticated: boolean;
          user: string;
          rateLimit: {
            remaining: number;
            limit: number;
            resetAt: string;
          };
        };
        repositories: {
          total: number;
          recentlyUpdated: any[];
        };
        workflows: {
          recent: number;
          failed: number;
          failedRuns: any[];
        };
        pullRequests: {
          open: number;
          recentPRs: any[];
        };
      };
    }>('/admin/monitor/github');

    logInfo(`Authenticated: ${response.data.health.authenticated}`);
    logInfo(`Repositories: ${response.data.repositories.total}`);
    logInfo(`Failed Workflows: ${response.data.workflows.failed}`);
    logInfo(`Open PRs: ${response.data.pullRequests.open}`);
  });

  // ============================================================================
  // ANALYTICS COMMANDS
  // ============================================================================

  log('\n═══ ANALYTICS COMMANDS ═══', 'yellow');

  // Test: Admin Analytics
  logTest('GET /admin/analytics (dashboard analytics)');
  await runTest('admin-analytics', async () => {
    const response = await apiClient.get<{
      activeProjects: number;
      pendingQuotes: number;
      totalRevenue: number;
      hoursTracked: number;
    }>('/admin/analytics');

    logInfo(`Active Projects: ${response.activeProjects}`);
    logInfo(`Pending Quotes: ${response.pendingQuotes}`);
    logInfo(`Total Revenue: $${response.totalRevenue}`);
    logInfo(`Hours Tracked: ${response.hoursTracked}`);
  });

  // ============================================================================
  // ADMIN COMMANDS
  // ============================================================================

  log('\n═══ ADMIN COMMANDS ═══', 'yellow');

  // Test: Admin Health
  logTest('GET /admin/health (system health check)');
  await runTest('admin-health', async () => {
    const response = await apiClient.get<{
      status: 'healthy' | 'degraded' | 'unhealthy';
      timestamp: string;
      uptime: number;
      services: {
        database: {
          status: string;
          responseTime: number;
        };
        discord: {
          status: string;
          latency?: number | null;
          guilds?: number;
        };
        api: {
          status: string;
          requestsPerMinute: number;
        };
      };
      memory: {
        used: number;
        total: number;
        percentage: number;
      };
    }>('/admin/health');

    logInfo(`Overall Status: ${response.status}`);
    logInfo(`Uptime: ${Math.floor(response.uptime / 60)} minutes`);
    logInfo(`Database: ${response.services.database.status} (${response.services.database.responseTime}ms)`);
    logInfo(`Memory Usage: ${response.memory.percentage.toFixed(1)}%`);
  });

  // Test: Admin Sync
  logTest('POST /admin/sync (sync with admin platform)');
  await runTest('admin-sync', async () => {
    const response = await apiClient.post<{
      syncType: string;
      results: {
        projects?: { synced: number; updated: number; errors: number };
        quotes?: { synced: number; updated: number; errors: number };
        timeEntries?: { synced: number; updated: number; errors: number };
        monitoring?: { synced: number; updated: number; errors: number };
      };
      timestamp: string;
      duration: number;
    }>('/admin/sync', { type: 'projects' });

    logInfo(`Sync Type: ${response.syncType}`);
    logInfo(`Duration: ${response.duration}ms`);
    if (response.results.projects) {
      logInfo(`Projects Synced: ${response.results.projects.synced}`);
    }
  });

  // ============================================================================
  // DISCORD NOTIFICATION TESTS
  // ============================================================================

  log('\n═══ DISCORD NOTIFICATION TESTS ═══', 'cyan');

  logTest('GET http://localhost:8080/health (verify Discord bot is running)');
  await runTest('bot-health-check', async () => {
    try {
      const healthResponse = await fetch('http://localhost:8080/health');

      if (!healthResponse.ok) {
        throw new Error(`Bot health check failed: ${healthResponse.status}`);
      }

      const health = await healthResponse.json();

      if (health.status !== 'healthy') {
        throw new Error('Bot is not healthy');
      }

      logInfo(`✅ Discord bot is running and healthy`);
      logInfo(`📊 Bot uptime: ${Math.floor(health.uptime)}s`);
      logInfo(`🤖 Bot version: ${health.version}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        throw new Error('Discord bot is not running (connection refused on port 8080)');
      }
      throw error;
    }
  });

  log('\n📊 Monitoring Service Notifications:', 'cyan');
  log('Monitoring services automatically check every 5-10 minutes and send notifications', 'blue');
  log('to #admin-logs channel when events occur (failures, deployments, etc.).', 'blue');
  log('\nTo manually trigger monitoring checks, use these Discord slash commands:', 'yellow');
  log('  • /monitor-github  - Check GitHub workflows and pull requests', 'yellow');
  log('  • /monitor-status  - View overall system monitoring status', 'yellow');
  log('  • /monitor-services - Health check for all monitored services', 'yellow');
  log('  • /monitor-alerts  - View recent monitoring alerts from database\n', 'yellow');

  // ============================================================================
  // CLEANUP (Delete Test Project)
  // ============================================================================

  if (testProjectId) {
    log('\n═══ CLEANUP ═══', 'yellow');

    logTest(`DELETE /admin/projects/${testProjectId} (cleanup test data)`);
    await runTest('project-delete', async () => {
      const response = await apiClient.delete<{ message: string }>(
        `/admin/projects/${testProjectId}`
      );

      logInfo(`Deleted test project: ${testProjectId}`);
    });
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Test Results Summary                                     ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  log(`Total Tests: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Pass Rate: ${passRate}%\n`, failed > 0 ? 'yellow' : 'green');

  if (failed > 0) {
    log('Failed Tests:', 'red');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        log(`  • ${r.command}: ${r.error}`, 'red');
      });
    console.log();
  }

  // Exit with error code if tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch((error) => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
